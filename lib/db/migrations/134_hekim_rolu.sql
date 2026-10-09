-- 134 NOTYA-UZ-BRANSLAR-01 (Kaan, 2026-10-08) · reshaped for the shared database by NOTYA-ULKE-SABLON-01
-- 1. The ROLE of an account inside a country's signed-in application: which doctor specialty, clinic doctor role
--    or clinic allied profession it works as (docs/COUNTRY-PACK-CHECKLIST.md J2, J5). Chosen at first login, after
--    the language question; changeable in settings. The value is one of the account's OWN country pack's role keys —
--    an internal identifier, never shown; the application validates it against the pack on every write and read.
-- 2. The role-specific FIELDS of a visit note (a cardiology note has other fields than an audiology note), for the
--    note and for its second-language draft, beside the language record of migration 133.
--
-- Country tables only. (1) is a NEW table, carrying the country like every other (rules: migration 130). (2) adds
-- two nullable columns to `not_dil_kaydi`, a country table that migration 133 created. No table Türkiye uses is
-- read, written or altered.
--
-- Server routes use the service role and always scope by country and doctor_id (= the authenticated account).
-- Row-level security is the second line: a signed-in account may read its own role row of its session's country and
-- nothing else, and cannot write from the browser.
--
-- Safe to run twice. One transaction. NOT APPLIED to any database by the job that wrote it. Apply after 133.

begin;
set local lock_timeout = '4s';

create table if not exists public.hekim_rolu (
  doctor_id uuid primary key,
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  -- A role key of the country pack: lower-case words joined by hyphens. Which keys exist is the pack's business.
  rol text not null check (rol ~ '^[a-z]+(-[a-z]+)*$' and char_length(rol) <= 60),
  secildi_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hekim_rolu_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);

alter table public.hekim_rolu enable row level security;

drop policy if exists "hekim kendi rolu" on public.hekim_rolu;
create policy "hekim kendi rolu" on public.hekim_rolu
  for select to authenticated using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

revoke all on table public.hekim_rolu from anon, authenticated;
grant select on table public.hekim_rolu to authenticated;

-- Role-specific fields of the note: { "<field key>": "<text>" }. null = the note has none (the general template,
-- or a note written before this migration). Keys are the pack's; the application drops any key the note's
-- template does not own before it stores or shows them.
alter table public.not_dil_kaydi
  add column if not exists alanlar jsonb check (alanlar is null or jsonb_typeof(alanlar) = 'object'),
  add column if not exists ikinci_alanlar jsonb check (ikinci_alanlar is null or jsonb_typeof(ikinci_alanlar) = 'object');

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('134', '134_hekim_rolu.sql', null, now(), false,
  'NOTYA-ULKE-SABLON-01: per-account role (new table, country in the key, owner-and-country-only) + role-specific note fields on not_dil_kaydi (country table)')
on conflict (version) do nothing;

commit;
