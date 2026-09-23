'use client';
import { useActionState } from 'react';
import { updateShop } from '@/app/actions/shop';

// Declared outside the form so it keeps its identity between renders —
// defined inline, every keystroke elsewhere would remount the inputs.
function F({ name, label, def = '', type = 'text', full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <label className="label">{label}</label>
      <input className="input" name={name} type={type} step={type === 'number' ? '0.01' : undefined}
        defaultValue={def ?? ''} />
    </div>
  );
}

export default function SettingsForm({ shop }) {
  const [state, action, pending] = useActionState(updateShop, {});
  return (
    <form action={action} className="card">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
        <F name="name" label="Shop name" def={shop.name} full />
        <F name="abn" label="ABN" def={shop.abn} />
        <F name="phone" label="Phone" def={shop.phone} />
        <F name="email" label="Email" def={shop.email} />
        <F name="address" label="Address" def={shop.address} />
        <F name="suburb" label="Suburb" def={shop.suburb} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
          <F name="state" label="State" def={shop.state} />
          <F name="postcode" label="Postcode" def={shop.postcode} />
        </div>
        <F name="labour_rate" label="Default labour rate ($/hr)" def={shop.default_labour_rate} type="number" />
        <F name="paint_rate" label="Default paint rate ($/hr)" def={shop.default_paint_rate} type="number" />
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="label">Quote terms (printed on every quote)</label>
          <textarea className="input" name="quote_terms" rows={3} defaultValue={shop.quote_terms || ''} />
        </div>
      </div>
      {state?.error && <p style={{ color: 'var(--bad)', marginTop: '.8rem' }}>{state.error}</p>}
      <button className="btn" style={{ marginTop: '1rem' }} disabled={pending}>
        {pending ? 'Saving…' : state?.ok ? 'Saved ✓' : 'Save settings'}
      </button>
    </form>
  );
}
