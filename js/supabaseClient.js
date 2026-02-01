// classicbollywoodmelodies/js/supabaseClient.js
(function () {
  // If we already created a client (has .auth AND .from), skip
  if (window._supabaseInitialized) {
    console.log("Supabase client already initialized. Skipping.");
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase CDN not loaded. Make sure the CDN script tag is above this file.");
    return;
  }

  const SUPABASE_URL = "https://lyqpxcilniqzurevetae.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDAyMTQsImV4cCI6MjA4NTExNjIxNH0.40ZbAatkMBFHacQGCpiNYpjcKQoZik-Xvqx3bG46x7c";

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Overwrite window.supabase with the client instance
  window.supabase = client;
  window._supabaseInitialized = true;

  console.log("Supabase client ready");
})();
