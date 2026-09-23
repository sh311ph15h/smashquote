import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentShop } from '@/lib/shop';
import { money } from '@/lib/money';
import { groupBySection, isTimeSection } from '@/lib/lineTypes';
import { areaShort } from '@/lib/panels';
import PrintButton from './PrintButton';

// The stamp across the page is driven by the quote's real status. A "DRAFT"
// mark left on a document that has gone to a customer reads as an accident, so
// anything already sent or approved carries no stamp at all.
const WATERMARK = {
  draft:     { text: 'DRAFT',     tone: '#94a3b8' },
  declined:  { text: 'DECLINED',  tone: '#b91c1c' },
  cancelled: { text: 'CANCELLED', tone: '#b91c1c' },
  approved:  { text: 'APPROVED',  tone: '#15803d' },
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-AU', {
  day: '2-digit', month: 'short', year: 'numeric',
});

export default async function PrintQuote({ params }) {
  const { id } = await params;
  const { shop } = await getCurrentShop();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .eq('id', id).maybeSingle();
  if (!quote) notFound();

  const { data: lines } = await supabase
    .from('quote_lines').select('*').eq('quote_id', id)
    .order('sort_order', { ascending: true });

  const v = quote.vehicle;
  const isInvoice = quote.status === 'invoiced';
  const docTitle = isInvoice ? 'TAX INVOICE' : 'QUOTATION';
  const mark = WATERMARK[quote.status];
  const addr = [shop.address, shop.suburb, shop.state, shop.postcode].filter(Boolean).join(', ');

  return (
    <div className="page">
      <PrintButton />

      <div className="sheet">
        {mark && <div className="watermark" style={{ color: mark.tone }}>{mark.text}</div>}
        <div className="rule-top" />

        {/* Masthead */}
        <header className="masthead">
          <div>
            <h1 className="shop">{shop.name}</h1>
            <div className="meta">
              {shop.abn && <div>ABN {shop.abn}</div>}
              {addr && <div>{addr}</div>}
              {shop.phone && <div>{shop.phone}</div>}
              {shop.email && <div>{shop.email}</div>}
            </div>
          </div>
          <div className="doc">
            <div className="doc-title">{docTitle}</div>
            <table className="doc-meta">
              <tbody>
                <tr><td>Number</td><td className="num">Q{String(quote.quote_number).padStart(4, '0')}</td></tr>
                <tr><td>Date</td><td className="num">{fmtDate(quote.created_at)}</td></tr>
                {quote.valid_until && (
                  <tr><td>{isInvoice ? 'Due' : 'Valid until'}</td><td className="num">{fmtDate(quote.valid_until)}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </header>

        {/* Parties */}
        <section className="panels">
          <div className="panel">
            <div className="panel-h">Vehicle</div>
            {v ? (
              <>
                <div className="panel-strong">{[v.year, v.make, v.model].filter(Boolean).join(' ') || '—'}</div>
                <dl className="kv">
                  {v.rego && <><dt>Rego</dt><dd className="num">{v.rego}</dd></>}
                  {v.vin && <><dt>VIN</dt><dd className="num">{v.vin}</dd></>}
                  {v.colour && <><dt>Colour</dt><dd>{v.colour}{v.paint_code ? ` · ${v.paint_code}` : ''}</dd></>}
                  {v.odometer != null && <><dt>Odometer</dt><dd className="num">{v.odometer} km</dd></>}
                </dl>
              </>
            ) : <div className="panel-strong">—</div>}
          </div>

          <div className="panel">
            <div className="panel-h">{isInvoice ? 'Bill to' : 'Prepared for'}</div>
            <div className="panel-strong">{quote.customer?.name || '—'}</div>
            <dl className="kv">
              {quote.customer?.phone && <><dt>Phone</dt><dd className="num">{quote.customer.phone}</dd></>}
              {quote.customer?.email && <><dt>Email</dt><dd>{quote.customer.email}</dd></>}
              {quote.claim_number && <><dt>Claim</dt><dd className="num">{quote.claim_number}</dd></>}
              {quote.excess != null && quote.excess !== '' && <><dt>Excess</dt><dd className="num">{money(quote.excess)}</dd></>}
            </dl>
          </div>
        </section>

        {/* Line items, in the six sections of the estimate. A printed quote
            that runs the work together reads as a bill; split into sections an
            assessor can check the R&R times against the paint times without
            re-sorting it by hand. Empty sections are dropped — a heading with
            nothing under it is just noise on paper. */}
        <table className="lines">
          <thead>
            <tr>
              <th className="c-desc">Description</th>
              <th className="c-area">Panel</th>
              <th className="c-qty">Qty/Hrs</th>
              <th className="c-rate">Rate</th>
              <th className="c-amt">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(lines || []).length === 0 && (
              <tr><td colSpan={5} className="empty">No items on this quote.</td></tr>
            )}
            {groupBySection(lines || [])
              .filter(sec => sec.lines.length > 0)
              .map(sec => {
                const time = isTimeSection(sec.key);
                const subtotal = sec.lines.reduce((n, l) => n + Number(l.line_total || 0), 0);
                const hours = time
                  ? sec.lines.reduce((n, l) => n + Number(l.hours || 0), 0)
                  : null;
                return (
                  <Fragment key={sec.key}>
                    <tr className="sec-row">
                      <th colSpan={5}>{sec.full}</th>
                    </tr>
                    {sec.lines.map(l => (
                      <tr key={l.id}>
                        <td className="c-desc">
                          {l.description}
                          {(l.part_number || l.source) && (
                            <span className="sub">
                              {l.part_number ? ` ${l.part_number}` : ''}
                              {l.source ? ` · ${l.source}` : ''}
                            </span>
                          )}
                        </td>
                        <td className="c-area">{areaShort(l.area_id) || '—'}</td>
                        <td className="c-qty num">{time ? l.hours : l.quantity}</td>
                        <td className="c-rate num">{money(time ? l.rate : l.unit_price)}</td>
                        <td className="c-amt num">{money(l.line_total)}</td>
                      </tr>
                    ))}
                    <tr className="sec-sub">
                      <td className="c-desc">{sec.label} subtotal</td>
                      <td className="c-area" />
                      <td className="c-qty num">{hours != null ? hours.toFixed(2) : ''}</td>
                      <td className="c-rate" />
                      <td className="c-amt num">{money(subtotal)}</td>
                    </tr>
                  </Fragment>
                );
              })}
          </tbody>
        </table>

        {/* Totals — the total is deliberately the largest number on the page. */}
        <section className="totals-wrap">
          <table className="totals">
            <tbody>
              <tr><td>Subtotal</td><td className="num">{money(quote.subtotal)}</td></tr>
              <tr><td>GST ({Math.round((quote.gst_rate ?? 0.1) * 100)}%)</td><td className="num">{money(quote.gst_amount)}</td></tr>
              <tr className="grand">
                <td>{isInvoice ? 'Amount due' : 'Total'}</td>
                <td className="num">{money(quote.total)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {quote.notes && (
          <section className="note">
            <div className="panel-h">Notes</div>
            <p>{quote.notes}</p>
          </section>
        )}

        <footer className="foot">
          {shop.quote_terms && <p className="terms">{shop.quote_terms}</p>}
          <p className="thanks">
            {isInvoice
              ? `Please quote invoice Q${String(quote.quote_number).padStart(4, '0')} with payment.`
              : 'Thank you for the opportunity to quote on this repair.'}
          </p>
          {shop.gst_registered && <p className="gst">All prices include GST where applicable.</p>}
        </footer>
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.page { background: #e9eaee; min-height: 100vh; padding: 28px 16px; }

.sheet {
  position: relative;
  width: 210mm; min-height: 297mm;
  margin: 0 auto; padding: 16mm 15mm 14mm;
  background: #fff; color: #14181f;
  font-family: var(--font-serif), Georgia, 'Times New Roman', serif;
  font-size: 10.5pt; line-height: 1.5;
  box-shadow: 0 6px 26px rgb(0 0 0 / .18);
  overflow: hidden;
}

/* Amounts, dates, regos: fixed-width digits so columns align down the page. */
.num {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  font-size: .95em;
}

.rule-top {
  position: absolute; z-index: 2; top: 0; left: 0; right: 0; height: 6mm;
  background: linear-gradient(90deg, #0f2544 0%, #1e3a63 55%, #2f5c96 100%);
}

.watermark {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-32deg);
  font-size: 104pt; font-weight: 700; letter-spacing: .08em;
  opacity: .07; white-space: nowrap; pointer-events: none;
  z-index: 0; text-transform: uppercase;
}
.sheet > *:not(.watermark):not(.rule-top) { position: relative; z-index: 1; }

.masthead { display: flex; justify-content: space-between; gap: 18mm; align-items: flex-start; }
.shop { font-size: 21pt; font-weight: 600; letter-spacing: -.01em; margin: 0 0 2mm; }
.meta { font-size: 8.7pt; color: #55606f; line-height: 1.65; }

.doc { text-align: right; flex-shrink: 0; }
.doc-title {
  font-size: 15pt; font-weight: 700; letter-spacing: .13em;
  color: #0f2544; margin-bottom: 3mm; white-space: nowrap;
}
.doc-meta { margin-left: auto; border-collapse: collapse; font-size: 9pt; }
.doc-meta td { padding: .6mm 0 .6mm 5mm; text-align: right; }
.doc-meta td:first-child { color: #6b7684; padding-left: 0; text-align: left; }

.panels { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin: 8mm 0 6mm; }
.panel { border: 1px solid #d6dae1; border-left: 3px solid #0f2544; padding: 3.5mm 4mm; background: #fbfcfd; }
.panel-h {
  font-size: 7.5pt; font-weight: 700; letter-spacing: .13em;
  text-transform: uppercase; color: #6b7684; margin-bottom: 1.8mm;
}
.panel-strong { font-size: 11.5pt; font-weight: 600; margin-bottom: 1.5mm; }
.kv { display: grid; grid-template-columns: auto 1fr; gap: .5mm 4mm; margin: 0; font-size: 9pt; }
.kv dt { color: #6b7684; }
.kv dd { margin: 0; }

.lines { width: 100%; border-collapse: collapse; margin-top: 2mm; font-size: 9.5pt; }
.lines thead th {
  background: #0f2544; color: #fff; text-align: left;
  padding: 2.4mm 3mm; font-size: 8pt; font-weight: 600;
  letter-spacing: .1em; text-transform: uppercase;
}
.lines tbody td { padding: 2.3mm 3mm; border-bottom: 1px solid #e4e7ec; vertical-align: top; }
.lines tbody tr:nth-child(even) td { background: #f7f8fa; }
.c-qty, .c-rate, .c-amt { text-align: right; white-space: nowrap; }
.c-amt { font-weight: 600; }
.c-area { color: #55606f; white-space: nowrap; width: 24mm; font-size: 8.6pt; }
.sub { color: #7b8492; font-size: 8.4pt; }
.empty { text-align: center; color: #8b94a1; padding: 10mm 0; font-style: italic; }

/* Section bands. The zebra striping above counts rows, not lines, so it has to
   be switched off through the headings or the banding walks out of step. */
.lines tbody tr.sec-row th {
  background: #e8ecf3; color: #0f2544; text-align: left;
  padding: 2mm 3mm; font-size: 8.2pt; font-weight: 700;
  letter-spacing: .09em; text-transform: uppercase;
  border-bottom: 1px solid #c9d2e0;
}
.lines tbody tr.sec-sub td {
  background: #fff; border-bottom: 1.5px solid #0f2544;
  font-weight: 600; color: #0f2544; font-size: 9pt;
}
.lines tbody tr.sec-row td, .lines tbody tr.sec-sub td { background-image: none; }
/* Keep a section heading with at least the first line under it. */
.lines tbody tr.sec-row { break-after: avoid; page-break-after: avoid; }
.lines tbody tr.sec-sub { break-before: avoid; page-break-before: avoid; }

.totals-wrap { display: flex; justify-content: flex-end; margin-top: 5mm; }
.totals { border-collapse: collapse; min-width: 72mm; font-size: 10pt; }
.totals td { padding: 1.6mm 3mm; }
.totals td:first-child { color: #55606f; }
.totals td:last-child { text-align: right; }
.totals .grand td {
  background: #0f2544; color: #fff; font-weight: 700;
  font-size: 13pt; padding: 3mm;
}

.note { margin-top: 7mm; font-size: 9.5pt; }
.note p { margin: 0; white-space: pre-wrap; }

.foot { margin-top: 9mm; border-top: 1px solid #d6dae1; padding-top: 3.5mm; }
.terms { font-size: 8pt; color: #6b7684; line-height: 1.6; margin: 0 0 2.5mm; white-space: pre-wrap; }
.thanks { font-size: 9pt; color: #0f2544; font-style: italic; margin: 0; }
.gst { font-size: 7.8pt; color: #8b94a1; margin: 1.5mm 0 0; }

/* ---- Print ----
   margin:0 on @page is what removes the browser's own header and footer, i.e.
   the URL top-right and the page number along the bottom. The sheet supplies
   its own margins instead. */
@page { size: A4; margin: 0; }

@media print {
  .no-print { display: none !important; }
  .page { background: #fff; padding: 0; }
  .sheet {
    width: auto; min-height: 0; margin: 0;
    box-shadow: none; overflow: visible;
    padding: 16mm 15mm 14mm;
  }
  /* Keep the navy bars and zebra striping — browsers drop backgrounds by default. */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .watermark { position: fixed; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr, .panel, .totals, .foot { break-inside: avoid; }
}
`;
