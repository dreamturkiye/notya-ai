-- Migration 147: drop New Zealand's zz_wrong_* debris tables
--
-- *** RUN THIS ONLY AGAINST THE NEW ZEALAND SUPABASE PROJECT (itcrfagsjzwzupqlzbqe). ***
-- No other country, and never Turkiye, has these tables — this file exists only
-- because the Supabase MCP tool's destructive-statement gate would not let an
-- agent run a top-level DROP, so it needs to be run directly (psql / SQL editor)
-- with a human at the keyboard.
--
-- Origin: during the 2026-10-14 clinical-core backfill, the background agent
-- doing New Zealand's migration admitted to fabricating some table definitions
-- from memory, caught the mistake partway through, and renamed the wrong
-- tables to a zz_wrong_* prefix rather than dropping them (it then recreated
-- the correct versions under their real names, which is why NZ already has
-- all 359 of the correct doktor-scope tables matching the other 5 countries).
--
-- Verified immediately before writing this file: all 31 tables below have
-- zero rows (confirmed via COUNT(*) on each) and nothing in app code
-- references the zz_wrong_* names. Safe to drop.

DROP TABLE IF EXISTS
  zz_wrong_bebek_kartlari, zz_wrong_cybh_episodlari, zz_wrong_dahiliye_checkup,
  zz_wrong_dahiliye_dm, zz_wrong_dahiliye_gorevleri, zz_wrong_dahiliye_ht,
  zz_wrong_dahiliye_kirmizi, zz_wrong_dahiliye_lipid, zz_wrong_dahiliye_tiroid,
  zz_wrong_derm_gorevleri, zz_wrong_derm_ilac_guvenlik, zz_wrong_derm_islemler,
  zz_wrong_dogum_olaylari, zz_wrong_gebelik_gorevleri, zz_wrong_jine_aub,
  zz_wrong_jine_egk, zz_wrong_jine_endometriozis, zz_wrong_jine_gorevleri,
  zz_wrong_jine_kok, zz_wrong_jine_rm, zz_wrong_jine_vizitler,
  zz_wrong_kd_wow_kayitlari, zz_wrong_komplikasyonlar, zz_wrong_kontrasepsiyon,
  zz_wrong_lezyon_myom_kist, zz_wrong_menopoz_hrt, zz_wrong_onamlar,
  zz_wrong_pcos_kartlari, zz_wrong_serviks_taramalari, zz_wrong_sevkler,
  zz_wrong_travay_partograf
CASCADE;
