'use client';

import { money, lineTotal } from '@/lib/money';
import { NumberField, PickField } from './Fields';
import { PICK_FOR_LINE } from '@/lib/picklist';
import { OTHER_AREAS, panelsFor, areaLabel } from '@/lib/panels';

const SOURCES = ['new', 'aftermarket', 'used', 'recycled', 'exchange'];

// ---------------------------------------------------------------------------
// One section of the estimate — R&R, Repair, Paint, Parts, Sublets or Other.
//
// Each carries only the columns its own work needs. The old single table gave
// every line a Part no. and a Qty/Hrs column that meant different things
// depending on a dropdown two columns to the left; here a paint line has hours
// and a rate, and a part has a number and a source, and neither shows the
// other's fields.
// ---------------------------------------------------------------------------
export default function Section({
  section, lines, header, bodyType,
  selectedArea, onAdd, onChange, onPick, onRemove, onMove, onFocusArea,
}) {
  const isTime = section.kind === 'time';
  const isPart = section.kind === 'part';

  const subtotal = lines.reduce((n, l) => n + lineTotal(l), 0);
  const hours = isTime
    ? lines.reduce((n, l) => n + Number(l.hours || 0), 0)
    : null;

  return (
    <section className="sec">
      <header className="sec-head">
        <div className="sec-id">
          <h3 className="sec-name">{section.label}</h3>
          <span className="sec-hint">{section.hint}</span>
        </div>
        <div className="sec-sum">
          {hours != null && lines.length > 0 && (
            <span className="sec-hours">{hours.toFixed(2)} hrs</span>
          )}
          <span className="sec-total">{money(subtotal)}</span>
          <button className="btn secondary sec-add" onClick={() => onAdd(section.key)}>
            + Add{selectedArea ? ` to ${areaLabel(selectedArea)}` : ''}
          </button>
        </div>
      </header>

      {lines.length === 0 ? (
        <p className="sec-empty">Nothing in {section.label.toLowerCase()} yet.</p>
      ) : (
        <div className="sec-scroll">
          <table className="sec-table">
            <thead>
              <tr>
                <th className="c-desc">Description</th>
                <th className="c-area">Panel</th>
                {isPart && <th className="c-partno">Part no.</th>}
                {isPart && <th className="c-source">Source</th>}
                <th className="c-num">{isTime ? 'Hours' : 'Qty'}</th>
                <th className="c-num">{isTime ? 'Rate' : 'Price'}</th>
                <th className="c-amt">Total</th>
                <th className="c-act" />
              </tr>
            </thead>
            <tbody>
              {lines.map(l => (
                <tr key={l._k} className={selectedArea && Number(l.area_id) === selectedArea ? 'is-focus' : undefined}>
                  <td className="c-desc">
                    <PickField
                      group={PICK_FOR_LINE[section.key]}
                      value={l.description || ''}
                      onChange={v => onChange(l._k, 'description', v)}
                      onPick={row => onPick(l._k, row)}
                      placeholder="Type a code or description — e.g. LFD"
                    />
                  </td>
                  <td className="c-area">
                    <AreaSelect
                      value={l.area_id}
                      bodyType={bodyType}
                      onChange={v => onChange(l._k, 'area_id', v)}
                      onFocusArea={onFocusArea}
                    />
                  </td>
                  {isPart && (
                    <td className="c-partno">
                      <input className="input" value={l.part_number || ''}
                        onChange={e => onChange(l._k, 'part_number', e.target.value)} />
                    </td>
                  )}
                  {isPart && (
                    <td className="c-source">
                      <select className="select" value={l.source || 'new'}
                        onChange={e => onChange(l._k, 'source', e.target.value)}>
                        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  )}
                  <td className="c-num">
                    {isTime
                      ? <NumberField value={l.hours ?? ''} onChange={v => onChange(l._k, 'hours', v)} decimals={2} />
                      : <NumberField value={l.quantity ?? ''} onChange={v => onChange(l._k, 'quantity', v)} decimals={0} />}
                  </td>
                  <td className="c-num">
                    {isTime
                      ? <NumberField value={l.rate ?? ''} onChange={v => onChange(l._k, 'rate', v)} />
                      : <NumberField value={l.unit_price ?? ''} onChange={v => onChange(l._k, 'unit_price', v)} />}
                  </td>
                  <td className="c-amt">{money(lineTotal(l))}</td>
                  <td className="c-act">
                    <button className="btn ghost row-btn" title="Up" onClick={() => onMove(l._k, -1)}>↑</button>
                    <button className="btn ghost row-btn" title="Down" onClick={() => onMove(l._k, 1)}>↓</button>
                    <button className="btn ghost row-btn row-del" title="Remove" onClick={() => onRemove(l._k)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Which panel a line is for. Picking one from the pick list fills this in on
// its own — the list already knows — so this is for correcting it or for a
// line typed by hand.
function AreaSelect({ value, bodyType, onChange, onFocusArea }) {
  const panels = panelsFor(bodyType);
  return (
    <select
      className="select"
      value={value ?? ''}
      onChange={e => {
        const v = e.target.value === '' ? null : Number(e.target.value);
        onChange(v);
        if (v) onFocusArea?.(v);
      }}
    >
      <option value="">—</option>
      <optgroup label="Panels">
        {panels.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </optgroup>
      <optgroup label="Other areas">
        {OTHER_AREAS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </optgroup>
      {/* A line whose panel doesn't exist on this body type (a bootlid on a
          hatch, after the type was changed) would otherwise silently show as
          blank and be lost on the next save. */}
      {value && !panels.some(p => p.id === Number(value)) && !OTHER_AREAS.some(p => p.id === Number(value)) && (
        <option value={value}>{areaLabel(value)}</option>
      )}
    </select>
  );
}
