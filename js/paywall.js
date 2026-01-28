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

  // Default: locked
  appEl.style.display = "none";
  paywallEl.style.display = "block";

  // Safety: if supabase isn't ready, stay locked
  if (!window.supabase?.auth?.getSession) {
    paywallEl.innerHTML = `
      <h3>Locked</h3>
      <p>Auth not ready (window.supabase missing).</p>
    `;
    return;
  }

  let email = "";
  let userId = "";

  try {
    const { data, error } = await window.supabase.auth.getSession();
    if (error) console.warn("supabase getSession error:", error);

  email = normalizeEmail(data?.session?.user?.email);
userId = data?.session?.user?.id || "";

// ✅ OWNER BYPASS (by user id = safest)
const OWNER_USER_IDS = [
  "11b81b74-54ef-4a54-b803-ab6c0f88b187",
];

const isOwner =
  OWNER_USER_IDS.includes(userId) ||
  OWNER_EMAILS.includes(email); // optional backup

if (isOwner) {
  paywallEl.style.display = "none";
  appEl.style.display = "block";
  return;
}

  } catch (e) {
    console.warn("Paywall session check failed:", e);
  }

  // Still locked: render paywall UI + show who is logged in + sign out for testing
  const title = options.title || "This song is locked";
  const body = options.body || "Please buy to unlock this lesson.";

  paywallEl.innerHTML = `
    <h3>${title}</h3>
    <p>${body}</p>

    <p style="font-size:13px;opacity:0.8;margin-top:10px;">
      Logged in as: <b>${email || "not logged in"}</b>
      <br/>
      User ID: <span style="font-family:monospace;">${userId || "-"}</span>
    </p>

    <button id="buyBtn" type="button">Buy this song</button>
    <button id="signOutBtn" type="button" style="margin-left:8px;">Sign out</button>
  `;

  const buyBtn = document.getElementById("buyBtn");
  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      alert("Purchases not connected yet.");
    });
  }

  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      await window.supabase.auth.signOut();
      // reload so requireLogin kicks in
      window.location.reload();
    });
  }
}
