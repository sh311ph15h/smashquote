// Damage marks drawn over a photo — the data shape and its guards.
//
// Deliberately framework-free (no 'use client'): the same parsing runs in the
// browser while drawing, and on the server before anything is written to the
// jsonb column, so there is exactly one definition of what a valid mark is.
//
// A mark is stored in *fractions of the image* (0..1), never pixels, so the
// same arrow lands on the same dent whether it's on a 150px thumbnail, a
// full-screen viewer or a printed sheet.
//
//   { id, type: 'arrow' | 'circle' | 'box' | 'text',
//     x1, y1, x2, y2, color, label }
//
// Arrow runs tail (x1,y1) -> head (x2,y2). Circle and box read the two points
// as opposite corners of a drag box. Text anchors at (x1,y1).

export const MARK_COLORS = ['#f87171', '#fbbf24', '#22d3ee', '#34d399', '#ffffff'];
export const DEFAULT_COLOR = MARK_COLORS[0];

const TYPES = new Set(['arrow', 'circle', 'box', 'text']);
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const MAX_MARKS = 60;

const clamp01 = n => Math.min(1, Math.max(0, Number.isFinite(Number(n)) ? Number(n) : 0));

// Anything can end up in a jsonb column — a hand-edited row, an older shape
// from a previous version, a crafted request. Drop what we can't draw rather
// than throwing, and never let a colour through that isn't a plain hex value.
export function normaliseMarks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(m => m && TYPES.has(m.type))
    .slice(0, MAX_MARKS)
    .map(m => ({
      id: String(m.id || Math.random().toString(36).slice(2)).slice(0, 40),
      type: m.type,
      x1: clamp01(m.x1), y1: clamp01(m.y1),
      x2: clamp01(m.x2), y2: clamp01(m.y2),
      color: COLOR_RE.test(m.color) ? m.color : DEFAULT_COLOR,
      label: typeof m.label === 'string' ? m.label.slice(0, 120) : '',
    }));
}

export const markCount = raw => (Array.isArray(raw) ? normaliseMarks(raw).length : 0);
