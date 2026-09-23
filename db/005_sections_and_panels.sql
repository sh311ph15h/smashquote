-- ============================================================
-- SMASHQUOTE — Migration 005: repair sections + panel areas
-- ============================================================

-- ------------------------------------------------------------
-- LINE TYPES — split "labour" into R&R and Repair
-- ------------------------------------------------------------
-- A smash estimate has always had six sections, and the Crashzone pick list we
-- ship already carries all six groups (rr, repair, paint, part, sublet, misc).
-- The schema collapsed the first two into one "labour" type, which meant the
-- 3,253-row Repair list had no line type that could reach it.
--
-- Text plus a CHECK rather than a new enum, for the same reason as the photo
-- categories in 004: this list has now changed twice, and Postgres enums can't
-- drop or rename a value.
alter table quote_lines alter column line_type type text using line_type::text;

-- Every existing labour line was picked from the R&R list — that's the only
-- group the old mapping (PICK_FOR_LINE.labour -> 'rr') ever offered — so R&R
-- is where they belong, not a guess.
update quote_lines set line_type = 'rr' where line_type = 'labour';

alter table quote_lines add constraint quote_lines_type_check check (
    line_type in ('rr', 'repair', 'paint', 'part', 'sublet', 'misc')
);

drop type line_type;

-- The totals trigger decides hours x rate vs qty x price off the line type, so
-- it has to learn the new names in the same migration. Left alone it would
-- price every R&R and Repair line at zero.
create or replace function compute_line_total()
returns trigger
language plpgsql
as $$
begin
    if new.line_type in ('rr', 'repair', 'paint') then
        new.line_total := round(coalesce(new.hours,0) * coalesce(new.rate,0), 2);
    else
        new.line_total := round(coalesce(new.quantity,0) * coalesce(new.unit_price,0), 2);
    end if;
    return new;
end;
$$;

-- ------------------------------------------------------------
-- PANEL AREAS
-- ------------------------------------------------------------
-- Which part of the car a line is for: 10 = FRONT BAR, 17 = L/H/F GUARD, and so
-- on, matching PICK_AREAS in lib/picklist.js. Every pick-list row already
-- carries its area; until now the app read it and threw it away.
--
-- Recording it is what lets the car diagram and the line items be two views of
-- one estimate rather than two things to keep in step. Deliberately a plain
-- smallint with no FK: the areas come from the pick list we ship, not from a
-- table, and a line typed by hand is allowed to have no area at all.
alter table quote_lines add column area_id smallint;

create index quote_lines_area_idx on quote_lines (quote_id, area_id);

comment on column quote_lines.area_id is
  'Panel area from the pick list (PICK_AREAS in lib/picklist.js). Null = not panel-specific.';

-- ------------------------------------------------------------
-- BODY TYPE
-- ------------------------------------------------------------
-- vehicles.body_type already exists as free text. The diagram maps whatever is
-- in it onto one of its shapes and falls back to a sedan, so nothing here
-- constrains it — a body type we don't draw must not block saving a quote.

notify pgrst, 'reload schema';
