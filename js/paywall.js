// /classicbollywoodmelodies/js/paywall.js

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

// ✅ Put your email(s) here
const OWNER_EMAILS = [
  "riaomshandilya@gmail.com",
];

export async function showPaywall(options = {}) {
  const paywallEl = document.getElementById("paywall");
  const appEl = document.getElementById("app");

  if (!paywallEl || !appEl) {
    console.error("Missing #paywall or #app element");
    return;
  }

  // Default: locked (safe)
  appEl.style.display = "none";
  paywallEl.style.display = "block";

  // Try to detect logged-in user
  try {
    const { data, error } = await window.supabase.auth.getSession();
    if (error) console.warn("supabase getSession error:", error);

    const email = normalizeEmail(data?.session?.user?.email);

    // ✅ OWNER BYPASS
    const isOwner = OWNER_EMAILS.includes(email);

    if (isOwner) {
      paywallEl.style.display = "none";
      appEl.style.display = "block";
      return;
    }
  } catch (e) {
    console.warn("Paywall session check failed:", e);
  }

  // Still locked: render minimal paywall UI (safe even if empty)
  const title = options.title || "This song is locked";
  const body = options.body || "Please buy to unlock this lesson.";

  paywallEl.innerHTML = `
    <h3>${title}</h3>
    <p>${body}</p>
    <button id="buyBtn" type="button">Buy this song</button>
  `;

  // Optional: wire later
  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      alert("Purchases not connected yet.");
    });
  }
}
