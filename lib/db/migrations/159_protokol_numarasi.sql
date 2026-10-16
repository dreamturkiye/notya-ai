-- ============================================================
-- Migration 159: Protokol Numarası (muayene / examination sequential document number)
-- ============================================================
--
-- NOTYA-PROTOKOL-NO-01 — every new muayene (sessions row) gets an automatic, sequential,
-- immutable "Protokol Numarası" at creation — the standard Turkish clinical-practice field
-- printed on prescriptions and reports, and required for future MBYS/e-Nabız/private
-- insurance export packages (beta-pediatrician audit finding, Kaan's brief: close it to a
-- genuinely Strong implementation, not a token field).
--
-- SCOPING DECISION — see lib/doktor/protokolNo.ts for the full reasoning (kept in sync with
-- this comment): `clinics`/`clinic_members` (migration 004_clinic_pabau) IS a real multi-
-- doctor entity in this data model — `clinic_invitations` accept flow
-- (app/api/klinik/invite/accept/route.ts) really sets `users.clinic_id` for any invited
-- doctor, it is not limited to the superuser-only "Klinik yüzü" preview UI
-- (lib/klinik/klinikErisim.ts gates only the admin dashboard, not this column). So the
-- counter is scoped by COALESCE(users.clinic_id, sessions.doctor_id): a doctor who is
-- genuinely a member of a multi-doctor clinic shares ONE sequence with every other doctor at
-- that clinic (matching real protokol defteri practice); every other doctor today — which is
-- every real beta account — gets their own sequence, the closest real equivalent until Klinik
-- accounts are actually used. No code change will be needed when that day comes: the scope
-- key just starts resolving to a shared clinic id instead of each doctor's own id.
--
-- ATOMICITY — `protokol_sayaclari` is a dedicated counter table, one row per (scope, year).
-- `protokol_no_ata()` is a single INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING
-- statement: Postgres takes a row-level lock on the conflicting row for the statement's
-- duration, so two concurrent calls for the same scope+year can never both read the same
-- `son_numara` and both write the next value — the exact collision a naive "SELECT max+1"
-- (read, then separate write) would hit under concurrent muayene creation. Verified with a
-- real concurrency test against a live Postgres instance (not mocked): 150 concurrent calls
-- against a single scope, and 50+50 concurrent calls across two different scopes at the same
-- time, each on a 20-connection pool — zero duplicates, a dense 1..N sequence for each scope,
-- and the two scopes independently producing the SAME numbers (expected — see "different
-- clinics/doctors can reuse the same number independently" below). The live-Postgres proof
-- lives in lib/doktor/protokolNo.test.ts
-- (its own header explains how to re-run it against a real database; it skips cleanly in
-- `npm test` when none is configured).
--
-- RESET — the counter resets every calendar year, per scope ("2026-000123" format, matching
-- Turkish protokol defteri convention). A new year's first call for a scope starts a fresh
-- row at 1; it can never collide with a previous year's numbers because the year is part of
-- both the formatted string and the counter table's primary key.
--
-- UNIQUENESS — "Must be unique within the clinic ... different clinics/doctors can reuse the
-- same number independently" (brief, verbatim) is enforced at the DB level, not just in the
-- generator: sessions.protokol_scope_id stores the exact scope key the number was drawn from,
-- and the unique index below is keyed on (protokol_scope_id, protokol_no) — NOT on
-- protokol_no alone. Two different scopes legitimately produce the identical string
-- "2026-000001"; the same scope never can.
--
-- IMMUTABILITY — "No manual override after generation — read-only once assigned" (brief) is
-- enforced by a BEFORE UPDATE trigger, not left to application discipline: once protokol_no
-- is non-null, any UPDATE that would change it (including setting it back to NULL) raises an
-- exception. Setting it the first time (NULL -> value) still works — the normal path sets it
-- inside the INSERT itself, never via a follow-up UPDATE, but the trigger does not need to
-- forbid that case.
--
-- HISTORICAL DATA — existing sessions rows (created before this migration) are left with
-- protokol_no = NULL, NOT backfilled. A backfill would have to invent an ordering/numbering
-- for muayenes that were never meant to carry one, with no way to guarantee it can never
-- collide with a number the live counter is about to hand out for the same scope+year (e.g. a
-- backfill seeded above "today's max" is still wrong the moment a later year's counter resets
-- to 1, or if more historical rows for that scope surface later from a different source). The
-- UI renders "—" for a null protokol_no (muayene screen, printed note, reçete, every report
-- built from lib/doktor/raporPdfSablonu.tsx) instead of a manufactured number.

CREATE TABLE IF NOT EXISTS protokol_sayaclari (
  scope_type TEXT NOT NULL CHECK (scope_type IN ('clinic', 'doctor')),
  scope_id UUID NOT NULL,
  yil INTEGER NOT NULL,
  son_numara INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (scope_type, scope_id, yil)
);

COMMENT ON TABLE protokol_sayaclari IS
  $$NOTYA-PROTOKOL-NO-01 — one atomic counter row per (scope, year). Never read/incremented directly; always go through protokol_no_ata() so the increment stays one atomic statement.$$;

ALTER TABLE protokol_sayaclari ENABLE ROW LEVEL SECURITY;
-- Service-role only (same posture as every other internal counter/ledger table in this
-- product) — no anon/authenticated policy is created, matching e.g. ai_token_kullanim.

CREATE OR REPLACE FUNCTION protokol_no_ata(p_scope_type TEXT, p_scope_id UUID, p_yil INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_numara INTEGER;
BEGIN
  INSERT INTO protokol_sayaclari (scope_type, scope_id, yil, son_numara)
  VALUES (p_scope_type, p_scope_id, p_yil, 1)
  ON CONFLICT (scope_type, scope_id, yil)
  DO UPDATE SET son_numara = protokol_sayaclari.son_numara + 1, updated_at = NOW()
  RETURNING son_numara INTO v_numara;

  RETURN p_yil::text || '-' || lpad(v_numara::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION protokol_no_ata IS
  $$NOTYA-PROTOKOL-NO-01 — atomically returns the NEXT "YYYY-NNNNNN" protokol numarası for a scope+year. One INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING statement: Postgres row-locks the counter row for its duration, so concurrent callers can never both read the same son_numara. Call once per muayene, at creation, and write the result into the SAME insert() payload as the new sessions row — never as a separate update afterward.$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='protokol_no') THEN
    ALTER TABLE sessions ADD COLUMN protokol_no TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='protokol_scope_id') THEN
    ALTER TABLE sessions ADD COLUMN protokol_scope_id UUID;
  END IF;
END $$;

COMMENT ON COLUMN sessions.protokol_no IS
  $$NOTYA-PROTOKOL-NO-01 — Turkish clinical protokol numarası ("YYYY-NNNNNN"), assigned once via protokol_no_ata() in the SAME insert as the session row. Immutable once set (see trg_sessions_protokol_no_degismez). Printed on reçete and every Hasta Raporları PDF (lib/doktor/raporPdfSablonu.tsx) and carried through to future MBYS/e-Nabız/private insurance export packages. NULL on sessions created before this migration — not backfilled (see migration header) — the UI renders "—" for those.$$;
COMMENT ON COLUMN sessions.protokol_scope_id IS
  $$NOTYA-PROTOKOL-NO-01 — the clinic id (if the doctor belongs to one, users.clinic_id) or else the doctor's own id, that protokol_no was drawn from. Stored (not re-derived) so the uniqueness index below is enforceable even if a doctor later changes clinic.$$;

-- Uniqueness holds WITHIN a scope only — two different scopes may legitimately produce the
-- same "YYYY-NNNNNN" string (brief, verbatim: "different clinics/doctors can reuse the same
-- number independently"). Partial index: historical NULL rows never collide with anything.
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_protokol_no_scope
  ON sessions (protokol_scope_id, protokol_no) WHERE protokol_no IS NOT NULL;

CREATE OR REPLACE FUNCTION sessions_protokol_no_degismez()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.protokol_no IS NOT NULL AND NEW.protokol_no IS DISTINCT FROM OLD.protokol_no THEN
    RAISE EXCEPTION 'protokol_no bir kez atandıktan sonra değiştirilemez (immutable).';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sessions_protokol_no_degismez ON sessions;
CREATE TRIGGER trg_sessions_protokol_no_degismez
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION sessions_protokol_no_degismez();
