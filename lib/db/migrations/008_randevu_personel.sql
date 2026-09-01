-- ============================================================
-- Migration 008: Randevu Sistemi + Personel (multi-user staff)
-- ============================================================
-- NOTYA-RANDEVU-01 — the doktor vertical had no appointment scheduling at all outside the
-- Pabau-connected klinik vertical. Every Turkish practice-management tool researched
-- (Hipokrat, NBYS, RandevuNet/E-Klinik, Bulut Randevu, Dr.Plazma) converges on the same shape:
-- one calendar per doctor, a secretary who books/reschedules/cancels on the doctor's behalf,
-- and SMS/WhatsApp reminders. This migration adds that shape natively (no Pabau dependency,
-- since most muayenehane doctors are not Pabau clinics).
--
-- Multi-user model: every existing /api/doktor/* route enforces `doctor_id = auth.uid()` in
-- APPLICATION CODE against a SERVICE-ROLE client (see lib/doktor/serverAuth.ts) — RLS below is
-- defense in depth, not the real gate. So a secretary cannot simply "see the doctor's rows"
-- through RLS; the server must resolve WHICH doctor's practice a logged-in secretary acts for.
-- `personel` is that mapping: a secretary is their own auth.users row, linked to exactly one
-- doktor_id. lib/doktor/pratikOturum.ts (new) is the auth convention every randevu/personel
-- route uses, the way doktorOturum() is the convention for solo-doctor routes.

CREATE TABLE IF NOT EXISTS personel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doktor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- NULL until the invite is accepted — accept-flow fills this in with the new auth user's id.
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_soyad TEXT NOT NULL,
  email TEXT NOT NULL,
  -- Single role today (sekreter): randevu + hasta demographics, never clinical notes/e-reçete/SGK.
  -- A CHECK rather than an enum so a future role (e.g. 'yardimci_doktor') is a one-line migration.
  rol TEXT NOT NULL DEFAULT 'sekreter' CHECK (rol IN ('sekreter')),
  aktif BOOLEAN DEFAULT TRUE,
  davet_token_hash TEXT UNIQUE,
  davet_expires_at TIMESTAMPTZ,
  davet_kabul_edildi_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doktor_id, email)
);

CREATE TABLE IF NOT EXISTS randevular (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doktor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  -- A walk-in or phone booking often precedes a full hasta kaydı. These let the secretary book
  -- first and attach the real patient record later, rather than blocking the appointment on it.
  hasta_adi_serbest TEXT,
  hasta_telefon_serbest TEXT,
  baslangic TIMESTAMPTZ NOT NULL,
  bitis TIMESTAMPTZ NOT NULL,
  tur TEXT NOT NULL DEFAULT 'muayene' CHECK (tur IN ('ilk_muayene', 'muayene', 'kontrol', 'diger')),
  durum TEXT NOT NULL DEFAULT 'planlandi' CHECK (durum IN ('planlandi', 'onaylandi', 'tamamlandi', 'iptal', 'gelmedi')),
  notlar TEXT,
  iptal_nedeni TEXT,
  -- Who booked it: the doctor's own auth id, or the secretary's — never doktor_id, which is
  -- whose CALENDAR this is, not who made the entry. Distinguishing the two is the whole point
  -- of a shared calendar.
  olusturan_id UUID REFERENCES auth.users(id),
  hatirlatma_gonderildi BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (bitis > baslangic)
);

-- Per-doctor working hours, used to suggest free slots and to stop a secretary from booking
-- outside clinic hours by accident. Kept as one JSONB row rather than 7 rows: a doctor edits
-- the whole week at once from a settings form, never a single day in isolation.
CREATE TABLE IF NOT EXISTS doktor_calisma_saatleri (
  doktor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Keys "0".."6" = Sunday..Saturday (JS Date#getDay convention, so the API needs no remapping).
  -- Each day: {acik, baslangic: "HH:MM", bitis: "HH:MM"}.
  gunler JSONB NOT NULL DEFAULT '{
    "0": {"acik": false, "baslangic": "09:00", "bitis": "18:00"},
    "1": {"acik": true,  "baslangic": "09:00", "bitis": "18:00"},
    "2": {"acik": true,  "baslangic": "09:00", "bitis": "18:00"},
    "3": {"acik": true,  "baslangic": "09:00", "bitis": "18:00"},
    "4": {"acik": true,  "baslangic": "09:00", "bitis": "18:00"},
    "5": {"acik": true,  "baslangic": "09:00", "bitis": "18:00"},
    "6": {"acik": false, "baslangic": "09:00", "bitis": "18:00"}
  }'::jsonb,
  slot_dakika INTEGER NOT NULL DEFAULT 20,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_randevular_doktor_baslangic ON randevular(doktor_id, baslangic);
CREATE INDEX IF NOT EXISTS idx_randevular_patient ON randevular(patient_id);
CREATE INDEX IF NOT EXISTS idx_personel_doktor ON personel(doktor_id);
CREATE INDEX IF NOT EXISTS idx_personel_user ON personel(user_id);
CREATE INDEX IF NOT EXISTS idx_personel_davet_token ON personel(davet_token_hash);

ALTER TABLE personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE randevular ENABLE ROW LEVEL SECURITY;
ALTER TABLE doktor_calisma_saatleri ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personel' AND policyname = 'personel_doktor_all') THEN
    CREATE POLICY personel_doktor_all ON personel FOR ALL USING (auth.uid() = doktor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personel' AND policyname = 'personel_own_row') THEN
    CREATE POLICY personel_own_row ON personel FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'randevular' AND policyname = 'randevular_doktor_all') THEN
    CREATE POLICY randevular_doktor_all ON randevular FOR ALL USING (auth.uid() = doktor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doktor_calisma_saatleri' AND policyname = 'calisma_saatleri_doktor_all') THEN
    CREATE POLICY calisma_saatleri_doktor_all ON doktor_calisma_saatleri FOR ALL USING (auth.uid() = doktor_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_randevular_updated_at') THEN
    CREATE TRIGGER update_randevular_updated_at BEFORE UPDATE ON randevular
      FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
  END IF;
END $$;
