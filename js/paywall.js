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
