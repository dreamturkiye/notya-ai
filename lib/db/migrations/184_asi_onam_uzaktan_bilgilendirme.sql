-- NOTYA-ASI-ONAM-02 (2026-11-01) — remote vaccine "consent" becomes a pre-visit information
-- acknowledgement. Turkey-only regulatory mechanic (not applied to the country projects).
--
-- Source: Sağlık Bakanlığı, "Bilgilendirilmiş Rızanın Elektronik Ortamda Alınması Hakkında
-- Yönetmelik", Resmî Gazete 27.10.2026 sayı 33413 (read 2026-11-01). Electronic consent counts only
-- via e-Nabız or the facility's SBYS-linked channel, after identity verification (Madde 6), with a
-- verified mobile number (Madde 7) and an SMS OTP (Madde 8/6-8); for a minor the same applies to the
-- legal representative (Madde 11/2-3). Notya's Sağlığım / e-posta / WhatsApp flow does none of that.
--
-- NON-DESTRUCTIVE: asi_onam_kayitlari stays append-only (migration 161 triggers untouched). No row
-- is updated or deleted. Existing remote rows keep their stored durum; their meaning is derived:
--   * the app maps them in lib/asi/onam/asiOnamDurum.ts (asiOnamGorunenDurumu);
--   * the view asi_onam_kayitlari_gorunum adds the same derived column for SQL readers.
-- New rows are constrained so a remote yöntem can never again be stored as 'alindi'.

-- 1. Two new durum values for remote acknowledgements.
ALTER TABLE asi_onam_kayitlari DROP CONSTRAINT IF EXISTS asi_onam_kayitlari_durum_check;
ALTER TABLE asi_onam_kayitlari ADD CONSTRAINT asi_onam_kayitlari_durum_check
  CHECK (durum IN ('alindi', 'reddedildi', 'bilgilendirme-okundu', 'bilgilendirme-cekince'));

-- 2. yöntem ↔ durum pairing for every NEW row. NOT VALID: existing rows are not re-checked
--    (they are immutable and keep their original data); Postgres enforces it on INSERT.
ALTER TABLE asi_onam_kayitlari DROP CONSTRAINT IF EXISTS asi_onam_kayitlari_uzaktan_onam_degil;
ALTER TABLE asi_onam_kayitlari ADD CONSTRAINT asi_onam_kayitlari_uzaktan_onam_degil
  CHECK (
    (yontem LIKE 'uzaktan-%' AND durum IN ('bilgilendirme-okundu', 'bilgilendirme-cekince'))
    OR (yontem IN ('klinik', 'kagit') AND durum IN ('alindi', 'reddedildi'))
  ) NOT VALID;

-- 3. The doctor's in-clinic confirmation that the consenting person was present and identified.
--    NULL on rows written before this migration (unknown, not false).
ALTER TABLE asi_onam_kayitlari ADD COLUMN IF NOT EXISTS kimlik_dogrulandi BOOLEAN;
ALTER TABLE asi_onam_kayitlari DROP CONSTRAINT IF EXISTS asi_onam_kayitlari_onam_kimlik;
ALTER TABLE asi_onam_kayitlari ADD CONSTRAINT asi_onam_kayitlari_onam_kimlik
  CHECK (durum <> 'alindi' OR kimlik_dogrulandi IS TRUE) NOT VALID;

-- 4. Derived meaning for SQL readers (RLS of the base table applies: security_invoker).
CREATE OR REPLACE VIEW asi_onam_kayitlari_gorunum WITH (security_invoker = true) AS
SELECT
  k.*,
  CASE
    WHEN k.yontem LIKE 'uzaktan-%' OR k.durum IN ('bilgilendirme-okundu', 'bilgilendirme-cekince') THEN
      CASE WHEN k.durum IN ('alindi', 'bilgilendirme-okundu') THEN 'bilgilendirme-okundu' ELSE 'bilgilendirme-cekince' END
    WHEN k.durum = 'alindi' THEN 'onaylandi'
    ELSE 'reddedildi'
  END AS gecerli_durum
FROM asi_onam_kayitlari k;

REVOKE ALL ON asi_onam_kayitlari_gorunum FROM anon;

COMMENT ON VIEW asi_onam_kayitlari_gorunum IS
  $$NOTYA-ASI-ONAM-02 — asi_onam_kayitlari with gecerli_durum: 'onaylandi' only for an in-clinic/paper consent; any remote row (incl. legacy remote 'alindi') is 'bilgilendirme-okundu' / 'bilgilendirme-cekince'. Mirrors lib/asi/onam/asiOnamDurum.ts.$$;
COMMENT ON COLUMN asi_onam_kayitlari.kimlik_dogrulandi IS
  $$NOTYA-ASI-ONAM-02 — doctor confirmed in clinic that the consenting veli/yasal temsilci (or ≥18 patient) was present and identified (RG 27.10.2026/33413 Madde 6, 11/2). Required for durum 'alindi' on new rows; NULL on rows before 2026-11-01.$$;
