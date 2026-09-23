'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LIABILITIES } from '@/lib/liability';

const STATUSES = ['draft', 'sent', 'approved', 'declined', 'invoiced', 'cancelled'];

// ---------------------------------------------------------------------------
// The search bar over the quote list.
//
// State lives in the URL, not in the component: a search someone lands on can
// be bookmarked, shared with the office and reloaded without losing the filter.
// The server page reads the same query string, so filtering happens in Postgres
// over every quote rather than over the hundred the browser happens to hold.
// ---------------------------------------------------------------------------
export default function QuoteFilters({ initial, resultCount }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const [term, setTerm] = useState(initial.q || '');
  const first = useRef(true);

  const push = (next) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...initial, ...next })) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // Typing shouldn't fire a query per keystroke, and shouldn't re-push the
  // term the page was already loaded with.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      if (term !== (initial.q || '')) push({ q: term });
    }, 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  // A filter is on if it isn't the default "everything".
  const active = Boolean(initial.q || initial.liability || initial.party || initial.status);

  return (
    <div className="filters">
      <div className="filters-row">
        <div className="search-wrap">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            className="input search-input"
            type="search"
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder="Search rego, VIN, make, model, customer, claim or quote no."
            aria-label="Search quotes"
          />
          {term && (
            <button className="search-clear" onClick={() => { setTerm(''); push({ q: '' }); }} aria-label="Clear search">✕</button>
          )}
        </div>
        {active && (
          <button className="btn ghost" onClick={() => { setTerm(''); push({ q: '', liability: '', party: '', status: '' }); }}>
            Reset
          </button>
        )}
      </div>

      <div className="chip-rows">
        <ChipRow label="Fault">
          <Chip on={!initial.liability} onClick={() => push({ liability: '' })}>All</Chip>
          {LIABILITIES.map(l => (
            <Chip
              key={l.key}
              on={initial.liability === l.key}
              tone={l.tone}
              title={l.hint}
              onClick={() => push({ liability: initial.liability === l.key ? '' : l.key })}
            >
              {l.label}
            </Chip>
          ))}
          <Chip
            on={initial.liability === 'none'}
            title="Fault hasn't been recorded on the quote yet."
            onClick={() => push({ liability: initial.liability === 'none' ? '' : 'none' })}
          >
            Not set
          </Chip>
        </ChipRow>

        <ChipRow label="Whose car">
          <Chip on={!initial.party} onClick={() => push({ party: '' })}>All</Chip>
          <Chip
            on={initial.party === 'customer'}
            title="Our own customer's vehicle."
            onClick={() => push({ party: initial.party === 'customer' ? '' : 'customer' })}
          >
            Our customer
          </Chip>
          <Chip
            on={initial.party === 'third_party'}
            tone="var(--brand)"
            title="The other driver's car, repaired at no cost to them. They aren't our customer."
            onClick={() => push({ party: initial.party === 'third_party' ? '' : 'third_party' })}
          >
            Third party
          </Chip>
        </ChipRow>

        <ChipRow label="Status">
          <Chip on={!initial.status} onClick={() => push({ status: '' })}>All</Chip>
          {STATUSES.map(s => (
            <Chip key={s} on={initial.status === s} onClick={() => push({ status: initial.status === s ? '' : s })}>
              {s[0].toUpperCase() + s.slice(1)}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {active && (
        <p className="filters-count" aria-live="polite">
          {pending ? 'Searching…' : `${resultCount} ${resultCount === 1 ? 'quote' : 'quotes'} match`}
        </p>
      )}
    </div>
  );
}

function ChipRow({ label, children }) {
  return (
    <div className="chip-row">
      <span className="chip-label">{label}</span>
      <div className="chip-set">{children}</div>
    </div>
  );
}

function Chip({ on, tone, children, ...rest }) {
  return (
    <button
      className={'chip' + (on ? ' is-on' : '')}
      style={on && tone ? { borderColor: tone, color: tone } : undefined}
      aria-pressed={on}
      {...rest}
    >
      {children}
    </button>
  );
}
