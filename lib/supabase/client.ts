import { createBrowserClient } from "@supabase/ssr";

// Reads your real Supabase project credentials from environment
// variables — see .env.example. These are safe to expose to the
// browser (that's what NEXT_PUBLIC_ means); the actual security
// boundary is the Row Level Security policies in schema.sql, not
// secrecy of this key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
