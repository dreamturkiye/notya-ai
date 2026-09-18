-- 053 — GOZ-EXCEPTIONAL-01 (2026-09-18): göz chapter derinliği. YALNIZ EKLEME: yeni kolonlar nullable, yeni tablolar,
-- bir NOT NULL gevşetmesi (goz_goruntu_okumalari.goruntu_id — Belge kasası analizinden gelen taslak için). Veri silinmez / değişmez.
-- Hekim kilitleri aynı: tanı / evre / doz / GİL gücü yalnız hekim girişi; bu tablolar hekimin girdiğini saklar.
-- Muayene düzeyi yapılandırılmış bulgular (refraksiyon, biyomikroskopi, keratokonus, şaşılık testleri) goz_muayeneler.ek jsonb'dadır.
-- İdempotent — tekrar çalıştırmak güvenli.

-- Glokom kartı: gonyoskopi (Shaffer 0–4 + serbest metin/Spaeth), pakimetri µm, görme alanı / OCT cihaz meta, uygulanan aralık önerisi etiketi
alter table goz_glokom add column if not exists shaffer_sag smallint check (shaffer_sag is null or shaffer_sag between 0 and 4);
alter table goz_glokom add column if not exists shaffer_sol smallint check (shaffer_sol is null or shaffer_sol between 0 and 4);
alter table goz_glokom add column if not exists gonyo_sag text;
alter table goz_glokom add column if not exists gonyo_sol text;
alter table goz_glokom add column if not exists paki_sag int check (paki_sag is null or paki_sag between 300 and 900);
alter table goz_glokom add column if not exists paki_sol int check (paki_sol is null or paki_sol between 300 and 900);
alter table goz_glokom add column if not exists gorme_alani_cihaz text;
alter table goz_glokom add column if not exists oct_cihaz text;
alter table goz_glokom add column if not exists aralik_onerisi text;

-- IVT odası kontrol listesi (onam, göz işaretleme, ilaç + lot, asepsi) — "yapıldı" öncesi zorunlu (API)
alter table goz_enjeksiyonlar add column if not exists ivt_kontrol jsonb;

-- Katarakt: biyometri (hekim girer; GİL gücü saklanmaz/hesaplanmaz), post-op 1. gün / 1. hafta, EK-3/G kalemi
alter table goz_katarakt add column if not exists biyometri jsonb;
alter table goz_katarakt add column if not exists postop jsonb;
alter table goz_katarakt add column if not exists ek3g_kod text;

-- Pediatrik şaşılık muayenesi (serbest metin, hekim)
alter table goz_pediatrik add column if not exists cover_test text;
alter table goz_pediatrik add column if not exists hirschberg text;
alter table goz_pediatrik add column if not exists krimsky text;

