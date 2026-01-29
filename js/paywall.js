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
// ✅ Check if user owns a song via purchases OR has credits
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
    .select("song_id, credits_remaining")
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
 // ✅ UPDATED: Verify payment with credit redemption
 async function verifyPayment({ productId, response, amount, currency, useCredits = false }) {
  const session = await getSessionOrThrow();
  
  const { data, error } = await window.supabase.functions.invoke("verify-razorpay-payment", {
    body: {
      productId,
      amount,
      currency,
      useCredits,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: window.supabase.supabaseKey,
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
// ✅ UPDATED: Show paywall with bundle option and credit redemption
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

    // ✅ Check for available credits
    const userId = session?.user?.id;
    let availableCredits = 0;
    
    if (userId) {
      const { data: creditData } = await window.supabase
        .from("purchases")
        .select("credits_remaining")
        .eq("user_id", userId)
        .eq("status", "paid")
        .not("credits_remaining", "is", null)
        .gt("credits_remaining", 0)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      availableCredits = creditData?.credits_remaining || 0;
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

    let creditButton = "";
    if (availableCredits > 0) {
      creditButton = `
        <button id="creditBtn" type="button" style="margin-top: 10px; background: #FF9800;">
          Use 1 Credit (${availableCredits} remaining)
        </button>
      `;
    }

    paywallEl.innerHTML = `
      <h3>${title || "Locked"}</h3>
      <p>${body || "Buy to unlock"}</p>
      <button id="buyBtn" type="button">Buy for ${priceDisplay}</button>
      ${creditButton}
      ${bundleButton}
    `;

    const buyBtn = document.getElementById("buyBtn");
    buyBtn.onclick = () => startRazorpayCheckout({ productId, currency: "INR" });

    const creditBtn = document.getElementById("creditBtn");
    if (creditBtn) {
      creditBtn.onclick = async () => {
        if (confirm(`Use 1 credit to unlock this song? (${availableCredits - 1} will remain)`)) {
          try {
            await redeemCredit(productId);
            window.location.reload();
          } catch (e) {
            alert(e.message || "Failed to redeem credit");
          }
        }
      };
    }

  const bundleBtn = document.getElementById("bundleBtn");
if (bundleBtn) {
  bundleBtn.onclick = () => showBundleExplanation();
}

  } catch (err) {
    console.error("[PAYWALL] Error:", err);
    paywallEl.innerHTML = `
      <h3>Error</h3>
      <p>Please refresh the page.</p>
    `;
  }
}
// ✅ NEW: Redeem a credit
async function redeemCredit(productId) {
  const session = await getSessionOrThrow();
  
  const { data, error } = await window.supabase.functions.invoke("redeem-credit", {
    body: { productId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: window.supabase.supabaseKey,
    },
  });

  if (error) {
    console.error("[PAYWALL] Redeem credit error:", error);
    throw new Error(error.message || "Failed to redeem credit");
  }
  return data;
}

// ✅ NEW: Show bundle explanation modal
  function showBundleExplanation() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 12px;
        max-width: 500px;
        text-align: center;
      ">
        <h2 style="margin: 0 0 20px; color: #333;">🎁 5-Song Pack</h2>
        <p style="font-size: 18px; margin: 20px 0; color: #666;">
          Buy this pack and get <strong>5 credits</strong>
        </p>
        <p style="font-size: 14px; margin: 20px 0; color: #666;">
          Use 1 credit to unlock any song you want.<br>
          No need to choose now - pick songs as you browse!
        </p>
        <div style="
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        ">
          <p style="margin: 0; font-size: 24px; color: #4CAF50; font-weight: bold;">
            ₹550 only!
          </p>
          <p style="margin: 10px 0 0; font-size: 14px; color: #999;">
            (That's ₹110 per song - Save ₹200!)
          </p>
        </div>
        <p style="font-size: 13px; color: #999; margin: 20px 0;">
          After purchase, you'll see "Use Credit" buttons on locked songs
        </p>
        <button id="confirmBundle" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 15px 40px;
          font-size: 16px;
          border-radius: 8px;
          cursor: pointer;
          margin-right: 10px;
        ">Buy Now</button>
        <button id="cancelBundle" style="
          background: #ccc;
          color: #333;
          border: none;
          padding: 15px 40px;
          font-size: 16px;
          border-radius: 8px;
          cursor: pointer;
        ">Cancel</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmBundle').onclick = () => {
      document.body.removeChild(modal);
      startRazorpayCheckout({ productId: "pack:5", currency: "INR" });
    };
    
    document.getElementById('cancelBundle').onclick = () => {
      document.body.removeChild(modal);
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };
  }
  
  // ✅ Export functions
  window.showPaywall = showPaywall;
  window.startRazorpayCheckout = startRazorpayCheckout;
  window.verifyBookCode = verifyBookCode;
  window.getPricing = getPricing;
})();
