import { createClient } from '@/lib/supabase/server';

// The signed-in user's shop. For now a user has exactly one shop (we take the
// first membership); multi-shop switching is a later feature. Returns null when
// the user has no shop yet, which routes them to onboarding.
export async function getCurrentShop() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, shop: null, role: null };

  const { data: membership } = await supabase
    .from('shop_members')
    .select('role, shop:shops(*)')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    user,
    shop: membership?.shop ?? null,
    role: membership?.role ?? null,
  };
}
