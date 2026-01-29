// /classicbollywoodmelodies/js/supabaseClient.js
(function () {
  const SUPABASE_URL = "https://lyqpxcilniqzurevetae.supabase.co";
  const SUPABASE_ANON_KEY = "PASTE_YOUR_ANON_KEY_HERE"; // Settings → API → anon public

  function loadSupabaseUMD() {
    return new Promise((resolve, reject) => {
      // If the library is already present
      if (window.supabase?.createClient) return resolve(true);

      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error("Failed to load supabase-js"));
      document.head.appendChild(s);
    });
  }

  async function init() {
    await loadSupabaseUMD();
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("[SUPABASE] ready:", !!window.supabase?.auth);
  }

  init().catch((e) => console.error("[SUPABASE] init failed:", e));
})();
