// /classicbollywoodmelodies/js/paywall.js

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

const OWNER_EMAILS = ["riaomshandilya@gmail.com"];

async function userHasAccess(productId, session) {
  const email = normalizeEmail(session?.user?.email);

  // ✅ Owner bypass
  if (OWNER_EMAILS.includes(email)) return true;

  const userId = session?.user?.id;
  if (!userId) return false;

  // ✅ Fetch ALL this user's entitlements, then compare safely with trim()
  const { data, error } = await window.supabase
    .from("entitlements")
    .select("product_id")
    .eq("user_id", userId);

  if (error) {
    console.warn("entitlements read error:", error);
    return false;
  }

  const owned = new Set((data || []).map(r => (r.product_id || "").trim()));
  const needed = (productId || "").trim();

  // ✅ Accept either bundle key format
  const hasAllSongs =
    owned.has("ALL_SONGS") || owned.has("bundle:all_songs");

  return hasAllSongs || owned.has(needed);
}


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

    if (allowed) {
      paywallEl.style.display = "none";
      appEl.style.display = "block";
      return;
    }
  } catch (e) {
    console.warn("Paywall session/access check failed:", e);
  }

  // Buy button
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
