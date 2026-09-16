-- NOTYA-ERECETE-01 (2026-09-16): doktorun e-reçete kimlik ayarları — bir kez girilir, Notya'dan gönderilir.
-- JSONB: tesisKodu, bransKodu, doktorTcSifreli, sifreSifreli (encryptPII), ortam, imzaYontemi, sonTest.
-- Hekim şifresi ve TC yalnız şifreli saklanır; e-imza PIN'i ASLA saklanmaz (işlem bazlı, yasal zorunluluk).
alter table users add column if not exists erecete_ayar jsonb;
