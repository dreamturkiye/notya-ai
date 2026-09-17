-- GOZ-CHAPTER (2026-09-17): Göz Hastalıkları chapter — live clinical truth in goz_* tables (same doctrine as
-- dahiliye_* / derm_*: additive tables, NOT specialty_records.payload, NOT core patients/visits columns).
-- Service-role API (/api/doktor/goz) filters by doctor_id; RLS on, doctor-own policies for direct clients.
-- VA is stored as written by the clinic ("0,8", "PS 1m", "EH", "IH", "IHY"); logMAR is derived in code.

create table if not exists goz_muayeneler (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tarih date not null default current_date,
  -- { sag: { uzak_sc, uzak_cc, yakin }, sol: { ... } } — text as written
  va jsonb not null default '{}'::jsonb,
  gib_sag numeric check (gib_sag is null or (gib_sag >= 0 and gib_sag <= 90)),
  gib_sol numeric check (gib_sol is null or (gib_sol >= 0 and gib_sol <= 90)),
  gib_yontem text check (gib_yontem is null or gib_yontem in ('nct','applanasyon','tonopen','icare','diger')),
  rapd text check (rapd is null or rapd in ('yok','sag','sol')),
  -- optional refraction / pupil payload (sph/cyl/aks per eye) — hekim girişi
  ek jsonb,
  kaynak text not null default 'hekim' check (kaynak in ('hekim','kopya_onayli')),
  created_at timestamptz not null default now()
);
create index if not exists goz_muayeneler_idx on goz_muayeneler (patient_id, tarih desc, created_at desc);

create table if not exists goz_glokom (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tani_hekim text, goz text check (goz is null or goz in ('sag','sol','iki')),
  hedef_gib_sag numeric, hedef_gib_sol numeric,
  -- [{ ad, goz, siklik, baslangic }] — hekim yazar; motor titrasyon önermez
  damlalar jsonb not null default '[]'::jsonb,
  son_gorme_alani date, son_oct_rnfl date,
  ga_aralik_ay int check (ga_aralik_ay is null or ga_aralik_ay between 1 and 36),
  oct_aralik_ay int check (oct_aralik_ay is null or oct_aralik_ay between 1 and 36),
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);

create table if not exists goz_dr (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  dm_tip text check (dm_tip is null or dm_tip in ('T1','T2','diger')), dm_tani_tarihi date, gebe boolean not null default false,
  evre_sag text check (evre_sag is null or evre_sag in ('yok','hafif_npdr','orta_npdr','agir_npdr','pdr','degerlendirilemedi')),
  evre_sol text check (evre_sol is null or evre_sol in ('yok','hafif_npdr','orta_npdr','agir_npdr','pdr','degerlendirilemedi')),
  dmo_sag text check (dmo_sag is null or dmo_sag in ('yok','merkez_disi','merkez_tutan')),
  dmo_sol text check (dmo_sol is null or dmo_sol in ('yok','merkez_disi','merkez_tutan')),
  son_fundus date, sonraki_kontrol date, kapatilan_sevk_id uuid references sevkler(id),
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);

create table if not exists goz_enjeksiyonlar (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  goz text not null check (goz in ('sag','sol')),
  ajan text not null check (ajan in ('bevacizumab','ranibizumab','aflibersept_2mg','aflibersept_8mg','deksametazon_implant','faricimab','brolucizumab','diger')),
  endikasyon text not null check (endikasyon in ('ybmd','dmo','rvt','miyopik_knv','rop','diger')),
  faz text not null default 'yukleme' check (faz in ('yukleme','idame')),
  doz_no int check (doz_no is null or doz_no between 1 and 99),
  tarih date not null, durum text not null default 'planli' check (durum in ('planli','yapildi','iptal')),
  -- SUT 4.2.33(3) yanıt verisi: { va_harf_degisim, mfk_mikron, mfk_onceki_mikron }
  yanit jsonb,
  created_at timestamptz not null default now()
);
create index if not exists goz_enjeksiyonlar_idx on goz_enjeksiyonlar (patient_id, tarih desc);

