-- ============================================================
-- Migration 113: NOTYA-OGRENME-05 — doktor_soyledi → uygulanir
-- ============================================================
-- Bug: migration 106 added durum DEFAULT 'aday'. hafizaKaydet wrote
-- kesin=true for doktor_soyledi but never set durum, so personal facts
-- (kahve tercihi) stayed "aday" in Ayarlar while hitap that was
-- backfilled at 106 showed "uygulanir". Heal existing rows.
-- ============================================================

UPDATE doktor_hafiza
SET
  durum = 'uygulanir',
  kesin = TRUE,
  aktif = TRUE,
  updated_at = NOW()
WHERE aktif = TRUE
  AND kaynak = 'doktor_soyledi'
  AND durum = 'aday';

UPDATE doktor_hafiza
SET
  durum = 'uygulanir',
  updated_at = NOW()
WHERE aktif = TRUE
  AND kesin = TRUE
  AND durum = 'aday';
