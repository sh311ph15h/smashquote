'use server';

import { createClient } from '@/lib/supabase/server';

// How many quotes to pull when building the recent-vehicles list. Enough to
// cover a busy fortnight on the floor without paging.
const RECENT_SCAN = 120;
const RECENT_VEHICLES = 12;

// Turn a list of quote rows into one entry per vehicle, newest first, each
// carrying every quote on that car. The floor works off the plate — the quote
// number is something you look up *after* you've found the car.
function groupByVehicle(rows) {
  const byVehicle = new Map();
  for (const q of rows || []) {
    if (!q.vehicle) continue;
    const v = q.vehicle;
    if (!byVehicle.has(v.id)) {
      byVehicle.set(v.id, {
        id: v.id,
        rego: v.rego || '',
        vin: v.vin || '',
        make: v.make || '',
        model: v.model || '',
        year: v.year || null,
        colour: v.colour || '',
        customer: q.customer?.name || '',
        quotes: [],
      });
    }
    byVehicle.get(v.id).quotes.push({
      id: q.id,
      quote_number: q.quote_number,
      status: q.status,
      liability: q.liability,
      is_third_party: q.is_third_party,
      created_at: q.created_at,
    });
  }
  return [...byVehicle.values()];
}

const SELECT =
  'id, quote_number, status, liability, is_third_party, created_at,' +
  ' vehicle:vehicles(id, rego, vin, make, model, year, colour), customer:customers(name)';

// The cars most recently quoted — what the rego box offers before anything is
// typed. A car in the shop today is almost always one of these.
export async function recentVehicles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quotes')
    .select(SELECT)
    .not('vehicle_id', 'is', null)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(RECENT_SCAN);
  if (error) return { error: error.message, vehicles: [] };
  return { vehicles: groupByVehicle(data).slice(0, RECENT_VEHICLES) };
}

// Anything else typed into the rego box: plate, VIN, make or model. Falls back
// to the recent list when the box is empty.
export async function searchVehicles(term) {
  const q = String(term || '').trim();
  if (q.length < 1) return recentVehicles();

  const supabase = await createClient();
  const like = `%${q.replace(/[%_,]/g, '')}%`;

  const { data: vehicles, error: vErr } = await supabase
    .from('vehicles')
    .select('id')
    .or(`rego.ilike.${like},vin.ilike.${like},make.ilike.${like},model.ilike.${like}`)
    .limit(40);
  if (vErr) return { error: vErr.message, vehicles: [] };
  if (!vehicles?.length) return { vehicles: [] };

  const { data, error } = await supabase
    .from('quotes')
    .select(SELECT)
    .in('vehicle_id', vehicles.map(v => v.id))
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(RECENT_SCAN);
  if (error) return { error: error.message, vehicles: [] };
  return { vehicles: groupByVehicle(data) };
}
