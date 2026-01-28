// /classicbollywoodmelodies/js/paywall.js

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

const OWNER_EMAILS = ["riaomshandilya@gmail.com"];

// Bundle keys we accept (you have ALL_SONGS in DB)
function hasAllSongs(ownedSet) {
  return ownedSet.has("ALL_SONGS") || ownedSet.has("bundle:all_songs");
}

// If productId is missing, infer from URL: /songs/aajkal.html -> song:aajkal
function inferProductIdFromUrl() {
  try {
    const path = window.location.pathname || "";
    const file = path.split("/").pop() || "";      // aajkal.html
    const base = file.replace(/\.html$/i, "");     // aajkal
    if (!base) return "";
    return `song:${base}`;
  } catch {
    return "";
  }
}

// Normalize productId so it supports:
// - "song:aajkal" (already ok)
// - "aajkal" (we’ll convert)
// - missing (we infer)
function normalizeProductId(productId) {
  const p = (productId || "").trim();
  if (!p) return inferProductIdFromUrl();
  if (p.startsWith("song:") || p.startsWith("bundle:")) return p;
  return `song:${p}`;
}

async function userHasAccess(productId, session) {
  const email = normalizeEmail(session?.user?.email);

  // ✅ Owner bypass
  if (OWNER_EMAILS.includes(email)) return true;

  const userId = session?.user?.id;
  if (!userId) return false;

  const needed = normalizeProductId(productId);
  if (!needed) return false;

  // ✅ Fetch all entitlements for this user, trim newline junk
  const { data, error } = await window.supabase
    .from("entitlements")
    .select("product_id")
    .eq("user_id", userId);

  if (error) {
    console.warn("entitlements read error:", error);
    return false;
  }

  const owned = new Set((data || []).map(r => (r.product_id || "").trim()));

  // Debug (keep for now)
  console.log("[PAYWALL] needed:", needed);
  console.log("[PAYWALL] owned:", Array.from(owned));

  return hasAllSongs(owned) || owned.has(needed);
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

  // Locked UI
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
    if (!session) return; // not logged in -> stay locked

    // ✅ productId can be missing now, we will infer it
    const allowed = await userHasAccess(options.productId, session);
    console.log("[PAYWALL] allowed:", allowed);

    if (allowed) {
      paywallEl.style.display = "none";
      appEl.style.display = "block";
      return;
    }
  } catch (e) {
    console.warn("Paywall session/access check failed:", e);
  }

  // Buy button handler (if/when you wire Razorpay)
  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) {
    buyBtn.addEventListener("click", async () => {
      if (typeof window.startRazorpayCheckout !== "function") {
        alert("Checkout is not configured yet.");
        return;
      }
      await window.startRazorpayCheckout({
        productId: normalizeProductId(options.productId),
        title: options.title || "Locked",
      });
    });
  }
}
