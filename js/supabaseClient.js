// classicbollywoodmelodies/js/supabaseClient.js
(function () {
  // Supabase CDN must be loaded BEFORE this file:
  // <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase CDN not loaded correctly. window.supabase.createClient is missing.");
    return;
  }

  // Preserve the CDN namespace (library) safely
  window.supabaseLib = window.supabase;

  const SUPABASE_URL = "https://lyqpxcilniqzurevetae.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDAyMTQsImV4cCI6MjA4NTExNjIxNH0.40ZbAatkMBFHacQGCpiNYpjcKQoZik-Xvqx3bG46x7c";

  const client = window.supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Make paywall code happy (it expects window.supabase.auth...)
  window.supabase = client;

  // Optional alias (if any other code uses window.sb)
  window.sb = client;

  console.log("Supabase client ready:", client);
})();
