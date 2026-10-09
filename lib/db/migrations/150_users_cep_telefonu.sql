-- 150 — NOTYA-ONBOARDING-01 (Kaan, 2026-10-09): doktorun KENDİ cep telefonu.
--
-- Onboarding artık her yeni doktora cep telefonunu soruyor (app/onboarding/page.tsx, 3. adım). Bu kolon
-- hekimin kendi numarasıdır; hastaya görünen muayenehane iletişim alanları (iletisim_*) DEĞİLDİR ve onlarla
-- karıştırılmaz. Kayıt biçimi tektir: +905XXXXXXXXX (lib/onboarding/cepTelefonu.ts aynı deseni uygular).
--
-- ADDITIVE only. Idempotent (iki kez çalıştırılabilir). DROP yok. Kolon NULL kabul eder, varsayılanı yok:
-- tablo yeniden yazılmaz. CHECK önce NOT VALID eklenir, sonra VALIDATE edilir (yazmayı kilitlemez; mevcut her
-- satırda değer NULL).
-- Kolon yoksa ürün soft-fail eder: POST /api/users/profile diğer yanıtları kaydeder, telefonu "kaydedilmedi"
-- diye bildirir ve günlüğe yazar. Yine de DEPLOY'DAN ÖNCE uygulanmalıdır — aksi halde o arada onboarding'i
-- bitiren doktorun numarası kaydedilmez.
--
-- Numara: 128–149 aralığı başka bir iş kolu için ayrıldığından 150.

alter table public.users add column if not exists cep_telefonu text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_cep_telefonu_bicim' and conrelid = 'public.users'::regclass) then
    alter table public.users add constraint users_cep_telefonu_bicim
      check (cep_telefonu is null or cep_telefonu ~ '^\+905[0-9]{9}$') not valid;
  end if;
end $$;

alter table public.users validate constraint users_cep_telefonu_bicim;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('150', '150_users_cep_telefonu.sql', null, now(), false,
  'NOTYA-ONBOARDING-01: users.cep_telefonu (doktorun kendi cep telefonu, +905XXXXXXXXX) + biçim CHECK')
on conflict (version) do nothing;
