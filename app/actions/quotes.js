'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentShop } from '@/lib/shop';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isValidSection } from '@/lib/lineTypes';

// Insert a fresh draft for the current shop. Shared by the "+ New quote"
// button and the shop-floor capture flow.
async function insertDraft(supabase, user, shop, extra = {}) {
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
      ...extra,
    })
    .select('id, quote_number, status, liability, is_third_party, created_at')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Start a new draft quote and jump into the builder.
export async function createQuote() {
  const supabase = await createClient();
  const { user, shop } = await getCurrentShop();
  if (!user) redirect('/login');
  if (!shop) redirect('/onboarding');

  const data = await insertDraft(supabase, user, shop);
  redirect(`/quotes/${data.id}`);
}

// From the capture screen, with a car in front of you: open a draft on a car
// we already know, or on a plate we've never seen (creating the car too). The
// photos have to land on *some* job, and walking to the office to make one
// first is exactly the trip the capture flow exists to save.
export async function startQuoteForVehicle({ vehicleId, rego } = {}) {
  const supabase = await createClient();
  const { user, shop } = await getCurrentShop();
  if (!user || !shop) return { error: 'Not signed in.' };

  try {
    let vehicle;
    if (vehicleId) {
      const { data } = await supabase
        .from('vehicles').select('id, customer_id').eq('id', vehicleId).maybeSingle();
      if (!data) return { error: 'Vehicle not found.' };
      vehicle = data;
    } else {
      const plate = String(rego || '').trim().toUpperCase().slice(0, 20);
      if (!plate) return { error: 'Enter the rego first.' };
      const { data, error } = await supabase
        .from('vehicles').insert({ shop_id: shop.id, rego: plate })
        .select('id, customer_id').single();
      if (error) return { error: error.message };
      vehicle = data;
    }

    const quote = await insertDraft(supabase, user, shop, {
      vehicle_id: vehicle.id,
      customer_id: vehicle.customer_id || null,
    });
    revalidatePath('/');
    return { quote, vehicleId: vehicle.id };
  } catch (e) {
    return { error: e.message };
  }
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
      vin: header.vin || null,
      make: header.make || null,
      model: header.model || null,
      year: header.year ? Number(header.year) : null,
      colour: header.colour || null,
      paint_code: header.paint_code || null,
      // Which shape the damage map draws. Stored on the car, not the quote —
      // a second quote on the same vehicle shouldn't have to be told again.
      body_type: header.body_type || null,
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

  let vehicleId, customerId;
  try {
    ({ vehicleId, customerId } = await linkVehicleAndCustomer(supabase, shop.id, header));
  } catch (e) {
    return { error: e.message };
  }

  const patch = {
    claim_number: header.claim_number || null,
    excess: header.excess === '' || header.excess == null ? null : Number(header.excess),
    status: header.status || 'draft',
    // Fault is deliberately nullable: an unanswered question is not the same
    // as "disputed", and a fresh draft genuinely hasn't been answered yet.
    liability: header.liability || null,
    is_third_party: Boolean(header.is_third_party),
    // The at-fault job a third party's car arose from. Only meaningful on a
    // third-party quote — untick the flag and the link goes with it, rather
    // than leaving a dangling pointer nothing in the UI would show.
    related_quote_id: header.is_third_party ? (header.related_quote_id || null) : null,
    labour_rate: Number(header.labour_rate || 0),
    paint_rate: Number(header.paint_rate || 0),
    notes: header.notes || null,
    assessor_notes: header.assessor_notes || null,
    valid_until: header.valid_until || null,
  };
  if (vehicleId) patch.vehicle_id = vehicleId;
  if (customerId) patch.customer_id = customerId;

  const { error: hErr } = await supabase.from('quotes').update(patch).eq('id', quoteId);
  if (hErr) return { error: hErr.message };

  // A line with a section the CHECK constraint doesn't know would fail the
  // insert below *after* the old lines are gone — catch it before deleting.
  const bad = lines.find(l => !isValidSection(l.line_type));
  if (bad) return { error: `Unknown line type "${bad.line_type}".` };

  const { error: dErr } = await supabase.from('quote_lines').delete().eq('quote_id', quoteId);
  if (dErr) return { error: dErr.message };

  if (lines.length) {
    const rows = lines.map((l, i) => ({
      quote_id: quoteId,
      line_type: l.line_type,
      description: l.description || '',
      part_number: l.part_number || null,
      source: l.line_type === 'part' ? (l.source || null) : null,
      // Which panel the line is for. Null is a real answer — plenty of lines
      // (towing, a wheel alignment) aren't about a panel at all.
      area_id: l.area_id == null || l.area_id === '' ? null : Number(l.area_id),
      quantity: l.quantity === '' ? 0 : Number(l.quantity),
      unit_price: l.unit_price === '' ? 0 : Number(l.unit_price),
      hours: l.hours === '' || l.hours == null ? null : Number(l.hours),
      rate: l.rate === '' || l.rate == null ? null : Number(l.rate),
      taxable: l.taxable !== false,
      sort_order: i,
    }));
    const { error: lErr } = await supabase.from('quote_lines').insert(rows);
    if (lErr) return { error: lErr.message };
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath('/');
  return { ok: true, vehicleId, customerId };
}

// Quotes offered when linking a third party's car to the job it came from.
// Searched the way the office would look for it: the at-fault car's plate, the
// customer's name, or the quote number.
export async function searchQuotesForLink(term, excludeId) {
  const q = String(term || '').trim();
  const supabase = await createClient();

  let query = supabase
    .from('quotes')
    .select('id, quote_number, liability, created_at,'
          + ' vehicle:vehicles(rego, make, model), customer:customers(name)')
    // A third party's car can't itself be the job something arose from.
    .eq('is_third_party', false)
    .neq('status', 'cancelled');
  if (excludeId) query = query.neq('id', excludeId);

  if (q) {
    const like = `%${q.replace(/[(),*%\\]/g, ' ').trim()}%`;
    const [{ data: vehicles }, { data: customers }] = await Promise.all([
      supabase.from('vehicles').select('id').ilike('rego', like).limit(200),
      supabase.from('customers').select('id').ilike('name', like).limit(200),
    ]);

    const clauses = [];
    if (vehicles?.length)  clauses.push(`vehicle_id.in.(${vehicles.map(v => v.id).join(',')})`);
    if (customers?.length) clauses.push(`customer_id.in.(${customers.map(c => c.id).join(',')})`);

    const asNumber = q.replace(/^q/i, '').replace(/^0+/, '');
    if (/^\d+$/.test(asNumber)) clauses.push(`quote_number.eq.${Number(asNumber)}`);

    // Nothing matched any of the three ways in — say so, rather than falling
    // back to an unfiltered list that looks like a result.
    if (!clauses.length) return { quotes: [] };
    query = query.or(clauses.join(','));
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return { error: error.message, quotes: [] };
  return { quotes: data || [] };
}
