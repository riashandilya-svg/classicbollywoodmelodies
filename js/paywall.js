// /classicbollywoodmelodies/js/paywall.js
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
      throw new Error("Supabase client missing");
    }
  }

  function getApiKey() {
    // Works for supabase-js v2
    return window.supabase?.supabaseKey;
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
    if (!session?.user) return false;

    const email = normalizeEmail(session.user.email);
    if (OWNER_EMAILS.includes(email)) return true;

    const userId = session.user.id;

    const { data, error } = await window.supabase
      .from("entitlements")
      .select("product_id")
      .eq("user_id", userId);

    if (error) return false;

    const owned = (data || []).map(r => (r.product_id || "").trim());
    const hasBundle = owned.some(p => ALL_SONG_KEYS.includes(p));
    const hasSong = owned.includes(productId);

    console.log("[PAYWALL] needed:", productId);
    console.log("[PAYWALL] owned:", owned);
    console.log("[PAYWALL] hasBundle:", hasBundle, "hasSong:", hasSong);

    return hasBundle || hasSong;
  }

  async function createOrder({ token, productId }) {
    const apiKey = getApiKey();

    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/create-razorpay-order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        amount: PRICE_RUPEES,
        currency: CURRENCY,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || "Create order failed");
    return json;
  }

  async function verifyPayment({ token, productId, response }) {
    const apiKey = getApiKey();

    const res = await fetch(`${SUPABASE_FUNCTIONS_BASE}/verify-razorpay-payment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: apiKey,
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
    if (!res.ok) throw new Error(json?.message || json?.error || "Payment verification failed");
    return json;
  }

  async function startRazorpayCheckout({ productId }) {
    assertSupabase();
    await loadRazorpay();

    const session = await getSessionOrThrow();
    const order = await createOrder({ token: session.access_token, productId });

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
          const fresh = await getSessionOrThrow();
          await verifyPayment({
            token: fresh.access_token,
            productId,
            response,
          });
          alert("Payment verified. Reloading.");
          window.location.reload();
        } catch (e) {
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
    if (!paywallEl || !appEl) return;

    // default locked
    appEl.style.display = "none";
    paywallEl.style.display = "block";

    paywallEl.innerHTML = `
      <h3>${title || "Locked"}</h3>
      <p>${body || "Buy to unlock"}</p>
      <button id="buyBtn" type="button">Buy</button>
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
    } catch (_) {}

    const buyBtn = document.getElementById("buyBtn");
    buyBtn.onclick = () => startRazorpayCheckout({ productId });
  }

  window.showPaywall = showPaywall;
  window.startRazorpayCheckout = startRazorpayCheckout;
})();
