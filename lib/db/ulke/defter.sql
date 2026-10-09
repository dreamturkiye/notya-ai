-- NOTYA-ULKE-PORTAL-01 — THE MIGRATION LEDGER of a country database. Part of the baseline
-- (lib/db/ulke/000_yeni_ulke_veritabani.sql is generated from this file and from the country migrations listed in
-- lib/db/ulke/gocler.json). It is not a migration and is not run by itself.
--
-- One row per country migration that has been applied to THIS database. Every country migration writes its own row.
-- SERVER ONLY: row-level security is on with no rule, and the browser roles hold no privilege on it, so it cannot be
-- read or written through the public API. The server's own role is not bound by row-level security.
create table if not exists public.schema_migrations (
  version text primary key,
  filename text not null,
  checksum text,
  applied_at timestamptz,
  backfilled boolean not null default false,
  note text
);

alter table public.schema_migrations enable row level security;
revoke all on table public.schema_migrations from anon, authenticated;
