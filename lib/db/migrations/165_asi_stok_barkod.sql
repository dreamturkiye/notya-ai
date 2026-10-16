-- 165 — NOTYA-ASI-STOK-BARKOD-01 (2026-10-16): Aşı Stok Yönetimi ve Barkod Sistemi, Faz 1 (Türkiye).
--
-- Entegrasyonlar altında isteğe bağlı modül. Varsayılan AÇIK: Pediatri, Aile Hekimliği, Enfeksiyon
-- Hastalıkları, Kadın Hastalıkları ve Doğum (Jinekoloji), Dahiliye/İç Hastalıkları — her hekim için
-- elle açılabilir/kapatılabilir (lib/asi/stok/modul.ts). Diğer tüm branşlarda varsayılan KAPALI,
-- hekim isterse açar. .cursor/skills/specialty-doktor-araclari/SKILL.md'deki ikili (base/branş-only)
-- kalıba uymuyor — bu yüzden ayrı bir modül tablosu (asi_stok_modul_ayarlari), klasik
-- ORTAK_DOKTOR_ARACLARI / BRANS_DOKTOR_ARACLARI listesine eklenmedi (bkz. final rapor).
--
-- Üç tablo:
--  * asi_stok_lotlari    — klinik stok: aşı adı, barkod/lot no, miktar, SKT, opsiyonel birim fiyat.
--  * asi_stok_hareketleri — her stok değişiminin denetim izi (ekleme/uygulama/duzeltme), geri alınamaz.
--  * asi_stok_modul_ayarlari — hekim bazlı override (NULL = branş varsayılanını kullan) + fatura varsayılanı.
--
-- `asilar` tablosuna (009_intake_asilar.sql) YALNIZ EKLEME: lot bağlantısı + anlık barkod/lot-no
-- (geri çağırma izlenebilirliği için dondurulmuş kopya — lot sonradan silinse/değişse bile kanıt
-- kalır) + session_id. kaynak_note_id (091) KASTEN KULLANILMADI: o kolon yalnız SOAP not onayı
-- senkronuna aittir ve not yeniden onaylandığında o kolonu taşıyan satırlar güncellenir/silinir
-- (091'in yorumu) — barkodla/stoktan uygulanan bir satırın o senkronla sessizce silinmesini
-- istemiyoruz, tıpkı karne/elle/sesli eklenen satırların NULL bırakılması gibi.
--
-- Atomiklik: asi_stok_dekrement() tek bir UPDATE...RETURNING — Postgres bu ifadenin süresince
-- satırı kilitler (160_protokol_numarasi.sql'deki protokol_no_ata() ile aynı kanıtlanmış teknik).
-- İki sekreterin aynı lotu aynı anda taratması: miktar > 0 koşulu sıfırın altına düşmeyi engeller;
-- ikinci çağrı 0 satır döner (stok tükendi), hiçbir zaman -1'e düşmez ve çift düşüş olmaz.
--
-- YALNIZ EKLEME, idempotent.

CREATE TABLE IF NOT EXISTS asi_stok_lotlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doktor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asi_adi TEXT NOT NULL,
  barkod TEXT NOT NULL,
  lot_no TEXT,
  miktar INTEGER NOT NULL DEFAULT 0 CHECK (miktar >= 0),
  son_kullanma_tarihi DATE,
  birim_fiyat_kurus INTEGER CHECK (birim_fiyat_kurus IS NULL OR birim_fiyat_kurus >= 0),
  varsayilan_uygulama_bolgesi TEXT,
  notlar TEXT,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_asi_stok_lot_barkod ON asi_stok_lotlari (doktor_id, barkod);
CREATE INDEX IF NOT EXISTS idx_asi_stok_lot_doktor_asi ON asi_stok_lotlari (doktor_id, asi_adi);
CREATE INDEX IF NOT EXISTS idx_asi_stok_lot_skt ON asi_stok_lotlari (doktor_id, son_kullanma_tarihi);
ALTER TABLE asi_stok_lotlari ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  CREATE POLICY "asi_stok_lotlari_kendi_satiri" ON asi_stok_lotlari FOR ALL
    USING (doktor_id = auth.uid()) WITH CHECK (doktor_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS asi_stok_hareketleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID REFERENCES asi_stok_lotlari(id) ON DELETE CASCADE NOT NULL,
  doktor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tur TEXT NOT NULL CHECK (tur IN ('ekleme', 'uygulama', 'duzeltme')),
  miktar_degisim INTEGER NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  asilar_id UUID,
  notlar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_asi_stok_hareket_lot ON asi_stok_hareketleri (lot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asi_stok_hareket_doktor ON asi_stok_hareketleri (doktor_id, created_at DESC);
ALTER TABLE asi_stok_hareketleri ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  CREATE POLICY "asi_stok_hareketleri_kendi_satiri" ON asi_stok_hareketleri FOR ALL
    USING (doktor_id = auth.uid()) WITH CHECK (doktor_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- NULL aktif_override = branş varsayılanını kullan (lib/asi/stok/modul.ts ASI_STOK_VARSAYILAN_ACIK_BRANSLAR).
CREATE TABLE IF NOT EXISTS asi_stok_modul_ayarlari (
  doktor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  aktif_override BOOLEAN,
  fatura_varsayilan BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE asi_stok_modul_ayarlari ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  CREATE POLICY "asi_stok_modul_ayarlari_kendi_satiri" ON asi_stok_modul_ayarlari FOR ALL
    USING (doktor_id = auth.uid()) WITH CHECK (doktor_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE asilar ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES asi_stok_lotlari(id) ON DELETE SET NULL;
ALTER TABLE asilar ADD COLUMN IF NOT EXISTS lot_barkod_anlik TEXT;
ALTER TABLE asilar ADD COLUMN IF NOT EXISTS lot_no_anlik TEXT;
ALTER TABLE asilar ADD COLUMN IF NOT EXISTS uygulama_bolgesi TEXT;
ALTER TABLE asilar ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_asilar_lot ON asilar (lot_id) WHERE lot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asilar_session ON asilar (session_id) WHERE session_id IS NOT NULL;

CREATE OR REPLACE FUNCTION asi_stok_dekrement(p_lot_id UUID, p_doktor_id UUID)
RETURNS SETOF asi_stok_lotlari AS $$
  UPDATE asi_stok_lotlari
     SET miktar = miktar - 1, updated_at = now()
   WHERE id = p_lot_id AND doktor_id = p_doktor_id AND miktar > 0
  RETURNING *;
$$ LANGUAGE sql VOLATILE;

NOTIFY pgrst, 'reload schema';

-- DOĞRULAMA (salt-okunur):
--   select table_name, column_name from information_schema.columns
--    where table_name in ('asi_stok_lotlari','asi_stok_hareketleri','asi_stok_modul_ayarlari')
--       or (table_name = 'asilar' and column_name in ('lot_id','lot_barkod_anlik','lot_no_anlik','uygulama_bolgesi','session_id'));
