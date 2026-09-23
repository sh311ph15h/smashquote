-- ============================================================
-- SMASHQUOTE — Migration 004: liability, third-party jobs,
--              photo stages and damage annotations
-- ============================================================

-- ------------------------------------------------------------
-- LIABILITY — who caused the accident
-- ------------------------------------------------------------
-- Deliberately separate from quote_status. Status is where the paperwork has
-- got to (draft -> sent -> approved); liability is whose fault the crash was,
-- and the two move independently: a disputed job is repaired regardless of
-- whether fault is ever settled.
--
--   favour   — someone else hit our customer. Not at fault, no excess.
--   against  — our customer caused it. Excess is payable.
--   disputed — fault still being worked out; the repair goes ahead anyway.
--
-- Null means "not recorded yet", which is the honest state of a fresh draft.
create type quote_liability as enum ('favour', 'against', 'disputed');

alter table quotes add column liability quote_liability;

-- An at-fault ("against") crash usually produces a second job: the other
-- driver's car, which we repair at no cost to them. They are not our customer,
-- so that quote is flagged here and can be found on its own.
alter table quotes add column is_third_party boolean not null default false;

-- ...but it isn't a free-floating job either. A third party's car is only in
-- the shop because one of our customers hit it, so the repair is pinned to the
-- at-fault quote it arose from. From either side of an accident you can reach
-- the other: our customer's job, and the car they ran into.
--
-- Self-referencing, and null for every ordinary job. ON DELETE SET NULL rather
-- than CASCADE: deleting our customer's quote must never silently delete the
-- record of a car we actually repaired.
alter table quotes add column related_quote_id uuid
    references quotes(id) on delete set null;

-- A quote can't arise from itself.
alter table quotes add constraint quotes_related_not_self
    check (related_quote_id is null or related_quote_id <> id);

create index quotes_liability_idx   on quotes (shop_id, liability);
create index quotes_thirdparty_idx  on quotes (shop_id, is_third_party);
create index quotes_related_idx     on quotes (related_quote_id);

-- ------------------------------------------------------------
-- VEHICLE LOOKUP — indexes for the shop-floor search
-- ------------------------------------------------------------
-- Rego is already indexed (001). These cover the other things someone types
-- into the search box when the plate isn't to hand.
create index vehicles_vin_idx   on vehicles (shop_id, lower(vin));
create index vehicles_make_idx  on vehicles (shop_id, lower(make), lower(model));

-- ------------------------------------------------------------
-- PHOTO STAGES
-- ------------------------------------------------------------
-- A repair is photographed at every stage, not just before and after, and the
-- stages have to stay apart so an assessor can see the job progress in order.
-- The old enum only had damage/before/after; widening it means adding values,
-- and Postgres enums can't drop or rename the old ones. Text plus a CHECK is
-- the honest shape for a list that will keep growing.
alter table quote_photos alter column category drop default;
alter table quote_photos alter column category type text using category::text;

-- Remap the two old values onto the new vocabulary. "before" always meant
-- "before we touched it", which is the damage set.
update quote_photos set category = 'damage'       where category = 'before';
update quote_photos set category = 'after_repair' where category = 'after';

alter table quote_photos alter column category set default 'damage';
alter table quote_photos add constraint quote_photos_category_check check (
    category in ('damage', 'under_repair', 'repaired',
                 'before_paint', 'painted', 'after_repair',
                 'invoice', 'other')
);

drop type photo_category;

-- ------------------------------------------------------------
-- DAMAGE ANNOTATIONS
-- ------------------------------------------------------------
-- Arrows, circles and labels drawn over a photo to point at what's actually
-- damaged — a dent in a guard is often invisible in a picture on its own.
--
-- Stored as vector data rather than burnt into the image so the original photo
-- stays untouched evidence, the marks can be corrected later, and they stay
-- crisp at any size. Coordinates are fractions of the image (0..1), so they
-- survive resizing and thumbnailing.
--
--   [{ "id": "...", "type": "arrow"|"circle"|"box"|"text",
--      "x1": 0.2, "y1": 0.3, "x2": 0.5, "y2": 0.6,
--      "color": "#f87171", "label": "Dent — L/H/F guard" }]
alter table quote_photos add column annotations jsonb;

comment on column quote_photos.annotations is
  'Damage marks drawn over the photo. Array of shapes with 0..1 relative coords.';

-- PostgREST caches the schema, including which foreign keys exist. Without
-- this it keeps serving the old shape and every query embedding the new
-- relationship fails with "could not find a relationship".
notify pgrst, 'reload schema';
