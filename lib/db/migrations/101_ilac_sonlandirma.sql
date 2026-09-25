-- NOTYA-ILAC-SONLANDIR-01 (Kaan / Dr. Gökhan, 2026-09-25) — medicines the approved note stops.
--
-- When the doctor approves a note that says "Klacid süspansiyon ve Calpol şurubu keselim", those rows in
-- hasta_ilaclar are ended (aktif = false, bitis_tarihi = today, notlar starts with
-- Muayene notunda sonlandırıldı: “<quote>”) — lib/doktor/ilacSonlandir.ts. The reason lives on the row itself
-- (existing notlar column), so the Kullandığı İlaçlar list shows it without this file.
--
-- This table is the audit + undo trail: who ended it (the approving doctor), when, from which note, the quoted
-- sentence, and the row's previous state so "Geri al" restores it exactly. It also remembers an undo, so
-- re-approving the same note does not end the same medicine again.
-- Until this file is applied: ending and Geri al still work (undo strips the reason prefix and clears the end
-- date); only the audit rows are not written and a re-approval after Geri al may end the row again.
--
-- Written only — NOT applied by the agent. Idempotent.

create table if not exists ilac_sonlandirmalari (
  id              uuid primary key default gen_random_uuid(),
  doctor_id       uuid not null references auth.users(id) on delete cascade,  -- the approving doctor
  patient_id      uuid not null references patients(id) on delete cascade,
  note_id         uuid references notes(id) on delete set null,
  ilac_id         uuid not null references hasta_ilaclar(id) on delete cascade,
  ilac_adi        text not null,
  alinti          text not null,                                               -- the note's own sentence
  onceki          jsonb not null,                                              -- { aktif, bitis_tarihi, notlar } before
  created_at      timestamptz not null default now(),
  geri_alindi_at  timestamptz,
  geri_alan       uuid references auth.users(id)
);
create index if not exists ilac_sonlandirmalari_not_idx on ilac_sonlandirmalari (note_id, doctor_id);
create index if not exists ilac_sonlandirmalari_hasta_idx on ilac_sonlandirmalari (doctor_id, patient_id, created_at desc);

-- RLS (HASTA-IZOLASYON, 052/085 pattern): service role bypasses; anon/authenticated only own rows + own patient.
alter table public.ilac_sonlandirmalari enable row level security;
do $$
begin
  create policy "hasta_izolasyon_kendi_satiri" on public.ilac_sonlandirmalari for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.ilac_sonlandirmalari as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;

-- Verify after applying:
--   select relrowsecurity from pg_class where relname = 'ilac_sonlandirmalari';                 -- true
--   select policyname, permissive from pg_policies where tablename = 'ilac_sonlandirmalari';    -- 2 rows
