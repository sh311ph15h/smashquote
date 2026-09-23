'use client';

import { useState } from 'react';
import { corePanelsFor, panelsByGroup, primaryOp, opColor, areaShort, areaLabel } from '@/lib/panels';

// ---------------------------------------------------------------------------
// The damage map as a flat, top-down plan of the car.
//
// Stands in for the 3D diagram (components/CarDiagram.jsx), which is parked
// until the models are sorted out. It takes the same props, so swapping back is
// a one-line change in CarPanel.
//
// The nineteen core panels are laid out where they sit on the car, front at the
// top. The detail catalogue — sensors, brackets, glass, trim — has no sensible
// place on a plan view, so it sits underneath as a grouped list of chips.
// ---------------------------------------------------------------------------

// [column, row, column span, row span] on a 5-wide grid:
//   L flank | L panels | centre | R panels | R flank
const PLAN = {
  10: [2, 1, 3, 1],                  // Front bar
  12: [[2, 2, 1, 1], [4, 2, 1, 1]],  // Front lights, drawn at both corners
  11: [3, 2, 1, 1],                  // Grille
  17: [1, 3, 2, 1],                  // L/H/F guard
  14: [3, 3, 1, 1],                  // Bonnet
  18: [4, 3, 2, 1],                  // R/H/F guard
  23: [1, 4, 1, 2],                  // L/H body side
  19: [2, 4, 1, 1],                  // L/H/F door
  27: [3, 4, 1, 2],                  // Roof
  20: [4, 4, 1, 1],                  // R/H/F door
  24: [5, 4, 1, 2],                  // R/H body side
  21: [2, 5, 1, 1],                  // L/H/R door
  22: [4, 5, 1, 1],                  // R/H/R door
  25: [1, 6, 2, 1],                  // L/H/R qtr
  28: [3, 6, 1, 1],                  // Tailgate
  29: [3, 6, 1, 1],                  // Bootlid (never on the same body as a tailgate)
  26: [4, 6, 2, 1],                  // R/H/R qtr
  31: [[2, 7, 1, 1], [4, 7, 1, 1]],  // Rear lights
  30: [2, 8, 3, 1],                  // Rear bumper
};

const tint = (hex) => `${hex}33`; // ~20% alpha on a #rrggbb colour

export default function PanelBoard({ bodyType, ops, selected, onSelect }) {
  const [showAll, setShowAll] = useState(false);
  const core = corePanelsFor(bodyType);
  const coreIds = new Set(core.map(p => p.id));
  const detailGroups = panelsByGroup(bodyType)
    .map(g => ({ ...g, panels: g.panels.filter(p => !coreIds.has(p.id)) }))
    .filter(g => g.panels.length);

  // Detail panels with work on them stay visible even while the list is
  // collapsed — hiding a panel that's on the estimate would hide the estimate.
  const detailWorked = detailGroups.flatMap(g => g.panels).filter(p => ops.has(p.id) || p.id === selected);

  const style = (id) => {
    const op = primaryOp(ops.get(id));
    if (!op) return undefined;
    const c = opColor(op);
    return { background: tint(c), borderColor: c, color: 'var(--text)' };
  };

  const cell = (p, pos, i = 0) => {
    const [col, row, cs, rs] = pos;
    return (
      <button
        key={`${p.id}-${i}`}
        type="button"
        className={'plan-cell' + (selected === p.id ? ' is-sel' : '')}
        style={{ gridColumn: `${col} / span ${cs}`, gridRow: `${row} / span ${rs}`, ...style(p.id) }}
        aria-pressed={selected === p.id}
        title={p.label}
        onClick={() => onSelect(selected === p.id ? null : p.id)}
      >
        {p.short || p.label}
      </button>
    );
  };

  const chip = (p) => (
    <button
      key={p.id}
      type="button"
      className={'chip plan-chip' + (selected === p.id ? ' is-on' : '')}
      style={style(p.id)}
      aria-pressed={selected === p.id}
      title={p.note || p.label}
      onClick={() => onSelect(selected === p.id ? null : p.id)}
    >
      {p.label}{p.sides ? ' (L/R)' : ''}
    </button>
  );

  return (
    <div className="plan">
      <div className="plan-grid" role="group" aria-label="Car panels, front at the top">
        <span className="plan-dir plan-dir-front">Front</span>
        {core.flatMap(p => {
          const pos = PLAN[p.id];
          if (!pos) return [];
          return Array.isArray(pos[0]) ? pos.map((q, i) => cell(p, q, i)) : [cell(p, pos)];
        })}
        <span className="plan-dir plan-dir-rear">Rear</span>
      </div>

      <div className="plan-more">
        <button type="button" className="btn ghost plan-toggle" onClick={() => setShowAll(s => !s)}>
          {showAll ? '▾ Hide detail parts' : '▸ All parts — bumper internals, glass, ADAS…'}
        </button>

        {showAll ? (
          detailGroups.map(g => (
            <div key={g.key} className="plan-group">
              <span className="label">{g.label}</span>
              <div className="plan-chips">{g.panels.map(chip)}</div>
            </div>
          ))
        ) : detailWorked.length > 0 && (
          <div className="plan-group">
            <span className="label">Detail parts on this job</span>
            <div className="plan-chips">{detailWorked.map(chip)}</div>
          </div>
        )}
      </div>

      {selected && !coreIds.has(selected) && !detailGroups.some(g => g.panels.some(p => p.id === selected)) && (
        <p className="plan-note">{areaLabel(selected) || areaShort(selected)} isn&apos;t an outside panel — it&apos;s listed under Other areas.</p>
      )}
    </div>
  );
}
