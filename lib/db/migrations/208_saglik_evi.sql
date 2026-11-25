-- 208 — HASTA-PORTALI-GUNLUK (Kaan, 2026-11-24): Sağlığım "daily health home", Phase 1 — Günlük Kayıt, Doz Takvimi,
-- Eğilim Bekçisi + rule engine, Sağlık Karnesi badges, web push reminders, Kontrol Öncesi Özet, KVKK consent / export /
-- delete. CORE: every one of the 30 medical branches and the 10 Özel Branşlar (branş differences are data, in
-- lib/saglikEvi/bransAyari.ts).
--
--   ev_olcumleri          home readings the patient enters (one tap or photo of the device screen), time-stamped
--   ev_ilac_planlari      dose plan per medicine: from the doctor's hasta_ilaclar (ilac_id) or patient-added (kaynak=hasta)
--   ev_doz_kayitlari      "Aldım / Atladım / Ertele" per scheduled slot (unique per plan + slot)
--   ev_hedefler           the doctor's per-patient targets / thresholds / extra measurements (defaults live in code)
--   ev_uyarilar           rule-engine alerts (bilgi / dikkat / hekime_bildir / acil), dedupe key + cool-down in code
--   ev_rozetler           badges earned (kept even when the window moves on)
--   ev_tercihler          KVKK açık rıza for sharing home data with the doctor (+ text version), quiet hours, reminders
--   ev_push_abonelikleri  Web Push subscriptions (one per browser endpoint)
--   ev_bildirim_gunlugu   idempotency log of sent reminders / notices (unique key → a cron re-run sends nothing twice)
--   ev_kontrol_ozetleri   Kontrol Öncesi Özet per appointment (built the day before)
--   ev_sorular            the patient's questions for the next visit
--
-- Access (hasta-izolasyon): every server route uses the service role. The patient reaches these rows only through
-- /api/portal/hasta/[token]/gunluk* after the PIN unlock; the token row fixes (doctor_id, patient_id) and every read /
-- write carries BOTH. The doctor reaches them through /api/doktor/hastalar/[id]/ev-verisi after hastaSahibiMi. RLS is
-- the second line: on for every table; doctors may SELECT only their own rows of their own patients (restrictive
-- patient-ownership policy, as in 052); no write policy (writes are service role only); push / log tables have no
-- policy at all. Patient deletion (KVKK) cascades.
-- Number 208: 206 (protokol kütüphanesi) and 207 (yetki daraltma) landed on main while this was built; the release
-- branches end at 200. Applied to production on 2026-11-25 UTC (Supabase migration log name: 208_saglik_evi).

create table if not exists public.ev_olcumleri (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  tip text not null check (tip in ('kb', 'glukoz', 'kilo', 'nabiz', 'spo2', 'ates', 'bel', 'su')),
  deger numeric not null,
  deger2 numeric,
  baglam text check (baglam is null or baglam in ('aclik', 'tokluk2', 'yatmadan', 'rastgele')),
  olcum_at timestamptz not null default now(),
  kaynak text not null default 'portal' check (kaynak in ('portal', 'portal_foto', 'hekim')),
  created_at timestamptz not null default now()
);
create index if not exists ev_olcumleri_kapsam_idx on public.ev_olcumleri (doctor_id, patient_id, olcum_at desc);

create table if not exists public.ev_ilac_planlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  ilac_id uuid references public.hasta_ilaclar(id) on delete set null,
  ad text not null check (char_length(ad) between 1 and 120),
  doz text check (doz is null or char_length(doz) <= 120),
  saatler text[] not null default '{}',
  gerektikce boolean not null default false,
  hafta_gunu smallint check (hafta_gunu is null or hafta_gunu between 0 and 6),
  kaynak text not null default 'hekim' check (kaynak in ('hekim', 'hasta')),
  kritik boolean not null default false,
  min_aralik_saat numeric check (min_aralik_saat is null or (min_aralik_saat > 0 and min_aralik_saat <= 72)),
  aktif boolean not null default true,
  baslangic date,
  bitis date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ev_ilac_planlari_kapsam_idx on public.ev_ilac_planlari (doctor_id, patient_id);
