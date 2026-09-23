'use client';

import { useEffect, useRef, useState } from 'react';
import { searchQuotesForLink } from '@/app/actions/quotes';
import { liabilityMeta } from '@/lib/liability';

const quoteNo = n => `Q${String(n).padStart(4, '0')}`;
const describe = q => [
  q.vehicle?.rego,
  [q.vehicle?.make, q.vehicle?.model].filter(Boolean).join(' '),
  q.customer?.name,
].filter(Boolean).join(' · ') || 'No vehicle';

// ---------------------------------------------------------------------------
// "Arising from" — pins a third party's car to the at-fault job that caused it.
//
// The other driver's car is only in the shop because one of our customers ran
// into it, so this is the thread back to our customer. Searched by the at-fault
// car's plate or the customer's name, since that's what's known when the second
// car is booked in.
// ---------------------------------------------------------------------------
export default function QuoteLink({ value, current, onChange, excludeId }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // The spinner goes up when the request actually starts, not on every
    // keystroke — flagging "searching" during the debounce is just flicker.
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await searchQuotesForLink(term, excludeId);
      if (cancelled) return;
      setResults(res.quotes || []);
      setLoading(false);
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [term, open, excludeId]);

  if (value && current) {
    const fault = liabilityMeta(current.liability);
    return (
      <div className="link-picked">
        <span className="label">Arising from</span>
        <div className="link-row">
          <a className="quote-no" href={`/quotes/${current.id}`}>{quoteNo(current.quote_number)}</a>
          <span className="link-desc">{describe(current)}</span>
          {fault && <span className="pill" style={{ color: fault.tone, borderColor: fault.tone }}>{fault.label}</span>}
          <button className="btn ghost link-clear" onClick={() => onChange(null)}>Unlink</button>
        </div>
      </div>
    );
  }

  return (
    <div className="link-picker" ref={wrapRef}>
      <span className="label">Arising from — our customer&apos;s job</span>
      <input
        className="input"
        value={term}
        onChange={e => { setTerm(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search the at-fault car by rego, customer or quote no."
        aria-label="Find the at-fault quote"
      />
      {open && (
        <ul className="combo-list link-list" role="listbox">
          {loading && <li className="combo-option link-note">Searching…</li>}
          {!loading && results.length === 0 && (
            <li className="combo-option link-note">
              {term ? 'No quote matches that.' : 'No quotes to link to yet.'}
            </li>
          )}
          {!loading && results.map(q => {
            const fault = liabilityMeta(q.liability);
            return (
              <li
                key={q.id}
                role="option"
                aria-selected="false"
                className="combo-option link-option"
                onMouseDown={(e) => { e.preventDefault(); onChange(q); setOpen(false); setTerm(''); }}
              >
                <span className="link-no">{quoteNo(q.quote_number)}</span>
                <span className="link-desc">{describe(q)}</span>
                {fault && <span className="link-fault" style={{ color: fault.tone }}>{fault.label}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {value && !current && (
        <p className="fault-warn">Linked to a quote that isn&apos;t visible here. Save to keep it, or unlink.</p>
      )}
    </div>
  );
}
