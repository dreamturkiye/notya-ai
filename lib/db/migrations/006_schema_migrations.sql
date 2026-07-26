-- Migration 006: Migration tracking ledger
--
-- Until now there was no record of which migrations had been applied to a
-- database. Runners existed only for 001 (scripts/run-supabase-migration.mjs,
-- scripts/run-tidb-migration.mjs); 002-005 were applied by hand in the SQL
-- editor with nothing recording that they had run. Applied state was therefore
-- only discoverable by probing the live schema column by column.
--
-- This migration is purely additive: one new table, no changes to existing
-- tables, no drops, no type changes, no data mutation.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  filename    TEXT NOT NULL,
  checksum    TEXT,                   -- sha256 prefix of the file when applied
  applied_at  TIMESTAMPTZ,            -- NULL for backfilled rows: real time unknown
  backfilled  BOOLEAN NOT NULL DEFAULT FALSE,
  note        TEXT
);

COMMENT ON TABLE schema_migrations IS
  'Ledger of applied database migrations. One row per migration file in lib/db/migrations/.';

-- Not user data, but it lives in the public schema and would otherwise be
-- readable through PostgREST with the anon key. Enable RLS with no policies:
-- anon and authenticated get nothing, service_role bypasses RLS as usual.
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- Backfill 001-005. Each row below was verified present in the production
-- schema on 2026-07-26 by direct inspection (information_schema, pg_policies,
-- pg_trigger, pg_constraint) rather than assumed. applied_at is left NULL
-- because the actual application time was never recorded.
INSERT INTO schema_migrations (version, filename, checksum, applied_at, backfilled, note) VALUES
  ('001', '001_doctor_profile.sql',            '8e3210daeeea2533', NULL, TRUE,
   'Verified 2026-07-26. Postgres/Supabase variant; 001_doctor_profile_tidb.sql targets TiDB/MySQL and is deliberately not tracked here.'),
  ('002', '002_doktor_hasta_management.sql',   'fbd82705a83ddc30', NULL, TRUE,
   'Verified 2026-07-26: hasta_belgeler, hasta_goruntulemeler, hasta_ilaclar, hasta_lab_sonuclari, hasta_hatirlatma all present.'),
  ('003', '003_sprint3_additions.sql',         '31b2aa7429d4aea1', NULL, TRUE,
   'Verified 2026-07-26: hasta_portal_tokens plus policies portal_tokens_doctor, belgeler_doctor, goruntuleme_doctor, ilaclar_doctor, hatirlatma_doctor all present. NOTE: the committed file contains CREATE POLICY IF NOT EXISTS, which is not valid Postgres syntax - it cannot have been applied verbatim and will fail if replayed against a fresh database. Needs a follow-up fix.'),
  ('004', '004_clinic_pabau_utf8.sql',         'e527740c7ba1733a', NULL, TRUE,
   'Verified 2026-07-26: users.account_type, users.clinic_id, users.pabau_connected present. The utf8 variant is treated as authoritative; 004_clinic_pabau.sql contains a non-UTF-8 byte sequence.'),
  ('005', '005_allied_health_diagnosis_ref.sql','8e66d184d67a621e', NULL, TRUE,
   'Verified 2026-07-26: notes.hekim_tani_referansi, hekim_tani_tarihi, hekim_adi, tedavi_plani_ozet present; trigger trg_enforce_hekim_tani present; notes_note_type_check widened to include the five allied-health types. Was applied to production but the file was never committed to git until 2026-07-26.')
ON CONFLICT (version) DO NOTHING;

-- This migration records itself.
INSERT INTO schema_migrations (version, filename, applied_at, backfilled, note) VALUES
  ('006', '006_schema_migrations.sql', NOW(), FALSE, 'Creates this ledger.')
ON CONFLICT (version) DO NOTHING;
