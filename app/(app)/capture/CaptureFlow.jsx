'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { searchVehicles } from '@/app/actions/vehicles';
import { saveAnnotations } from '@/app/actions/photos';
import { startQuoteForVehicle } from '@/app/actions/quotes';
import { PHOTO_SEGMENTS, segmentLabel } from '@/lib/photos';
import { liabilityMeta } from '@/lib/liability';
import { useUpload, CaptureButtons } from '@/components/PhotoUpload';
import { AnnotationLayer } from '@/components/Annotations';
import { markCount } from '@/lib/annotations';
import PhotoAnnotator from '@/components/PhotoAnnotator';

// ---------------------------------------------------------------------------
// Take photo / choose from gallery — the flow used with a car in front of you.
//
// Three questions, in the order someone on the floor can answer them:
//   1. which car   — by rego, suggested from what's recently been through
//   2. which job   — defaulted to the newest quote on that car, changeable
//   3. which stage — damage, under repair, painted, and so on
//
// Then the camera. Steps 2 and 3 are one tap each and step 2 usually needs no
// tap at all, so the common case is: pick the plate, pick the stage, shoot.
// ---------------------------------------------------------------------------

const fmtDate = d => new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
const quoteNo = n => `Q${String(n).padStart(4, '0')}`;

export default function CaptureFlow({ initialVehicles, presetType, configured }) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [term, setTerm] = useState('');
  const [searching, setSearching] = useState(false);

  const [vehicle, setVehicle] = useState(null);
  const [quote, setQuote] = useState(null);
  const [pickingQuote, setPickingQuote] = useState(false);
  const [category, setCategory] = useState(presetType || null);

  const [shot, setShot] = useState([]);       // uploaded this session
  const [editing, setEditing] = useState(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const { upload, uploading, error, setError } = useUpload(quote?.id);

  // Typing a plate searches the whole yard, not just the recent list.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await searchVehicles(term);
      if (cancelled) return;
      setVehicles(res.vehicles || []);
      setSearching(false);
    }, 260);
    return () => { cancelled = true; clearTimeout(t); };
  }, [term]);

  // Picking a car picks its newest quote too — that's the right one nine times
  // out of ten, and the one time it isn't there's a Change link right beside it.
  const chooseVehicle = (v) => {
    setVehicle(v);
    setQuote(v.quotes[0] || null);
    setPickingQuote(false);
    setShot([]);
    setError('');
  };

  // Open a fresh draft — on the car already chosen, or on a plate that isn't in
  // the system yet — and carry straight on to the camera.
  async function startQuote({ vehicleId, rego }) {
    setStarting(true); setStartError('');
    const res = await startQuoteForVehicle({ vehicleId, rego });
    setStarting(false);
    if (res.error) { setStartError(res.error); return; }
    const q = res.quote;
    if (vehicle) {
      setVehicle(v => ({ ...v, quotes: [q, ...v.quotes] }));
    } else {
      setVehicle({
        id: res.vehicleId, rego: String(rego).trim().toUpperCase(), vin: '', make: '', model: '',
        year: null, colour: '', customer: '', quotes: [q],
      });
    }
    setQuote(q);
    setPickingQuote(false);
  }

  const reset = () => {
    setVehicle(null); setQuote(null); setShot([]);
    setCategory(presetType || null); setPickingQuote(false); setError(''); setStartError('');
  };

  async function onFiles(files) {
    if (!quote || !category) return;
    const added = await upload(files, category);
    if (added.length) setShot(s => [...added, ...s]);
  }

  if (!configured) {
    return (
      <Shell title="Take photo">
        <p className="capture-note">
          Photo storage isn&apos;t connected yet. Add your Cloudflare R2 keys to{' '}
          <code>.env.local</code> and this turns on automatically.
        </p>
      </Shell>
    );
  }

  // ---- Step 1: which car -------------------------------------------------
  if (!vehicle) {
    return (
      <Shell title={presetType === 'invoice' ? 'Add invoice' : 'Take photo'}>
        <p className="capture-note">Which car? Start typing the rego, or pick one that&apos;s been through recently.</p>

        <input
          className="input capture-search"
          type="search"
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder="Rego, VIN, make or model"
          aria-label="Find a vehicle"
          autoFocus
        />

        {!term && <h2 className="capture-h">Recently added</h2>}
        {searching && <p className="capture-note">Searching…</p>}

        {!searching && vehicles.length === 0 && (
          <p className="capture-note">
            {term
              ? 'No car matches that. Check the plate, or add it as a new car above.'
              : 'No vehicles yet — create a quote and the car will show up here.'}
          </p>
        )}

        {term.trim() && !searching
          && !vehicles.some(v => v.rego?.toUpperCase() === term.trim().toUpperCase()) && (
          <button className="btn secondary capture-new" disabled={starting}
            onClick={() => startQuote({ rego: term })}>
            {starting ? 'Starting…' : `+ New car ${term.trim().toUpperCase()} — start a quote`}
          </button>
        )}
        {startError && <p className="capture-error">{startError}</p>}

        <div className="rego-grid">
          {vehicles.map(v => (
            <button key={v.id} className="rego-card" onClick={() => chooseVehicle(v)}>
              <span className="rego-plate">{v.rego || 'No rego'}</span>
              <span className="rego-desc">{[v.year, v.make, v.model].filter(Boolean).join(' ') || '—'}</span>
              <span className="rego-meta">
                {v.customer || 'No customer'} · {v.quotes.length} quote{v.quotes.length === 1 ? '' : 's'}
              </span>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  // ---- Step 2: which quote (only when the default isn't obvious) ---------
  if (!quote || pickingQuote) {
    return (
      <Shell title="Which job?" onBack={reset}>
        <VehicleBar vehicle={vehicle} />
        {vehicle.quotes.length === 0 && (
          <p className="capture-note">This car has no open quote yet.</p>
        )}
        <button className="btn secondary capture-new" disabled={starting}
          onClick={() => startQuote({ vehicleId: vehicle.id })}>
          {starting ? 'Starting…' : '+ Start a new quote for this car'}
        </button>
        {startError && <p className="capture-error">{startError}</p>}
        {vehicle.quotes.length > 0 && (
          <div className="job-list">
            {vehicle.quotes.map(q => {
              const fault = liabilityMeta(q.liability);
              return (
                <button key={q.id} className="job-card" onClick={() => { setQuote(q); setPickingQuote(false); }}>
                  <span className="job-no">{quoteNo(q.quote_number)}</span>
                  <span className="job-meta">
                    {fmtDate(q.created_at)} · {q.status}
                    {fault ? ` · ${fault.label}` : ''}
                    {q.is_third_party ? ' · 3rd party' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Shell>
    );
  }

  // ---- Step 3: which stage ----------------------------------------------
  if (!category) {
    return (
      <Shell title="What kind of photo?" onBack={reset}>
        <VehicleBar vehicle={vehicle} quote={quote} onChangeQuote={() => setPickingQuote(true)} />
        <div className="seg-grid">
          {PHOTO_SEGMENTS.map(s => (
            <button key={s.key} className="seg-card" onClick={() => setCategory(s.key)}>
              <span className="seg-name">{s.label}</span>
              <span className="seg-hint">{s.hint}</span>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  // ---- Step 4: shoot -----------------------------------------------------
  return (
    <Shell title={segmentLabel(category)} onBack={reset}>
      <VehicleBar vehicle={vehicle} quote={quote} onChangeQuote={() => setPickingQuote(true)} />

      <div className="capture-type">
        <span className="capture-type-label">Type</span>
        <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
          {PHOTO_SEGMENTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      <div className="capture-actions">
        <CaptureButtons onFiles={onFiles} disabled={uploading > 0} size="big" />
      </div>

      {uploading > 0 && <p className="capture-note">Uploading {uploading}…</p>}
      {error && <p className="capture-error">{error}</p>}

      {shot.length > 0 && (
        <>
          <h2 className="capture-h">Added this session ({shot.length})</h2>
          <div className="shot-grid">
            {shot.map(p => (
              <figure key={p.id} className="shot">
                <div className="shot-img">
                  {p.content_type === 'application/pdf'
                    ? <div className="shot-pdf">📄 PDF</div>
                    : <>
                        <img src={p.url} alt="" />
                        <AnnotationLayer marks={p.annotations} minimal />
                      </>}
                </div>
                <figcaption className="shot-cap">
                  <span className="pill">{segmentLabel(p.category)}</span>
                  {p.content_type !== 'application/pdf' && (
                    <button className="btn ghost shot-mark" onClick={() => setEditing(p)}>
                      ✎ Mark{markCount(p.annotations) ? ` (${markCount(p.annotations)})` : ''}
                    </button>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}

      <div className="capture-foot">
        <Link className="btn secondary" href={`/quotes/${quote.id}`}>
          Open {quoteNo(quote.quote_number)}
        </Link>
        <button className="btn ghost" onClick={reset}>Another car</button>
      </div>

      {editing && (
        <PhotoAnnotator
          photo={editing}
          onClose={() => setEditing(null)}
          onSave={async (marks) => {
            const res = await saveAnnotations(editing.id, marks);
            if (res.error) return res;
            setShot(s => s.map(p => (p.id === editing.id ? { ...p, annotations: res.annotations } : p)));
            return res;
          }}
        />
      )}
    </Shell>
  );
}

function Shell({ title, onBack, children }) {
  return (
    <div className="capture">
      <div className="capture-head">
        {onBack
          ? <button className="btn ghost" onClick={onBack}>← Start over</button>
          : <Link className="btn ghost" href="/">← Quotes</Link>}
        <h1 className="page-title">{title}</h1>
      </div>
      {children}
    </div>
  );
}

// The car and job you're shooting against, pinned to the top so a photo can
// never quietly land on the wrong quote.
function VehicleBar({ vehicle, quote, onChangeQuote }) {
  return (
    <div className="vehicle-bar">
      <span className="rego-plate">{vehicle.rego || 'No rego'}</span>
      <span className="vehicle-bar-desc">
        {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
        {vehicle.colour ? ` · ${vehicle.colour}` : ''}
      </span>
      {quote && (
        <span className="vehicle-bar-job">
          {quoteNo(quote.quote_number)}
          {/* Always offered, even with one quote: "change" is also how a new
              job gets started on a car that's been in before. */}
          {onChangeQuote && (
            <button className="btn ghost vehicle-bar-change" onClick={onChangeQuote}>Change</button>
          )}
        </span>
      )}
    </div>
  );
}
