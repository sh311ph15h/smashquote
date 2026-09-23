import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentShop } from '@/lib/shop';
import { createQuote } from '@/app/actions/quotes';
import { money } from '@/lib/money';
import { liabilityMeta } from '@/lib/liability';
import QuoteFilters from './QuoteFilters';

const STATUS_COLOR = {
  draft: 'var(--muted)', sent: 'var(--brand)', approved: 'var(--good)',
  declined: 'var(--bad)', invoiced: 'var(--good)', cancelled: 'var(--muted)',
};

// quotes -> quotes is a self-reference, so the embed is named after the column
// rather than the table: `related_quote_id` follows the key forwards to the one
// at-fault job. Naming the table instead would walk it backwards and return the
// list of quotes pointing *at* this one.
const SELECT =
  'id, quote_number, status, liability, is_third_party, total, created_at,' +
  ' vehicle:vehicles(rego, vin, make, model, year), customer:customers(name),' +
  ' related:related_quote_id(id, quote_number, customer:customers(name))';

// PostgREST's or() takes a comma-separated list, so a comma, bracket or wildcard
// typed into the search box would be read as syntax rather than as text.
const forFilter = s => s.replace(/[(),*%\\]/g, ' ').trim();

// A quote can be found by anything the floor actually knows about the car. Rego
// and VIN live on the vehicle and the name on the customer, both of which are
// separate tables — so those are resolved to ids first and the quote query is
// filtered on them. Two small queries beat trying to search across an embedded
// join, and each one is still filtered by RLS to this shop.
async function findQuotes(supabase, { q, liability, party, status }) {
  let query = supabase.from('quotes').select(SELECT);

  if (liability === 'none') query = query.is('liability', null);
  else if (liability) query = query.eq('liability', liability);

  if (party === 'third_party') query = query.eq('is_third_party', true);
  else if (party === 'customer') query = query.eq('is_third_party', false);

  if (status) query = query.eq('status', status);

  if (q) {
    const like = `%${forFilter(q)}%`;
    const [{ data: vehicles }, { data: customers }] = await Promise.all([
      supabase.from('vehicles').select('id')
        .or(`rego.ilike.${like},vin.ilike.${like},make.ilike.${like},model.ilike.${like}`)
        .limit(500),
      supabase.from('customers').select('id').ilike('name', like).limit(500),
    ]);

    const clauses = [`claim_number.ilike.${like}`];
    if (vehicles?.length)  clauses.push(`vehicle_id.in.(${vehicles.map(v => v.id).join(',')})`);
    if (customers?.length) clauses.push(`customer_id.in.(${customers.map(c => c.id).join(',')})`);

    // "Q0042", "q42" and "42" all mean quote 42 to the person typing it.
    const asNumber = q.replace(/^q/i, '').replace(/^0+/, '');
    if (/^\d+$/.test(asNumber)) clauses.push(`quote_number.eq.${Number(asNumber)}`);

    query = query.or(clauses.join(','));
  }

  const { data } = await query.order('created_at', { ascending: false }).limit(200);
  return data || [];
}

export default async function Dashboard({ searchParams }) {
  const sp = await searchParams;
  const filters = {
    q: (sp.q || '').trim(),
    liability: sp.liability || '',
    party: sp.party || '',
    status: sp.status || '',
  };

  const { shop } = await getCurrentShop();
  const supabase = await createClient();
  const quotes = await findQuotes(supabase, filters);

  const searching = Boolean(filters.q || filters.liability || filters.party || filters.status);

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Quotes</h1>
        <div className="page-actions">
          {/* First action on the page, because it's the one used most: the car
              is in front of you and the photos need taking now. */}
          <Link className="btn secondary" href="/capture">📷 Take photo</Link>
          <form action={createQuote}><button className="btn">+ New quote</button></form>
        </div>
      </div>

      <QuoteFilters initial={filters} resultCount={quotes.length} />

      {quotes.length === 0 ? (
        <div className="card empty-state">
          {searching
            ? 'No quotes match that search. Try a partial rego, or reset the filters.'
            : `No quotes yet. Create your first estimate for ${shop.name}.`}
        </div>
      ) : (
        <div className="card table-card">
          <table className="list">
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Fault</th>
                <th>Status</th>
                <th className="right">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => {
                const fault = liabilityMeta(q.liability);
                const v = q.vehicle;
                return (
                  <tr key={q.id}>
                    <td>
                      <Link href={`/quotes/${q.id}`} className="quote-no">
                        Q{String(q.quote_number).padStart(4, '0')}
                      </Link>
                    </td>
                    <td>
                      {v ? (
                        <>
                          {v.rego && <span className="rego">{v.rego}</span>}
                          <span className="vehicle-desc">
                            {[v.year, v.make, v.model].filter(Boolean).join(' ') || '—'}
                          </span>
                        </>
                      ) : '—'}
                    </td>
                    <td>
                      {q.customer?.name || '—'}
                      {q.is_third_party && <span className="pill tp-pill">3rd party</span>}
                      {/* A third party's car belongs to someone else's crash —
                          name the job, and the customer, it came from. */}
                      {q.related && (
                        <Link href={`/quotes/${q.related.id}`} className="from-link">
                          from Q{String(q.related.quote_number).padStart(4, '0')}
                          {q.related.customer?.name ? ` · ${q.related.customer.name}` : ''}
                        </Link>
                      )}
                    </td>
                    <td>
                      {fault
                        ? <span className="pill" style={{ color: fault.tone, borderColor: fault.tone }}>{fault.label}</span>
                        : <span className="muted-dash">—</span>}
                    </td>
                    <td>
                      <span className="pill" style={{ color: STATUS_COLOR[q.status], borderColor: STATUS_COLOR[q.status] }}>
                        {q.status}
                      </span>
                    </td>
                    <td className="right total">{money(q.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
