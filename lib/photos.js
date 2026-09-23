// The stages a repair is photographed at, in the order they happen on the
// floor. Each one is its own segment in the UI so a job reads as a sequence —
// what came in, what was found stripped down, what went back out — instead of
// one undifferentiated pile of pictures.
export const PHOTO_SEGMENTS = [
  { key: 'damage',       label: 'Damage / before repair', hint: 'How the car arrived.' },
  { key: 'under_repair', label: 'Under repair',           hint: 'Stripped down — what was found underneath.' },
  { key: 'repaired',     label: 'Repaired',               hint: 'Panel work finished, before paint prep.' },
  { key: 'before_paint', label: 'Before paint',           hint: 'Masked and primed, ready for the booth.' },
  { key: 'painted',      label: 'Painted parts',          hint: 'Out of the booth.' },
  { key: 'after_repair', label: 'After repair',           hint: 'Finished job, ready for handover.' },
  { key: 'invoice',      label: 'Invoices',               hint: 'Parts and sublet invoices for this job.' },
  { key: 'other',        label: 'Other',                  hint: 'Anything else worth keeping on file.' },
];

export const PHOTO_CATEGORIES = PHOTO_SEGMENTS.map(s => s.key);

const BY_KEY = new Map(PHOTO_SEGMENTS.map(s => [s.key, s]));
export const segmentMeta = key => BY_KEY.get(key) || null;
export const segmentLabel = key => BY_KEY.get(key)?.label || key;

export const isValidCategory = key => BY_KEY.has(key);

// Group a flat list of photos into the segment order above. Every segment comes
// back, empty ones included, so the quote page can show the full sequence and
// make a missing stage obvious rather than silently absent.
export function groupBySegment(photos = []) {
  const buckets = new Map(PHOTO_SEGMENTS.map(s => [s.key, []]));
  for (const p of photos) {
    (buckets.get(p.category) || buckets.get('other')).push(p);
  }
  return PHOTO_SEGMENTS.map(s => ({ ...s, photos: buckets.get(s.key) }));
}
