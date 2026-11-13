-- ============================================================
-- Migration 197: AYSE-OGRENME-V3 — öğrenme ivmesi + klinik ortak üslup
-- ============================================================
-- Additive, idempotent. Kural önizleme (feature 2) needs NO schema: it is rebuilt from not_duzenlemeleri.
-- Apply to Türkiye + the six country databases (same numbering as the release branches; 196 is geri_cagirma).
--
-- 1) doktor_ogrenme_metrik — per approved note, the real number of corrections (duzeltmeAnaliz deltas). One row per
--    (doctor, note); written in waitUntil at approval. Counts only; no note text, no patient id.
-- 2) klinik_uslup_katilim — per-doctor explicit consent to the clinic's shared style. DEFAULT OFF (no row = off).
-- 3) klinik_ortak_uslup — the shared pool: STYLE RULES ONLY (terim / uzunluk / sira — filtered in code,
--    lib/doktor/ogrenme/klinikUslup.ts). Split by branş (no specialty leak). kaynak_doctor_id exists only so a leaving
--    doctor's rows can be deleted; it is never returned to a client.
-- Service-role routes scope by doctor_id in code (hasta-izolasyon); RLS below is the second line for the anon key.
-- ============================================================

CREATE TABLE IF NOT EXISTS doktor_ogrenme_metrik (
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL,
  duzeltme_sayisi INTEGER NOT NULL CHECK (duzeltme_sayisi >= 0),
  onay_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (doctor_id, note_id)
);
CREATE INDEX IF NOT EXISTS idx_doktor_ogrenme_metrik_zaman ON doktor_ogrenme_metrik (doctor_id, onay_at DESC);

CREATE TABLE IF NOT EXISTS klinik_uslup_katilim (
  doctor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  aktif BOOLEAN NOT NULL DEFAULT FALSE,
  onay_at TIMESTAMPTZ,
  ayrildi_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_klinik_uslup_katilim_klinik ON klinik_uslup_katilim (clinic_id) WHERE aktif;

CREATE TABLE IF NOT EXISTS klinik_ortak_uslup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  kaynak_doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brans TEXT NOT NULL,
  anahtar TEXT NOT NULL,
  deger TEXT NOT NULL CHECK (char_length(deger) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, kaynak_doctor_id, anahtar)
);
CREATE INDEX IF NOT EXISTS idx_klinik_ortak_uslup_okuma ON klinik_ortak_uslup (clinic_id, brans, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_klinik_ortak_uslup_kaynak ON klinik_ortak_uslup (kaynak_doctor_id);

ALTER TABLE doktor_ogrenme_metrik ENABLE ROW LEVEL SECURITY;
ALTER TABLE klinik_uslup_katilim ENABLE ROW LEVEL SECURITY;
ALTER TABLE klinik_ortak_uslup ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doktor_ogrenme_metrik' AND policyname = 'doktor_ogrenme_metrik_kendi_satiri') THEN
    CREATE POLICY "doktor_ogrenme_metrik_kendi_satiri" ON doktor_ogrenme_metrik FOR SELECT USING (auth.uid() = doctor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'klinik_uslup_katilim' AND policyname = 'klinik_uslup_katilim_kendi_satiri') THEN
    CREATE POLICY "klinik_uslup_katilim_kendi_satiri" ON klinik_uslup_katilim FOR SELECT USING (auth.uid() = doctor_id);
  END IF;
  -- Pool: a doctor can see/delete only their OWN rows through the anon key; reading others' rules happens only
  -- server-side (service role) and never returns kaynak_doctor_id.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'klinik_ortak_uslup' AND policyname = 'klinik_ortak_uslup_kendi_satiri') THEN
    CREATE POLICY "klinik_ortak_uslup_kendi_satiri" ON klinik_ortak_uslup FOR ALL USING (auth.uid() = kaynak_doctor_id) WITH CHECK (auth.uid() = kaynak_doctor_id);
  END IF;
END $$;

REVOKE ALL ON doktor_ogrenme_metrik, klinik_uslup_katilim, klinik_ortak_uslup FROM anon;
