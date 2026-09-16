-- NOTYA-KD-yenidogan (2026-09-16): Taburcu paketi + Ulusal Yenidoğan Tarama (NTP) + Bebek izlem.
-- Additive only. Preview/prod share Supabase — apply before persistence QA.
-- 025 belge, 026 KD clinic-fit, 027 derm, 028 lab_paneller → this is 029.
-- Notya is clinic checklist + colleague tooling. Not a device, not a national registry, not e-Nabız.

-- Birth event (KD owns). Live birth MUST create bebek_kartlari linked to anne.
create table if not exists dogum_olaylari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  anne_id uuid not null references patients(id) on delete cascade,
  bebek_id uuid not null references patients(id) on delete cascade,
  gebelik_id uuid references gebelikler(id) on delete set null,
  dogum_at timestamptz not null,
  yol text not null default 'NSD' check (yol in ('NSD', 'C/S')),
  apgar_1 int,
  apgar_5 int,
  kilo int,
  boy numeric,
  bas numeric,
  gest_hafta numeric,
  canli boolean not null default true,
  created_at timestamptz not null default now(),
  unique (bebek_id)
);
create index if not exists dogum_olaylari_anne_idx on dogum_olaylari (anne_id, doctor_id, dogum_at desc);
create index if not exists dogum_olaylari_gebelik_idx on dogum_olaylari (gebelik_id);

comment on table dogum_olaylari is
  'KD birth event. Canlı doğum → bebek_kartlari. Notya does not replace e-Doğum / e-Nabız.';

create table if not exists bebek_kartlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  anne_id uuid not null references patients(id) on delete cascade,
  dogum_id uuid not null references dogum_olaylari(id) on delete cascade,
  cinsiyet text,
  kan_grubu text,
  preterm boolean not null default false,
  lbw boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id),
  unique (dogum_id)
);
create index if not exists bebek_kartlari_anne_idx on bebek_kartlari (anne_id, doctor_id);

comment on table bebek_kartlari is
  'Pediatri/Ayşe owns the baby after discharge. Linked to anne + dogum. NTP labs live here, not on anne.';

create table if not exists taburcu_checklist (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  dogum_id uuid not null references dogum_olaylari(id) on delete cascade,
  ntp1_alindi_at timestamptz,
  ntp1_barkod text,
  ntp1_beslenme_sonrasi boolean,
  ntp2_randevu_at date,
  ntp2_yer text default 'ASM',
  hepb1_at timestamptz,
  vitk_at timestamptz,
  isitme_at timestamptz,
  isitme_sonuc text check (isitme_sonuc is null or isitme_sonuc in ('gec', 'kaldi', 'yapilmadi')),
  pulseox_at timestamptz,
  pulseox_sonuc text check (pulseox_sonuc is null or pulseox_sonuc in ('gec', 'kaldi')),
  kirmizi_refleks boolean,
  gkd_risk boolean not null default false,
  kalca_us_randevu_at date,
  dvit_baslandi boolean,
  emzirme_danismanlik boolean,
  red_json jsonb not null default '{"maddeler":[]}'::jsonb,
  istisna jsonb,
  taburcu_onay_at timestamptz,
  onaylayan uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dogum_id)
);

comment on table taburcu_checklist is
  'KD cannot finalize taburcu if NTP-1, HepB-1, VitK, işitme unchecked unless documented exception + tasks.';
comment on column taburcu_checklist.red_json is
  '{ maddeler: [{ kalem, neden, imza, at, kaydeden, status:"red" }] }. Refuse never silently skips calendar.';

create table if not exists lohusa_checklist (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  dogum_id uuid not null references dogum_olaylari(id) on delete cascade,
  anne_id uuid not null references patients(id) on delete cascade,
  kanama text,
  meme text,
  epizyo_kesi text,
  duygu_durum text,
  rhogam_at timestamptz,
  rhogam_endike boolean,
  demir_devam boolean,
  red_json jsonb not null default '{"maddeler":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (dogum_id)
);

