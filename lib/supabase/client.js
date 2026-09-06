// Browser Supabase client. Uses the anon key; every query is still bound by
// Row-Level Security, so a signed-in user only ever reads their own shop.
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
