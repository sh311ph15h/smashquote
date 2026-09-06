-- ============================================================
-- SMASHQUOTE — Migration 003: quote photos
-- ============================================================
-- Photos (damage shots, before/after, invoice scans) live in Cloudflare R2,
-- NOT in Postgres. This table only records the object key + metadata; the bytes
-- are fetched from R2 through short-lived presigned URLs. shop_id is duplicated
-- onto the row so RLS can isolate without a join to the parent quote.

create type photo_category as enum ('damage', 'before', 'after', 'invoice', 'other');

create table quote_photos (
    id            uuid primary key default gen_random_uuid(),
    shop_id       uuid not null references shops(id) on delete cascade,
    quote_id      uuid not null references quotes(id) on delete cascade,
    r2_key        text not null unique,        -- object key in the R2 bucket
    category      photo_category not null default 'damage',
    caption       text,
    content_type  text,
    size_bytes    bigint,
    uploaded_by   uuid references auth.users(id) on delete set null,
    created_at    timestamptz not null default now()
);

create index quote_photos_quote_idx on quote_photos (quote_id, created_at);
create index quote_photos_shop_idx  on quote_photos (shop_id);

alter table quote_photos enable row level security;

create policy quote_photos_member_all on quote_photos
    for all
    using (is_shop_member(shop_id))
    with check (is_shop_member(shop_id));
