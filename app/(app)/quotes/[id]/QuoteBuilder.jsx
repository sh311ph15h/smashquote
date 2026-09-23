'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { money, quoteTotals } from '@/lib/money';
import { saveQuote } from '@/app/actions/quotes';
import { Combo, NumberField } from './Fields';
import { VEHICLE_MAKES, modelsForMake } from '@/lib/vehicles';
import { LIABILITIES, excessApplies } from '@/lib/liability';
import { groupBySection, isTimeSection, rateFor } from '@/lib/lineTypes';
import { bodyTypeForVehicle, baseBody, panelOps, BODY_TYPES } from '@/lib/panels';
import QuoteLink from './QuoteLink';
import Section from './Sections';
import CarPanel from './CarPanel';

const STATUSES = ['draft', 'sent', 'approved', 'declined', 'invoiced', 'cancelled'];
const uid = () => Math.random().toString(36).slice(2);

export default function QuoteBuilder({ shop, quote, initialLines, relatedQuote, causedQuotes = [] }) {
  const [header, setHeader] = useState({
    vehicle_id: quote.vehicle_id || null,
    customer_id: quote.customer_id || null,
    rego: quote.vehicle?.rego || '',
    vin: quote.vehicle?.vin || '',
    make: quote.vehicle?.make || '',
    model: quote.vehicle?.model || '',
    year: quote.vehicle?.year || '',
    colour: quote.vehicle?.colour || '',
    paint_code: quote.vehicle?.paint_code || '',
    body_type: bodyTypeForVehicle(quote.vehicle) || 'sedan',
    customer_name: quote.customer?.name || '',
    customer_phone: quote.customer?.phone || '',
    claim_number: quote.claim_number || '',
    excess: quote.excess ?? '',
    status: quote.status || 'draft',
    liability: quote.liability || '',
    is_third_party: quote.is_third_party || false,
    related_quote_id: quote.related_quote_id || null,
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
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState('');
  // Held alongside the id so a freshly picked link renders straight away,
  // instead of waiting for a save and reload to learn what it points at.
  const [linked, setLinked] = useState(relatedQuote || null);
  // Which panel the diagram is focused on. Purely a UI focus — it decides where
  // a new line lands, and nothing about it is saved.
  const [selectedArea, setSelectedArea] = useState(null);

  const markDirty = () => { setSaved(false); setDirty(true); };

  // Closing the tab on an unsaved estimate loses every line typed since the
  // last save — ask first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const setH = (k, v) => { setHeader(h => ({ ...h, [k]: v })); markDirty(); };
  // Picking a different make clears a model that belonged to the old one, but
  // leaves free-typed models alone so a part-finished entry isn't wiped.
  const setMake = (v) => {
    setHeader(h => {
      const stale = h.model && modelsForMake(h.make).includes(h.model)
        && !modelsForMake(v).includes(h.model);
      return { ...h, make: v, model: stale ? '' : h.model };
    });
    markDirty();
  };
  const setLine = (k, field, v) => {
    setLines(ls => ls.map(l => (l._k === k ? { ...l, [field]: v } : l)));
    markDirty();
  };

  // A new line starts in the section it was added from, on the panel currently
  // selected on the diagram — so clicking a guard and hitting "+ Repair" needs
  // no further pointing at anything.
  const addLine = (type, areaId = selectedArea) => {
    setLines(ls => [...ls, {
      _k: uid(), line_type: type, description: '', part_number: '',
      source: type === 'part' ? 'new' : null,
      area_id: areaId ?? null,
      quantity: 1, unit_price: '',
      hours: isTimeSection(type) ? 1 : null,
      rate: isTimeSection(type) ? rateFor(type, header) : null,
      taxable: true,
    }]);
    markDirty();
  };

  // A pick-list row carries the panel it belongs to and, for R&R, Repair and
  // Paint, a standard time. Both are taken: the area is the whole reason the
  // diagram can colour itself off the estimate, and re-deriving it from the
  // wording would be guesswork over data we already have.
  const applyPick = (k, row) => {
    setLines(ls => ls.map(l => {
      if (l._k !== k) return l;
      const next = { ...l };
      if (row?.areaId) next.area_id = row.areaId;
      if (row?.hours && isTimeSection(l.line_type)) {
        next.hours = row.hours;
        next.rate = l.rate || rateFor(l.line_type, header);
      }
      return next;
    }));
    markDirty();
  };

  const removeLine = (k) => { setLines(ls => ls.filter(l => l._k !== k)); markDirty(); };
  // Up/down moves within the line's own section. The list is stored flat, so
  // swapping with the flat neighbour would usually swap with a line from
  // another section and look like nothing happened.
  const move = (k, dir) => {
    setLines(ls => {
      const i = ls.findIndex(l => l._k === k);
      if (i < 0) return ls;
      let j = i + dir;
      while (j >= 0 && j < ls.length && ls[j].line_type !== ls[i].line_type) j += dir;
      if (j < 0 || j >= ls.length) return ls;
      const copy = [...ls]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
    });
    markDirty();
  };

  const totals = useMemo(() => quoteTotals(lines, quote.gst_rate ?? 0.1), [lines, quote.gst_rate]);
  const sections = useMemo(() => groupBySection(lines), [lines]);
  // What the diagram paints, read straight out of the lines.
  const ops = useMemo(() => panelOps(lines), [lines]);

  const onSave = () => startSave(async () => {
    setSaveError('');
    try {
      const res = await saveQuote(quote.id, header, lines.map(({ _k, ...l }) => l));
      if (res?.error) { setSaveError(res.error); return; }
      // The first save creates the car and customer rows; hold on to their ids
      // so the next save updates them instead of inserting duplicates.
      setHeader(h => ({ ...h, vehicle_id: res?.vehicleId ?? h.vehicle_id, customer_id: res?.customerId ?? h.customer_id }));
      setSaved(true);
      setDirty(false);
    } catch (e) {
      setSaveError(e?.message || 'Could not save. Check the connection and try again.');
    }
  });

  return (
    <div>
      <div className="quote-head">
        <div>
          <Link href="/" style={{ color: 'var(--muted)', fontSize: '.85rem' }}>← All quotes</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Quote Q{String(quote.quote_number).padStart(4, '0')}</h1>
        </div>
        <div className="quote-actions">
          <select className="select" style={{ width: 'auto' }} value={header.status} onChange={e => setH('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
          <a className="btn secondary" href={`/print/${quote.id}`} target="_blank">Preview / PDF</a>
          <button className="btn" onClick={onSave} disabled={pending}>
            {pending ? 'Saving…' : saved ? 'Saved ✓' : dirty ? 'Save quote •' : 'Save quote'}
          </button>
        </div>
      </div>
      {saveError && <p className="capture-error" role="alert">Not saved: {saveError}</p>}

      {/* Vehicle + customer */}
      <div className="quote-top">
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '.8rem' }}>Vehicle</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
            <Field label="Rego" v={header.rego} on={v => setH('rego', v)} />
            <NumberField label="Year" value={header.year} onChange={v => setH('year', v)} decimals={0} maxLength={4} placeholder="2019" />
            <Combo label="Make" value={header.make} onChange={setMake} options={VEHICLE_MAKES} placeholder="Start typing…" />
            <Combo label="Model" value={header.model} onChange={v => setH('model', v)} options={modelsForMake(header.make)} placeholder={header.make ? 'Start typing…' : 'Pick a make first'} />
            <Field label="Colour" v={header.colour} on={v => setH('colour', v)} />
            <Field label="Paint code" v={header.paint_code} on={v => setH('paint_code', v)} />
            <div>
              <label className="label">Body type</label>
              <select className="select" value={baseBody(header.body_type)}
                onChange={e => setH('body_type', e.target.value)}>
                {BODY_TYPES.filter(b => !b.model).map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
              </select>
            </div>
            <div />
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="VIN" v={header.vin} on={v => setH('vin', v.toUpperCase())} />
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '.8rem' }}>Customer & claim</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
            <Field label="Customer name" v={header.customer_name} on={v => setH('customer_name', v)} />
            <Field label="Phone" v={header.customer_phone} on={v => setH('customer_phone', v)} />
            <Field label="Claim number" v={header.claim_number} on={v => setH('claim_number', v)} />
            <NumberField
              label={excessApplies(header.liability) ? 'Excess ($) — payable' : 'Excess ($)'}
              value={header.excess}
              onChange={v => setH('excess', v)}
            />
            <NumberField label="Labour rate ($/hr)" value={header.labour_rate} onChange={v => setH('labour_rate', v)} />
            <NumberField label="Paint rate ($/hr)" value={header.paint_rate} onChange={v => setH('paint_rate', v)} />
          </div>
        </div>
      </div>

      {/* Fault — kept out of the status dropdown on purpose. Status is where
          the paperwork has got to; this is whose fault the crash was, and the
          two move independently. */}
      <div className="card fault-card">
        <div className="fault-main">
          <div>
            <span className="label">Fault / liability</span>
            <div className="fault-set" role="group" aria-label="Fault">
              {LIABILITIES.map(l => (
                <button
                  key={l.key}
                  className={'chip' + (header.liability === l.key ? ' is-on' : '')}
                  style={header.liability === l.key ? { borderColor: l.tone, color: l.tone } : undefined}
                  aria-pressed={header.liability === l.key}
                  title={l.hint}
                  onClick={() => setH('liability', header.liability === l.key ? '' : l.key)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Same chip style as fault on purpose: both are one-tap answers
              about the job, and a lone checkbox read as a different kind of
              control. */}
          <div>
            <span className="label">Whose car</span>
            <div className="fault-set" role="group" aria-label="Whose car">
              {[
                { tp: false, label: 'Our customer' },
                { tp: true, label: 'Third party' },
              ].map(o => (
                <button
                  key={o.label}
                  className={'chip' + (header.is_third_party === o.tp ? ' is-on' : '')}
                  aria-pressed={header.is_third_party === o.tp}
                  title={o.tp ? "The other driver's vehicle, repaired at no cost to them." : undefined}
                  onClick={() => setH('is_third_party', o.tp)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* A third party's car is always someone else's accident. The link back
            to the at-fault job is what connects it to a customer of ours. */}
        {header.is_third_party && (
          <div className="tp-link">
            <QuoteLink
              value={header.related_quote_id}
              current={linked}
              excludeId={quote.id}
              onChange={(picked) => {
                setLinked(picked);
                setH('related_quote_id', picked?.id || null);
              }}
            />
            {!header.related_quote_id && (
              <p className="fault-warn">
                Not linked yet — pick the job of the car that hit it, so this repair traces back to our customer.
              </p>
            )}
          </div>
        )}

        {/* The other direction: our customer's at-fault job, showing the cars
            their accident put through the shop. */}
        {!header.is_third_party && causedQuotes.length > 0 && (
          <div className="tp-caused">
            <span className="label">Third party cars from this accident</span>
            {causedQuotes.map(c => (
              <div className="link-row" key={c.id}>
                <a className="quote-no" href={`/quotes/${c.id}`}>Q{String(c.quote_number).padStart(4, '0')}</a>
                <span className="link-desc">
                  {[c.vehicle?.rego, [c.vehicle?.make, c.vehicle?.model].filter(Boolean).join(' ')]
                    .filter(Boolean).join(' · ') || 'No vehicle'}
                </span>
                <span className="pill tp-pill">3rd party</span>
              </div>
            ))}
          </div>
        )}

        {header.is_third_party && (
          <p className="fault-hint">The other driver&apos;s vehicle, repaired at no cost to them.</p>
        )}
        {header.liability && (
          <p className="fault-hint">
            {LIABILITIES.find(l => l.key === header.liability)?.hint}
          </p>
        )}
        {excessApplies(header.liability) && !Number(header.excess) && (
          <p className="fault-warn">An at-fault job normally carries an excess — the excess field is still empty.</p>
        )}
        {!excessApplies(header.liability) && header.liability && Number(header.excess) > 0 && (
          <p className="fault-warn">There&apos;s an excess on this quote, but the job isn&apos;t at fault.</p>
        )}
      </div>

      {/* The car, and the six sections of the estimate. Both read from the
          same lines: colouring on the diagram is derived from what's been
          added, never stored beside it. */}
      <CarPanel
        bodyType={header.body_type}
        onBodyType={v => setH('body_type', v)}
        ops={ops}
        lines={lines}
        selected={selectedArea}
        onSelect={setSelectedArea}
        onAdd={(type, area) => addLine(type, area)}
      />

      <div className="sections">
        {sections.map(sec => (
          <Section
            key={sec.key}
            section={sec}
            lines={sec.lines}
            header={header}
            bodyType={header.body_type}
            selectedArea={selectedArea}
            onAdd={addLine}
            onChange={setLine}
            onPick={applyPick}
            onRemove={removeLine}
            onMove={move}
            onFocusArea={setSelectedArea}
          />
        ))}
      </div>

      {/* Notes + totals */}
      <div className="quote-foot">
        <div className="card quote-notes">
          <h3 style={{ fontWeight: 700, marginBottom: '.8rem' }}>Notes</h3>
          <label className="label">Notes on the quote (printed)</label>
          <textarea className="input" rows={3} value={header.notes}
            onChange={e => setH('notes', e.target.value)} />
          <label className="label" style={{ marginTop: '.6rem' }}>Assessor / internal notes (not printed)</label>
          <textarea className="input" rows={3} value={header.assessor_notes}
            onChange={e => setH('assessor_notes', e.target.value)} />
          <div style={{ marginTop: '.6rem', maxWidth: 220 }}>
            <Field label={header.status === 'invoiced' ? 'Payment due' : 'Valid until'} type="date"
              v={header.valid_until} on={v => setH('valid_until', v)} />
          </div>
        </div>
        <div className="card quote-totals">
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
