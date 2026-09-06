'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'shop';
}

// Create the shop and make the signed-in user its owner. Uses the service-role
// client because it writes across the tenant boundary (a brand-new shop the
// user isn't a member of yet), which RLS would otherwise block.
export async function createShop(_prev, formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const name = String(formData.get('name') || '').trim();
  if (!name) return { error: 'Shop name is required.' };

  const base = slugify(name);
  let shop = null;
  for (let attempt = 0; attempt < 5 && !shop; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await admin
      .from('shops')
      .insert({
        slug,
        name,
        abn: formData.get('abn') || null,
        phone: formData.get('phone') || null,
        state: formData.get('state') || null,
        default_labour_rate: Number(formData.get('labour_rate') || 0),
        default_paint_rate: Number(formData.get('paint_rate') || 0),
      })
      .select()
      .single();
    if (!error) shop = data;
    else if (error.code !== '23505') return { error: error.message }; // not a slug clash
  }
  if (!shop) return { error: 'Could not allocate a shop URL — try a different name.' };

  const { error: memErr } = await admin
    .from('shop_members')
    .insert({ shop_id: shop.id, user_id: user.id, role: 'owner' });
  if (memErr) {
    // A shop with no owner is invisible to everyone (RLS keys off membership)
    // and squats on the slug. Roll it back so the user can simply try again.
    await admin.from('shops').delete().eq('id', shop.id);
    return { error: memErr.message };
  }

  redirect('/');
}

// Update the current shop's details and quote defaults.
export async function updateShop(_prev, formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('shop_members').select('shop_id, role').limit(1).maybeSingle();
  if (!membership) redirect('/onboarding');

  const patch = {
    name: formData.get('name'),
    abn: formData.get('abn') || null,
    address: formData.get('address') || null,
    suburb: formData.get('suburb') || null,
    state: formData.get('state') || null,
    postcode: formData.get('postcode') || null,
    phone: formData.get('phone') || null,
    email: formData.get('email') || null,
    default_labour_rate: Number(formData.get('labour_rate') || 0),
    default_paint_rate: Number(formData.get('paint_rate') || 0),
    quote_terms: formData.get('quote_terms') || null,
  };
  const { error } = await supabase.from('shops').update(patch).eq('id', membership.shop_id);
  if (error) return { error: error.message };
  return { ok: true, savedAt: Date.now() };
}
