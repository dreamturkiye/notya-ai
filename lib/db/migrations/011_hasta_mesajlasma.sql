-- ============================================================
-- Migration 011: Sağlığım secure messaging (patient ↔ practice)
-- ============================================================
-- Shared practice inbox (doktor + sekreter via pratikOturum). External WhatsApp
-- pings never include message body / PHI — only "panele gir" alerts, throttled.

CREATE TABLE IF NOT EXISTS hasta_mesaj_konulari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  konu TEXT NOT NULL,
  -- Patient-facing folder: gelen | gonderilen | arsiv
  hasta_klasor TEXT NOT NULL DEFAULT 'gonderilen'
    CHECK (hasta_klasor IN ('gelen', 'gonderilen', 'arsiv')),
  son_mesaj_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  okundu_hasta BOOLEAN NOT NULL DEFAULT TRUE,
  okundu_pratik BOOLEAN NOT NULL DEFAULT FALSE,
  pratik_arsiv BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hasta_mesaj_konulari_doctor_son
  ON hasta_mesaj_konulari (doctor_id, son_mesaj_at DESC);
CREATE INDEX IF NOT EXISTS idx_hasta_mesaj_konulari_patient
  ON hasta_mesaj_konulari (patient_id, son_mesaj_at DESC);
CREATE INDEX IF NOT EXISTS idx_hasta_mesaj_konulari_pratik_unread
  ON hasta_mesaj_konulari (doctor_id, okundu_pratik)
  WHERE okundu_pratik = FALSE AND pratik_arsiv = FALSE;

CREATE TABLE IF NOT EXISTS hasta_mesajlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  konu_id UUID REFERENCES hasta_mesaj_konulari(id) ON DELETE CASCADE NOT NULL,
  taraf TEXT NOT NULL CHECK (taraf IN ('hasta', 'doktor', 'klinik')),
  yazar_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metin TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hasta_mesajlar_konu
  ON hasta_mesajlar (konu_id, created_at ASC);

-- Throttle column for doctor WhatsApp "new message" pings (no PHI in body).
ALTER TABLE users ADD COLUMN IF NOT EXISTS mesaj_ping_at TIMESTAMPTZ;

ALTER TABLE hasta_mesaj_konulari ENABLE ROW LEVEL SECURITY;
ALTER TABLE hasta_mesajlar ENABLE ROW LEVEL SECURITY;

-- Defense in depth: app uses service role + pratikOturum / portal token. Policies allow
-- doctors to see their own rows if a user-scoped client is ever used.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hasta_mesaj_konulari' AND policyname = 'doctor own threads'
  ) THEN
    CREATE POLICY "doctor own threads" ON hasta_mesaj_konulari
      FOR ALL USING (auth.uid() = doctor_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hasta_mesajlar' AND policyname = 'doctor own messages'
  ) THEN
    CREATE POLICY "doctor own messages" ON hasta_mesajlar
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM hasta_mesaj_konulari k
          WHERE k.id = konu_id AND k.doctor_id = auth.uid()
        )
      );
  END IF;
END $$;

INSERT INTO schema_migrations (version, filename, checksum, applied_at, backfilled, note)
VALUES (
  '011',
  '011_hasta_mesajlasma.sql',
  NULL,
  NOW(),
  FALSE,
  'Sağlığım patient↔practice messaging + users.mesaj_ping_at throttle'
)
ON CONFLICT (version) DO NOTHING;
