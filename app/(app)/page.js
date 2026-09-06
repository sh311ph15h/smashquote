import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentShop } from '@/lib/shop';
import { createQuote } from '@/app/actions/quotes';
import { money } from '@/lib/money';

const STATUS_COLOR = {
  draft: 'var(--muted)', sent: 'var(--brand)', approved: 'var(--good)',
  declined: 'var(--bad)', invoiced: 'var(--good)', cancelled: 'var(--muted)',
};

export default async function Dashboard() {
  const { shop } = await getCurrentShop();
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, quote_number, status, total, created_at, vehicle:vehicles(rego, make, model), customer:customers(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Quotes</h1>
        <form action={createQuote}><button className="btn">+ New quote</button></form>
      </div>

      {(!quotes || quotes.length === 0) ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>
          No quotes yet. Create your first estimate for {shop.name}.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)', fontSize: '.78rem' }}>
                <th style={{ padding: '.8rem 1rem' }}>#</th>
                <th>Vehicle</th><th>Customer</th><th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '.7rem 1rem' }}>
                    <Link href={`/quotes/${q.id}`} style={{ color: 'var(--brand)', fontWeight: 700 }}>Q{String(q.quote_number).padStart(4, '0')}</Link>
                  </td>
                  <td>{q.vehicle ? `${q.vehicle.rego || ''} ${q.vehicle.make || ''} ${q.vehicle.model || ''}`.trim() || '—' : '—'}</td>
                  <td>{q.customer?.name || '—'}</td>
                  <td><span className="pill" style={{ color: STATUS_COLOR[q.status], borderColor: STATUS_COLOR[q.status] }}>{q.status}</span></td>
                  <td style={{ textAlign: 'right', paddingRight: '1rem', fontWeight: 700 }}>{money(q.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
