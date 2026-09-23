'use client';

import { money, lineTotal } from '@/lib/money';
import { BODY_TYPES, OPS, areaLabel, areaMeta, baseBody, materialWarning, panelsFor } from '@/lib/panels';
import { SECTIONS, sectionLabel } from '@/lib/lineTypes';
import PanelBoard from '@/components/PanelBoard';

// The 3D diagram (components/CarDiagram.jsx) is parked until the models are
// settled; the flat plan takes the same props. Only the generic shapes are
// offered meanwhile — the per-model body types exist for the 3D models alone.
const SHAPES = BODY_TYPES.filter(b => !b.model);

// ---------------------------------------------------------------------------
// The car, its legend, and whatever panel is currently selected.
//
// Clicking a panel doesn't record anything by itself — it focuses it. Adding a
// line is what marks a panel, because the colour on the diagram is read
// straight back out of the line items. There's no second copy of the truth to
// go stale.
// ---------------------------------------------------------------------------
export default function CarPanel({
  bodyType, onBodyType, ops, lines,
  selected, onSelect, onAdd,
}) {
  const panelLines = selected
    ? lines.filter(l => Number(l.area_id) === selected)
    : [];
  const present = ops.get(selected) || null;
  const worked = [...ops.keys()].filter(id => panelsFor(bodyType).some(p => p.id === id));

  return (
    <div className="car-card card">
      <div className="car-head">
        <h3 className="car-title">Damage map</h3>
        <div className="chip-set">
          {SHAPES.map(b => (
            <button
              key={b.key}
              className={'chip' + (baseBody(bodyType) === b.key ? ' is-on' : '')}
              aria-pressed={baseBody(bodyType) === b.key}
              onClick={() => onBodyType(b.key)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="car-body">
        <div className="car-stage">
          <PanelBoard
            bodyType={bodyType}
            ops={ops}
            selected={selected}
            onSelect={onSelect}
          />
          <p className="car-help">Tap a panel to work on it</p>
        </div>

        <aside className="car-side">
          <div className="car-legend">
            {OPS.map(o => (
              <span key={o.key} className="legend-item">
                <i className="legend-dot" style={{ background: o.color }} />
                {o.label}
              </span>
            ))}
          </div>

          {selected ? (
            <>
              <div className="panel-title">
                <strong>{areaLabel(selected)}</strong>
                {present && (
                  <span className="panel-ops">
                    {OPS.filter(o => present.has(o.key)).map(o => (
                      <span key={o.key} className="panel-op" style={{ color: o.color, borderColor: o.color }}>
                        {o.label}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              {areaMeta(selected)?.note && <p className="panel-note">{areaMeta(selected).note}</p>}
              {materialWarning(selected) && <p className="fault-warn">{materialWarning(selected)}</p>}

              {panelLines.length === 0 ? (
                <p className="panel-empty">Nothing on this panel yet.</p>
              ) : (
                <ul className="panel-lines">
                  {panelLines.map(l => (
                    <li key={l._k}>
                      <span className="panel-line-sec">{sectionLabel(l.line_type)}</span>
                      <span className="panel-line-desc">{l.description || <em>Untitled</em>}</span>
                      <span className="panel-line-amt">{money(lineTotal(l))}</span>
                    </li>
                  ))}
                </ul>
              )}

              <span className="label">Add to this panel</span>
              <div className="panel-adds">
                {SECTIONS.map(s => (
                  <button key={s.key} className="btn secondary panel-add"
                    onClick={() => onAdd(s.key, selected)}>
                    + {s.label}
                  </button>
                ))}
              </div>
              <button className="btn ghost panel-clear" onClick={() => onSelect(null)}>
                Clear selection
              </button>
            </>
          ) : (
            <p className="panel-empty">
              {worked.length
                ? `${worked.length} panel${worked.length === 1 ? '' : 's'} with work on them. Tap one to see it.`
                : 'Tap a panel on the car to start adding work to it.'}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
