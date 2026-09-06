'use client';
import { useActionState } from 'react';
import { createShop } from '@/app/actions/shop';

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(createShop, {});
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <form action={action} className="card" style={{ width: 'min(520px, 100%)' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Set up your shop</h1>
        <p style={{ color: 'var(--muted)', margin: '.3rem 0 1.2rem', fontSize: '.9rem' }}>
          These become the defaults on every quote. You can change them later.
        </p>
        <label className="label">Shop name *</label>
        <input className="input" name="name" required placeholder="MB Smash Repair" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem', marginTop: '.8rem' }}>
          <div><label className="label">ABN</label><input className="input" name="abn" /></div>
          <div><label className="label">Phone</label><input className="input" name="phone" /></div>
          <div><label className="label">State</label>
            <select className="select" name="state" defaultValue="VIC">
              {['VIC','NSW','QLD','SA','WA','TAS','NT','ACT'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div />
          <div><label className="label">Labour rate ($/hr)</label><input className="input" name="labour_rate" type="number" step="0.01" defaultValue="0" /></div>
          <div><label className="label">Paint rate ($/hr)</label><input className="input" name="paint_rate" type="number" step="0.01" defaultValue="0" /></div>
        </div>
        {state?.error && <p style={{ color: 'var(--bad)', fontSize: '.85rem', marginTop: '.8rem' }}>{state.error}</p>}
        <button className="btn" style={{ marginTop: '1.2rem' }} disabled={pending}>
          {pending ? 'Creating…' : 'Create shop →'}
        </button>
      </form>
    </main>
  );
}
