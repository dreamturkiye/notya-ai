-- 054 — DERM-EXCEPTIONAL-01 (2026-09-18): dermatoloji bölüm derinliği. YALNIZ EKLEME: yeni kolonlar nullable,
-- yeni tablolar. Veri silinmez / değişmez. 053_goz_exceptional.sql biçemiyle aynı: idempotent, tekrar çalıştırmak güvenli.
-- Hekim kilitleri aynı: tanı / basamak / doz / MED değeri yalnız hekim girişi; bu tablolar hekimin girdiğini saklar.
-- Notya doz üretmez, Medula'ya canlı gönderim yapmaz, Form 014'ü ağ üzerinden bildirmez.

-- ── Skorlar: bölge çalışma sayfası dökümü + SCORAD / IGA / BSA ──────────────────────────────
-- PASI ve EASI artık 4 bölge × (E/I/D + alan) girişinden hesaplanıyor; döküm `ek` jsonb'da saklanır
-- (bolgeler, bant, hekimin girdiği ham değerler). Toplamlar mevcut kolonlarda kalır.
alter table derm_skor_anlari add column if not exists scorad numeric check (scorad is null or scorad between 0 and 103);
alter table derm_skor_anlari add column if not exists iga smallint check (iga is null or iga between 0 and 4);
alter table derm_skor_anlari add column if not exists bsa_pct numeric check (bsa_pct is null or bsa_pct between 0 and 100);
alter table derm_skor_anlari add column if not exists ek jsonb;

-- ── Fototerapi ünitesi v2: seans başına doz adımı, eritem yanıtı, yanık protokolü ───────────
-- Doz ve artış oranı hekim / ünite protokolünden girilir — hesaplanmaz.
alter table derm_fototerapi_seanslari add column if not exists seans_no int check (seans_no is null or seans_no between 1 and 500);
alter table derm_fototerapi_seanslari add column if not exists doz_adimi_pct numeric check (doz_adimi_pct is null or doz_adimi_pct between -100 and 100);
alter table derm_fototerapi_seanslari add column if not exists eritem text check (eritem is null or eritem in ('yok','minimal','agrili','bullu'));
alter table derm_fototerapi_seanslari add column if not exists kacirilan_gun int check (kacirilan_gun is null or kacirilan_gun between 0 and 365);
alter table derm_fototerapi_seanslari add column if not exists yanik_protokolu jsonb;
alter table derm_fototerapi_seanslari add column if not exists not_hemsire text;

-- MED / MPD testi — cihaz başına, hekim okur ve girer (solaryum cihaz listesinde yok)
create table if not exists derm_med_kayitlari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  hasta_derm_id uuid references hasta_derm(id) on delete cascade,
  tarih date not null,
  device text not null check (device in ('nb-uvb-311','bb-uvb','puva-oral','puva-bath','local-puva','excimer-308','uva1')),
  deger numeric not null check (deger > 0),
  birim text not null check (birim in ('mJ/cm²','J/cm²')),
  test_foto_core_image_id uuid,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists derm_med_idx on derm_med_kayitlari (patient_id, tarih desc);

-- ── Yama: seri seçimi + ICDRG okuma dereceleri (alerjen kodu → derece) ─────────────────────
alter table derm_yama_kurslari add column if not exists d2_dereceler jsonb;
alter table derm_yama_kurslari add column if not exists d4_dereceler jsonb;
-- Mevcut kayıtlarda series = 'european_baseline'; ek seriler için CHECK gevşetilir (varsa).
do $$
begin
  alter table derm_yama_kurslari drop constraint derm_yama_kurslari_series_check;
exception when undefined_object then null;
end $$;
do $$
begin
  alter table derm_yama_kurslari add constraint derm_yama_kurslari_series_chk
    check (series in ('european_baseline','ek_kozmetik','ek_sac','ek_mesleki','ek_hekim'));
exception when duplicate_object then null;
end $$;

