// /classicbollywoodmelodies/js/paywall.js

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

// ✅ Put your email(s) here
const OWNER_EMAILS = ["riaomshandilya@gmail.com"];

/**
 * productId examples:
 *  - "song:aajkal"
 *  - "bundle:all_songs"
 */
async function userHasAccess(productId, session) {
  const email = normalizeEmail(session?.user?.email);

  // ✅ Owner bypass
  if (OWNER_EMAILS.includes(email)) return true;

  const userId = session?.user?.id;
  if (!userId) return false;

  // ✅ Check entitlement: either this product OR bundle unlock
  const { data, error } = await window.supabase
    .from("entitlements")
    .select("product_id")
    .eq("user_id", userId)
    .in("product_id", [productId, "bundle:all_songs"])
    .limit(1);

  if (error) {
    console.warn("entitlements read error:", error);
    return false;
  }

  return (data || []).length > 0;
}

export async function showPaywall(options = {}) {
  const paywallEl = document.getElementById("paywall");
  const appEl = document.getElementById("app");

  if (!paywallEl || !appEl) {
    console.error("Missing #paywall or #app element");
    return;
  }

  // ✅ Default locked
  appEl.style.display = "none";
  paywallEl.style.display = "block";

  // ✅ Locked UI
  const title = options.title || "This song is locked";
  const body = options.body || "Please buy to unlock this lesson.";

  paywallEl.innerHTML = `
    <h3>${title}</h3>
    <p>${body}</p>
    <button id="buyBtn" type="button">Buy this song</button>
  `;

  // ✅ Must provide productId per song page
  const productId = options.productId;
  if (!productId) {
    console.warn("showPaywall missing options.productId");
    return; // stay locked
  }

  // ✅ Session + access check
  try {
    const { data, error } = await window.supabase.auth.getSession();
    if (error) console.warn("supabase getSession error:", error);

    const session = data?.session;
    if (!session) return; // not logged in -> stay locked

    const allowed = await userHasAccess(productId, session);

    if (allowed) {
      paywallEl.style.display = "none";
      appEl.style.display = "block";
      return;
    }
  } catch (e) {
    console.warn("Paywall session/access check failed:", e);
  }

  // ✅ Buy handler (optional)
  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) {
    buyBtn.addEventListener("click", async () => {
      if (typeof window.startRazorpayCheckout !== "function") {
        alert("Checkout is not configured yet.");
        return;
      }
      await window.startRazorpayCheckout({
        productId,
        title,
      });
    });
  }
}
