// Service-role client — BYPASSES Row-Level Security. Server-only, never import
// this into a client component. Used only for actions that legitimately cross
// the tenant boundary: creating a shop + its first membership at signup, and
// inviting/removing members.
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
