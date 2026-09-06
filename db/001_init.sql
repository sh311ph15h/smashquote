-- ============================================================
-- SMASHQUOTE — Multi-tenant quoting platform for smash repair shops
-- Migration 001: core schema + Row-Level Security
-- Postgres / Supabase. Every tenant table carries shop_id and is
-- isolated by RLS: you only ever see rows for a shop you belong to.
-- ============================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ------------------------------------------------------------
-- SHOPS (tenants)
-- ------------------------------------------------------------
-- One row per smash repair business. slug is the future subdomain
-- (acme.smashquote.com.au), the same shape Crashzone uses.
create table shops (
    id                  uuid primary key default gen_random_uuid(),
    slug                text not null unique
                          check (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
    name                text not null,
    abn                 text,
    address             text,
    suburb              text,
    state               text,
    postcode            text,
    phone               text,
    email               text,
    logo_url            text,
    -- Quotes default to these so an estimator isn't retyping rates all day.
    gst_registered      boolean not null default true,
    default_labour_rate numeric(10,2) not null default 0,   -- $/hr, panel/repair
    default_paint_rate  numeric(10,2) not null default 0,   -- $/hr, paint
    quote_terms         text,          -- printed at the foot of every quote
    plan                text not null default 'trial',      -- billing tier
    created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- MEMBERSHIP — links Supabase auth users to shops
-- ------------------------------------------------------------
-- A user can belong to several shops (a group operator, or us testing MB
-- Smash alongside demo shops). Role gates what they can do.
create type shop_role as enum ('owner', 'admin', 'estimator', 'viewer');

create table shop_members (
    shop_id     uuid not null references shops(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    role        shop_role not null default 'estimator',
    created_at  timestamptz not null default now(),
    primary key (shop_id, user_id)
);

create index shop_members_user_idx on shop_members (user_id);

-- Helper: is the current user a member of this shop? Used by every policy.
-- SECURITY DEFINER so the policy check itself doesn't recurse through RLS.
create or replace function is_shop_member(target_shop uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from shop_members
        where shop_id = target_shop and user_id = auth.uid()
    );
$$;

-- ------------------------------------------------------------
-- CUSTOMERS
-- ------------------------------------------------------------
create type customer_type as enum ('private', 'insurance', 'fleet', 'dealer');

create table customers (
    id          uuid primary key default gen_random_uuid(),
    shop_id     uuid not null references shops(id) on delete cascade,
    name        text not null,
    type        customer_type not null default 'private',
    phone       text,
    email       text,
    address     text,
    notes       text,
    created_at  timestamptz not null default now()
);
create index customers_shop_idx on customers (shop_id);

-- ------------------------------------------------------------
-- INSURERS (for insurance-work quotes)
-- ------------------------------------------------------------
create table insurers (
    id          uuid primary key default gen_random_uuid(),
    shop_id     uuid not null references shops(id) on delete cascade,
    name        text not null,
    phone       text,
    email       text,
    created_at  timestamptz not null default now()
);
create index insurers_shop_idx on insurers (shop_id);

-- ------------------------------------------------------------
-- VEHICLES
-- ------------------------------------------------------------
create table vehicles (
    id            uuid primary key default gen_random_uuid(),
    shop_id       uuid not null references shops(id) on delete cascade,
    customer_id   uuid references customers(id) on delete set null,
    rego          text,
    vin           text,
    make          text,
    model         text,
    year          smallint check (year is null or year between 1950 and 2100),
    colour        text,
    paint_code    text,
    body_type     text,
    odometer      integer,
    created_at    timestamptz not null default now()
);
create index vehicles_shop_idx on vehicles (shop_id);
create index vehicles_rego_idx on vehicles (shop_id, lower(rego));

-- ------------------------------------------------------------
-- QUOTES (estimates) — the heart of the product
-- ------------------------------------------------------------
create type quote_status as enum
    ('draft', 'sent', 'approved', 'declined', 'invoiced', 'cancelled');

create table quotes (
    id              uuid primary key default gen_random_uuid(),
    shop_id         uuid not null references shops(id) on delete cascade,
    -- Human-facing number, sequential PER SHOP (see next_quote_number()).
    quote_number    integer not null,
    vehicle_id      uuid references vehicles(id) on delete set null,
    customer_id     uuid references customers(id) on delete set null,
    insurer_id      uuid references insurers(id) on delete set null,
    claim_number    text,
    excess          numeric(10,2),
    status          quote_status not null default 'draft',
    -- Rates snapshotted onto the quote so a later rate change never rewrites
    -- an estimate the customer already signed off on.
    labour_rate     numeric(10,2) not null default 0,
    paint_rate      numeric(10,2) not null default 0,
    gst_rate        numeric(5,4) not null default 0.10,   -- AU GST = 10%
    notes           text,          -- customer-facing
    assessor_notes  text,          -- internal / insurer
    valid_until     date,
    -- Cached money totals, recomputed whenever lines change (see trigger).
    subtotal        numeric(12,2) not null default 0,
    gst_amount      numeric(12,2) not null default 0,
    total           numeric(12,2) not null default 0,
    created_by      uuid references auth.users(id) on delete set null,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (shop_id, quote_number)
);
create index quotes_shop_idx    on quotes (shop_id);
create index quotes_status_idx  on quotes (shop_id, status);
create index quotes_vehicle_idx on quotes (vehicle_id);

-- ------------------------------------------------------------
-- QUOTE LINES
-- ------------------------------------------------------------
-- One estimate mixes four kinds of work. Parts/sublet/misc price by
-- quantity x unit_price; labour/paint price by hours x rate. line_total is
-- stored so a printed quote is always exactly what the estimator saw.
create type line_type as enum ('part', 'paint', 'labour', 'sublet', 'misc');
create type part_source as enum ('new', 'aftermarket', 'used', 'recycled', 'exchange');

create table quote_lines (
    id            uuid primary key default gen_random_uuid(),
    quote_id      uuid not null references quotes(id) on delete cascade,
    line_type     line_type not null,
    description   text not null,
    part_number   text,
    source        part_source,        -- only meaningful for parts
    quantity      numeric(10,2) not null default 1,
    unit_price    numeric(12,2) not null default 0,   -- parts/sublet/misc
    hours         numeric(10,2),                       -- labour/paint
    rate          numeric(12,2),                       -- labour/paint $/hr
    line_total    numeric(12,2) not null default 0,
    taxable       boolean not null default true,
    sort_order    integer not null default 0,
    created_at    timestamptz not null default now()
);
create index quote_lines_quote_idx on quote_lines (quote_id, sort_order);

-- ------------------------------------------------------------
-- Per-shop quote numbering
-- ------------------------------------------------------------
create table shop_counters (
    shop_id      uuid primary key references shops(id) on delete cascade,
    last_quote   integer not null default 0
);

create or replace function next_quote_number(target_shop uuid)
returns integer
language plpgsql
as $$
declare
    n integer;
begin
    insert into shop_counters (shop_id, last_quote)
        values (target_shop, 1)
    on conflict (shop_id)
        do update set last_quote = shop_counters.last_quote + 1
    returning last_quote into n;
    return n;
end;
$$;
