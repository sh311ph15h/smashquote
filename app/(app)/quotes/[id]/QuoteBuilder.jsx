'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { money, quoteTotals, lineTotal } from '@/lib/money';
import { saveQuote } from '@/app/actions/quotes';
import { Combo, NumberField, PickField } from './Fields';
import { VEHICLE_MAKES, modelsForMake } from '@/lib/vehicles';
import { PICK_FOR_LINE } from '@/lib/picklist';

const LINE_TYPES = [
  { key: 'part',   label: 'Part' },
  { key: 'paint',  label: 'Paint & materials' },
  { key: 'labour', label: 'Labour' },
  { key: 'sublet', label: 'Sublet' },
  { key: 'misc',   label: 'Misc' },
];
const SOURCES = ['new', 'aftermarket', 'used', 'recycled', 'exchange'];
const STATUSES = ['draft', 'sent', 'approved', 'declined', 'invoiced', 'cancelled'];
const isTime = t => t === 'labour' || t === 'paint';
const uid = () => Math.random().toString(36).slice(2);

export default function QuoteBuilder({ shop, quote, initialLines }) {
  const [header, setHeader] = useState({
    vehicle_id: quote.vehicle_id || null,
    customer_id: quote.customer_id || null,
    rego: quote.vehicle?.rego || '',
    make: quote.vehicle?.make || '',
    model: quote.vehicle?.model || '',
    year: quote.vehicle?.year || '',
    colour: quote.vehicle?.colour || '',
    paint_code: quote.vehicle?.paint_code || '',
    customer_name: quote.customer?.name || '',
    customer_phone: quote.customer?.phone || '',
    claim_number: quote.claim_number || '',
    excess: quote.excess ?? '',
    status: quote.status || 'draft',
    labour_rate: quote.labour_rate ?? shop.default_labour_rate ?? 0,
    paint_rate: quote.paint_rate ?? shop.default_paint_rate ?? 0,
    valid_until: quote.valid_until || '',
    notes: quote.notes || '',
    assessor_notes: quote.assessor_notes || '',
  });

  const [lines, setLines] = useState(
    initialLines.map(l => ({ ...l, _k: uid() })),
  );
  const [pending, startSave] = useTransition();
  const [saved, setSaved] = useState(false);

  const setH = (k, v) => { setHeader(h => ({ ...h, [k]: v })); setSaved(false); };
  // Picking a different make clears a model that belonged to the old one, but
  // leaves free-typed models alone so a part-finished entry isn't wiped.
  const setMake = (v) => {
    setHeader(h => {
      const stale = h.model && modelsForMake(h.make).includes(h.model)
        && !modelsForMake(v).includes(h.model);
      return { ...h, make: v, model: stale ? '' : h.model };
    });
    setSaved(false);
  };
  const setLine = (k, field, v) => {
    setLines(ls => ls.map(l => (l._k === k ? { ...l, [field]: v } : l)));
    setSaved(false);
  };

  const addLine = (type) => {
    setLines(ls => [...ls, {
      _k: uid(), line_type: type, description: '', part_number: '',
      source: type === 'part' ? 'new' : null,
      quantity: 1, unit_price: '',
      hours: isTime(type) ? 1 : null,
      rate: isTime(type) ? (type === 'paint' ? header.paint_rate : header.labour_rate) : null,
      taxable: true,
    }]);
    setSaved(false);
  };
  // A pick-list row can carry a standard time. On a labour or paint line that
  // fills hours and the matching rate; on other line types only the wording is
  // taken, since qty and price are the shop's own.
  const applyPick = (k, row) => {
    if (!row?.hours) return;
    setLines(ls => ls.map(l => {
      if (l._k !== k || !isTime(l.line_type)) return l;
      return {
        ...l,
        hours: row.hours,
        rate: l.rate || (l.line_type === 'paint' ? header.paint_rate : header.labour_rate),
      };
    }));
    setSaved(false);
  };

  const removeLine = (k) => { setLines(ls => ls.filter(l => l._k !== k)); setSaved(false); };
  const move = (k, dir) => setLines(ls => {
    const i = ls.findIndex(l => l._k === k);
    const j = i + dir;
    if (j < 0 || j >= ls.length) return ls;
    const copy = [...ls]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
  });

  const totals = useMemo(() => quoteTotals(lines, quote.gst_rate ?? 0.1), [lines, quote.gst_rate]);

  const onSave = () => startSave(async () => {
    await saveQuote(quote.id, header, lines.map(({ _k, ...l }) => l));
    setSaved(true);
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <div>
          <Link href="/" style={{ color: 'var(--muted)', fontSize: '.85rem' }}>← All quotes</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Quote Q{String(quote.quote_number).padStart(4, '0')}</h1>
        </div>
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
          <select className="select" style={{ width: 'auto' }} value={header.status} onChange={e => setH('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
          <a className="btn secondary" href={`/print/${quote.id}`} target="_blank">Preview / PDF</a>
          <button className="btn" onClick={onSave} disabled={pending}>
            {pending ? 'Saving…' : saved ? 'Saved ✓' : 'Save quote'}
          </button>
        </div>
      </div>

      {/* Vehicle + customer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '.8rem' }}>Vehicle</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
            <Field label="Rego" v={header.rego} on={v => setH('rego', v)} />
            <NumberField label="Year" value={header.year} onChange={v => setH('year', v)} decimals={0} maxLength={4} placeholder="2019" />
            <Combo label="Make" value={header.make} onChange={setMake} options={VEHICLE_MAKES} placeholder="Start typing…" />
            <Combo label="Model" value={header.model} onChange={v => setH('model', v)} options={modelsForMake(header.make)} placeholder={header.make ? 'Start typing…' : 'Pick a make first'} />
            <Field label="Colour" v={header.colour} on={v => setH('colour', v)} />
            <Field label="Paint code" v={header.paint_code} on={v => setH('paint_code', v)} />
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '.8rem' }}>Customer & claim</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
            <Field label="Customer name" v={header.customer_name} on={v => setH('customer_name', v)} />
            <Field label="Phone" v={header.customer_phone} on={v => setH('customer_phone', v)} />
            <Field label="Claim number" v={header.claim_number} on={v => setH('claim_number', v)} />
            <NumberField label="Excess ($)" value={header.excess} onChange={v => setH('excess', v)} />
            <NumberField label="Labour rate ($/hr)" value={header.labour_rate} onChange={v => setH('labour_rate', v)} />
            <NumberField label="Paint rate ($/hr)" value={header.paint_rate} onChange={v => setH('paint_rate', v)} />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem', minWidth: 820 }}>
            <thead>
              <tr style={{ color: 'var(--muted)', fontSize: '.72rem', textAlign: 'left' }}>
                <th style={{ padding: '.6rem .5rem .6rem 1rem' }}>Type</th>
                <th>Description</th>
                <th style={{ width: 110 }}>Part no.</th>
                <th style={{ width: 90 }}>Qty / Hrs</th>
                <th style={{ width: 100 }}>Price / Rate</th>
                <th style={{ width: 100, textAlign: 'right' }}>Total</th>
                <th style={{ width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  No line items yet — add one below.
                </td></tr>
              )}
              {lines.map(l => (
                <tr key={l._k} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '.4rem .5rem .4rem 1rem' }}>
                    <select className="select" value={l.line_type} onChange={e => setLine(l._k, 'line_type', e.target.value)}>
                      {LINE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '.4rem .3rem' }}>
                    <PickField
                      group={PICK_FOR_LINE[l.line_type]}
                      value={l.description || ''}
                      onChange={v => setLine(l._k, 'description', v)}
                      onPick={row => applyPick(l._k, row)}
                      placeholder="Type a code or description — e.g. LFD"
                    />
                    {l.line_type === 'part' && (
                      <select className="select" style={{ marginTop: '.3rem', fontSize: '.75rem' }} value={l.source || 'new'} onChange={e => setLine(l._k, 'source', e.target.value)}>
                        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </td>
                  <td style={{ padding: '.4rem .3rem' }}>
                    <input className="input" value={l.part_number || ''} disabled={isTime(l.line_type)} onChange={e => setLine(l._k, 'part_number', e.target.value)} />
                  </td>
                  <td style={{ padding: '.4rem .3rem' }}>
                    {isTime(l.line_type)
                      ? <NumberField value={l.hours ?? ''} onChange={v => setLine(l._k, 'hours', v)} decimals={2} />
                      : <NumberField value={l.quantity ?? ''} onChange={v => setLine(l._k, 'quantity', v)} decimals={0} />}
                  </td>
                  <td style={{ padding: '.4rem .3rem' }}>
                    {isTime(l.line_type)
                      ? <NumberField value={l.rate ?? ''} onChange={v => setLine(l._k, 'rate', v)} />
                      : <NumberField value={l.unit_price ?? ''} onChange={v => setLine(l._k, 'unit_price', v)} />}
                  </td>
                  <td style={{ padding: '.4rem .5rem', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{money(lineTotal(l))}</td>
                  <td style={{ padding: '.4rem .5rem', whiteSpace: 'nowrap' }}>
                    <button className="btn ghost" title="Up" onClick={() => move(l._k, -1)} style={{ padding: '.2rem .35rem' }}>↑</button>
                    <button className="btn ghost" title="Down" onClick={() => move(l._k, 1)} style={{ padding: '.2rem .35rem' }}>↓</button>
                    <button className="btn ghost" title="Remove" onClick={() => removeLine(l._k)} style={{ padding: '.2rem .35rem', color: 'var(--bad)' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '.5rem', padding: '.8rem 1rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {LINE_TYPES.map(t => (
            <button key={t.key} className="btn secondary" onClick={() => addLine(t.key)}>+ {t.label}</button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <div className="card" style={{ width: 320 }}>
          <Row k="Subtotal" v={money(totals.subtotal)} />
          <Row k={`GST (${Math.round((quote.gst_rate ?? 0.1) * 100)}%)`} v={money(totals.gst)} />
          <div style={{ borderTop: '1px solid var(--border)', margin: '.6rem 0' }} />
          <Row k="Total" v={money(totals.total)} big />
        </div>
      </div>
    </div>
  );
}

function Field({ label, v, on, type = 'text' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} value={v ?? ''} onChange={e => on(e.target.value)} />
    </div>
  );
}
function Row({ k, v, big }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.25rem 0', fontSize: big ? '1.15rem' : '.9rem', fontWeight: big ? 800 : 500 }}>
      <span style={{ color: big ? 'var(--text)' : 'var(--muted)' }}>{k}</span><span>{v}</span>
    </div>
  );
}
