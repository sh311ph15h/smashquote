'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <form action={action} className="card" style={{ width: 'min(380px, 100%)' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.25rem' }}>SmashQuote</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '1.2rem', fontSize: '.9rem' }}>
          Sign in to your shop.
        </p>
        <label className="label">Email</label>
        <input className="input" name="email" type="email" required autoComplete="email" />
        <div style={{ height: '.8rem' }} />
        <label className="label">Password</label>
        <input className="input" name="password" type="password" required autoComplete="current-password" />
        {state?.error && (
          <p style={{ color: 'var(--bad)', fontSize: '.85rem', marginTop: '.8rem' }}>{state.error}</p>
        )}
        <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1.1rem' }} disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: '1rem', textAlign: 'center' }}>
          New shop? <Link href="/signup" style={{ color: 'var(--brand)' }}>Create an account</Link>
        </p>
      </form>
    </main>
  );
}
