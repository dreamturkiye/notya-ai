-- 070 — ROMATOLOJI-EXCEPTIONAL-01 (2026-09-19): Romatoloji bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: infüzyon süiti / HIS randevu çekirdek ürünü DEĞİLDİR;
-- tanı kilidi ve uydurma biyolojik doz KAPSAM DIŞI. 067_endokrinoloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- DAS28/BASDAI bandını tanıya çevirmez. Medula'ya canlı e-imza yoktur. Pediatri büyüme / baş çevresi sızmaz.
-- Ortopedi / FTR araçları bu tablolara bağlanmaz — romatoloji chapter yalnız romatoloji hekimine aittir.

create table if not exists hasta_romatoloji (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- dates-only / checklist snapshot (doz yok): { biyolojik_baslangic, biyolojik_kontrol, sut_ozet, not }
  plan jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_romatoloji_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_romatoloji_idx on hasta_romatoloji (doctor_id, next_kontrol);

-- DAS28 / BASDAI skor anları — karar desteği, tanı değil
create table if not exists roma_skor (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_romatoloji_id uuid references hasta_romatoloji(id) on delete cascade,
  tarih date not null,
  tur text not null check (tur in ('das28_crp','das28_esr','basdai')),
  toplam numeric,
  bant text,
  girdi jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists roma_skor_idx on roma_skor (patient_id, tarih desc);
create index if not exists roma_skor_doktor_idx on roma_skor (doctor_id, tarih desc);

-- Lab izlem: CRP / ESR / RF / anti-CCP — karar desteği
create table if not exists roma_lab (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_romatoloji_id uuid references hasta_romatoloji(id) on delete cascade,
  tarih date not null,
  tur text not null check (tur in ('crp','esr','rf','anti_ccp','diger')),
  deger numeric,
  birim text,
  sonraki_izlem date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists roma_lab_idx on roma_lab (patient_id, tarih desc);
create index if not exists roma_lab_doktor_idx on roma_lab (doctor_id, tarih desc);

-- Eklem haritası (28 eklem veya serbest işaret) — sayım karar desteği
create table if not exists roma_eklem (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_romatoloji_id uuid references hasta_romatoloji(id) on delete cascade,
  tarih date not null,
  hassas text[] not null default '{}',
  siskin text[] not null default '{}',
  tjc integer,
  sjc integer,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists roma_eklem_idx on roma_eklem (patient_id, tarih desc);

create table if not exists roma_gorevleri (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  kod text not null,
  ad text not null,
  due date,
  durum text not null default 'acik' check (durum in ('acik','tamam')),
  kaynak text,
  tamam_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists roma_gorev_idx on roma_gorevleri (patient_id, durum, due);
create index if not exists roma_gorev_doktor_idx on roma_gorevleri (doctor_id, durum, due);

-- Acil: septik artrit şüphesi, ciddii lupus alevi, vb. → 112. Portal yönetmez.
create table if not exists roma_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_romatoloji_id uuid references hasta_romatoloji(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists roma_acil_idx on roma_acil (patient_id, tarih desc);
create index if not exists roma_acil_doktor_idx on roma_acil (doctor_id, tarih desc);

do $$
declare t text;
begin
  foreach t in array array['hasta_romatoloji','roma_skor','roma_lab','roma_eklem','roma_gorevleri','roma_acil'] loop
    execute format('alter table public.%I enable row level security', t);
    begin
      execute format('create policy "hasta_izolasyon_kendi_satiri" on public.%I for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid())', t);
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
values ('070', '070_romatoloji_exceptional.sql', null, now(), false, 'ROMATOLOJI-EXCEPTIONAL-01: hasta_romatoloji, roma_skor, roma_lab, roma_eklem, roma_gorevleri, roma_acil + RLS')
on conflict (version) do nothing;