create table if not exists goz_katarakt (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  goz text not null check (goz in ('sag','sol')),
  checklist jsonb not null default '{}'::jsonb,
  gil_tipi_hekim text check (gil_tipi_hekim is null or gil_tipi_hekim in ('monofokal','torik','multifokal','edof','diger')),
  planlanan_tarih date, durum text not null default 'planlama' check (durum in ('planlama','hazir','yapildi','iptal')),
  updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists goz_sgk_raporlari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  sablon text not null check (sablon in ('anti_vegf_baslangic','anti_vegf_idame','deksametazon_implant','katarakt_gil')),
  draft jsonb not null, eksikler text[] not null default '{}',
  durum text not null default 'taslak' check (durum in ('taslak','kilitli')), kilit_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists goz_sgk_raporlari_idx on goz_sgk_raporlari (patient_id, created_at desc);

-- OCT / fundus / ön segment reads on core hasta_goruntulemeler rows. Dual-sign: taslak (asistan hekim / Ayşe) → uzman onay.
create table if not exists goz_goruntu_okumalari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  goruntu_id uuid not null references hasta_goruntulemeler(id) on delete cascade,
  goz text check (goz is null or goz in ('sag','sol','iki')),
  taslak text not null default '', taslak_yazan text not null default 'asistan' check (taslak_yazan in ('asistan','uzman')),
  durum text not null default 'draft' check (durum in ('draft','onayli','duzeltilmis','reddedildi')),
  uzman_metin text, onay_at timestamptz,
  disclaimer text not null default 'Karar desteği, tanı değildir. Uzman onayı gerekir.',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists goz_goruntu_okumalari_idx on goz_goruntu_okumalari (patient_id, created_at desc);

-- MD-set next kontrol (portal "Gözlerim" reads only these).
create table if not exists goz_kontroller (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tarih date not null, neden text not null, dilatasyon boolean not null default false,
  durum text not null default 'planli' check (durum in ('planli','yapildi','iptal')),
  created_at timestamptz not null default now()
);
create index if not exists goz_kontroller_idx on goz_kontroller (patient_id, tarih);

create table if not exists goz_pediatrik (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tip text not null check (tip in ('ambliyopi','sasilik','ambliyopi_sasilik','refraktif')),
  kapama_hekim text, gozluk boolean not null default false, sonraki_kontrol date, notlar text,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now(), unique (patient_id)
);

create table if not exists goz_gorevler (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  kod text not null, ad text not null, due date, kaynak text,
  durum text not null default 'acik' check (durum in ('acik','tamam','iptal')), tamam_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists goz_gorevler_idx on goz_gorevler (patient_id, durum, due);

-- OCT / fundus / ön segment become canonical modality codes (lib/doktor/imagingModalities.ts).
alter table hasta_goruntulemeler drop constraint if exists hasta_goruntulemeler_modalite_check;
alter table hasta_goruntulemeler add constraint hasta_goruntulemeler_modalite_check check (
  modalite is null or modalite in ('xray','mri','bt','us','pet','ekg','eko','mamografi','diger','dermatoskopi','derm','yara','oct','fundus','on_segment')
);

do $$
declare t text;
begin
  foreach t in array array['goz_muayeneler','goz_glokom','goz_dr','goz_enjeksiyonlar','goz_katarakt','goz_sgk_raporlari','goz_goruntu_okumalari','goz_kontroller','goz_pediatrik','goz_gorevler'] loop
    execute format('alter table %I enable row level security', t);
    begin
      execute format('create policy "doktor kendi %s" on %I for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid())', t, t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('048', '048_goz_chapter.sql', null, now(), false, 'Göz chapter: muayene VA/GİB, glokom, DR, enjeksiyon, katarakt, SGK rapor, görüntü okuma dual-sign, kontrol, pediatrik, görevler; oct/fundus/on_segment modaliteleri')
on conflict (version) do nothing;
