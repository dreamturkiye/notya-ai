-- 066 — SPOR-HEKIMLIGI-EXCEPTIONAL-01 (2026-09-19): Spor Hekimliği bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: takım kadrosu HIS, doping panelleri (çekirdek ürün),
-- tanı kilidi ve uydurma doz KAPSAM DIŞI. 060_uroloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç, doz ve "sporcu dönüş" kararı YALNIZ hekimin. Notya doz üretmez, tanı
-- kilitlemez, RTP basamağını tanıya çevirmez (basamaklar karar desteğidir).

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_spor (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  spor_dali text,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_spor_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_spor_idx on hasta_spor (doctor_id, next_kontrol);

-- ── RTP: return-to-play basamak (0–5); karar desteği, tanı değil ────────────────────────────
create table if not exists spor_rtp (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_spor_id uuid references hasta_spor(id) on delete cascade,
  tarih date not null,
  basamak smallint not null check (basamak >= 0 and basamak <= 5),
  hekim_kilit boolean not null default false,
  maddeler jsonb,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists spor_rtp_idx on spor_rtp (patient_id, tarih desc);
create index if not exists spor_rtp_doktor_idx on spor_rtp (doctor_id, tarih desc);

-- ── Sakatlık günlüğü: bölge · mekanizma · şiddet bandı (tanı değil) · yüklenme notu ─────────
create table if not exists spor_sakatlik (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_spor_id uuid references hasta_spor(id) on delete cascade,
  tarih date not null,
  bolge text not null,
  mekanizma text,
  siddet_bant text,
  durum text not null default 'aktif' check (durum in ('aktif','iyilesiyor','kapandi')),
  yuklenme_uyari boolean not null default false,
  hekim_kilit boolean not null default false,
  maddeler jsonb,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists spor_sakatlik_idx on spor_sakatlik (patient_id, tarih desc);
create index if not exists spor_sakatlik_doktor_idx on spor_sakatlik (doctor_id, tarih desc);

-- ── Görevler: RTP kontrolü, sakatlık izlem, kontrol, yüklenme takibi ────────────────────────
create table if not exists spor_gorevleri (
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
create index if not exists spor_gorev_idx on spor_gorevleri (patient_id, durum, due);
create index if not exists spor_gorev_doktor_idx on spor_gorevleri (doctor_id, durum, due);

-- ── Acil / kırmızı bayrak: konküzyon, egzersiz göğüs ağrısı, senkop, kırık+nöro, kompartman ─
create table if not exists spor_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_spor_id uuid references hasta_spor(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists spor_risk_idx on spor_risk (patient_id, tarih desc);
create index if not exists spor_risk_doktor_idx on spor_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_spor','spor_rtp','spor_sakatlik','spor_gorevleri','spor_risk'] loop
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
values ('066', '066_spor_hekimligi_exceptional.sql', null, now(), false, 'SPOR-HEKIMLIGI-EXCEPTIONAL-01: hasta_spor, spor_rtp, spor_sakatlik, spor_gorevleri, spor_risk + RLS')
on conflict (version) do nothing;
