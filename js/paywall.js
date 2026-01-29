// /classicbollywoodmelodies/js/paywall.js

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

const OWNER_EMAILS = ["riaomshandilya@gmail.com"];

// ✅ accepts ALL common "all songs" keys so you don't get stuck again
const ALL_SONG_KEYS = ["all_songs", "ALL_SONGS", "bundle:all_songs"];

async function userHasAccess(productId, session) {
  productId = (productId || "").trim();

  const email = normalizeEmail(session?.user?.email);

  // ✅ Owner bypass
  if (OWNER_EMAILS.includes(email)) return true;

  const userId = session?.user?.id;
  if (!userId) return false;

  const { data, error } = await window.supabase
    .from("entitlements")
    .select("product_id")
    .eq("user_id", userId);

  if (error) {
    console.warn("entitlements read error:", error);
    return false;
  }

  const owned = (data || []).map(r => (r.product_id || "").trim());

  const hasBundle = owned.some(p => ALL_SONG_KEYS.includes(p));
  const hasSong = owned.includes(productId);

  // Debug (you can remove later)
  console.log("[PAYWALL] needed:", productId);
  console.log("[PAYWALL] owned:", owned);
  console.log("[PAYWALL] hasBundle:", hasBundle, "hasSong:", hasSong);

  return hasBundle || hasSong;
}
function loadRazorpayCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.head.appendChild(script);
  });
}
window.startRazorpayCheckout = async function startRazorpayCheckout({ productId }) {
  // 0) Make sure Razorpay Checkout JS is loaded
  await loadRazorpayCheckout();

  // 1) Get logged-in session token
  const { data, error } = await window.supabase.auth.getSession();
  if (error) throw error;
  const token = data?.session?.access_token;
  const email = data?.session?.user?.email;
  if (!token) throw new Error("Not logged in");

  // 2) TEMP: choose currency + amount (we will replace with real pricing later)
  // IMPORTANT: Razorpay expects INR amounts in paise.
  const currency = "INR";
  const amount = 19900; // ₹199.00 (paise)

  // 3) Ask our Edge Function to create a Razorpay order
  const res = await fetch(
    "https://lyqpxcilniqzurevetae.supabase.co/functions/v1/create-razorpay-order",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, currency, amount }),
    }
  );

  const order = await res.json();
  if (!res.ok) {
    console.error("create-order failed:", order);
    throw new Error(order?.error || "Create order failed");
  }

  // 4) Open Razorpay popup
  const options = {
    key: order.key_id,
    order_id: order.razorpay_order_id,
    amount: order.amount,
    currency: order.currency,
    name: "Classic Bollywood Melodies",
    description: `Unlock: ${order.song_slug}`,
    prefill: {
      email: email || "",
    },
    handler: async function (response) {
      try {
        // response has: razorpay_payment_id, razorpay_order_id, razorpay_signature
        const { data, error } = await window.supabase.auth.getSession();
        if (error) throw error;
        const token = data?.session?.access_token;
        if (!token) throw new Error("Not logged in");
    
        const verifyRes = await fetch(
          "https://lyqpxcilniqzurevetae.supabase.co/functions/v1/verify-razorpay-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          }
        );
    
        const verifyJson = await verifyRes.json();
        if (!verifyRes.ok) {
          console.error("verify failed:", verifyJson);
          alert("Payment verification failed. Please contact support.");
          return;
        }
    
        alert("✅ Payment verified. Unlocking now...");
    
        // simplest unlock: reload page so showPaywall runs again and reads entitlements
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert(err.message || "Verification error");
      }
    },    
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};

export async function showPaywall(options = {}) {
  const paywallEl = document.getElementById("paywall");
  const appEl = document.getElementById("app");

  if (!paywallEl || !appEl) {
    console.error("Missing #paywall or #app element");
    return;
  }

  // Default locked
  appEl.style.display = "none";
  paywallEl.style.display = "block";

  const title = options.title || "This song is locked";
  const body = options.body || "Please buy to unlock this lesson.";

  paywallEl.innerHTML = `
    <h3>${title}</h3>
    <p>${body}</p>
    <button id="buyBtn" type="button">Buy this song</button>
  `;

  try {
    const { data, error } = await window.supabase.auth.getSession();
    if (error) console.warn("supabase getSession error:", error);

    const session = data?.session;
    const productId = options.productId;

    if (!productId) {
      console.warn("showPaywall missing options.productId");
      return; // stay locked
    }

    const allowed = await userHasAccess(productId, session);

    console.log("[PAYWALL] allowed:", allowed);

    if (allowed) {
      paywallEl.style.display = "none";
      appEl.style.display = "block";
      return;
    }
  } catch (e) {
    console.warn("Paywall session/access check failed:", e);
  }

  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) {
    buyBtn.addEventListener("click", async () => {
      if (typeof window.startRazorpayCheckout !== "function") {
        alert("Checkout is not configured yet.");
        return;
      }
      await window.startRazorpayCheckout({
        productId: options.productId,
        title: options.title || "Locked",
      });
    });
  }
}
