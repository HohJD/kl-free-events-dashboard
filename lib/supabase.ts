"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase public client config.
// The anon key is safe to ship to browsers by design — access is controlled
// by Row Level Security (public can only SELECT non-claimed items;
// writes require an account and are limited to the owner's rows).
export const SUPABASE_URL = "https://rdqfibpnlizxgkqzcnee.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcWZpYnBubGl6eGdrcXpjbmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDI2MTcsImV4cCI6MjEwMzM3ODYxN30.wFFlcbZGUrS-b48H8hQrH1ezllSMtDWqBmEcpjqdYmI";

let client: SupabaseClient | null = null;

/** Browser-side Supabase client (session persisted in localStorage). */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}
