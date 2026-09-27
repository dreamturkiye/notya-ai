-- ============================================================
-- Migration 107: Meslektaş V2 Faz 2 — kullanım rutini + öne geçme
-- ============================================================
-- Additive. doktor_kullanim_olaylari = PII-free page/action events.
-- doktor_rutin = nightly Markov paket. 30-day retention is the cron.
-- ============================================================

CREATE TABLE IF NOT EXISTS doktor_kullanim_olaylari (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zaman TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sayfa_tipi TEXT NOT NULL,
  eylem TEXT NOT NULL,
  onceki TEXT,
  sure_ms INTEGER,
  cihaz TEXT
);
CREATE INDEX IF NOT EXISTS idx_kullanim_doktor_zaman ON doktor_kullanim_olaylari (doctor_id, zaman DESC);

CREATE TABLE IF NOT EXISTS doktor_rutin (
  doctor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  paket JSONB NOT NULL DEFAULT '{}'::jsonb,
  guncelleme TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE doktor_kullanim_olaylari ENABLE ROW LEVEL SECURITY;
ALTER TABLE doktor_rutin ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doktor_kullanim_olaylari' AND policyname = 'Doktor kendi kullanimini gorur') THEN
    CREATE POLICY "Doktor kendi kullanimini gorur" ON doktor_kullanim_olaylari FOR ALL USING (auth.uid() = doctor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doktor_rutin' AND policyname = 'Doktor kendi rutinini gorur') THEN
    CREATE POLICY "Doktor kendi rutinini gorur" ON doktor_rutin FOR ALL USING (auth.uid() = doctor_id);
  END IF;
END $$;
