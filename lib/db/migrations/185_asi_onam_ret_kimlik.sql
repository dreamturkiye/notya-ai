-- NOTYA-ASI-ONAM-03 (2026-11-01) — recording a REFUSAL ("Kabul etmedi") in the clinic or on paper
-- requires the same identity confirmation as an acceptance. Turkey-only regulatory mechanic (Pediatri
-- vaccine consent; not applied to the country projects — no country build ships vaccine consent).
--
-- Source: Resmî Gazete 27.10.2026 sayı 33413, Madde 6 (identity verification) and Madde 11/2 (legal
-- representative of a minor). A refusal is the representative's decision as much as an acceptance;
-- migration 184 only required kimlik_dogrulandi for durum 'alindi'.
--
-- NON-DESTRUCTIVE: no row is updated or deleted; NOT VALID, so rows written before this migration
-- (including earlier refusals with kimlik_dogrulandi NULL/false) are not re-checked. Remote rows carry
-- 'bilgilendirme-*' and are unaffected. App side: lib/asi/onam/asiOnamDurum.ts asiOnamKimlikEksikMi.
ALTER TABLE asi_onam_kayitlari DROP CONSTRAINT IF EXISTS asi_onam_kayitlari_onam_kimlik;
ALTER TABLE asi_onam_kayitlari ADD CONSTRAINT asi_onam_kayitlari_onam_kimlik
  CHECK (durum NOT IN ('alindi', 'reddedildi') OR kimlik_dogrulandi IS TRUE) NOT VALID;

COMMENT ON COLUMN asi_onam_kayitlari.kimlik_dogrulandi IS
  $$NOTYA-ASI-ONAM-02/03 — doctor confirmed in clinic that the consenting veli/yasal temsilci (or ≥18 patient) was present and identified (RG 27.10.2026/33413 Madde 6, 11/2). Required for durum 'alindi' AND 'reddedildi' on new rows (migration 185); NULL on rows before 2026-11-01.$$;
