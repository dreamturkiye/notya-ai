-- 167 — MBYS-BILDIR-01 (2026-10-16): "Muayeneyi Bildir" audit trail.
--
-- mbys_bildirim_gunlugu: APPEND-ONLY log of every "Muayeneyi Bildir" step a doctor took on an approved muayene:
--   'onaylandi'       the doctor confirmed the exact record shown (payload_hash = SHA-256 of that record)
--   'devredildi'      the record was handed to the doctor's browser helper ('yardimci') or the clipboard ('pano')
--   'devir_basarisiz' the hand-over failed in the browser
-- It holds ids, the fingerprint and the outcome ONLY: no name, identity number, diagnosis or note text.
-- `gonderildi` is always false today: no Notya server submits to MBYS (no Ministry API exists in this repo).
-- It becomes true only if a real adapter ever gets a Ministry receipt.
--
-- No foreign keys on purpose: the trail must outlive a deleted note/patient (kalici-sil). UPDATE and DELETE are
-- blocked by trigger, so a row cannot be edited or erased through the app or PostgREST.
-- ADDITIVE only. Idempotent.

create table if not exists public.mbys_bildirim_gunlugu (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_id uuid not null,
  note_id uuid not null,
  olay text not null check (olay in ('onaylandi', 'devredildi', 'devir_basarisiz')),
  kanal text check (kanal is null or kanal in ('yardimci', 'pano')),
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  onay_id uuid references public.mbys_bildirim_gunlugu(id),
  eksik_alanlar text[] not null default '{}',
  gonderildi boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists mbys_bildirim_gunlugu_not_idx on public.mbys_bildirim_gunlugu (doctor_id, note_id, created_at desc);

create or replace function public.mbys_bildirim_gunlugu_degismez() returns trigger
language plpgsql as $$
begin
  raise exception 'mbys_bildirim_gunlugu is append-only (% blocked)', tg_op;
end $$;

drop trigger if exists trg_mbys_bildirim_gunlugu_degismez on public.mbys_bildirim_gunlugu;
create trigger trg_mbys_bildirim_gunlugu_degismez
  before update or delete on public.mbys_bildirim_gunlugu
  for each row execute function public.mbys_bildirim_gunlugu_degismez();

alter table public.mbys_bildirim_gunlugu enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'mbys_bildirim_gunlugu' and policyname = 'doktor kendi mbys gunlugu') then
    create policy "doktor kendi mbys gunlugu" on public.mbys_bildirim_gunlugu
      for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'mbys_bildirim_gunlugu' and policyname = 'hasta_izolasyon_hasta_sahipligi') then
    create policy hasta_izolasyon_hasta_sahipligi on public.mbys_bildirim_gunlugu as restrictive for all to authenticated, anon
      using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
      with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('168', '168_mbys_bildirim_gunlugu.sql', null, now(), false,
  'MBYS-BILDIR-01: append-only mbys_bildirim_gunlugu audit trail')
on conflict (version) do nothing;
