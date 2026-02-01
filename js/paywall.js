// 🚨🚨🚨 EMERGENCY COMPLETE FIX - paywall.js 🚨🚨🚨
// This version COMPLETELY REMOVES the bundle unlimited access bug
// Credits system will work CORRECTLY

(() => {
  const SUPABASE_FUNCTIONS_BASE = "https://lyqpxcilniqzurevetae.supabase.co/functions/v1";
  const OWNER_EMAILS = ["riaomshandilya@gmail.com"];
  const BUNDLE_PRODUCT_ID = "pack:5";
const CURRENCY_SYMBOLS = {
  'INR': '₹',
  'USD': '$',
  'GBP': '£',
  'EUR': '€',
  'CAD': 'CA$',
  'AUD': 'A$',
  'NZD': 'NZ$',
  'SGD': 'S$',
  'MYR': 'RM',
  'AED': 'د.إ',
  'SAR': '﷼',
  'JPY': '¥',
  'CNY': '¥',
  'BRL': 'R$',
  'MXN': 'MX$',
  'ZAR': 'R',
  'CHF': 'CHF',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'PLN': 'zł',
  'TRY': '₺',
  'RUB': '₽',
  'KRW': '₩',
  'THB': '฿',
  'IDR': 'Rp',
  'PHP': '₱',
  'VND': '₫',
  'BDT': '৳',
  'PKR': '₨',
  'LKR': '₨',
  'NPR': '₨',
  'HKD': 'HK$',
  'TWD': 'NT$'
};
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMTYxNzcsImV4cCI6MjA1MjY5MjE3N30.P7vYO7s8fLqG6EkB9_SfqRQPKXFLAaI_LGQbYaXqWis';

  function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  function assertSupabase() {
    if (!window.supabase || !window.supabase.auth || !window.supabase.from) {
      throw new Error("Supabase client missing");
    }
  }

async function detectCurrency() {
  // Map of country codes to currencies
  const currencyMap = {
    'US': 'USD',
    'IN': 'INR',
    'GB': 'GBP',
    'EU': 'EUR',
    'DE': 'EUR',
    'FR': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
    'NL': 'EUR',
    'CA': 'CAD',
    'AU': 'AUD',
    'NZ': 'NZD',
    'SG': 'SGD',
    'MY': 'MYR',
    'AE': 'AED',
    'SA': 'SAR',
    'JP': 'JPY',
    'CN': 'CNY',
    'BR': 'BRL',
    'MX': 'MXN',
    'ZA': 'ZAR',
    'CH': 'CHF',
    'SE': 'SEK',
    'NO': 'NOK',
    'DK': 'DKK',
    'PL': 'PLN',
    'TR': 'TRY',
    'RU': 'RUB',
    'KR': 'KRW',
    'TH': 'THB',
    'ID': 'IDR',
    'PH': 'PHP',
    'VN': 'VND',
    'BD': 'BDT',
    'PK': 'PKR',
    'LK': 'LKR',
    'NP': 'NPR',
    'HK': 'HKD',
    'TW': 'TWD'
  };

  try {
    // Check timezone first for US
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone && (timezone.includes('America') || timezone.includes('US'))) {
      return 'USD';
    }
    
    // Mobile-friendly: longer timeout + better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const countryCode = data.country_code;
      
      // Return currency for country, or INR as fallback
      return currencyMap[countryCode] || 'INR';
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
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

  // 🚨🚨🚨 THIS IS THE CRITICAL FUNCTION - COMPLETELY REWRITTEN 🚨🚨🚨
  async function userHasAccess(productId, session) {
    console.log(`[PAYWALL] 🔍 Checking access for: ${productId}`);
    
    productId = (productId || "").trim();
    if (!productId) {
      console.log("[PAYWALL] ❌ No productId provided");
      return false;
    }
    
    if (!session?.user) {
      console.log("[PAYWALL] ❌ No session");
      return false;
    }

    // Check if owner
    const email = normalizeEmail(session.user.email);
    if (OWNER_EMAILS.includes(email)) {
      console.log("[PAYWALL] ✅ User is owner - granting access");
      return true;
    }

    const userId = session.user.id;
    const songSlug = productId.startsWith("song:") ? productId.slice(5) : productId;

    // 🚨 CRITICAL: ONLY check if user owns THIS SPECIFIC SONG
    // DO NOT check for bundle - bundle only gives CREDITS, not access!
    console.log(`[PAYWALL] 🔍 Checking ownership for song_slug: ${songSlug}`);
    
    try {
      const { data: songData, error: songError } = await window.supabase
        .from("purchases")
        .select("id, provider")
        .eq("user_id", userId)
        .eq("song_slug", songSlug)
        .eq("status", "paid")
        .maybeSingle();

      if (songError) {
        console.warn("[PAYWALL] ⚠️ Error checking song ownership:", songError);
        return false;
      }

      if (songData) {
        console.log(`[PAYWALL] ✅ User owns this song (provider: ${songData.provider})`);
        return true;
      }

      console.log("[PAYWALL] ❌ User does NOT own this song");
      return false;
      
    } catch (e) {
      console.error("[PAYWALL] ❌ Exception checking ownership:", e);
      return false;
    }
  }

  async function checkAllCredits() {
    try {
      const session = await getSessionOrThrow();
      const userId = session.user.id;

      let bundleCredits = 0;
      let bookCredits = 0;

      // Check bundle credits
      try {
        const { data: bundleData, error } = await window.supabase
          .from("purchases")
          .select("credits_remaining")
          .eq("user_id", userId)
          .eq("status", "paid")
          .eq("song_id", BUNDLE_PRODUCT_ID)
          .not("credits_remaining", "is", null)
          .gt("credits_remaining", 0)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (bundleData && !error) {
          bundleCredits = bundleData.credits_remaining || 0;
          console.log(`[PAYWALL] 🎁 Bundle credits: ${bundleCredits}`);
        }
      } catch (e) {
        console.warn('[PAYWALL] Bundle credits check error:', e);
      }

      // Check book credits
      try {
        const { data: bookData, error } = await window.supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();

        if (bookData && !error) {
          bookCredits = bookData.balance || 0;
          console.log(`[PAYWALL] 📚 Book credits: ${bookCredits}`);
        }
      } catch (e) {
        console.warn('[PAYWALL] Book credits check error:', e);
      }

      console.log(`[PAYWALL] 💰 Total credits: ${bundleCredits + bookCredits}`);
      
      return {
        bundleCredits,
        bookCredits,
        total: bundleCredits + bookCredits
      };
    } catch (error) {
      console.error('[PAYWALL] Error checking credits:', error);
      return { bundleCredits: 0, bookCredits: 0, total: 0 };
    }
  }

  // ✅ FIXED: Use raw fetch instead of supabase.functions.invoke
  // invoke() has two problems on mobile:
  //   1. It conflicts when you manually set Authorization (double-auth)
  //   2. It doesn't reliably throw on HTTP error statuses - error can be null
  //      while data contains the error payload, so the caller never sees it
  // Raw fetch gives us full control over headers and proper status checking.
  async function fetchPricing(productId, currency) {
    const session = await getSessionOrThrow();

    console.log("[PAYWALL] 📡 Calling get-pricing via raw fetch...");

    const url = `${SUPABASE_FUNCTIONS_BASE}/get-pricing`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ productId, currency }),
    });

    const data = await res.json();
    console.log("[PAYWALL] 📦 get-pricing raw response:", res.status, data);

    if (!res.ok) {
      throw new Error(data?.error || `get-pricing failed with status ${res.status}`);
    }

    return data;
  }

  // ✅ FIXED: Same raw fetch treatment for createOrder
  async function createOrder({ productId, currency = "INR" }) {
    const session = await getSessionOrThrow();

    console.log("[PAYWALL] 📡 Calling create-razorpay-order via raw fetch...");

    const url = `${SUPABASE_FUNCTIONS_BASE}/create-razorpay-order`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ productId, currency }),
    });

    const data = await res.json();
    console.log("[PAYWALL] 📦 create-razorpay-order raw response:", res.status, data);

    if (!res.ok) {
      throw new Error(data?.error || `create-razorpay-order failed with status ${res.status}`);
    }

    return data;
  }

  function extractOrderId(orderData) {
    const orderId = orderData.razorpay_order_id || 
                    orderData.order_id || 
                    orderData.orderId || 
                    orderData.id ||
                    orderData.razorpayOrderId;
    
    console.log("[PAYWALL] 🔍 Extracted order ID:", orderId);
    return orderId;
  }

  // ✅ FIXED: Same raw fetch treatment for verifyPayment
  async function verifyPayment({ productId, response, orderData }) {
    try {
      const session = await getSessionOrThrow();
      const razorpayOrderId = extractOrderId(orderData);
      
      if (!razorpayOrderId) {
        console.error("[PAYWALL] ❌ No order ID found!");
        throw new Error("Missing order ID from payment");
      }
  
      const verifyParams = {
        productId: productId,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: response.razorpay_signature,
        currency: orderData.currency,  // ✅ ADD THIS
        amount: orderData.amount        // ✅ ADD THIS
      };
  
      console.log('[PAYWALL] ✅ Verifying payment:', verifyParams);
  
      const url = `${SUPABASE_FUNCTIONS_BASE}/verify-razorpay-payment`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(verifyParams),
      });
  
      const data = await res.json();
      console.log('[PAYWALL] 📦 verify-razorpay-payment raw response:', res.status, data);
  
      if (!res.ok) {
        throw new Error(data?.error || `verify-razorpay-payment failed with status ${res.status}`);
      }
  
      console.log('[PAYWALL] ✅ Payment verified!', data);
      return data;
    } catch (error) {
      console.error('[PAYWALL] ❌ Verify payment error:', error);
      throw error;
    }
  }

  async function startRazorpayCheckout({ productId, currency = "INR" }) {
    assertSupabase();
    await loadRazorpay();
    const session = await getSessionOrThrow();
    const orderData = await createOrder({ productId, currency });

    const isBundle = productId === BUNDLE_PRODUCT_ID;
    const description = isBundle 
      ? "5-Song Bundle Pack" 
      : `Unlock: ${productId.replace('song:', '')}`;

    const razorpayOrderId = extractOrderId(orderData);
    
    if (!razorpayOrderId) {
      console.error("[PAYWALL] ❌ Cannot start checkout - no order ID!");
      alert("Error: Could not create order. Please try again.");
      return;
    }

    console.log("[PAYWALL] 🚀 Starting Razorpay checkout:", razorpayOrderId);

    const rzp = new window.Razorpay({
      key: orderData.key_id,
      order_id: razorpayOrderId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Classic Bollywood Melodies",
      description: description,
      prefill: { email: session.user?.email || "" },
      handler: async (response) => {
        try {
          console.log("[PAYWALL] 💳 Payment completed, verifying...");
          await verifyPayment({ 
            productId, 
            response,
            orderData: orderData
          });
          console.log("[PAYWALL] ✅ SUCCESS! Reloading...");
          window.location.reload();
        } catch (e) {
          console.error("[PAYWALL] ❌ Verification failed:", e);
          alert(e?.message || "Verification error");
        }
      },
    });
    rzp.open();
  }

  // ✅ FIXED: Same raw fetch treatment for redeem functions
  async function redeemAnyCredit(productId) {
    const session = await getSessionOrThrow();
    const credits = await checkAllCredits();

    console.log(`[PAYWALL] 🎁 Redeeming credit for: ${productId}`);
    console.log(`[PAYWALL] 💰 Available - Bundle: ${credits.bundleCredits}, Book: ${credits.bookCredits}`);

    // Try book credits first
    if (credits.bookCredits > 0) {
      try {
        console.log("[PAYWALL] 🎁 Trying book credit...");
        const url = `${SUPABASE_FUNCTIONS_BASE}/redeem-book-credit`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `redeem-book-credit failed: ${res.status}`);
        console.log("[PAYWALL] ✅ Book credit redeemed!");
        return { success: true, source: 'book_bonus' };
      } catch (e) {
        console.warn('[PAYWALL] Book credit failed:', e);
      }
    }

    // Try bundle credits
    if (credits.bundleCredits > 0) {
      console.log("[PAYWALL] 🎁 Trying bundle credit...");
      const url = `${SUPABASE_FUNCTIONS_BASE}/redeem-credit`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[PAYWALL] ❌ Bundle credit error:", data);
        throw new Error(data?.error || `redeem-credit failed: ${res.status}`);
      }
      console.log("[PAYWALL] ✅ Bundle credit redeemed!");
      return { success: true, source: 'bundle' };
    }

    throw new Error("No credits available");
  }

  async function showPaywall({ productId, title, body }) {
    assertSupabase();
    const paywallEl = document.getElementById("paywall");
    const appEl = document.getElementById("app");
    if (!paywallEl || !appEl) return;

    console.log(`[PAYWALL] 🎬 Starting paywall for: ${productId}`);

    appEl.style.display = "none";
    paywallEl.style.display = "block";
    paywallEl.innerHTML = `<h3>Checking access...</h3><p>Please wait...</p>`;

    try {
      const { data } = await window.supabase.auth.getSession();
      const session = data?.session;
      
      console.log("[PAYWALL] 🔐 Session:", session ? "Found" : "Not found");
      
      const allowed = await userHasAccess(productId, session);
      
      if (allowed) {
        console.log("[PAYWALL] ✅ ACCESS GRANTED - Showing content");
        paywallEl.style.display = "none";
        appEl.style.display = "block";
        return;
      }

      console.log("[PAYWALL] 🚫 ACCESS DENIED - Showing paywall");
      
      const currency = await detectCurrency();
      const currencySymbol = CURRENCY_SYMBOLS[currency];
      
      const [pricingData, credits] = await Promise.all([
        fetchPricing(productId, currency),
        checkAllCredits()
      ]);

      const { price, hasBooks, songsOwned, canUseCredits, bundleAvailable, bundlePrice } = pricingData;
      
    // Currencies that don't use decimals
const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'CLP'];
const useDecimals = !noDecimalCurrencies.includes(currency);

const priceDisplay = useDecimals
  ? `${currencySymbol}${(price / 100).toFixed(2)}`
  : `${currencySymbol}${(price / 100).toFixed(0)}`;

const bundlePriceDisplay = bundlePrice 
  ? (useDecimals 
      ? `${currencySymbol}${(bundlePrice / 100).toFixed(2)}`
      : `${currencySymbol}${(bundlePrice / 100).toFixed(0)}`)
  : null;

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

      // Show credit button if user has credits
      if (canUseCredits && credits.total > 0) {
        const creditTypes = [];
        if (credits.bundleCredits > 0) creditTypes.push(`${credits.bundleCredits} bundle`);
        if (credits.bookCredits > 0) creditTypes.push(`${credits.bookCredits} book bonus`);
        
        console.log(`[PAYWALL] 🎁 Showing credit button (${creditTypes.join(' + ')})`);
        
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
      } else {
        console.log("[PAYWALL] ℹ️ No credits available for redemption");
      }

      // Show bundle option
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

      // Attach event listeners
      const buyBtn = document.getElementById("buyBtn");
      buyBtn.onclick = () => {
        console.log("[PAYWALL] 💳 User clicked: Buy This Song");
        startRazorpayCheckout({ productId, currency });
      };

      const bundleBtn = document.getElementById("bundleBtn");
      if (bundleBtn) {
        bundleBtn.onclick = () => {
          console.log("[PAYWALL] 💳 User clicked: Buy Bundle");
          startRazorpayCheckout({ productId: BUNDLE_PRODUCT_ID, currency });
        };
      }

      const redeemBtn = document.getElementById("redeemBtn");
      if (redeemBtn) {
        redeemBtn.onclick = async () => {
          try {
            console.log("[PAYWALL] 🎁 User clicked: Redeem Credit");
            redeemBtn.disabled = true;
            redeemBtn.textContent = "Redeeming...";
            await redeemAnyCredit(productId);
            console.log("[PAYWALL] ✅ Credit redeemed, reloading...");
            window.location.reload();
          } catch (e) {
            console.error("[PAYWALL] ❌ Redeem failed:", e);
            alert(e?.message || "Failed to redeem credit");
            redeemBtn.disabled = false;
            redeemBtn.textContent = `🎁 Unlock with 1 Credit`;
          }
        };
      }

    } catch (err) {
      console.error("[PAYWALL] ❌ Critical error:", err);
      paywallEl.innerHTML = `
        <h3>Error</h3>
        <p>Failed to load pricing. Please refresh the page.</p>
        <p style="font-size: 0.8em; color: #666;">${err.message}</p>
      `;
    }
  }

  console.log("[PAYWALL] ✅ Paywall system loaded");
  window.showPaywall = showPaywall;
  window.startRazorpayCheckout = startRazorpayCheckout;
})();
