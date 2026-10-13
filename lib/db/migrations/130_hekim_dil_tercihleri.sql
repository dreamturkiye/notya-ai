-- ONE DATABASE PER COUNTRY (Kaan, 2026-10-09) — READ FIRST. This file is run only on a country's OWN database, never on
-- the Turkish one. A new country's database is created with the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql),
-- which is generated from this file and its neighbours (lib/db/ulke/gocler.json); this file is not run by hand any
-- more. Where the comments below speak of a "shared database" or of Türkiye's tables, they describe the plan of
-- 2026-10-08, which this decision replaced. What holds now: docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
-- 130 NOTYA-UZ-MUAYENE-01 (Kaan, 2026-10-08) · reshaped for the shared database by NOTYA-ULKE-SABLON-01
--
-- 1. ulke_hesaplari        THE ACCOUNT OF A COUNTRY BUILD: which country it belongs to, its name, its interface
--                          language, its own time zone. One row per account. This is where "an account belongs to
--                          one country" is recorded, and every other country table hangs from it.
-- 2. hekim_dil_tercihleri  the default language of visit notes, and whether the first-login question was answered
--                          (docs/COUNTRY-PACK-CHECKLIST.md E6, J5).
--
-- SHARED DATABASE (Kaan, 2026-10-08 19:09: "use the same database as what we are using for notya turkiye").
-- Every country lives in the same database as Türkiye. The rules of every migration from here on:
--   * A country build writes ONLY to country tables (this file and 129, 131–135). It never writes a row into a
--     table Türkiye uses — not `users`, not `patients`, `sessions`, `notes`. Türkiye's screens, scheduled jobs and
--     reports therefore never meet a foreign row, and no table of Türkiye's is altered.
--   * EVERY country table carries `ulke` (ISO 3166-1 alpha-2, lower case), with no default: a write that forgets
--     the country fails.
--   * The country is part of every FOREIGN KEY. A patient belongs to (country, doctor); a visit to (country, doctor,
--     patient); a note to (country, doctor, visit). The database itself refuses a row of one country that points at
--     a row of another, or at another doctor's row — with a valid id as well.
--   * ROW-LEVEL SECURITY (second line; server routes use the service role and filter by country and doctor in every
--     statement): a signed-in account reads only rows that carry its own id AND the country stamped on its session
--     (auth `app_metadata.country`, which the account cannot write). It cannot write from the browser.
--
-- The only objects of Türkiye this file touches: a FOREIGN KEY from the new, empty `ulke_hesaplari` to `auth.users`
-- (a short lock on auth.users while it is created — see docs/COUNTRY-PACK-DB-ROLLOUT.md), and one row in the
-- migration ledger `schema_migrations`.
--
-- Safe to run twice. One transaction: applied completely or not at all. `lock_timeout` makes it give up instead of
-- queueing behind a long query. NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- The country stamped on the caller's session. '' for a session without one (every account of Türkiye today).
-- Used by the row-level rules of the country tables and by the storage rule of migration 132.
create or replace function public.ulke_oturum_ulkesi() returns text
language sql stable set search_path = public as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'country', '')
$$;

-- ── 1. The account of a country build ───────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_hesaplari (
  id uuid primary key references auth.users(id) on delete cascade,
  -- The country this account belongs to. Written once, by the server, when the account is created.
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  full_name text not null default '',
  -- BCP-47 interface language. Must be a language of the country pack's application.
  ui_language text not null check (ui_language ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  -- IANA time zone the account works in. null = the country pack's default. One of the pack's own list.
  saat_dilimi text check (saat_dilimi is null or (char_length(saat_dilimi) <= 64 and saat_dilimi ~ '^[A-Za-z0-9_+-]+(/[A-Za-z0-9_+-]+)*$')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- What the other country tables point at: an account TOGETHER WITH its country.
  constraint ulke_hesaplari_ulke_id_tekil unique (ulke, id)
);

-- An account never changes country — not by the account, not by the server.
create or replace function public.ulke_hesaplari_ulke_kilidi() returns trigger
language plpgsql as $$
begin
  if new.ulke is distinct from old.ulke then
    raise exception 'ulke_hesaplari.ulke is set when the account is created and never changes' using errcode = '23514';
  end if;
  return new;
end $$;

drop trigger if exists ulke_hesaplari_ulke_kilidi on public.ulke_hesaplari;
create trigger ulke_hesaplari_ulke_kilidi
  before update of ulke on public.ulke_hesaplari
  for each row execute function public.ulke_hesaplari_ulke_kilidi();

alter table public.ulke_hesaplari enable row level security;

drop policy if exists "ulke hesabi kendi satiri" on public.ulke_hesaplari;
create policy "ulke hesabi kendi satiri" on public.ulke_hesaplari
  for select to authenticated using (id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

revoke all on table public.ulke_hesaplari from anon, authenticated;
grant select on table public.ulke_hesaplari to authenticated;

-- ── 2. Language choices ─────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.hekim_dil_tercihleri (
  doctor_id uuid primary key,
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  -- BCP-47, same format as ulke_hesaplari.ui_language. Must be a language of the country pack's application.
  not_dili text not null check (not_dili ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  -- When the first-login question was answered. null = not asked yet.
  soruldu_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hekim_dil_tercihleri_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);

alter table public.hekim_dil_tercihleri enable row level security;

drop policy if exists "hekim kendi dil tercihi" on public.hekim_dil_tercihleri;
create policy "hekim kendi dil tercihi" on public.hekim_dil_tercihleri
  for select to authenticated using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

revoke all on table public.hekim_dil_tercihleri from anon, authenticated;
grant select on table public.hekim_dil_tercihleri to authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('130', '130_hekim_dil_tercihleri.sql', null, now(), false,
  'NOTYA-ULKE-SABLON-01: country accounts (ulke_hesaplari: one country per account, never changes) + per-account note language (new tables, country in every key, owner-and-country-only)')
on conflict (version) do nothing;

commit;
