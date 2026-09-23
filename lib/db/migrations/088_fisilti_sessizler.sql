-- 088 — NOTYA-FISILTI-UNIVERSAL: fisilti_sessizler (mute, Sprint 1 doktor).
--
-- Kaan'ın "kizarlar" endişesine yanıt: fısıltı bir öğeyi sonsuza dek göstermeye devam etmemeli,
-- ama sessizlik SESSİZ bir dismiss olmamalı -- görünür bir kayıt, bir sebep ve kimin sustuğu.
-- v1 kapsam: hasta düzeyinde susturma (belirli bir bayrak değil) -- daha ince taneli susturma
-- (bayrak bazlı) ucuz bir sonraki adım, bu tabloyu genişletmeden.
--
-- Ayşe HAZIRLAR, hekim ONAYLAR ilkesi burada da geçerli: core/eylemler/temelEylemler.ts'teki
-- fisilti_sessize_al eylemi T1 (eklenebilir, geri alınabilir) -- EylemKarti onayı olmadan hiçbir
-- satır burada oluşmaz.
--
-- YALNIZ EKLEME. İdempotent.

create table if not exists fisilti_sessizler (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references auth.users(id) on delete cascade,
  patient_id  uuid not null references patients(id) on delete cascade,
  brans       text not null,
  sebep       text not null,
  sessiz_at   timestamptz not null default now(),
  kaldirildi_at timestamptz
);
create index if not exists fisilti_sessizler_aktif_idx on fisilti_sessizler (doctor_id, patient_id, brans) where kaldirildi_at is null;

alter table public.fisilti_sessizler enable row level security;
do $$
begin
  create policy "hasta_izolasyon_kendi_satiri" on public.fisilti_sessizler for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.fisilti_sessizler as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;

-- DOĞRULAMA (salt-okunur):
--   select relrowsecurity from pg_class where relname = 'fisilti_sessizler';  -- true
--   select policyname, permissive from pg_policies where tablename = 'fisilti_sessizler';  -- 2 satır
