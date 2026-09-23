import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentShop } from '@/lib/shop';
import { signout } from '@/app/actions/auth';

export default async function AppLayout({ children }) {
  const { user, shop } = await getCurrentShop();
  if (!user) redirect('/login');
  if (!shop) redirect('/onboarding');

  return (
    <div className="shell">
      <aside className="side">
        <div className="side-brand">
          <div className="side-name">SmashQuote</div>
          <div className="pill">{shop.name}</div>
        </div>

        <nav className="side-nav">
          <Link className="btn ghost side-link" href="/">Quotes</Link>
          {/* The two shop-floor actions sit in the nav as well as on the
              dashboard — on a phone this list is the whole app. */}
          <Link className="btn ghost side-link" href="/capture">📷 Take photo</Link>
          <Link className="btn ghost side-link" href="/capture?type=invoice">🧾 Add invoice</Link>
          <Link className="btn ghost side-link" href="/settings">Settings</Link>
        </nav>

        <div className="side-foot">
          <div className="side-user">{user.email}</div>
          <form action={signout}>
            <button className="btn secondary side-signout">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
