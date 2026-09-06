-- ============================================================
-- SMASHQUOTE — Migration 002: totals trigger + Row-Level Security
-- ============================================================

-- ------------------------------------------------------------
-- Keep line_total and the quote's cached money columns correct
-- ------------------------------------------------------------
-- The client never gets to decide the maths. line_total is derived from the
-- line's own fields on every insert/update; the parent quote's subtotal / GST
-- / total are recomputed from its lines whenever a line changes.

create or replace function compute_line_total()
returns trigger
language plpgsql
as $$
begin
    if new.line_type in ('labour', 'paint') then
        new.line_total := round(coalesce(new.hours,0) * coalesce(new.rate,0), 2);
    else
        new.line_total := round(coalesce(new.quantity,0) * coalesce(new.unit_price,0), 2);
    end if;
    return new;
end;
$$;

create trigger trg_line_total
    before insert or update on quote_lines
    for each row execute function compute_line_total();

create or replace function recompute_quote_totals()
returns trigger
language plpgsql
as $$
declare
    q uuid := coalesce(new.quote_id, old.quote_id);
    sub numeric(12,2);
    taxable_sub numeric(12,2);
    rate numeric(5,4);
begin
    select
        coalesce(sum(line_total), 0),
        coalesce(sum(line_total) filter (where taxable), 0)
      into sub, taxable_sub
      from quote_lines where quote_id = q;

    select gst_rate into rate from quotes where id = q;

    update quotes
       set subtotal   = sub,
           gst_amount = round(taxable_sub * coalesce(rate,0), 2),
           total      = sub + round(taxable_sub * coalesce(rate,0), 2),
           updated_at = now()
     where id = q;

    return null;
end;
$$;

create trigger trg_quote_totals
    after insert or update or delete on quote_lines
    for each row execute function recompute_quote_totals();

-- ------------------------------------------------------------
-- Row-Level Security — the core of tenant isolation
-- ------------------------------------------------------------
-- Turn RLS on everywhere, then allow a row only when the current user belongs
-- to its shop. Child tables (quote_lines) check membership through the parent.

alter table shops         enable row level security;
alter table shop_members  enable row level security;
alter table customers     enable row level security;
alter table insurers      enable row level security;
alter table vehicles      enable row level security;
alter table quotes        enable row level security;
alter table quote_lines   enable row level security;
alter table shop_counters enable row level security;

-- Shops: you can see/edit a shop you belong to.
create policy shops_member_all on shops
    for all using (is_shop_member(id)) with check (is_shop_member(id));

-- Membership rows: you can see the membership of shops you're in.
create policy members_read on shop_members
    for select using (is_shop_member(shop_id));
-- (Writes to shop_members go through server-side code with the service role —
--  inviting/removing users is an admin action, not a direct client write.)

-- One policy shape, repeated for every shop-scoped table.
create policy customers_member_all on customers
    for all using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));
create policy insurers_member_all on insurers
    for all using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));
create policy vehicles_member_all on vehicles
    for all using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));
create policy quotes_member_all on quotes
    for all using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));
create policy counters_member_all on shop_counters
    for all using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

-- Quote lines: membership is inherited from the parent quote.
create policy quote_lines_member_all on quote_lines
    for all using (
        exists (select 1 from quotes q
                 where q.id = quote_lines.quote_id and is_shop_member(q.shop_id))
    ) with check (
        exists (select 1 from quotes q
                 where q.id = quote_lines.quote_id and is_shop_member(q.shop_id))
    );
