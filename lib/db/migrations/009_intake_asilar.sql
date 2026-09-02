-- ============================================================
-- Migration 009: Hasta Bilgi Formu (intake) + Aşı Takibi (immunizations)
-- ============================================================
-- NOTYA-INTAKE-01 — yeni hasta bilgi formu, branşa özel sorular, ve aşı kayıtları.
--
-- Form teslimi e-postaya değil, MEVCUT davet-token deseninе (bkz. personel.davet_token_hash)
-- dayanıyor: satırın kendisi bir token_hash + expires_at taşıyor, ayrı bir token tablosu yok.
-- SMTP henüz kurulmadığı için (docs/OPEN-COMMITMENTS.md) form linki bugün WhatsApp veya elden
-- paylaşılıyor; e-posta kanalı eklendiğinde tek değişen şey gönderim yöntemi olacak, veri modeli
-- aynı kalır.
--
-- Aşı kayıtları hem pediatrik (SB Ulusal Aşılama Takvimi, çok doz/yaş bağımlı) hem yetişkin
-- (tetanoz-difteri, grip, KOVID — tek doz/yıllık) senaryosunu aynı tabloda tutar; `kategori`
-- ayrımı yalnızca hatırlatma sıklığını ve UI gruplamasını değiştirir, şemayı değil.

CREATE TABLE IF NOT EXISTS hasta_intake_formlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doktor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  randevu_id UUID REFERENCES randevular(id) ON DELETE SET NULL,
  -- lib/asistan/specialistsCatalog.ts içindeki 30 specialtyKey'den biri, ya da 'genel'.
  brans TEXT NOT NULL DEFAULT 'genel',
  durum TEXT NOT NULL DEFAULT 'gonderildi' CHECK (durum IN ('gonderildi', 'dolduruldu', 'incelendi')),
  gonderim_kanali TEXT NOT NULL DEFAULT 'link' CHECK (gonderim_kanali IN ('whatsapp', 'eposta', 'elden')),
  token_hash TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  -- Tüm form yanıtları TEK şifreli JSON blob olarak — patients.notes_encrypted ile aynı desen.
  -- İçerik: { coreAlanlar: {...}, bransAlanlari: {...} } şeklinde, TC Kimlik dahil TÜM alanlar.
  form_data_encrypted TEXT,
  gonderildi_at TIMESTAMPTZ DEFAULT NOW(),
  dolduruldu_at TIMESTAMPTZ,
  incelendi_at TIMESTAMPTZ,
  incelendi_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asilar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doktor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  asi_adi TEXT NOT NULL,
  doz_no INTEGER,
  kategori TEXT NOT NULL DEFAULT 'yetiskin' CHECK (kategori IN ('pediatrik', 'yetiskin')),
  uygulama_tarihi DATE,
  -- Hatırlatma cron'unun taradığı alan — bir sonraki dozun/tekrarın ne zaman düştüğü.
  sonraki_doz_tarihi DATE,
  -- 'beyan' = hasta/veli beyanı (dış kurumda yapılmış), 'kayit' = bu klinikte uygulandı.
  kaynak TEXT NOT NULL DEFAULT 'kayit' CHECK (kaynak IN ('beyan', 'kayit')),
  hatirlatma_gonderildi BOOLEAN DEFAULT FALSE,
  notlar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intake_patient ON hasta_intake_formlari(patient_id);
CREATE INDEX IF NOT EXISTS idx_intake_doktor ON hasta_intake_formlari(doktor_id);
CREATE INDEX IF NOT EXISTS idx_intake_token ON hasta_intake_formlari(token_hash);
CREATE INDEX IF NOT EXISTS idx_asilar_patient ON asilar(patient_id);
CREATE INDEX IF NOT EXISTS idx_asilar_doktor ON asilar(doktor_id);
CREATE INDEX IF NOT EXISTS idx_asilar_sonraki_doz ON asilar(sonraki_doz_tarihi) WHERE sonraki_doz_tarihi IS NOT NULL;

ALTER TABLE hasta_intake_formlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE asilar ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hasta_intake_formlari' AND policyname = 'intake_doktor_all') THEN
    CREATE POLICY intake_doktor_all ON hasta_intake_formlari FOR ALL USING (auth.uid() = doktor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asilar' AND policyname = 'asilar_doktor_all') THEN
    CREATE POLICY asilar_doktor_all ON asilar FOR ALL USING (auth.uid() = doktor_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_asilar_updated_at') THEN
    CREATE TRIGGER update_asilar_updated_at BEFORE UPDATE ON asilar
      FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
  END IF;
END $$;