-- ── Kozmetik işlem izlenebilirliği: lot + komplikasyon (yalnız kozmetik ünitesi UI'sinde) ──
alter table derm_islemler add column if not exists urun text;
alter table derm_islemler add column if not exists lot_no text;
alter table derm_islemler add column if not exists son_kullanma date;
alter table derm_islemler add column if not exists test_spot boolean;
alter table derm_islemler add column if not exists komplikasyonlar jsonb;
alter table derm_islemler add column if not exists komplikasyon_notu text;

-- ── Bölüm kaydı: acil işaretleri, hekimin kilitlediği basamak, saç/tırnak ek alanları ──────
alter table hasta_derm add column if not exists acil_isaretleri jsonb;
alter table hasta_derm add column if not exists basamak_kilidi jsonb;
alter table hasta_derm add column if not exists psa_triyaj jsonb;
alter table hasta_derm add column if not exists behcet_izlem jsonb;
alter table hasta_derm add column if not exists bulloz_izlem jsonb;

-- Biyolojik / sistemik SUT rapor taslağı — hekim kilitler, Medula girişini hekim yapar
create table if not exists derm_biyolojik_raporlar (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  hasta_derm_id uuid references hasta_derm(id) on delete cascade,
  sablon text not null check (sablon in ('baslangic','idame')),
  endikasyon text not null,
  -- etken madde adı hekim girişi; DOZ SAKLANMAZ (4.x doz kilidi)
  etken_madde text,
  taslak_metni text,
  eksikler jsonb,
  kilitli boolean not null default false,
  kilit_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists derm_biyolojik_rapor_idx on derm_biyolojik_raporlar (patient_id, created_at desc);

-- Dermoskopi çalışma sayfası sonuçları (3 nokta / 7 nokta / CASH) — tanı değil, uzman kararına girdi
create table if not exists derm_dermoskopi_skorlari (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id), doctor_id uuid not null references auth.users(id),
  lezyon_id uuid references derm_lezyonlar(id) on delete set null,
  algoritma text not null check (algoritma in ('uc_nokta','yedi_nokta','cash')),
  toplam numeric not null,
  esik_ustu boolean not null default false,
  isaretli jsonb,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists derm_dermoskopi_skor_idx on derm_dermoskopi_skorlari (patient_id, created_at desc);

-- RLS: doktor-kendi politikası + (052 deseni) restrictive hasta sahipliği
do $$
declare t text;
begin
  foreach t in array array['derm_med_kayitlari','derm_biyolojik_raporlar','derm_dermoskopi_skorlari'] loop
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

-- DERM-EXCEPTIONAL-01 — Belge Tier A → derm dual-sign okuma köprüsü.
-- Additive only. derm_vision_reads zaten dual-sign kaydı (asistan draft → uzman onay); burada
-- taslağın NEREDEN geldiği (Belge kasası analizi) ve hangi güven üst sınırıyla yazıldığı saklanır.
-- RLS: hasta_derm üzerinden doctor-own (027_derm_clinic_fit.sql politikaları geçerli kalır).

alter table derm_vision_reads add column if not exists kaynak text not null default 'hekim';
alter table derm_vision_reads add column if not exists belge_id uuid;
alter table derm_vision_reads add column if not exists belge_analiz_id uuid;
alter table derm_vision_reads add column if not exists modalite text;
alter table derm_vision_reads add column if not exists bolge text;
alter table derm_vision_reads add column if not exists fitzpatrick_bilinmiyor boolean;
alter table derm_vision_reads add column if not exists guven_ust_pct integer;
alter table derm_vision_reads add column if not exists asistan_rapor jsonb;

-- Aynı Belge analizi ikinci kez aktarılamaz (onay bekleyen taslak varken 409).
create unique index if not exists derm_vision_belge_analiz_draft_idx
  on derm_vision_reads (belge_analiz_id)
  where belge_analiz_id is not null and status = 'draft';

create index if not exists derm_vision_kaynak_idx on derm_vision_reads (hasta_derm_id, kaynak);

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('054', '054_derm_exceptional.sql', null, now(), false, 'DERM-EXCEPTIONAL-01: skor/fototerapi/yama/SUT/acil/dermoskopi + Belge dual-sign vision columns')
on conflict (version) do nothing;
