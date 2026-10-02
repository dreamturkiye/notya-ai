-- NOTYA-ARAMA-INDEKS-01 (#503) + NOTYA-AYSE-GERI-07 (audit §4.3, PR 10)
-- Blind name index: one row per name part of a patient, holding a one-way HMAC-SHA256 digest of that part
-- (lib/doktor/hastaAramaIndeksi.ts). The name itself is never stored here.
--
-- The table was created by hand in production on 2026-10-01 and had no migration in the repository. This file
-- records it so a fresh database gets it too. Additive and idempotent: on a database that already has the table
-- every statement is a no-op, and nothing here alters an existing column.
-- NOT APPLIED by this commit. The column list is taken from the code that reads and writes the table; the
-- production definition was not inspected (see docs/ayse-restoration-report.md, S7).
--
-- After applying on a database with existing patients: npx tsx scripts/_backfill_arama_indeksi.mts
-- Coverage check (read-only, counts only):
--   select p.doctor_id, count(*) from patients p left join patient_search_tokens t on t.patient_id = p.id
--   where p.is_active and t.patient_id is null group by 1;

create table if not exists public.patient_search_tokens (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients(id) on delete cascade,
  doctor_id   uuid not null references auth.users(id) on delete cascade,
  token_hash  text not null,
  created_at  timestamptz not null default now()
);
create index if not exists patient_search_tokens_arama_idx
  on public.patient_search_tokens (doctor_id, token_hash);
create index if not exists patient_search_tokens_hasta_idx
  on public.patient_search_tokens (patient_id);

alter table public.patient_search_tokens enable row level security;
do $$
begin
  create policy "hasta_izolasyon_kendi_satiri" on public.patient_search_tokens for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.patient_search_tokens as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;
