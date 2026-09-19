-- 079 — ANESTEZI-EXCEPTIONAL-01 (2026-09-19): Anesteziyoloji ve Reanimasyon bölüm derinliği.
-- Ticari ayaktan / poliklinik ürünü: ameliyathane OR anestezi makinesi HIS, tanı kilidi ve
-- uydurma ilaç dozları KAPSAM DIŞI. 077_beyin_cerrahisi_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- ASA / hava yolu / ağrı bayrağını tanıya çevirmez. Genel cerrahi / göğüs cerrahisi araçları bu tablolara bağlanmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_anestezi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- ASA / pre-op checklist özeti: { secilen: string[], asaSinif?, tarih, not } — tanı/doz yok
  asa jsonb,
  -- hava yolu notu özeti: { bayraklar, tarih, not } — tanı/doz yok
  hava_yolu jsonb,
  -- post-op ağrı izlem özeti: { bayraklar, skor?, tarih, not } — mg doz yok
  agri jsonb,
  -- ek: alerji/ilaç bayrakları (yalnız kod; doz yok)
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_anestezi_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_anestezi_idx on hasta_anestezi (doctor_id, next_kontrol);

-- ── ASA / pre-op checklist — madde kodları + tarih; tanı/OR HIS YOK ────────────────────────
create table if not exists anestezi_asa (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_anestezi_id uuid references hasta_anestezi(id) on delete cascade,
  tarih date not null,
  maddeler jsonb,
  asa_sinif text,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists anestezi_asa_idx on anestezi_asa (patient_id, tarih desc);
create index if not exists anestezi_asa_doktor_idx on anestezi_asa (doctor_id, tarih desc);

-- ── Hava yolu notu — bayraklar + tarihler; entübasyon tekniği / doz YOK ─────────────────────
create table if not exists anestezi_hava_yolu (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_anestezi_id uuid references hasta_anestezi(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists anestezi_hava_yolu_idx on anestezi_hava_yolu (patient_id, tarih desc);
create index if not exists anestezi_hava_yolu_doktor_idx on anestezi_hava_yolu (doctor_id, tarih desc);

-- ── Post-op ağrı izlem — skor/bayrak + tarih; analjezik mg doz YOK ──────────────────────────
create table if not exists anestezi_agri (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_anestezi_id uuid references hasta_anestezi(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  agri_skor integer,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists anestezi_agri_idx on anestezi_agri (patient_id, tarih desc);
create index if not exists anestezi_agri_doktor_idx on anestezi_agri (doctor_id, tarih desc);

-- ── Görevler: pre-op, hava yolu, ağrı, alerji, kontrol ─────────────────────────────────────
create table if not exists anestezi_gorevleri (
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
create index if not exists anestezi_gorev_idx on anestezi_gorevleri (patient_id, durum, due);
create index if not exists anestezi_gorev_doktor_idx on anestezi_gorevleri (doctor_id, durum, due);

-- ── Acil / anestezi kırmızı bayrak ─────────────────────────────────────────────────────────
-- Ayaktan / poliklinik: zor hava yolu, anafilaksi, MH şüphesi, aspirasyon → 112.
-- Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz. İlaç dozu yazılmaz.
create table if not exists anestezi_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_anestezi_id uuid references hasta_anestezi(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists anestezi_acil_idx on anestezi_acil (patient_id, tarih desc);
create index if not exists anestezi_acil_doktor_idx on anestezi_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_anestezi','anestezi_asa','anestezi_hava_yolu','anestezi_agri','anestezi_gorevleri','anestezi_acil'] loop
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
values ('079', '079_anestezi_exceptional.sql', null, now(), false, 'ANESTEZI-EXCEPTIONAL-01: hasta_anestezi, anestezi_asa, anestezi_hava_yolu, anestezi_agri, anestezi_gorevleri, anestezi_acil + RLS')
on conflict (version) do nothing;