-- DR lazer kaydı (PRP / fokal / grid) — göz başına, tarih, hekim; kontrole bağlanabilir
create table if not exists goz_lazerler (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  goz text not null check (goz in ('sag','sol')),
  tip text not null check (tip in ('prp','fokal','grid','diger')),
  tarih date not null, seans_no int check (seans_no is null or seans_no between 1 and 20),
  hekim_adi text, not_hekim text,
  kontrol_id uuid references goz_kontroller(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists goz_lazerler_idx on goz_lazerler (patient_id, tarih desc);

-- ROP tarama kartı — zon / evre / plus hekim girer; sonraki tarama tarihini hekim kilitler
create table if not exists goz_rop_taramalari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tarih date not null,
  dogum_haftasi numeric check (dogum_haftasi is null or dogum_haftasi between 20 and 44),
  dogum_agirligi_g int check (dogum_agirligi_g is null or dogum_agirligi_g between 300 and 6000),
  pma_hafta numeric,
  zon_sag text check (zon_sag is null or zon_sag in ('I','II','III')), zon_sol text check (zon_sol is null or zon_sol in ('I','II','III')),
  evre_sag text check (evre_sag is null or evre_sag in ('0','1','2','3','4','5')), evre_sol text check (evre_sol is null or evre_sol in ('0','1','2','3','4','5')),
  plus_sag text check (plus_sag is null or plus_sag in ('yok','pre_plus','plus')), plus_sol text check (plus_sol is null or plus_sol in ('yok','pre_plus','plus')),
  sonraki_tarama date, not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists goz_rop_idx on goz_rop_taramalari (patient_id, tarih desc);

-- Acil kayıt: kimyasal yıkama zamanlayıcısı (başlangıç / bitiş / dakika), VA saati, eylem listesi
create table if not exists goz_acil_kayitlari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  tip text not null default 'kimyasal_yikama' check (tip in ('kimyasal_yikama','diger')),
  baslangic timestamptz, bitis timestamptz, dakika numeric check (dakika is null or dakika between 0 and 1440),
  ph_once text, ph_sonra text,
  va jsonb, kontrol jsonb, not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists goz_acil_idx on goz_acil_kayitlari (patient_id, created_at desc);

-- Aynı göz OCT kalınlıkları — hekim girer (piksel ölçümü yok)
create table if not exists goz_oct_olcumleri (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  goruntu_id uuid not null references hasta_goruntulemeler(id) on delete cascade,
  goz text check (goz is null or goz in ('sag','sol')),
  mfk_mikron int check (mfk_mikron is null or mfk_mikron between 50 and 1500),
  rnfl_mikron int check (rnfl_mikron is null or rnfl_mikron between 20 and 250),
  not_hekim text,
  created_at timestamptz not null default now(), unique (goruntu_id)
);

-- Belge › Asistana raporla (Tier A) → dual-sign taslağı. Kaynak görüntü: core hasta_goruntulemeler VEYA Belge kasası dokümanı.
alter table goz_goruntu_okumalari alter column goruntu_id drop not null;
alter table goz_goruntu_okumalari add column if not exists belge_id uuid;
alter table goz_goruntu_okumalari add column if not exists belge_analiz_id uuid references belge_analizleri(id) on delete set null;
alter table goz_goruntu_okumalari add column if not exists kaynak text not null default 'elle';
alter table goz_goruntu_okumalari add column if not exists modalite text;
alter table goz_goruntu_okumalari add column if not exists tek_alan boolean;
alter table goz_goruntu_okumalari add column if not exists guven_ust_pct int;
alter table goz_goruntu_okumalari add column if not exists asistan_rapor jsonb;
do $$
begin
  alter table goz_goruntu_okumalari add constraint goz_goruntu_okumalari_kaynak_chk check (kaynak in ('elle','ayse_iskelet','belge_tier_a'));
exception when duplicate_object then null;
end $$;
do $$
begin
  alter table goz_goruntu_okumalari add constraint goz_goruntu_okumalari_hedef_chk check (goruntu_id is not null or belge_id is not null);
exception when duplicate_object then null;
end $$;
create index if not exists goz_goruntu_okumalari_belge_idx on goz_goruntu_okumalari (belge_id) where belge_id is not null;

-- RLS: doktor-kendi politikası + (052 deseni) restrictive hasta sahipliği
do $$
declare t text;
begin
  foreach t in array array['goz_lazerler','goz_rop_taramalari','goz_acil_kayitlari','goz_oct_olcumleri'] loop
    execute format('alter table %I enable row level security', t);
    begin
      execute format('create policy "doktor kendi %s" on %I for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid())', t, t);
    exception when duplicate_object then null;
    end;
    begin
      execute format(
        'create policy "hasta_izolasyon_hasta_sahipligi" on public.%I as restrictive for all to authenticated, anon
           using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
           with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))',
        t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('053', '053_goz_exceptional.sql', null, now(), false, 'GOZ-EXCEPTIONAL-01: glokom gonyo/paki/VF meta, IVT kontrol, katarakt biyometri/postop/EK-3G, pediatrik şaşılık testleri, goz_lazerler, goz_rop_taramalari, goz_acil_kayitlari, goz_oct_olcumleri, görüntü okuma Belge köprüsü')
on conflict (version) do nothing;