create unique index if not exists ev_ilac_planlari_ilac_uq on public.ev_ilac_planlari (doctor_id, patient_id, ilac_id) where ilac_id is not null;
create index if not exists ev_ilac_planlari_aktif_idx on public.ev_ilac_planlari (aktif) where aktif and not gerektikce;

create table if not exists public.ev_doz_kayitlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  plan_id uuid not null references public.ev_ilac_planlari(id) on delete cascade,
  planlanan_at timestamptz not null,
  durum text not null check (durum in ('alindi', 'atlandi', 'ertelendi')),
  kayit_at timestamptz not null default now(),
  ertele_until timestamptz,
  unique (plan_id, planlanan_at)
);
create index if not exists ev_doz_kayitlari_kapsam_idx on public.ev_doz_kayitlari (doctor_id, patient_id, planlanan_at desc);

create table if not exists public.ev_hedefler (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  ayarlar jsonb not null default '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  unique (doctor_id, patient_id)
);

create table if not exists public.ev_uyarilar (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  kural text not null,
  anahtar text not null,
  duzey text not null check (duzey in ('bilgi', 'dikkat', 'hekime_bildir', 'acil')),
  metrik text not null,
  hasta_metni text not null,
  hekim_metni text not null,
  veri jsonb not null default '{}'::jsonb,
  olusturma_at timestamptz not null default now(),
  hasta_gordu_at timestamptz,
  hekim_gordu_at timestamptz
);
create index if not exists ev_uyarilar_kapsam_idx on public.ev_uyarilar (doctor_id, patient_id, olusturma_at desc);
create index if not exists ev_uyarilar_hekim_acik_idx on public.ev_uyarilar (doctor_id, olusturma_at) where hekim_gordu_at is null and duzey in ('hekime_bildir', 'acil');

create table if not exists public.ev_rozetler (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  rozet text not null check (char_length(rozet) between 1 and 40),
  kazanildi_at timestamptz not null default now(),
  hasta_gordu_at timestamptz,
  unique (doctor_id, patient_id, rozet)
);

