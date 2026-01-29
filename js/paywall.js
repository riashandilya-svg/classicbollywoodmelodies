// /classicbollywoodmelodies/js/paywall.js
// Assumes:
// 1) Supabase CDN loaded
// 2) supabaseClient.js has created: window.supabase (client instance)

(() => {
  const SUPABASE_FUNCTIONS_BASE =
    "https://lyqpxcilniqzurevetae.supabase.co/functions/v1";

  const OWNER_EMAILS = ["riaomshandilya@gmail.com"];
  const ALL_SONG_KEYS = ["bundle:all_songs", "all_songs", "ALL_SONGS"];

  const PRICE_RUPEES = 199;
  const CURRENCY = "INR";

  function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  function assertSupabase() {
    if (!window.supabase || !window.supabase.auth || !window.supabase.from) {
      throw new Error("Supabase client missing. Check supabaseClient.js load order.");
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

  async function userHasAccess(productId, session) {
    productId = (productId || "").trim();
    if (!productId) return false;

    const email = normalizeEmail(session?.user?.email);
    if (OWNER_EMAILS.includes(email)) return true;

    const userId = session?.user?.id;
    if (!userId) return false;

    const { data, error } = await window.supabase
      .from("entitlements")
      .select("product_id")
      .eq("user_id", userId);

    if (error) {
      console.warn("[PAYWALL] entitlements read error:", error);
      return false;
    }

    const owned = (data || []).map(r => (r.product_id || "").trim());
    const hasBundle = owned.some(p => ALL_SONG_KEYS.includes(p));
    const hasSong = owned.includes(productId);

    console.log("[PAYWALL] needed:", productId);
    console.log("[PAYWALL] owned:", owned);
    console.log("[PAYWALL] hasBundle:", hasBundle, "hasSong:", hasSong);

    return hasBundle || hasSong;
  }

  async function createOrder({ token, productId }) {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/create-razorpay-order`, {
      method: "POST",
     headers: {
  Authorization: `Bearer ${token}`,
  apikey: window.supabase.supabaseKey,
  "Content-Type": "application/json",
},
      body: JSON.stringify({
        productId,
        amount: PRICE_RUPEES,
        currency: CURRENCY,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[PAYWALL] create-order failed:", json);
      throw new Error(json?.message || json?.error || "Create order failed");
    }
    return json;
  }

  async function verifyPayment({ token, productId, response }) {
    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/verify-razorpay-payment`, {
      method: "POST",
      headers: {
   headers: {
  Authorization: `Bearer ${token}`,
  apikey: window.supabase.supabaseKey,
  "Content-Type": "application/json",
},

      body: JSON.stringify({
        productId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[PAYWALL] verify failed:", json);
      throw new Error(json?.message || json?.error || "Payment verification failed");
    }
    return json;
  }

  async function startRazorpayCheckout({ productId }) {
    assertSupabase();
    await loadRazorpay();

    const session = await getSessionOrThrow();
    const token = session.access_token;

    const order = await createOrder({ token, productId });

    const rzp = new window.Razorpay({
      key: order.key_id,
      order_id: order.razorpay_order_id,
      amount: order.amount,
      currency: order.currency,
      name: "Classic Bollywood Melodies",
      description: `Unlock: ${order.song_slug || productId}`,
      prefill: { email: session.user?.email || "" },

      handler: async (response) => {
        try {
          // refresh token in case it rotated
          const fresh = await getSessionOrThrow();
          await verifyPayment({
            token: fresh.access_token,
            productId,
            response,
          });

          alert("✅ Payment verified. Unlocking now...");
          window.location.reload();
        } catch (e) {
          console.error(e);
          alert(e?.message || "Verification error");
        }
      },
    });

    rzp.open();
  }

  async function showPaywall({ productId, title, body }) {
    assertSupabase();

    const paywallEl = document.getElementById("paywall");
    const appEl = document.getElementById("app");
    if (!paywallEl || !appEl) {
      console.error("Missing #paywall or #app element");
      return;
    }

    // default locked
    appEl.style.display = "none";
    paywallEl.style.display = "block";

    paywallEl.innerHTML = `
      <h3>${title || "This song is locked"}</h3>
      <p>${body || "Please buy to unlock this lesson."}</p>
      <button id="buyBtn" type="button">Buy this song</button>
    `;

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
    } catch (e) {
      console.warn("[PAYWALL] session/access check failed:", e);
      // stay locked
    }

    const buyBtn = document.getElementById("buyBtn");
    buyBtn.onclick = async () => {
      try {
        await startRazorpayCheckout({ productId });
      } catch (e) {
        console.error(e);
        alert(e?.message || "Checkout error");
      }
    };
  }

  // expose
  window.showPaywall = showPaywall;
  window.startRazorpayCheckout = startRazorpayCheckout;
})();
