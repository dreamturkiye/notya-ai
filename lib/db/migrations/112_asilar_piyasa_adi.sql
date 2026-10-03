-- 112 — NOTYA-ASI-TABLO-01 (Dr. Gökhan; Kaan 2026-10-03): Aşılar sekmesi tablo sütunları.
--
-- Hekim listede yan yana görüp düzeltecek: aşı adı, piyasa adı, uygulama tarihi, uygulama anındaki
-- yaş (ay), doz, uygulama yeri, lot. lot_no / uygulama_yeri zaten 093'te; bu migration yalnız
-- piyasa_adi + uygulama_yas_ay ekler (nullable). Yaş ayı hekim düzeltebilir; boşsa UI doğum +
-- uygulama tarihinden hesaplar (lib/asi/karneBelgesi → uygulamaYasAy).
--
-- YALNIZ EKLEME — mevcut satırlara dokunulmaz. İdempotent.

alter table asilar add column if not exists piyasa_adi text;
alter table asilar add column if not exists uygulama_yas_ay integer;

comment on column asilar.piyasa_adi is 'Aşının piyasa / ticari adı (ör. Priorix, Varilrix); hekim girer.';
comment on column asilar.uygulama_yas_ay is 'Uygulama anında hastanın tamamlanmış ay yaşı; hekim düzeltmesi. Boşsa doğum+tarihten hesaplanır.';

notify pgrst, 'reload schema';

-- DOĞRULAMA (salt-okunur):
--   select column_name from information_schema.columns
--    where table_name = 'asilar' and column_name in ('piyasa_adi', 'uygulama_yas_ay');
