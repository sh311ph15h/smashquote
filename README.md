# SmashQuote

Multi-tenant quoting / estimating platform for smash repair shops.
Next.js 16 (App Router) · Supabase Postgres (Auth + Row-Level Security) · Tailwind v4.

## What works today (MVP)

- **Auth & tenancy** — email/password sign-up, each account creates a *shop*
  (tenant). Every table is isolated by Row-Level Security: you only ever see
  your own shop's data.
- **Quote builder** — the core screen. Vehicle + customer + claim details, then
  mixed line items (Part / Paint & materials / Labour / Sublet / Misc) with
  per-line source (new/used/aftermarket/recycled), live subtotal + GST + total.
- **Printable quote** — clean A4 view at `/print/<id>`, "Save as PDF" via the
  browser. Carries shop letterhead, vehicle, customer, claim, lines, GST, terms.
- **Settings** — shop details + default labour/paint rates + quote terms.

## Setup

1. **Create a Supabase project** at https://supabase.com.
2. **Run the schema** — in the Supabase SQL editor, run in order:
   - `db/001_init.sql`
   - `db/002_rls.sql`
3. **Auth setting** — for testing, Supabase → Authentication → Providers → Email
   → turn *off* "Confirm email" so sign-up logs you straight in.
4. **Env** — copy `.env.local.example` to `.env.local` and fill from
   Supabase → Settings → API (URL, anon key, service_role key).
5. `npm install && npm run dev`, open http://localhost:3000, sign up, create your
   shop, hit **+ New quote**.

## Architecture notes

- `db/` — SQL migrations. Totals are computed by a DB trigger, never trusted
  from the client. `is_shop_member()` backs every RLS policy.
- `lib/supabase/` — `client` (browser), `server` (RLS-bound), `admin`
  (service-role, server-only, used only to create a shop at signup).
- Quote money maths lives in one place: `lib/money.js` (UI preview) mirrors the
  DB trigger in `db/002_rls.sql` (source of truth).

## Roadmap (not built yet)

- Rego → make/model lookup (port from MB Smash `scripts/rego_lookup.py`)
- Reusable parts catalogue + supplier prices
- Server-side PDF (port MB Smash `lib/pdf.mjs`) + email/send to customer/insurer
- Insurer assessor workflow (approve/decline, betterment)
- Convert approved quote → job → invoice; payments
- Subdomain-per-shop routing, team invites, billing

## Photos (Cloudflare R2)

Photos are stored in R2 (S3-compatible), not in Postgres — only the object key
lives in the `quote_photos` table. Bytes upload straight from the browser to R2
via presigned URLs; viewing uses short-lived presigned GET URLs (bucket stays
private). To turn it on:

1. Cloudflare dashboard → R2 → **Create bucket** (e.g. `smashquote`).
2. R2 → **Manage API Tokens** → create a token with **Object Read & Write**.
3. Put the Account ID, Access Key ID, Secret, and bucket name into `.env.local`
   (see `.env.local.example`).
4. Set the bucket **CORS policy** so the browser is allowed to PUT directly.
   List every origin the app is served from in `R2_CORS_ORIGINS`, then either
   paste the policy in the dashboard (R2 → bucket → Settings → CORS policy) or:

   ```bash
   node scripts/setup-r2-cors.mjs
   ```

   Note the script needs an **Admin Read & Write** token — CORS is bucket
   configuration, which the app's Object-scoped token deliberately can't touch.
   The script prints the exact JSON to paste if it hits `AccessDenied`.

   Without this, uploads fail in the browser with an opaque CORS error even
   though the presigned URL itself is valid.

That's the only human step — the code is already wired. R2's free tier is 10 GB
with no egress fees. Because it's the S3 API, the same code points at AWS S3 or
Backblaze B2 by changing env alone.
