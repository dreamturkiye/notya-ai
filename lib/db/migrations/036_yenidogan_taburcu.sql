-- NOTYA-KD-yenidogan (2026-09-16): Taburcu paketi extras + NTP lab columns + Bebek izlem calendar.
-- Additive only. Preview/prod share Supabase — apply BEFORE persistence QA.
-- 029_kd_dogum_spine.sql already created dogum_olaylari, bebek_kartlari, taburcu_checklist
--   (taburcu_checklist.maddeler jsonb + istisna; bebek_kartlari.yenidogan_tarama jsonb). REUSE those.
-- 035_kd_jine_wow_sprint.sql already taken on main — this is 036.
-- Notya is clinic checklist + colleague tooling. Not a device, not a national registry, not e-Nabız.

-- Calendar tasks (NTP-2, izlem, aşı, D vit, demir, lohusa_anne, yeni_bebek worklist).
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

comment on table bebek_gorevleri is
  'Bebek/lohusa calendar rows from dogum_at. Refuse = status red + timestamp/who; never silently dropped.';

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

-- Anne lohusa checklist (DSBYR). NTP results must never live here or on anne Belgeler.
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

-- Additive columns on 029 tables (do not replace maddeler / yenidogan_tarama jsonb).
alter table taburcu_checklist add column if not exists red_json jsonb not null default '{"maddeler":[]}'::jsonb;
alter table taburcu_checklist add column if not exists onaylayan uuid references auth.users(id);

comment on column taburcu_checklist.red_json is
  '{ maddeler: [{ kalem, neden, imza, at, kaydeden, status:"red" }] }. Refuse never silently skips calendar.';
comment on column taburcu_checklist.maddeler is
  '029 TaburcuChecklist booleans (ntp1, hepb1, vitk, isitme, …) plus optional timestamps (ntp1_alindi_at, …).';

alter table bebek_kartlari add column if not exists kan_grubu text;
alter table bebek_kartlari add column if not exists preterm boolean not null default false;
alter table bebek_kartlari add column if not exists lbw boolean not null default false;

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

alter table lohusa_checklist enable row level security;
alter table bebek_gorevleri enable row level security;
alter table asi_dozlari enable row level security;

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
  '036',
  '036_yenidogan_taburcu.sql',
  null,
  now(),
  false,
  'KD taburcu extras: bebek_gorevleri, asi_dozlari, lohusa_checklist; taburcu_checklist.red_json/onaylayan; bebek_kartlari preterm/lbw; lab_paneller.panel_type/sample_no. Reuses 029 dogum_olaylari/bebek_kartlari/taburcu_checklist. Additive. Apply before persistence QA. Notya ≠ e-Nabız.'
)
on conflict (version) do nothing;
