-- ============================================================
-- Migration 015: Nottan gelen reçeteler — doktor onay kuyruğu
-- ============================================================
-- QA 2026-09-08: muayene notlarında reçeteler YAPILANDIRILMIŞ olarak duruyor
-- (notes.content_ilaclar = [{ad,doz,kullanim,sure}], notes.recete_onerisi =
-- [{etkenMadde,ticariOrnek,doz,kullanim,sure,sgkListesinde,not}]) ama hasta
-- portalındaki "İlaçlarım" bölümü yalnızca hasta_ilaclar tablosunu okuyor.
-- Tablo boş olduğu için doktor ilacı reçete etmiş olsa bile hasta/veli
-- "İlaç kaydı yok" görüyordu.
--
-- Dr. Gökhan Mamur'un kararı (Seçenek C): nottaki reçeteler doktorun ilaç
-- listesine AKTARILIR, ancak hangisinin aktif/sonlandırıldığı kararını doktor
-- panelden verir. Portal yalnızca doktorun onayladığı satırları gösterir.
--
-- Bu yüzden `aktif` boolean'ı yetmiyor: üçüncü bir durum gerekiyor —
-- "aktarıldı, henüz doktor karar vermedi". Klinik güvenlik gereği bu satırlar
-- hastaya HİÇ gösterilmez: 10 günlük bir antibiyotik kürünü aylar sonra
-- "Aktif" diye göstermek zararlı olur.

ALTER TABLE hasta_ilaclar
  ADD COLUMN IF NOT EXISTS onay_durumu TEXT NOT NULL DEFAULT 'onayli'
    CHECK (onay_durumu IN ('beklemede', 'onayli'));

-- Provenance: hangi nottan geldi. Elle eklenen ilaçlarda NULL kalır.
ALTER TABLE hasta_ilaclar
  ADD COLUMN IF NOT EXISTS kaynak_note_id UUID REFERENCES notes(id) ON DELETE SET NULL;

-- Mevcut satırların hepsi elle girilmiş; DEFAULT 'onayli' sayesinde davranış
-- değişmiyor — portal onları göstermeye devam eder.

-- Portalın sıcak sorgusu: hasta + onay durumu.
CREATE INDEX IF NOT EXISTS idx_hasta_ilaclar_patient_onay
  ON hasta_ilaclar (patient_id, onay_durumu);

-- Doktorun onay kuyruğu.
CREATE INDEX IF NOT EXISTS idx_hasta_ilaclar_bekleyen
  ON hasta_ilaclar (doctor_id, onay_durumu)
  WHERE onay_durumu = 'beklemede';

-- Aynı notun aynı ilacı iki kez aktarılmasın (yeniden onaylama / backfill).
CREATE UNIQUE INDEX IF NOT EXISTS idx_hasta_ilaclar_kaynak_tekil
  ON hasta_ilaclar (kaynak_note_id, ilac_adi)
  WHERE kaynak_note_id IS NOT NULL;
