// /classicbollywoodmelodies/js/paywall.js

export function showPaywall({ title = "This song is locked" } = {}) {
  const paywall = document.getElementById("paywall");
  const app = document.getElementById("app");
  if (!paywall || !app) return;

  paywall.innerHTML = `
    <div class="paywall-card">
      <h3>${title}</h3>
      <p>Please buy to unlock this lesson.</p>
      <button id="buyBtn">Buy this song</button>
    </div>
  `;

  paywall.style.display = "block";
  app.style.display = "none";
}

export function unlockApp() {
  const paywall = document.getElementById("paywall");
  const app = document.getElementById("app");
  if (!paywall || !app) return;

  paywall.style.display = "none";
  app.style.display = "block";
}
