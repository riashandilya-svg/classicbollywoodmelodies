import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://lyqpxcilniqzurevetae.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXB4Y2lsbmlxenVyZXZldGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDAyMTQsImV4cCI6MjA4NTExNjIxNH0.40ZbAatkMBFHacQGCpiNYpjcKQoZik-Xvqx3bG46x7c";

window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
