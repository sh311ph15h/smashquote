# Database migrations

Run in order in the Supabase SQL editor (or via psql):

1. `001_init.sql` — shops, members, customers, insurers, vehicles, quotes, lines, counters
2. `002_rls.sql` — totals trigger + Row-Level Security policies
3. `003_photos.sql` — quote_photos (R2 object keys + metadata)
