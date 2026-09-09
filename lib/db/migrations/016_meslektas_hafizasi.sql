-- ============================================================
-- Migration 016: Meslektaş Hafızası (NOTYA-OGRENME-03)
-- ============================================================
-- Kaan direktifi (2026-09-09): asistan "kişisel şef" gibi olmalı — doktoru
-- tanımalı (ben balık yemem / benim mesaim 9'da başlar / bana Gökhan de),
-- 10. seansta yıllardır birlikte çalışıyormuş gibi hissettirmeli. Bu, en iyi
-- SOAP uygulaması olduğumuz için değil, İLİŞKİ kişisel olduğu için kalma
-- sebebidir (iPhone -> Android geçmeme sebebi).
--
-- Bugüne kadar öğrenme iki ayrı yerde yaşıyordu:
--   doctor_preferences (asistan sohbet, hiç dolmuyordu)
--   doktor_stil_profilleri (not damıtma, yalnız not üretimine gidiyordu)
-- Bu migration TEK hafıza katmanı kurar; tüm yüzeyler (yazılı sohbet, sesli
-- Ayşe, not üretimi, Ayşe'ye Danış) aynı hafızayı okur.
--
-- Güven modeli:
--   kaynak='doktor_soyledi'  -> anında KESİN (şefe "balık yemem" dersin, iki kez
--                               görmesi gerekmez)
--   kaynak='duzeltme'/'gozlem' + kategori klinik -> 2+ kanıt (bir vakada başka
--                               klinik sebep olabilir — Kaan/Gökhan kuralı)
--   diğer kategoriler (üslup/rutin/iletişim/uygulama) -> 1 kanıt yeter
-- ============================================================

-- Repo gerçekliği: bu tablo canlıda SQL editörle açılmıştı, migration dosyası yoktu.
CREATE TABLE IF NOT EXISTS doktor_stil_profilleri (
  doctor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profil TEXT,
  ornek_sayisi INTEGER DEFAULT 0,
  guncelleme TIMESTAMPTZ DEFAULT NOW()
);

-- Tek tek hafıza kayıtları (doktorun bana söyledikleri + gözlemlerim)
CREATE TABLE IF NOT EXISTS doktor_hafiza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kategori TEXT NOT NULL CHECK (kategori IN ('klinik','uslup','rutin','iletisim','kisisel','uygulama')),
  anahtar TEXT NOT NULL,          -- kısa slug: "ogle-arasi", "hitap", "antibiyotik-ilk-tercih"
  deger TEXT NOT NULL,            -- doğal dil: "12:30-13:30 arası hasta almaz"
  kaynak TEXT NOT NULL CHECK (kaynak IN ('doktor_soyledi','duzeltme','gozlem')),
  kanit_sayisi INTEGER NOT NULL DEFAULT 1,
  kesin BOOLEAN NOT NULL DEFAULT FALSE,   -- prompta "uy" olarak girer
  aktif BOOLEAN NOT NULL DEFAULT TRUE,    -- "unut" -> false (silinmez, iz kalır)
  ilk_gorulme TIMESTAMPTZ DEFAULT NOW(),
  son_gorulme TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doctor_id, kategori, anahtar)
);

-- Doktor-asistan ilişki durumu (tek satır / doktor)
CREATE TABLE IF NOT EXISTS doktor_iliski (
  doctor_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  seans_sayisi INTEGER NOT NULL DEFAULT 0,   -- birlikte çalışılan FARKLI günler (TRT)
  ilk_seans_gunu DATE,
  son_seans_gunu DATE,
  toplam_not INTEGER NOT NULL DEFAULT 0,
  toplam_sohbet INTEGER NOT NULL DEFAULT 0,
  toplam_duzeltme INTEGER NOT NULL DEFAULT 0,
  rutin JSONB NOT NULL DEFAULT '{}',        -- veriden hesaplanır: gün başına hasta, ilk/son saat, yoğun günler
  ozet TEXT,                                -- "Bu doktor kimdir" — Haiku damıtması, 5 seansta bir
  ozet_seans INTEGER NOT NULL DEFAULT 0,    -- özetin üretildiği seans sayısı
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doktor_hafiza_doctor ON doktor_hafiza(doctor_id) WHERE aktif = TRUE;

ALTER TABLE doktor_stil_profilleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE doktor_hafiza ENABLE ROW LEVEL SECURITY;
ALTER TABLE doktor_iliski ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doktor_stil_profilleri' AND policyname = 'Doktor kendi stil profilini gorur') THEN
    CREATE POLICY "Doktor kendi stil profilini gorur" ON doktor_stil_profilleri FOR ALL USING (auth.uid() = doctor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doktor_hafiza' AND policyname = 'Doktor kendi hafizasini gorur') THEN
    CREATE POLICY "Doktor kendi hafizasini gorur" ON doktor_hafiza FOR ALL USING (auth.uid() = doctor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doktor_iliski' AND policyname = 'Doktor kendi iliskisini gorur') THEN
    CREATE POLICY "Doktor kendi iliskisini gorur" ON doktor_iliski FOR ALL USING (auth.uid() = doctor_id);
  END IF;
END $$;
