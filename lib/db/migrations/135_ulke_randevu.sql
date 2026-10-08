-- 135 NOTYA-UZ-RANDEVU-01 (Kaan, 2026-10-08) · reshaped for the shared database by NOTYA-ULKE-SABLON-01
-- Appointments of a country's signed-in application (docs/COUNTRY-PACK-CHECKLIST.md J4), and an all-or-nothing
-- approval of a visit note.
--
--   1. hekim_calisma_duzeni   one row per account: working days, working hours, default appointment length, breaks.
--                             Minutes are WALL-CLOCK minutes of the account's own time zone (the pack's default, or
--                             the one the account chose from the pack's list).
--   2. ulke_randevulari       one row per appointment. Instants (timestamptz). The reason is encrypted like the
--                             rest of a patient's data. `session_id` links the appointment to the visit that was
--                             started from it.
--   3. ulke_not_onayla()      approves a note in ONE transaction: the note's text and approval, its role fields
--                             (and the exchange of the two drafts), and "done" on the appointment the visit was
--                             started from. Either all of it happens or none of it.
--
-- NEW objects only, all of them a country's (rules of the shared database: migration 130). `notes`, `sessions`,
-- `patients`, `users` and Türkiye's own `randevular` and `doktor_calisma_saatleri` are not read, written or altered.
-- The function reads and writes country tables only, and every statement in it carries the country it was called for.
--
-- The extension `btree_gist` is created if it is missing. It adds operator classes; it changes no existing table,
-- index or query of Türkiye.
--
-- NO DOUBLE BOOKING is a database guarantee, not an application check: an exclusion constraint refuses two
-- appointments of one doctor whose times overlap while both hold their time (planned, arrived, done). Two requests
-- at the same moment cannot both win; the loser gets error 23P01, which the application answers as "slot taken".
-- A cancelled appointment and a "did not come" give their time back. (An account belongs to one country, so "one
-- doctor" needs no country in the constraint.)
--
-- Patient isolation (.cursor/skills/hasta-izolasyon/SKILL.md): server routes use the service role and scope every
-- statement by country and doctor_id. An appointment belongs to (country, doctor, patient) by its foreign key; its
-- visit link is (country, doctor, visit). Row-level security is the second line, as in 131.
-- The function takes the country and the doctor's id as arguments, so it is closed to the browser roles: only the
-- server may call it.
--
-- Safe to run twice. One transaction. NOT APPLIED to any database by the job that wrote it. Run on a throwaway local
-- PostgreSQL by scripts/ulke-goc-kaniti.mjs. Apply after 134, before the calendar is used.

begin;
set local lock_timeout = '4s';

create extension if not exists btree_gist;

-- ── 1. Working pattern ───────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.hekim_calisma_duzeni (
  doctor_id uuid primary key,
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  -- ISO weekdays the account works: 1 = Monday … 7 = Sunday.
  gunler smallint[] not null check (gunler <@ array[1,2,3,4,5,6,7]::smallint[] and cardinality(gunler) between 1 and 7),
  -- Minutes after local midnight.
  baslangic_dk smallint not null check (baslangic_dk between 0 and 1439),
  bitis_dk smallint not null check (bitis_dk between 1 and 1440),
  -- Default appointment length, minutes.
  sure_dk smallint not null check (sure_dk between 5 and 240),
  -- Breaks inside the working hours: [{ "bas": <minute>, "bit": <minute> }, …]. Validated by the application.
  molalar jsonb not null default '[]'::jsonb check (jsonb_typeof(molalar) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (bitis_dk > baslangic_dk),
  constraint hekim_calisma_duzeni_hesap_fk foreign key (ulke, doctor_id) references public.ulke_hesaplari (ulke, id) on delete cascade
);

alter table public.hekim_calisma_duzeni enable row level security;

drop policy if exists "hekim kendi calisma duzeni" on public.hekim_calisma_duzeni;
create policy "hekim kendi calisma duzeni" on public.hekim_calisma_duzeni
  for select to authenticated using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

revoke all on table public.hekim_calisma_duzeni from anon, authenticated;
grant select on table public.hekim_calisma_duzeni to authenticated;

-- ── 2. Appointments ──────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.ulke_randevulari (
  id uuid primary key default gen_random_uuid(),
  ulke text not null check (ulke ~ '^[a-z]{2}$'),
  doctor_id uuid not null,
  patient_id uuid not null,
  baslangic timestamptz not null,
  bitis timestamptz not null,
  -- AES-256-GCM, same helper as ulke_hastalar.*_encrypted (lib/security/encryption.ts). A short reason for the visit.
  neden_encrypted text,
  -- planned, arrived, done, did not come, cancelled.
  durum text not null default 'planlandi' check (durum in ('planlandi', 'geldi', 'tamamlandi', 'gelmedi', 'iptal')),
  -- true = booked outside the working hours on purpose (the doctor confirmed "book anyway").
  mesai_disi boolean not null default false,
  -- The visit started from this appointment. One visit belongs to at most one appointment.
  session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (bitis > baslangic),
  check (bitis <= baslangic + interval '8 hours'),
  constraint ulke_randevulari_hasta_fk foreign key (ulke, doctor_id, patient_id) references public.ulke_hastalar (ulke, doctor_id, id) on delete cascade,
  -- The linked visit must be the same country's and the same doctor's. Checked only when there is a link. A visit
  -- is never removed by itself once it is linked (only together with its patient, which removes the appointment too).
  constraint ulke_randevulari_muayene_fk foreign key (ulke, doctor_id, session_id) references public.ulke_muayeneler (ulke, doctor_id, id)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ulke_randevulari_cakisma_yok') then
    alter table public.ulke_randevulari add constraint ulke_randevulari_cakisma_yok
      exclude using gist (doctor_id with =, tstzrange(baslangic, bitis, '[)') with &&)
      where (durum in ('planlandi', 'geldi', 'tamamlandi'));
  end if;
end $$;

create index if not exists ulke_randevulari_doctor_idx on public.ulke_randevulari (ulke, doctor_id, baslangic);
create index if not exists ulke_randevulari_patient_idx on public.ulke_randevulari (ulke, doctor_id, patient_id, baslangic);
create unique index if not exists ulke_randevulari_session_idx on public.ulke_randevulari (session_id) where session_id is not null;

alter table public.ulke_randevulari enable row level security;

drop policy if exists "hasta_izolasyon_kendi_satiri" on public.ulke_randevulari;
create policy "hasta_izolasyon_kendi_satiri" on public.ulke_randevulari
  for select to authenticated using (doctor_id = auth.uid() and ulke = public.ulke_oturum_ulkesi());

drop policy if exists "hasta_izolasyon_hasta_sahipligi" on public.ulke_randevulari;
create policy "hasta_izolasyon_hasta_sahipligi" on public.ulke_randevulari as restrictive for all to authenticated, anon
  using (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()))
  with check (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()));

revoke all on table public.ulke_randevulari from anon, authenticated;
grant select on table public.ulke_randevulari to authenticated;

-- ── 3. Approval of a note, all or nothing ────────────────────────────────────────────────────────────────────
-- Until this function, approving wrote the note and then, in a second request, the role fields in `not_dil_kaydi`:
-- a failure between the two left an approved note with the fields of its last saved draft.
--
-- COUNTRY. `p_ulke` is the country of the build that calls. Every statement below carries it: a note, a language
-- record or an appointment of another country is never read, locked or changed, whatever ids are passed.
--
-- A function body runs inside the caller's transaction: if any statement below fails, or the function raises,
-- every statement before it is undone. The application sends the values exactly as they must stand afterwards;
-- nothing here decides what a note may contain (the pack's field list is applied by the application first).
--
--   p_dil_kaydi   null = `not_dil_kaydi` is left as it is. Otherwise an object whose KEYS are the columns to write:
--                 alanlar, ikinci_alanlar (objects or null), not_dili, ikinci_dil, ikinci_s, ikinci_o, ikinci_a,
--                 ikinci_p (text or null). A key that is absent leaves its column untouched.
--
-- Returns  'TAMAM'      approved now
--          'ONAYLI'     the note was already approved: NOTHING was changed
--          'NOT_FOUND'  no such note for this doctor IN THIS COUNTRY: nothing was changed
drop function if exists public.ulke_not_onayla(uuid, uuid, timestamptz, text, text, text, text, jsonb);
create or replace function public.ulke_not_onayla(
  p_ulke text,
  p_note_id uuid,
  p_doctor_id uuid,
  p_onay_ani timestamptz,
  p_s text,
  p_o text,
  p_a text,
  p_p text,
  p_dil_kaydi jsonb default null
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_session uuid;
  v_onayli timestamptz;
begin
  -- The row is locked, so a second approval or a late save of the same note waits for this one to finish.
  select n.session_id, n.approved_at into v_session, v_onayli
    from public.ulke_notlar n
   where n.id = p_note_id and n.doctor_id = p_doctor_id and n.ulke = p_ulke
     for update;
  if not found then
    return 'NOT_FOUND';
  end if;
  if v_onayli is not null then
    return 'ONAYLI';
  end if;

  update public.ulke_notlar
     set content_subjektif = p_s,
         content_objektif = p_o,
         content_degerlendirme = p_a,
         content_plan = p_p,
         approved_at = p_onay_ani,
         approved_by = p_doctor_id
   where id = p_note_id and doctor_id = p_doctor_id and ulke = p_ulke and approved_at is null;

  if p_dil_kaydi is not null then
    update public.not_dil_kaydi d
       set alanlar        = case when p_dil_kaydi ? 'alanlar' then nullif(p_dil_kaydi -> 'alanlar', 'null'::jsonb) else d.alanlar end,
           ikinci_alanlar = case when p_dil_kaydi ? 'ikinci_alanlar' then nullif(p_dil_kaydi -> 'ikinci_alanlar', 'null'::jsonb) else d.ikinci_alanlar end,
           not_dili       = case when p_dil_kaydi ? 'not_dili' then p_dil_kaydi ->> 'not_dili' else d.not_dili end,
           ikinci_dil     = case when p_dil_kaydi ? 'ikinci_dil' then p_dil_kaydi ->> 'ikinci_dil' else d.ikinci_dil end,
           ikinci_s       = case when p_dil_kaydi ? 'ikinci_s' then p_dil_kaydi ->> 'ikinci_s' else d.ikinci_s end,
           ikinci_o       = case when p_dil_kaydi ? 'ikinci_o' then p_dil_kaydi ->> 'ikinci_o' else d.ikinci_o end,
           ikinci_a       = case when p_dil_kaydi ? 'ikinci_a' then p_dil_kaydi ->> 'ikinci_a' else d.ikinci_a end,
           ikinci_p       = case when p_dil_kaydi ? 'ikinci_p' then p_dil_kaydi ->> 'ikinci_p' else d.ikinci_p end,
           updated_at     = p_onay_ani
     where d.note_id = p_note_id and d.doctor_id = p_doctor_id and d.ulke = p_ulke;
    if not found then
      -- A note of this application always has its language record. Without it nothing is approved.
      raise exception 'ulke_not_onayla: not_dil_kaydi row missing' using errcode = 'P0002';
    end if;
  end if;

  -- The appointment this visit was started from is done. Only an appointment that still holds its time changes
  -- (planned or arrived), so this statement can never run into the no-double-booking constraint.
  update public.ulke_randevulari
     set durum = 'tamamlandi', updated_at = p_onay_ani
   where session_id = v_session and doctor_id = p_doctor_id and ulke = p_ulke and durum in ('planlandi', 'geldi');

  return 'TAMAM';
end $$;

revoke all on function public.ulke_not_onayla(text, uuid, uuid, timestamptz, text, text, text, text, jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.ulke_not_onayla(text, uuid, uuid, timestamptz, text, text, text, text, jsonb) to service_role;
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('135', '135_ulke_randevu.sql', null, now(), false,
  'NOTYA-ULKE-SABLON-01: per-account working pattern + country appointments (new tables, country and doctor in every key, exclusion constraint against double booking) + ulke_not_onayla (note approval in one transaction, bound to the country)')
on conflict (version) do nothing;

commit;
