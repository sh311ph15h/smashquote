// Whose fault the accident was. Kept apart from quote_status on purpose: status
// tracks the paperwork, liability tracks the crash, and they move separately —
// a disputed job still gets quoted, approved and repaired.
export const LIABILITIES = [
  {
    key: 'favour',
    label: 'In favour',
    tone: 'var(--good)',
    hint: 'Someone else hit our customer. Not at fault — no excess.',
  },
  {
    key: 'against',
    label: 'Against',
    tone: 'var(--bad)',
    hint: 'Our customer caused it. Excess is payable.',
  },
  {
    key: 'disputed',
    label: 'Disputed',
    tone: 'var(--warn)',
    hint: 'Fault is still being worked out. The repair goes ahead regardless.',
  },
];

export const LIABILITY_KEYS = LIABILITIES.map(l => l.key);

const BY_KEY = new Map(LIABILITIES.map(l => [l.key, l]));
export const liabilityMeta = key => BY_KEY.get(key) || null;
export const liabilityLabel = key => BY_KEY.get(key)?.label || '—';

// Only an at-fault claim carries an excess. Used to prompt for one on an
// "against" quote, and to flag an excess sitting on a not-at-fault job.
export const excessApplies = liability => liability === 'against';
