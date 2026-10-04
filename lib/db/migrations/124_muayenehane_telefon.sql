-- 124 — NOTYA-ILETISIM-02 (2026-10-04): Muayenehane (ofis) telefonu + görünen varsayılan.
--
-- iletisim_telefon_muayenehane: hekimin ofis / sabit hat numarası (0216… veya cep).
-- iletisim_telefon_varsayilan: hastaya / meslektaşa görünen numara.
--   NULL → ofis telefonu varsayılandır (ofis değişince görünen de onu izler).
--   Dolu → hekim bilinçli olarak farklı bir varsayılan seçmiş.
--
-- WhatsApp muayenehane hattı (iletisim_whatsapp_muayenehane) ayrı kalır.
-- ADDITIVE only. Idempotent. Kolon yoksa ürün soft-fail eder.

alter table public.users add column if not exists iletisim_telefon_muayenehane text;
alter table public.users add column if not exists iletisim_telefon_varsayilan text;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('124', '124_muayenehane_telefon.sql', null, now(), false,
  'NOTYA-ILETISIM-02: ofis telefonu + görünen varsayılan (NULL = ofisi izle)')
on conflict (version) do nothing;
