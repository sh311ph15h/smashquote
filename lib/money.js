// Money helpers — one source of truth for how dollars are shown and summed.
export const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency', currency: 'AUD',
});

export function money(n) {
  return AUD.format(Number(n || 0));
}

// Mirror of the DB trigger so the builder can show a live total before saving.
export function lineTotal(line) {
  const isTime = line.line_type === 'labour' || line.line_type === 'paint';
  const raw = isTime
    ? Number(line.hours || 0) * Number(line.rate || 0)
    : Number(line.quantity || 0) * Number(line.unit_price || 0);
  return Math.round(raw * 100) / 100;
}

export function quoteTotals(lines, gstRate = 0.1) {
  let subtotal = 0;
  let taxable = 0;
  for (const l of lines) {
    const t = lineTotal(l);
    subtotal += t;
    if (l.taxable !== false) taxable += t;
  }
  const gst = Math.round(taxable * gstRate * 100) / 100;
  return { subtotal, gst, total: subtotal + gst };
}
