// /classicbollywoodmelodies/js/paywall.js

// This module only controls UI (paywall vs app).
// Auth + entitlements check happens elsewhere (or later you can add purchase checks).

export function showPaywall({
  title = "This song is locked",
  message = "Please purchase or unlock access to continue.",
  buttonText = "Unlock",
  onBuy = null
} = {}) {
  const paywall = document.getElementById("paywall");
  const app = document.getElementById("app");

  if (!paywall) {
    console.warn("showPaywall: #paywall not found");
    return;
  }

  // Hide the app until unlocked
  if (app) app.style.display = "none";

  // Build paywall UI
  paywall.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(message)}</p>
    <button id="buyBtn">${escapeHtml(buttonText)}</button>
  `;

  paywall.style.display = "block";

  const btn = document.getElementById("buyBtn");
  if (btn) {
    btn.addEventListener("click", async () => {
      // If you pass a handler, run it. Otherwise just alert.
      if (typeof onBuy === "function") {
        try {
          btn.disabled = true;
          btn.textContent = "Loading…";
          await onBuy();
        } catch (e) {
          console.error(e);
          alert("Something went wrong. Please try again.");
        } finally {
          btn.disabled = false;
          btn.textContent = buttonText;
        }
      } else {
        alert("Unlock flow not connected yet.");
      }
    });
  }
}

export function unlockApp() {
  const paywall = document.getElementById("paywall");
  const app = document.getElementById("app");

  if (paywall) {
    paywall.style.display = "none";
    paywall.innerHTML = "";
  }
  if (app) app.style.display = "block";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
