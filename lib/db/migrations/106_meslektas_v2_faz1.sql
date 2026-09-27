-- ============================================================
-- Migration 106: Meslektaş V2 Faz 1 — düzeltme kuralları görünür
-- ============================================================
-- Additive. doktor_hafiza gains durum/ornekler/kanit_not_idler.
-- notes.uygulanan_kurallar = this note's applied slugs.
-- doktor_ogrenme_islemleri = idempotent approve hook.
-- doktor_iliski greeting flags (öğrenme satırı + 10. seans).
-- ai_hiz_olcum = sibling latency log (cagir.ts untouched).
-- ============================================================

ALTER TABLE doktor_hafiza
  ADD COLUMN IF NOT EXISTS durum TEXT NOT NULL DEFAULT 'aday'
    CHECK (durum IN ('aday', 'uygulanir', 'kapali')),
  ADD COLUMN IF NOT EXISTS ornekler JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS kanit_not_idler TEXT[] NOT NULL DEFAULT '{}';

UPDATE doktor_hafiza
  SET durum = CASE
    WHEN NOT aktif THEN 'kapali'
    WHEN kesin THEN 'uygulanir'
    ELSE 'aday'
  END
  WHERE durum = 'aday' AND (kesin = TRUE OR aktif = FALSE);

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS uygulanan_kurallar TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE doktor_iliski
  ADD COLUMN IF NOT EXISTS ogrenme_selam_gunu DATE,
  ADD COLUMN IF NOT EXISTS meslektas_selam_at DATE;

CREATE TABLE IF NOT EXISTS doktor_ogrenme_islemleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL,
  revizyon_ozet TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doctor_id, note_id, revizyon_ozet)
);

CREATE INDEX IF NOT EXISTS idx_doktor_ogrenme_doktor ON doktor_ogrenme_islemleri(doctor_id);

CREATE TABLE IF NOT EXISTS ai_hiz_olcum (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gorev TEXT NOT NULL,
  sure_ms INTEGER NOT NULL CHECK (sure_ms >= 0),
  onbellekli BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ai_hiz_olcum_gorev_idx ON ai_hiz_olcum (gorev, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_hiz_olcum_doktor_idx ON ai_hiz_olcum (doctor_id, created_at DESC);

ALTER TABLE doktor_ogrenme_islemleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_hiz_olcum ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doktor_ogrenme_islemleri' AND policyname = 'Doktor kendi ogrenme islemlerini gorur') THEN
    CREATE POLICY "Doktor kendi ogrenme islemlerini gorur" ON doktor_ogrenme_islemleri FOR ALL USING (auth.uid() = doctor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_hiz_olcum' AND policyname = 'ai_hiz_olcum_kendi_satiri_oku') THEN
    CREATE POLICY "ai_hiz_olcum_kendi_satiri_oku" ON ai_hiz_olcum FOR SELECT TO authenticated USING (doctor_id = auth.uid());
  END IF;
END $$;
