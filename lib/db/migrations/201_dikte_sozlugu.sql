-- 201 — DIKTE-TIBBI-01 (KBB feedback, 2026-11-21): the doctor's personal dictation vocabulary.
--   doktor_dikte_sozlugu  one row per (doctor, heard phrase): what the recogniser heard → the term the doctor meant.
--                         Written when the doctor corrects a misrecognised term (note approval, transcript before
--                         "Seansı Bitir") or types it in Ayşe'nin hafızası; read before each dictation is repaired
--                         (lib/dikte) and sent to Scribe as keyterms. TERMS ONLY: no digits, ≤ 60 characters a side
--                         (the application also refuses protected words and caps 500 rows per doctor).
--   Never shared across doctors: every application query is scoped by doctor_id (service role); RLS lets an
--   authenticated client read only its own rows; anon gets nothing.
-- Number 201: 200 is taken on the release branches (200_ulke_prematur.sql).

create table if not exists public.doktor_dikte_sozlugu (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  duyulan text not null check (char_length(duyulan) between 2 and 60 and duyulan !~ '[0-9]'),
  dogru text not null check (char_length(dogru) between 2 and 60 and dogru !~ '[0-9]'),
  duyulan_anahtar text not null check (char_length(duyulan_anahtar) between 2 and 60),
  kaynak text not null default 'elle' check (kaynak in ('elle', 'not_duzeltme', 'transkript_duzeltme')),
  sayac integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, duyulan_anahtar)
);

alter table public.doktor_dikte_sozlugu enable row level security;
revoke all on public.doktor_dikte_sozlugu from anon, authenticated;
grant select on public.doktor_dikte_sozlugu to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'doktor_dikte_sozlugu' and policyname = 'doktor kendi satirlari') then
    create policy "doktor kendi satirlari" on public.doktor_dikte_sozlugu for select to authenticated using (doctor_id = auth.uid());
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('201', '201_dikte_sozlugu.sql', null, now(), false,
  'DIKTE-TIBBI-01: doktor_dikte_sozlugu (per-doctor heard→correct dictation terms; RLS own rows only)')
on conflict (version) do nothing;
