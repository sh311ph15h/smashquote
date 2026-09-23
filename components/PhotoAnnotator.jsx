'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mark } from './Annotations';
import { MARK_COLORS, DEFAULT_COLOR, normaliseMarks } from '@/lib/annotations';

// ---------------------------------------------------------------------------
// PhotoAnnotator — draw arrows and rings on a damage photo.
//
// The problem this solves: a photo of a crease in a guard is often unreadable
// to anyone who wasn't standing in front of the car. Marking the picture is
// how the estimator says "this bit, here".
//
// Marks are vector data saved next to the photo, never burnt into it — the
// original stays untouched as evidence, and a mark can be fixed later without
// re-shooting. Drawing is pointer-based, so a finger on a phone in the workshop
// works exactly like a mouse.
// ---------------------------------------------------------------------------

const TOOLS = [
  { key: 'arrow',  label: 'Arrow',  icon: '↗', hint: 'Drag from clear space to the damage' },
  { key: 'circle', label: 'Ring',   icon: '◯', hint: 'Drag around the damaged area' },
  { key: 'box',    label: 'Box',    icon: '▭', hint: 'Drag a box over the panel' },
  { key: 'text',   label: 'Label',  icon: 'T', hint: 'Tap to drop a text label' },
  { key: 'select', label: 'Select', icon: '⌖', hint: 'Tap a mark to edit or delete it' },
];

// The words that actually get written on these photos, as one tap each.
const QUICK_LABELS = [
  'Dent', 'Deep dent', 'Scratch', 'Scuff', 'Crack', 'Chip',
  'Crease', 'Misaligned', 'Rust', 'Prior damage',
  'Replace', 'Repair', 'Blend', 'R&R',
];

const uid = () => Math.random().toString(36).slice(2);
const MIN_DRAG = 0.015;   // fraction of the image; below this it's a stray tap

