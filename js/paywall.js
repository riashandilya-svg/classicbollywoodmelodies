// /classicbollywoodmelodies/js/paywall.js
(() => {
  const SUPABASE_FUNCTIONS_BASE = "https://lyqpxcilniqzurevetae.supabase.co/functions/v1";
  const OWNER_EMAILS = ["riashandilya@gmail.com"];

  function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  function assertSupabase() {
    if (!window.supabase || !window.supabase.auth || !window.supabase.from) {
      throw new Error("Supabase client missing");
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

  // ✅ NEW: Check if user owns a song via purchases table
  async function userHasAccess(productId, session) {
    productId = (productId || "").trim();
    if (!productId) return false;
    if (!session?.user) return false;

    const email = normalizeEmail(session.user.email);
    if (OWNER_EMAILS.includes(email)) return true;

    const userId = session.user.id;

    // Check purchases table for this song
    const { data, error } = await window.supabase
      .from("purchases")
      .select("song_id")
      .eq("user_id", userId)
      .eq("status", "paid");

    if (error) {
      console.error("[PAYWALL] Error checking purchases:", error);
      return false;
    }

    const ownedSongs = (data || []).map(r => (r.song_id || "").trim());
    const hasSong = ownedSongs.includes(productId);

    console.log("[PAYWALL] needed:", productId);
    console.log("[PAYWALL] owned songs:", ownedSongs);
    console.log("[PAYWALL] hasSong:", hasSong);

    return hasSong;
  }

  // ✅ NEW: Get pricing from backend
  async function getPricing({ productId, currency = "INR" }) {
    const session = await getSessionOrThrow();
    
    const { data, error } = await window.supabase.functions.invoke("get-pricing", {
      body: { productId, currency },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: window.supabase.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMTYxNzcsImV4cCI6MjA1MjY5MjE3N30.P7vYO7s8fLqG6EkB9_SfqRQPKXFLAaI_LGQbYaXqWis',
      },
    });

    if (error) {
      console.error("[PAYWALL] Get pricing error:", error);
      throw new Error(error.message || "Failed to get pricing");
    }
    if (!data) {
      throw new Error("Pricing API returned no data");
    }
    return data;
  }

  // ✅ UPDATED: Create order with dynamic pricing
  async function createOrder({ productId, currency = "INR" }) {
    const session = await getSessionOrThrow();
    
    // Get the API key - try multiple methods
    const apikey = window.supabase.supabaseKey || 
                   window.supabase.supabaseUrl?.match(/https:\/\/([^.]+)/)?.[0] ||
                   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMTYxNzcsImV4cCI6MjA1MjY5MjE3N30.P7vYO7s8fLqG6EkB9_SfqRQPKXFLAaI_LGQbYaXqWis';
    
    console.log('[PAYWALL] Using API key:', apikey ? 'Found' : 'Missing');
    
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

  // ✅ UPDATED: Verify payment with amount and currency
  async function verifyPayment({ productId, response, amount, currency }) {
    const session = await getSessionOrThrow();
    
    const { data, error } = await window.supabase.functions.invoke("verify-razorpay-payment", {
      body: {
        productId,
        amount,
        currency,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: window.supabase.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMTYxNzcsImV4cCI6MjA1MjY5MjE3N30.P7vYO7s8fLqG6EkB9_SfqRQPKXFLAaI_LGQbYaXqWis',
      },
    });

    if (error) {
      console.error("[PAYWALL] Verify payment error:", error);
      throw new Error(error.message || "Payment verification failed");
    }
    return data;
  }

  // ✅ UPDATED: Razorpay checkout with dynamic pricing
  async function startRazorpayCheckout({ productId, currency = "INR" }) {
    assertSupabase();
    await loadRazorpay();

    const session = await getSessionOrThrow();
    const order = await createOrder({ productId, currency });

    const isBundle = productId === "pack:5";
    const description = isBundle 
      ? "5-Song Pack" 
      : `Unlock: ${productId.replace('song:', '')}`;

    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Classic Bollywood Melodies",
      description: description,
      prefill: { email: session.user?.email || "" },
      handler: async (response) => {
        try {
          const fresh = await getSessionOrThrow();
          await verifyPayment({ 
            productId, 
            response,
            amount: order.amount,
            currency: order.currency
          });

          // ✅ Auto-reload without alert
          window.location.reload();
        } catch (e) {
          alert(e?.message || "Verification error");
        }
      },
    });

    rzp.open();
  }

  // ✅ NEW: Verify book code
  async function verifyBookCode(code) {
    const session = await getSessionOrThrow();
    
    const { data, error } = await window.supabase.functions.invoke("verify-book-code", {
      body: { code },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: window.supabase.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMTYxNzcsImV4cCI6MjA1MjY5MjE3N30.P7vYO7s8fLqG6EkB9_SfqRQPKXFLAaI_LGQbYaXqWis',
      },
    });

    if (error) {
      console.error("[PAYWALL] Verify book code error:", error);
      throw new Error(error.message || "Code verification failed");
    }
    return data;
  }

  // ✅ UPDATED: Show paywall with bundle option
  async function showPaywall({ productId, title, body }) {
    assertSupabase();

    const paywallEl = document.getElementById("paywall");
    const appEl = document.getElementById("app");
    if (!paywallEl || !appEl) return;

    // default locked
    appEl.style.display = "none";
    paywallEl.style.display = "block";

    try {
      const { data } = await window.supabase.auth.getSession();
      const session = data?.session;

      const allowed = await userHasAccess(productId, session);
      console.log("[PAYWALL] allowed:", allowed);

      if (allowed) {
        paywallEl.style.display = "none";
        appEl.style.display = "block";
        return;
      }

      // ✅ Get pricing info
      const pricing = await getPricing({ productId, currency: "INR" });
      
      const priceDisplay = `₹${(pricing.price / 100).toFixed(0)}`;
      
      let bundleButton = "";
      if (pricing.bundleAvailable && pricing.bundlePrice) {
        const bundleDisplay = `₹${(pricing.bundlePrice / 100).toFixed(0)}`;
        bundleButton = `
          <button id="bundleBtn" type="button" style="margin-top: 10px; background: #4CAF50;">
            Buy 5-Song Pack for ${bundleDisplay} (Save!)
          </button>
        `;
      }

      paywallEl.innerHTML = `
        <h3>${title || "Locked"}</h3>
        <p>${body || "Buy to unlock"}</p>
        <button id="buyBtn" type="button">Buy for ${priceDisplay}</button>
        ${bundleButton}
      `;

      const buyBtn = document.getElementById("buyBtn");
      buyBtn.onclick = () => startRazorpayCheckout({ productId, currency: "INR" });

      const bundleBtn = document.getElementById("bundleBtn");
      if (bundleBtn) {
        bundleBtn.onclick = () => startRazorpayCheckout({ productId: "pack:5", currency: "INR" });
      }

    } catch (err) {
      console.error("[PAYWALL] Error:", err);
      paywallEl.innerHTML = `
        <h3>Error</h3>
        <p>Please refresh the page.</p>
      `;
    }
  }

  // ✅ Export functions
  window.showPaywall = showPaywall;
  window.startRazorpayCheckout = startRazorpayCheckout;
  window.verifyBookCode = verifyBookCode;
  window.getPricing = getPricing;
})();