comment on table lohusa_checklist is
  'Anne lohusa checklist (DSBYR). NTP results must never be stored here or on anne Belgeler.';

create table if not exists bebek_gorevleri (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  bebek_id uuid not null references patients(id) on delete cascade,
  anne_id uuid references patients(id) on delete set null,
  kind text not null check (kind in (
    'ntp2', 'izlem', 'asi', 'dvit', 'demir', 'isitme_izlem', 'kalca_us', 'hgb', 'lohusa_anne', 'yeni_bebek'
  )),
  due_at date not null,
  due_end_at date,
  status text not null default 'bekliyor' check (status in ('bekliyor', 'yapildi', 'red', 'gecikti')),
  source text not null default 'sistem' check (source in ('sistem', 'hekim')),
  title text not null,
  notes text,
  asi_kod text,
  red_at timestamptz,
  red_kaydeden uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bebek_gorevleri_bebek_idx on bebek_gorevleri (bebek_id, due_at);
create index if not exists bebek_gorevleri_anne_idx on bebek_gorevleri (anne_id, kind) where kind = 'lohusa_anne';
create index if not exists bebek_gorevleri_worklist_idx on bebek_gorevleri (doctor_id, kind, created_at desc) where kind = 'yeni_bebek';

create table if not exists asi_dozlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  bebek_id uuid not null references patients(id) on delete cascade,
  kod text not null,
  due_at date not null,
  given_at date,
  lot text,
  yer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bebek_id, kod)
);
create index if not exists asi_dozlari_bebek_idx on asi_dozlari (bebek_id, due_at);

comment on table asi_dozlari is
  'V1 SB GBP kod list only: HEPB1-3 BCG DABTIPA_HIB1-4 KPA1-4 OPA1-2 KKK1 VARICELLA HEPA1-2. No paid extras as mandatory.';

-- Reuse lab_paneller + lab_satirlar for NTP. Additive columns.
alter table lab_paneller add column if not exists panel_type text not null default 'genel';
alter table lab_paneller add column if not exists sample_no text;
alter table lab_paneller drop constraint if exists lab_paneller_sample_no_check;
alter table lab_paneller
  add constraint lab_paneller_sample_no_check
  check (sample_no is null or sample_no in ('1', '2', 'tekrar'));

comment on column lab_paneller.panel_type is
  'genel | yenidogan_tarama. NTP panels MUST have patient_id = bebek, never anne.';
comment on column lab_paneller.sample_no is
  'NTP heel-stick number: 1 (hospital) | 2 (ASM day 3–5) | tekrar.';

create index if not exists lab_paneller_ntp_idx
  on lab_paneller (patient_id, panel_type, sample_no, created_at desc)
  where panel_type = 'yenidogan_tarama';

alter table dogum_olaylari enable row level security;
alter table bebek_kartlari enable row level security;
alter table taburcu_checklist enable row level security;
alter table lohusa_checklist enable row level security;
alter table bebek_gorevleri enable row level security;
alter table asi_dozlari enable row level security;

do $$ begin
  create policy "doktor kendi dogum olaylari" on dogum_olaylari for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi bebek kartlari" on bebek_kartlari for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi taburcu checklist" on taburcu_checklist for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi lohusa checklist" on lohusa_checklist for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi bebek gorevleri" on bebek_gorevleri for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "doktor kendi asi dozlar" on asi_dozlari for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values (
  '029',
  '029_yenidogan_taburcu.sql',
  null,
  now(),
  false,
  'KD taburcu + NTP + bebek izlem: dogum_olaylari, bebek_kartlari, taburcu/lohusa checklist, bebek_gorevleri, asi_dozlari; lab_paneller.panel_type/sample_no. Additive. Apply before persistence QA. Notya ≠ e-Nabız.'
)
on conflict (version) do nothing;
