-- 141 NOTYA-ULKE-MESAJ-01 (Kaan, 2026-10-09) — "MY TEMPLATES" of a country build: a doctor's own reusable text
-- blocks, for notes and for messages.
--
-- ONE DATABASE PER COUNTRY. This file is run only on a country's OWN database, never on the Turkish one. A new
-- country's database gets it through the baseline (lib/db/ulke/000_yeni_ulke_veritabani.sql); a country database
-- that already exists gets this file, once, after 140. docs/COUNTRY-PACK-DB-ROLLOUT.md.
--
--   1. ulke_hekim_sablonlari      ONE ROW PER TEMPLATE of one doctor. NO PATIENT IN THE ROW: there is no column for
--                                 one, and a template is never bound to a patient. Its title and its text are the
--                                 doctor's own words, kept as ONE ENCRYPTED VALUE (AES-256-GCM, same helper as a
--                                 patient's data: a doctor may type anything into their own text). `kapsam` says
--                                 where the template is offered: in a note, in a message, or in both.
--                                 DELETING IS SOFT: `silindi_at` is set, the row stays.
--   2. ulke_hekim_sablonu_kilidi  a trigger that holds, in the database, what no path of the application may break:
--                                 a template never moves to another country or doctor; a deleted template is not
--                                 brought back and does not change.
--
-- It is deliberately its OWN table (migration 139 holds unchangeable results bound to a patient; a template is an
-- editable text of a doctor with no patient).
--
-- SERVER ONLY: row-level security on, NO rule, no privilege for the browser roles. A doctor's browser session never
-- reads the table directly; the server's routes do, binding every statement to country and doctor.
--
-- It alters no existing table. Safe to run twice. One transaction. No "drop … if exists".
-- NOT APPLIED to any database by the job that wrote it.

begin;
set local lock_timeout = '4s';

-- A country migration runs on a country database only. Run anywhere else by mistake, it stops here and changes nothing.
do $$
begin
  if to_regclass('public.ulke_hesaplari') is null then
    raise exception 'country migration 141 refused: this database has no country tables (public.ulke_hesaplari is missing). It is not a country database.';
  end if;
end $$;

-- ── 1. Templates ─────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_hekim_sablonlari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  -- Where the template is offered: 'not' a section of a visit note, 'mesaj' a message to a patient, 'hepsi' both.
  kapsam text not null check (kapsam in ('not', 'mesaj', 'hepsi')),
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted (lib/security/encryption.ts): the title and the text, as one value.
  icerik_encrypted text not null check (char_length(icerik_encrypted) > 0),
  -- The doctor deleted it. Empty = in use.
  silindi_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ulke_hekim_sablonlari_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);

create index if not exists ulke_hekim_sablonlari_doctor_idx on public.ulke_hekim_sablonlari (ulke, doctor_id, updated_at desc) where silindi_at is null;

create or replace function public.ulke_hekim_sablonu_kilidi() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ulke is distinct from old.ulke or new.doctor_id is distinct from old.doctor_id or new.created_at is distinct from old.created_at then
    raise exception 'ulke_hekim_sablonlari: a template never moves to another country or doctor' using errcode = '23514';
  end if;
  if old.silindi_at is not null then
    raise exception 'ulke_hekim_sablonlari: a deleted template does not change and is not brought back' using errcode = '23514';
  end if;
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ulke_hekim_sablonu_kilidi' and tgrelid = 'public.ulke_hekim_sablonlari'::regclass) then
    create trigger ulke_hekim_sablonu_kilidi
      before update on public.ulke_hekim_sablonlari
      for each row execute function public.ulke_hekim_sablonu_kilidi();
  end if;
end $$;

alter table public.ulke_hekim_sablonlari enable row level security;
revoke all on table public.ulke_hekim_sablonlari from anon, authenticated;
revoke all on function public.ulke_hekim_sablonu_kilidi() from public, anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('141', '141_ulke_hekim_sablonlari.sql', null, now(), false,
  'NOTYA-ULKE-MESAJ-01: "my templates" of a country build: one row per reusable text block of a doctor (where it is offered, title and text as one encrypted value, soft delete), no patient in the row; a trigger that keeps a template with its doctor and a deleted one deleted. Server only.')
on conflict (version) do nothing;

commit;
