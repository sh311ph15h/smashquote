import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentShop } from '@/lib/shop';
import { signout } from '@/app/actions/auth';

export default async function AppLayout({ children }) {
  const { user, shop } = await getCurrentShop();
  if (!user) redirect('/login');
  if (!shop) redirect('/onboarding');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside style={{ background: 'var(--panel)', borderRight: '1px solid var(--border)', padding: '1.2rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '.2rem' }}>SmashQuote</div>
        <div className="pill" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>{shop.name}</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          <Link className="btn ghost" style={{ justifyContent: 'flex-start' }} href="/">Quotes</Link>
          <Link className="btn ghost" style={{ justifyContent: 'flex-start' }} href="/settings">Settings</Link>
        </nav>
        <div style={{ marginTop: 'auto', fontSize: '.8rem', color: 'var(--muted)' }}>
          <div style={{ marginBottom: '.5rem' }}>{user.email}</div>
          <form action={signout}><button className="btn secondary" style={{ width: '100%', justifyContent: 'center' }}>Sign out</button></form>
        </div>
      </aside>
      <main style={{ padding: '2rem', maxWidth: 1200 }}>{children}</main>
    </div>
  );
}
