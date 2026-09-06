'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentShop } from '@/lib/shop';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Start a new draft quote and jump into the builder.
export async function createQuote() {
  const supabase = await createClient();
  const { user, shop } = await getCurrentShop();
  if (!user) redirect('/login');
  if (!shop) redirect('/onboarding');

  const { data: n, error: numErr } = await supabase
    .rpc('next_quote_number', { target_shop: shop.id });
  if (numErr) throw new Error(numErr.message);

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      shop_id: shop.id,
      quote_number: n,
      status: 'draft',
      labour_rate: shop.default_labour_rate,
      paint_rate: shop.default_paint_rate,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  redirect(`/quotes/${data.id}`);
}

// Upsert the quote's vehicle and customer as their own rows and return their
// ids, so a quote always points at real records (reusable across future quotes)
// rather than burying the car and owner in free text.
async function linkVehicleAndCustomer(supabase, shopId, header) {
  // Reuse the rows already linked to this quote (update in place) so re-saving
  // an estimate doesn't spawn a duplicate car and customer every time.
  let customerId = header.customer_id || null;
  if (header.customer_name?.trim()) {
    const fields = {
      shop_id: shopId,
      name: header.customer_name.trim(),
      phone: header.customer_phone || null,
      type: header.insurer_name ? 'insurance' : 'private',
    };
    if (customerId) {
      const { error } = await supabase.from('customers').update(fields).eq('id', customerId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from('customers').insert(fields).select('id').single();
      if (error) throw new Error(error.message);
      customerId = data.id;
    }
  }

  let vehicleId = header.vehicle_id || null;
  if (header.rego?.trim() || header.make?.trim()) {
    const fields = {
      shop_id: shopId,
      customer_id: customerId,
      rego: header.rego || null,
      make: header.make || null,
      model: header.model || null,
      year: header.year ? Number(header.year) : null,
      colour: header.colour || null,
      paint_code: header.paint_code || null,
    };
    if (vehicleId) {
      const { error } = await supabase.from('vehicles').update(fields).eq('id', vehicleId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from('vehicles').insert(fields).select('id').single();
      if (error) throw new Error(error.message);
      vehicleId = data.id;
    }
  }
  return { customerId, vehicleId };
}

// Persist the whole estimate: header + full set of lines. Lines are replaced
// wholesale (a quote has tens of rows, not thousands); the DB trigger recomputes
// subtotal / GST / total from what lands.
export async function saveQuote(quoteId, header, lines) {
  const supabase = await createClient();
  const { shop } = await getCurrentShop();
  if (!shop) redirect('/onboarding');

  const { vehicleId, customerId } = await linkVehicleAndCustomer(supabase, shop.id, header);

  const patch = {
    claim_number: header.claim_number || null,
    excess: header.excess === '' || header.excess == null ? null : Number(header.excess),
    status: header.status || 'draft',
    labour_rate: Number(header.labour_rate || 0),
    paint_rate: Number(header.paint_rate || 0),
    notes: header.notes || null,
    assessor_notes: header.assessor_notes || null,
    valid_until: header.valid_until || null,
  };
  if (vehicleId) patch.vehicle_id = vehicleId;
  if (customerId) patch.customer_id = customerId;

  const { error: hErr } = await supabase.from('quotes').update(patch).eq('id', quoteId);
  if (hErr) throw new Error(hErr.message);

  await supabase.from('quote_lines').delete().eq('quote_id', quoteId);

  if (lines.length) {
    const rows = lines.map((l, i) => ({
      quote_id: quoteId,
      line_type: l.line_type,
      description: l.description || '',
      part_number: l.part_number || null,
      source: l.line_type === 'part' ? (l.source || null) : null,
      quantity: l.quantity === '' ? 0 : Number(l.quantity),
      unit_price: l.unit_price === '' ? 0 : Number(l.unit_price),
      hours: l.hours === '' || l.hours == null ? null : Number(l.hours),
      rate: l.rate === '' || l.rate == null ? null : Number(l.rate),
      taxable: l.taxable !== false,
      sort_order: i,
    }));
    const { error: lErr } = await supabase.from('quote_lines').insert(rows);
    if (lErr) throw new Error(lErr.message);
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath('/');
  return { ok: true };
}
