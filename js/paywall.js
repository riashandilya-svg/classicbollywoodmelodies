// /classicbollywoodmelodies/js/paywall.js
(() => {
  const SUPABASE_FUNCTIONS_BASE = "https://lyqpxcilniqzurevetae.supabase.co/functions/v1";
  const OWNER_EMAILS = ["riaomshandilya@gmail.com"];
  const BUNDLE_PRODUCT_ID = "pack:5";
  const CURRENCY_SYMBOLS = { INR: '₹', USD: '$' };

  function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  function assertSupabase() {
    if (!window.supabase || !window.supabase.auth || !window.supabase.from) {
      throw new Error("Supabase client missing");
    }
  }

  // ✅ FIXED: Better currency detection with fallback
  async function detectCurrency() {
    try {
      // Try timezone-based detection first (no API call needed)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone && (timezone.includes('America') || timezone.includes('US'))) {
        return 'USD';
      }
      
      // Fallback: try ipapi with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      return data.country_code === 'US' ? 'USD' : 'INR';
    } catch (error) {
      console.warn('Currency detection failed, defaulting to INR:', error);
      return 'INR';
    }
  }

  async function loadRazorpay() {
    if (window.Razorpay) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
      document.head.appendChild(s);
    });
  }

  async function getSessionOrThrow() {
    const { data, error } = await window.supabase.auth.getSession();
    if (error) throw error;
    if (!data?.session) throw new Error("Not logged in");
    return data.session;
  }

  // ✅ FIXED: Handle 406 errors by catching and treating as "not found"
  async function userHasAccess(productId, session) {
    productId = (productId || "").trim();
    if (!productId) return false;
    if (!session?.user) return false;

    const email = normalizeEmail(session.user.email);
    if (OWNER_EMAILS.includes(email)) return true;

    const userId = session.user.id;

    try {
      // Check if they own the bundle (pack:5)
      const { data: bundleData, error: bundleError } = await window.supabase
        .from("purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("song_id", BUNDLE_PRODUCT_ID)
        .eq("status", "paid")
        .maybeSingle();

      // Ignore 406 errors - treat as not found
      if (bundleData && !bundleError) {
        console.log("[PAYWALL] User has bundle pack");
        return true;
      }
    } catch (e) {
      console.warn("[PAYWALL] Bundle check error (ignoring):", e);
    }

    try {
      // Check if they own this specific song
      const songSlug = productId.startsWith("song:") ? productId.slice(5) : productId;
      
      const { data: songData, error: songError } = await window.supabase
        .from("purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("song_slug", songSlug)
        .eq("status", "paid")
        .maybeSingle();

      if (songData && !songError) {
        console.log("[PAYWALL] User owns this song");
        return true;
      }
    } catch (e) {
      console.warn("[PAYWALL] Song check error (ignoring):", e);
    }

    console.log("[PAYWALL] User does not have access");
    return false;
  }

  // ✅ FIXED: Handle 406 errors in credit checking
  async function checkAllCredits() {
    try {
      const session = await getSessionOrThrow();
      const userId = session.user.id;

      let bundleCredits = 0;
      let bookCredits = 0;

      // Check bundle credits (existing system)
      try {
        const { data: bundleData, error } = await window.supabase
          .from("purchases")
          .select("credits_remaining")
          .eq("user_id", userId)
          .eq("status", "paid")
          .not("credits_remaining", "is", null)
          .gt("credits_remaining", 0)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (bundleData && !error) {
          bundleCredits = bundleData.credits_remaining || 0;
        }
      } catch (e) {
        console.warn('[PAYWALL] Bundle credits check error (ignoring):', e);
      }

      // Check book bonus credits (new system)
      try {
        const { data: bookData, error } = await window.supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();

        if (bookData && !error) {
          bookCredits = bookData.balance || 0;
        }
      } catch (e) {
        console.warn('[PAYWALL] Book credits check error (ignoring):', e);
      }

      return {
        bundleCredits,
        bookCredits,
        total: bundleCredits + bookCredits
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      return { bundleCredits: 0, bookCredits: 0, total: 0 };
    }
  }

  // ✅ Get pricing
  async function fetchPricing(productId, currency) {
    const session = await getSessionOrThrow();
    
    const { data, error } = await window.supabase.functions.invoke("get-pricing", {
      body: { productId, currency },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: window.supabase.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMTYxNzcsImV4cCI6MjA1MjY5MjE3N30.P7vYO7s8fLqG6EkB9_SfqRQPKXFLAaI_LGQbYaXqWis',
      },
    });

    if (error) {
      console.error("[PAYWALL] Fetch pricing error:", error);
      throw new Error(error.message || "Failed to fetch pricing");
    }
    return data;
  }

  // ✅ Create order
  async function createOrder({ productId, currency = "INR" }) {
    const session = await getSessionOrThrow();
    
    const apikey = window.supabase.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMTYxNzcsImV4cCI6MjA1MjY5MjE3N30.P7vYO7s8fLqG6EkB9_SfqRQPKXFLAaI_LGQbYaXqWis';
    
    const { data, error } = await window.supabase.functions.invoke("create-razorpay-order", {
      body: { productId, currency },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: apikey,
      },
    });

    if (error) {
      console.error("[PAYWALL] Create order error:", error);
      throw new Error(error.message || "Create order failed");
    }
    if (!data) {
      throw new Error("Edge Function returned a non-2xx status code");
    }
    return data;
  }

  // ✅ CRITICAL FIX: Store orderId and pass it to verifyPayment
  async function verifyPayment({ productId, response, orderId }) {
    try {
      const session = await getSessionOrThrow();
      const userId = session.user.id;
      
      // Determine item_type and item_id
      let itemType, itemId;
      if (productId === BUNDLE_PRODUCT_ID) {
        itemType = 'bundle';
        itemId = productId;
      } else {
        itemType = 'song';
        itemId = productId.startsWith('song:') ? productId.slice(5) : productId;
      }

      console.log('[PAYWALL] Verifying payment with params:', {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: orderId || response.razorpay_order_id,
        user_id: userId,
        item_id: itemId,
        item_type: itemType
      });

      const { data, error } = await window.supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: orderId || response.razorpay_order_id, // Use stored orderId
          razorpay_signature: response.razorpay_signature,
          user_id: userId,
          item_id: itemId,
          item_type: itemType
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('[PAYWALL] Verify payment error:', error);
        throw new Error(error.message || 'Payment verification failed');
      }

      console.log('[PAYWALL] Payment verified successfully:', data);
      return data;
    } catch (error) {
      console.error('[PAYWALL] Verify payment error:', error);
      throw error;
    }
  }

  // ✅ CRITICAL FIX: Store orderId and pass to handler
  async function startRazorpayCheckout({ productId, currency = "INR" }) {
    assertSupabase();
    await loadRazorpay();
    const session = await getSessionOrThrow();
    const order = await createOrder({ productId, currency });

    const isBundle = productId === BUNDLE_PRODUCT_ID;
    const description = isBundle 
      ? "5-Song Pack" 
      : `Unlock: ${productId.replace('song:', '')}`;

    // Store orderId for later use
    const orderId = order.orderId;

    const rzp = new window.Razorpay({
      key: order.key_id,
      order_id: orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Classic Bollywood Melodies",
      description: description,
      prefill: { email: session.user?.email || "" },
      handler: async (response) => {
        try {
          const fresh = await getSessionOrThrow();
          // Pass orderId to verifyPayment
          await verifyPayment({ 
            productId, 
            response,
            orderId: orderId  // Pass the stored orderId
          });
          window.location.reload();
        } catch (e) {
          alert(e?.message || "Verification error");
        }
      },
    });
    rzp.open();
  }

  // ✅ Unified credit redemption
  async function redeemAnyCredit(productId) {
    const session = await getSessionOrThrow();
    const credits = await checkAllCredits();

    // Try book credits first (new system)
    if (credits.bookCredits > 0) {
      try {
        const { data, error } = await window.supabase.functions.invoke("redeem-book-credit", {
          body: { productId },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: window.supabase.supabaseKey,
          },
        });
        if (error) throw error;
        return { success: true, source: 'book_bonus' };
      } catch (e) {
        console.warn('[PAYWALL] Book credit failed, trying bundle credits:', e);
      }
    }

    // Fallback to bundle credits (old system)
    if (credits.bundleCredits > 0) {
      const { data, error } = await window.supabase.functions.invoke("redeem-credit", {
        body: { productId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: window.supabase.supabaseKey,
        },
      });
      if (error) throw error;
      return { success: true, source: 'bundle' };
    }

    throw new Error("No credits available");
  }

  // ✅ Show paywall
  async function showPaywall({ productId, title, body }) {
    assertSupabase();
    const paywallEl = document.getElementById("paywall");
    const appEl = document.getElementById("app");
    if (!paywallEl || !appEl) return;

    appEl.style.display = "none";
    paywallEl.style.display = "block";
    paywallEl.innerHTML = `<h3>Checking access...</h3><p>Please wait...</p>`;

    try {
      const { data } = await window.supabase.auth.getSession();
      const session = data?.session;
      const allowed = await userHasAccess(productId, session);
      
      if (allowed) {
        paywallEl.style.display = "none";
        appEl.style.display = "block";
        return;
      }

      const currency = await detectCurrency();
      const currencySymbol = CURRENCY_SYMBOLS[currency];
      
      const [pricingData, credits] = await Promise.all([
        fetchPricing(productId, currency),
        checkAllCredits()
      ]);

      const { price, hasBooks, songsOwned, canUseCredits, bundleAvailable, bundlePrice } = pricingData;
      
      const priceDisplay = currency === 'INR' 
        ? `${currencySymbol}${(price / 100).toFixed(0)}`
        : `${currencySymbol}${(price / 100).toFixed(2)}`;
      
      const bundlePriceDisplay = bundlePrice && currency === 'INR'
        ? `${currencySymbol}${(bundlePrice / 100).toFixed(0)}`
        : bundlePrice ? `${currencySymbol}${(bundlePrice / 100).toFixed(2)}` : null;

      let paywallHTML = `
        <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
          <h3>${title || "Unlock This Song"}</h3>
          <p>${body || "Purchase to access this exclusive content"}</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0 0 5px 0;"><strong>Your Price:</strong> ${priceDisplay}</p>
            <p style="margin: 0; font-size: 0.9em; color: #666;">
              ${hasBooks ? `📚 Book owner pricing (${songsOwned} song${songsOwned !== 1 ? 's' : ''} owned)` : `${songsOwned} song${songsOwned !== 1 ? 's' : ''} owned`}
            </p>
          </div>
      `;

      // Show credit redemption if ANY credits available
      if (canUseCredits && credits.total > 0) {
        const creditTypes = [];
        if (credits.bundleCredits > 0) creditTypes.push(`${credits.bundleCredits} bundle`);
        if (credits.bookCredits > 0) creditTypes.push(`${credits.bookCredits} book bonus`);
        
        paywallHTML += `
          <div style="margin: 20px 0;">
            <button id="redeemBtn" type="button" style="
              width: 100%;
              padding: 12px;
              background: #10b981;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              margin-bottom: 10px;
            ">
              🎁 Unlock with 1 Credit (${creditTypes.join(' + ')})
            </button>
          </div>
        `;
      }

      if (bundleAvailable && bundlePrice) {
        paywallHTML += `
          <div style="margin: 20px 0; padding: 15px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0;">💎 Better Deal: 5-Song Bundle</h4>
            <p style="margin: 0 0 10px 0; font-size: 0.9em;">Get 5 songs for ${bundlePriceDisplay} - Save money!</p>
            <button id="bundleBtn" type="button" style="
              width: 100%;
              padding: 12px;
              background: #f59e0b;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
            ">
              Buy 5-Song Bundle ${bundlePriceDisplay}
            </button>
          </div>
        `;
      }

      paywallHTML += `
          <button id="buyBtn" type="button" style="
            width: 100%;
            padding: 12px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
          ">
            Buy This Song ${priceDisplay}
          </button>
        </div>
      `;

      paywallEl.innerHTML = paywallHTML;

      const buyBtn = document.getElementById("buyBtn");
      buyBtn.onclick = () => startRazorpayCheckout({ productId, currency });

      const bundleBtn = document.getElementById("bundleBtn");
      if (bundleBtn) {
        bundleBtn.onclick = () => startRazorpayCheckout({ productId: BUNDLE_PRODUCT_ID, currency });
      }

      const redeemBtn = document.getElementById("redeemBtn");
      if (redeemBtn) {
        redeemBtn.onclick = async () => {
          try {
            redeemBtn.disabled = true;
            redeemBtn.textContent = "Redeeming...";
            await redeemAnyCredit(productId);
            window.location.reload();
          } catch (e) {
            alert(e?.message || "Failed to redeem credit");
            redeemBtn.disabled = false;
            redeemBtn.textContent = `🎁 Unlock with 1 Credit`;
          }
        };
      }

    } catch (err) {
      console.error("[PAYWALL] Error:", err);
      paywallEl.innerHTML = `
        <h3>Error</h3>
        <p>Failed to load pricing information. Please refresh the page.</p>
      `;
    }
  }

  window.showPaywall = showPaywall;
  window.startRazorpayCheckout = startRazorpayCheckout;
})();
