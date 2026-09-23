// The six sections of a smash estimate, in the order they're worked and
// costed. These are also the six groups the Crashzone pick list ships with, so
// each section searches its own list: an R&R line offers R&R items and a paint
// line offers paint items.
//
// `kind` decides what columns a section needs. Time work is priced hours x
// rate; parts carry a number and a source; sublet and other are a plain
// quantity x price. One flat table with a type dropdown made every line carry
// every column, most of them meaningless.
export const SECTIONS = [
  {
    key: 'rr', label: 'R&R', full: 'Remove & Replace', kind: 'time',
    rate: 'labour', hint: 'Taking panels off and refitting them.',
  },
  {
    key: 'repair', label: 'Repair', full: 'Repair', kind: 'time',
    rate: 'labour', hint: 'Beating out, filling and straightening.',
  },
  {
    key: 'paint', label: 'Paint', full: 'Paint & materials', kind: 'time',
    rate: 'paint', hint: 'Refinishing, blending and materials.',
  },
  {
    key: 'part', label: 'Parts', full: 'Parts', kind: 'part',
    hint: 'New, used or aftermarket panels and components.',
  },
  {
    key: 'sublet', label: 'Sublets', full: 'Sublet', kind: 'money',
    hint: 'Work sent out — wheel alignment, glass, towing.',
  },
  {
    key: 'misc', label: 'Other', full: 'Other', kind: 'money',
    hint: 'Anything that isn\'t one of the above.',
  },
];

export const SECTION_KEYS = SECTIONS.map(s => s.key);

const BY_KEY = new Map(SECTIONS.map(s => [s.key, s]));
export const sectionMeta = key => BY_KEY.get(key) || null;
export const sectionLabel = key => BY_KEY.get(key)?.label || key;
export const isValidSection = key => BY_KEY.has(key);

// Priced by the clock rather than by the piece — the one distinction the
// totals maths turns on, mirrored from the DB trigger.
export const isTimeSection = key => BY_KEY.get(key)?.kind === 'time';

// Which of the quote's two rates a section bills at.
export const rateFor = (key, header) =>
  BY_KEY.get(key)?.rate === 'paint' ? header.paint_rate : header.labour_rate;

// Group lines into sections, keeping every section so an empty one still shows
// its heading and add button.
export function groupBySection(lines = []) {
  const buckets = new Map(SECTIONS.map(s => [s.key, []]));
  for (const l of lines) {
    (buckets.get(l.line_type) || buckets.get('misc')).push(l);
  }
  return SECTIONS.map(s => ({ ...s, lines: buckets.get(s.key) }));
}
