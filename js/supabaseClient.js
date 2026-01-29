// classicbollywoodmelodies/js/supabaseClient.js
(function () {
  // If a Supabase client is already set up, don't re-init
  if (window.supabase && window.supabase.auth && typeof window.supabase.from === "function") {
    console.log("Supabase client already initialized. Skipping re-init.");
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase CDN not loaded correctly. window.supabase.createClient is missing.");
    return;
  }

  window.supabaseLib = window.supabase;

   const SUPABASE_URL = "https://lyqpxcilniqzurevetae.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDAyMTQsImV4cCI6MjA4NTExNjIxNH0.40ZbAatkMBFHacQGCpiNYpjcKQoZik-Xvqx3bG46x7c";

  const client = window.supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  window.supabase = client;
  window.sb = client;

  console.log("Supabase client ready:", client);
})();
