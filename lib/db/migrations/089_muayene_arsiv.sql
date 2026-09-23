-- 089 — NOTYA-MUAYENE-ARSIV (Kaan, 2026-09-23): doktor bir muayeneyi ar\u015fivleyebilsin.
--
-- Ba\u011flam: bir belge de\u011ferlendirmesi onaylan\u0131rken hedef muayene se\u00e7iminde bir hata, notsuz
-- ("Not bulunamad\u0131") bir "hayalet" muayene kayd\u0131 b\u0131rakm\u0131\u015ft\u0131 (fix/belge-onayla-muayene-hedefi
-- o hatay\u0131 ayr\u0131ca d\u00fczeltiyor). Byle bir kayd\u0131 ya da yanl\u0131\u015fl\u0131kla a\u00e7\u0131lm\u0131\u015f herhangi bir muayeneyi
-- hekimin temizleyebilmesi i\u00e7in -- sert silme de\u011fil, di\u011fer her yerdeki (medical_documents,
-- fisilti_sessizler) ayn\u0131 yumu\u015fak-silme deseni: g\u00f6r\u00fcn\u00fcr kal\u0131r (kim, ne zaman ar\u015fivledi),
-- yaln\u0131z varsay\u0131lan listelerden \u00e7\u0131kar.
--
-- YALNIZ EKLEME. \u0130dempotent.

alter table sessions add column if not exists archived_at timestamptz;
create index if not exists sessions_arsivsiz_idx on sessions (doctor_id, patient_id, created_at desc) where archived_at is null;

-- DO\u011eRULAMA (salt-okunur):
--   select column_name from information_schema.columns where table_name = 'sessions' and column_name = 'archived_at';
