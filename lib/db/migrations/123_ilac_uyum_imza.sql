-- 123 — NOTYA-RECETE-07 (2026-10-04): Plan↔İlaç uyum onayı kalıcı imza.
--
-- Hekim bir kez "Plan'a göre güncelle" veya "Mevcut listeyle onayla" dediğinde
-- (plan + ilaçlar) imzası notes.ilac_uyum_imza'ya yazılır. Aynı çift yeniden
-- muayene notu revizyonunda açıldığında uyum kartı tekrar sorulmaz.
-- Plan veya ilaç listesi değişince imza eşleşmez → kart yeniden açılır.
--
-- ADDITIVE only. Idempotent.

alter table notes add column if not exists ilac_uyum_imza text;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('123', '123_ilac_uyum_imza.sql', null, now(), false,
  'NOTYA-RECETE-07: notes.ilac_uyum_imza — Plan↔İlaç bir kez onaylandıysa tekrar sorma')
on conflict (version) do nothing;
