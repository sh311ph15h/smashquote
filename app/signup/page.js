'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { signup } from '@/app/actions/auth';

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, {});
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <form action={action} className="card" style={{ width: 'min(380px, 100%)' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.25rem' }}>Create your account</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '1.2rem', fontSize: '.9rem' }}>
          You&apos;ll set up your shop next.
        </p>
        <label className="label">Email</label>
        <input className="input" name="email" type="email" required autoComplete="email" />
        <div style={{ height: '.8rem' }} />
        <label className="label">Password</label>
        <input className="input" name="password" type="password" required minLength={8} autoComplete="new-password" />
        {state?.error && (
          <p style={{ color: 'var(--bad)', fontSize: '.85rem', marginTop: '.8rem' }}>{state.error}</p>
        )}
        {state?.checkEmail && (
          <p style={{ color: 'var(--good)', fontSize: '.85rem', marginTop: '.8rem' }}>
            Account created. Check <strong>{state.checkEmail}</strong> for a confirmation link,
            then sign in.
          </p>
        )}
        <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1.1rem' }} disabled={pending}>
          {pending ? 'Creating…' : 'Create account'}
        </button>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: '1rem', textAlign: 'center' }}>
          Already have one? <Link href="/login" style={{ color: 'var(--brand)' }}>Sign in</Link>
        </p>
      </form>
    </main>
  );
}