create table if not exists public.ev_tercihler (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  paylasim_onayi boolean not null default false,
  onay_at timestamptz,
  onay_surumu text,
  geri_cekme_at timestamptz,
  sessiz_bas text not null default '23:00' check (sessiz_bas ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  sessiz_bit text not null default '07:00' check (sessiz_bit ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  hatirlatma_acik boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (doctor_id, patient_id)
);

create table if not exists public.ev_push_abonelikleri (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) <= 1024),
  p256dh text not null,
  auth text not null,
  hata_sayisi integer not null default 0,
  son_basari_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ev_push_abonelikleri_kapsam_idx on public.ev_push_abonelikleri (doctor_id, patient_id);

create table if not exists public.ev_bildirim_gunlugu (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  tur text not null check (tur in ('doz', 'kacirma', 'kritik', 'kontrol_ozeti', 'foto_okuma')),
  anahtar text not null unique,
  sonuc text,
  created_at timestamptz not null default now()
);
create index if not exists ev_bildirim_gunlugu_kapsam_idx on public.ev_bildirim_gunlugu (doctor_id, patient_id, created_at desc);

create table if not exists public.ev_kontrol_ozetleri (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  randevu_id uuid unique references public.randevular(id) on delete set null,
  randevu_at timestamptz,
  ozet jsonb not null,
  metin text not null,
  olusturma_at timestamptz not null default now(),
  hekim_gordu_at timestamptz
);
create index if not exists ev_kontrol_ozetleri_kapsam_idx on public.ev_kontrol_ozetleri (doctor_id, patient_id, olusturma_at desc);

create table if not exists public.ev_sorular (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  metin text not null check (char_length(metin) between 1 and 500),
  created_at timestamptz not null default now(),
  kapandi_at timestamptz
);
create index if not exists ev_sorular_kapsam_idx on public.ev_sorular (doctor_id, patient_id, created_at desc);

-- RLS: on everywhere (anon / authenticated get nothing unless a policy below says so).
alter table public.ev_olcumleri enable row level security;
alter table public.ev_ilac_planlari enable row level security;
alter table public.ev_doz_kayitlari enable row level security;
alter table public.ev_hedefler enable row level security;
alter table public.ev_uyarilar enable row level security;
alter table public.ev_rozetler enable row level security;
alter table public.ev_tercihler enable row level security;
alter table public.ev_push_abonelikleri enable row level security;
alter table public.ev_bildirim_gunlugu enable row level security;
alter table public.ev_kontrol_ozetleri enable row level security;
alter table public.ev_sorular enable row level security;

-- Doctor: SELECT own rows of own patients (permissive own-row + restrictive patient ownership). No write policy.
do $$
declare t text;
begin
  foreach t in array array['ev_olcumleri', 'ev_ilac_planlari', 'ev_doz_kayitlari', 'ev_hedefler', 'ev_uyarilar', 'ev_rozetler', 'ev_tercihler', 'ev_kontrol_ozetleri', 'ev_sorular'] loop
    begin
      execute format('create policy "doktor kendi satirlari" on public.%I for select to authenticated using (doctor_id = auth.uid())', t);
    exception when duplicate_object then null;
    end;
    begin
      execute format('create policy "hasta_izolasyon_hasta_sahipligi" on public.%I as restrictive for all to authenticated, anon using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid())) with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

revoke insert, update, delete on public.ev_olcumleri, public.ev_ilac_planlari, public.ev_doz_kayitlari, public.ev_hedefler, public.ev_uyarilar, public.ev_rozetler, public.ev_tercihler, public.ev_kontrol_ozetleri, public.ev_sorular from anon, authenticated;
revoke all on public.ev_push_abonelikleri, public.ev_bildirim_gunlugu from anon, authenticated;
-- anon never reads these (no anon policy exists either); 207's TRUNCATE / REFERENCES / TRIGGER rule, explicit here too.
revoke select on public.ev_olcumleri, public.ev_ilac_planlari, public.ev_doz_kayitlari, public.ev_hedefler, public.ev_uyarilar, public.ev_rozetler, public.ev_tercihler, public.ev_kontrol_ozetleri, public.ev_sorular from anon;
revoke truncate, references, trigger on public.ev_olcumleri, public.ev_ilac_planlari, public.ev_doz_kayitlari, public.ev_hedefler, public.ev_uyarilar, public.ev_rozetler, public.ev_tercihler, public.ev_kontrol_ozetleri, public.ev_sorular from anon, authenticated;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('208', '208_saglik_evi.sql', null, now(), false,
  'HASTA-PORTALI-GUNLUK: ev_olcumleri, ev_ilac_planlari, ev_doz_kayitlari, ev_hedefler, ev_uyarilar, ev_rozetler, ev_tercihler, ev_push_abonelikleri, ev_bildirim_gunlugu, ev_kontrol_ozetleri, ev_sorular; RLS on, doctor select own rows of own patients, writes service role only')
on conflict (version) do nothing;

-- VERIFY (read-only):
--   select relname, relrowsecurity from pg_class where relname like 'ev\_%' and relkind = 'r' order by 1;
--   select tablename, policyname, permissive, cmd from pg_policies where tablename like 'ev\_%' order by 1, 2;
--   explain select * from ev_olcumleri where doctor_id = '00000000-0000-0000-0000-000000000000' and patient_id = '00000000-0000-0000-0000-000000000000' order by olcum_at desc limit 500;
