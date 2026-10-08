-- 130 NOTYA-UZ-MUAYENE-01 (Kaan, 2026-10-08)
-- Language choices of an account inside the signed-in application (docs/COUNTRY-PACK-CHECKLIST.md E6, J5):
-- the default language of visit notes, and whether the first-login language question has been answered.
-- The interface language itself stays where migration 128 put it (users.ui_language).
--
-- A NEW table on purpose: no existing table, column, row, policy or index is changed. Türkiye does not use it;
-- there it stays empty. One row per account; removed with the account.
--
-- Server routes use the service role and always scope by doctor_id (= the authenticated account). Row-level
-- security is the second line: a signed-in account may read its own row and nothing else, and cannot write
-- from the browser.
--
-- NOT APPLIED by the job that wrote it. Apply to a country's database before the feature `cekirdekMuayene`
-- is used there. Without it the application asks the language question again and cannot save the answer.

create table if not exists public.hekim_dil_tercihleri (
  doctor_id uuid primary key references auth.users(id) on delete cascade,
  -- BCP-47, same format as users.ui_language. Must be a language of the country pack's application.
  not_dili text not null check (not_dili ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  -- When the first-login question was answered. null = not asked yet.
  soruldu_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hekim_dil_tercihleri enable row level security;

drop policy if exists "hekim kendi dil tercihi" on public.hekim_dil_tercihleri;
create policy "hekim kendi dil tercihi" on public.hekim_dil_tercihleri
  for select to authenticated using (doctor_id = auth.uid());

revoke all on table public.hekim_dil_tercihleri from anon, authenticated;
grant select on table public.hekim_dil_tercihleri to authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('130', '130_hekim_dil_tercihleri.sql', null, now(), false,
  'NOTYA-UZ-MUAYENE-01: per-account note language + first-login language question (new table, owner-only)')
on conflict (version) do nothing;
