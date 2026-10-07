-- 126 NOTYA-SES-PROFILI-01 (Kaan, 2026-10-07)
-- Doctor voice profile: Ayşe prefers the doctor's voice when deciding whether to stop talking. Optional, offered
-- in onboarding, explicit KVKK consent (biometric data). NOT authentication — never used for sign-in.
--
-- Stored: ONLY the mathematical profile (a 256-number speaker embedding), never audio. Enrolment audio is
-- processed in the doctor's browser and discarded. Patients are never enrolled.
-- One row per doctor. The profile is encrypted at rest with the same AES-256-GCM helper as patient *_encrypted
-- fields (lib/security/encryption.ts encryptPII). Server routes use the service role (bypasses RLS) and always
-- scope by doctor_id. RLS is the second line: a signed-in doctor may read only their own row's harmless columns,
-- never the profile column, and may not write from the browser. Delete = row gone (cascade on account deletion).
create table if not exists public.doktor_ses_profilleri (
  doctor_id uuid primary key references auth.users(id) on delete cascade,
  profil_encrypted text not null,
  model_surumu text not null,
  riza_zamani timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.doktor_ses_profilleri enable row level security;

drop policy if exists "doktor kendi ses profili" on public.doktor_ses_profilleri;
create policy "doktor kendi ses profili" on public.doktor_ses_profilleri
  for select to authenticated using (doctor_id = auth.uid());

revoke all on table public.doktor_ses_profilleri from anon, authenticated;
grant select (doctor_id, model_surumu, riza_zamani, created_at, updated_at)
  on table public.doktor_ses_profilleri to authenticated;

-- Anonymous tuning counters: verdict counts per day and model version. No doctor id, no audio, no text.
create table if not exists public.ses_profili_sayaclari (
  gun date not null,
  model_surumu text not null,
  kabul bigint not null default 0,
  red bigint not null default 0,
  belirsiz bigint not null default 0,
  kisa bigint not null default 0,
  primary key (gun, model_surumu)
);

alter table public.ses_profili_sayaclari enable row level security;
revoke all on table public.ses_profili_sayaclari from anon, authenticated;

create or replace function public.ses_profili_sayac_ekle(p_gun date, p_surum text, p_kabul int, p_red int, p_belirsiz int, p_kisa int)
returns void language sql as $$
  insert into public.ses_profili_sayaclari as s (gun, model_surumu, kabul, red, belirsiz, kisa)
  values (p_gun, p_surum, greatest(p_kabul, 0), greatest(p_red, 0), greatest(p_belirsiz, 0), greatest(p_kisa, 0))
  on conflict (gun, model_surumu) do update set
    kabul = s.kabul + excluded.kabul,
    red = s.red + excluded.red,
    belirsiz = s.belirsiz + excluded.belirsiz,
    kisa = s.kisa + excluded.kisa;
$$;

revoke execute on function public.ses_profili_sayac_ekle(date, text, int, int, int, int) from public, anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('126', '126_doktor_ses_profili.sql', null, now(), false,
  'NOTYA-SES-PROFILI-01: doctor voice profile (encrypted embedding, owner-only) + anonymous verdict counters')
on conflict (version) do nothing;