export default function PhotoAnnotator({ photo, onSave, onClose }) {
  const [marks, setMarks] = useState(() => normaliseMarks(photo.annotations));
  const [tool, setTool] = useState('arrow');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const frameRef = useRef(null);
  const selected = marks.find(m => m.id === selectedId) || null;

  // Track the rendered size of the image so pointer positions can be turned
  // into fractions, and the marks drawn back out at the right pixel size.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      setBox({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId
          && e.target.tagName !== 'INPUT') {
        setMarks(ms => ms.filter(m => m.id !== selectedId));
        setSelectedId(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, selectedId]);

  const pointAt = useCallback((e) => {
    const r = frameRef.current.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }, []);

  const onPointerDown = (e) => {
    if (tool === 'select') { setSelectedId(null); return; }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = pointAt(e);
    if (tool === 'text') {
      const m = { id: uid(), type: 'text', x1: p.x, y1: p.y, x2: p.x, y2: p.y, color, label: '' };
      setMarks(ms => [...ms, m]);
      setSelectedId(m.id);
      return;
    }
    setDraft({ id: uid(), type: tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color, label: '' });
  };

  const onPointerMove = (e) => {
    if (!draft) return;
    const p = pointAt(e);
    setDraft(d => ({ ...d, x2: p.x, y2: p.y }));
  };

  const onPointerUp = () => {
    if (!draft) return;
    // A tap that never moved isn't a mark — it's a mis-touch, or someone
    // trying to scroll. Dropping it stops the picture filling with specks.
    const moved = Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1);
    if (moved >= MIN_DRAG) {
      setMarks(ms => [...ms, draft]);
      setSelectedId(draft.id);
    }
    setDraft(null);
  };

  const patchSelected = (patch) => {
    if (!selectedId) return;
    setMarks(ms => ms.map(m => (m.id === selectedId ? { ...m, ...patch } : m)));
  };

  const removeMark = (id) => {
    setMarks(ms => ms.filter(m => m.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    // Empty text labels would save as invisible marks nobody can find again.
    const clean = marks.filter(m => m.type !== 'text' || m.label.trim());
    const res = await onSave(clean);
    setSaving(false);
    if (res?.error) setError(res.error);
    else onClose();
  };

  const activeTool = TOOLS.find(t => t.key === tool);
  const visible = draft ? [...marks, draft] : marks;

  return (
    <div className="anno-backdrop" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="anno-modal" role="dialog" aria-modal="true" aria-label="Mark damage on photo">
        <header className="anno-head">
          <div>
            <strong>Mark the damage</strong>
            <span className="anno-hint">{activeTool?.hint}</span>
          </div>
          <button className="btn ghost" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="anno-stage">
          <div
            ref={frameRef}
            className="anno-frame"
            style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDraft(null)}
          >
            {/* draggable=false — otherwise a drag on the picture starts a
                browser image-drag instead of drawing a mark. */}
            <img src={photo.url} alt="" className="anno-img" draggable={false} />
            {box.w > 1 && (
              <svg className="anno-svg" width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`}>
                {visible.map(m => (
                  <g
                    key={m.id}
                    style={{ pointerEvents: tool === 'select' ? 'auto' : 'none', cursor: 'pointer' }}
                    onPointerDown={(e) => {
                      if (tool !== 'select') return;
                      e.stopPropagation();
                      setSelectedId(m.id);
                    }}
                  >
                    {/* Only in select mode: the hit copy sets its own
                        pointer-events, which would otherwise beat the group's
                        'none' and swallow drags meant to draw a new mark. */}
                    {tool === 'select' && <Mark m={m} w={box.w} h={box.h} hit />}
                    <Mark m={m} w={box.w} h={box.h} selected={m.id === selectedId} />
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

        <div className="anno-tools">
          <div className="anno-group" role="group" aria-label="Tool">
            {TOOLS.map(t => (
              <button
                key={t.key}
                className={'anno-tool' + (tool === t.key ? ' is-on' : '')}
                onClick={() => setTool(t.key)}
                title={t.hint}
              >
                <span className="anno-icon">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          <div className="anno-group" role="group" aria-label="Colour">
            {MARK_COLORS.map(c => (
              <button
                key={c}
                className={'anno-swatch' + ((selected ? selected.color : color) === c ? ' is-on' : '')}
                style={{ background: c }}
                aria-label={`Colour ${c}`}
                onClick={() => { setColor(c); patchSelected({ color: c }); }}
              />
            ))}
          </div>

          <div className="anno-group" style={{ marginLeft: 'auto' }}>
            <button className="btn ghost" disabled={!marks.length}
              onClick={() => { setMarks(ms => ms.slice(0, -1)); setSelectedId(null); }}>
              Undo
            </button>
            <button className="btn ghost" disabled={!marks.length}
              onClick={() => { setMarks([]); setSelectedId(null); }}>
              Clear
            </button>
          </div>
        </div>

        {selected ? (
          <div className="anno-label-bar">
            <input
              className="input"
              autoFocus={selected.type === 'text'}
              placeholder="Label this mark — e.g. Dent, L/H/F guard"
              value={selected.label}
              onChange={e => patchSelected({ label: e.target.value.slice(0, 120) })}
            />
            <button className="btn ghost" style={{ color: 'var(--bad)' }}
              onClick={() => removeMark(selected.id)}>Delete mark</button>
          </div>
        ) : (
          <p className="anno-empty">
            {marks.length
              ? 'Switch to Select and tap a mark to label or delete it.'
              : 'Drag on the photo to point at the damage.'}
          </p>
        )}

        {selected && (
          <div className="anno-quick">
            {QUICK_LABELS.map(q => (
              <button key={q} className="anno-chip" onClick={() => patchSelected({ label: q })}>{q}</button>
            ))}
          </div>
        )}

        {error && <p className="anno-error">{error}</p>}

        <footer className="anno-foot">
          <span className="anno-count">{marks.length} mark{marks.length === 1 ? '' : 's'}</span>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn secondary" onClick={onClose}>Cancel</button>
            <button className="btn" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save marks'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
