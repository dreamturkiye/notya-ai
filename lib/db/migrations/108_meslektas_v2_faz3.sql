-- ============================================================
-- Migration 108: Meslektaş V2 Faz 3 — hasta dosya önbelleği + hız görünümü
-- ============================================================

CREATE TABLE IF NOT EXISTS hasta_dosya_onbellek (
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  surum_hash TEXT NOT NULL DEFAULT '',
  paket_metin TEXT NOT NULL DEFAULT '',
  hasta_ad TEXT NOT NULL DEFAULT '',
  kart_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  olaylar_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  guncelleme TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kirli BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (doctor_id, patient_id)
);
CREATE INDEX IF NOT EXISTS idx_hasta_onbellek_kirli ON hasta_dosya_onbellek (doctor_id, kirli);

ALTER TABLE hasta_dosya_onbellek ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasta_dosya_onbellek' AND policyname = 'Doktor kendi onbellegini gorur') THEN
    CREATE POLICY "Doktor kendi onbellegini gorur" ON hasta_dosya_onbellek FOR ALL USING (auth.uid() = doctor_id);
  END IF;
END $$;

CREATE OR REPLACE VIEW v_hiz_gunluk AS
SELECT
  (created_at AT TIME ZONE 'Europe/Istanbul')::date AS gun,
  gorev,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY sure_ms)::int AS p50,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY sure_ms)::int AS p95,
  count(*)::int AS n,
  count(*) FILTER (WHERE onbellekli)::int AS onbellekli_n
FROM ai_hiz_olcum
GROUP BY 1, 2;
