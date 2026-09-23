# Database migrations

Run in order in the Supabase SQL editor (or via psql):

1. `001_init.sql` — shops, members, customers, insurers, vehicles, quotes, lines, counters
2. `002_rls.sql` — totals trigger + Row-Level Security policies
3. `003_photos.sql` — quote_photos (R2 object keys + metadata)
4. `004_liability_photos.sql` — fault (favour/against/disputed), third-party
   jobs and the link back to the at-fault quote, the full set of repair-stage
   photo categories, and damage annotations
5. `005_sections_and_panels.sql` — splits labour into R&R and Repair (six
   estimate sections), re-teaches the totals trigger the new line types, and
   adds `quote_lines.area_id` (which panel a line is for)
