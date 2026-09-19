-- 060 — UROLOJI-EXCEPTIONAL-01 (2026-09-19): Üroloji bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: ameliyathane planlama, cerrahi HIS ve canlı Medula
-- e-imza KAPSAM DIŞI. 057_kbb_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç, doz ve "BPH / prostat kanseri" kararı YALNIZ hekimin. Notya doz üretmez, tanı
-- kilitlemez, IPSS/PSA bandını tanıya çevirmez (bantlar karar desteğidir).

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_uro (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_uro_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_uro_idx on hasta_uro (doctor_id, next_kontrol);

-- ── IPSS: 7 madde 0–5, toplam 0–35, bant şiddet karar desteği (tanı değil) ──────────────────
create table if not exists uro_ipss (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_uro_id uuid references hasta_uro(id) on delete cascade,
  tarih date not null,
  toplam numeric check (toplam >= 0 and toplam <= 35),
  bant text,
  hekim_kilit boolean not null default false,
  maddeler jsonb,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists uro_ipss_idx on uro_ipss (patient_id, tarih desc);
create index if not exists uro_ipss_doktor_idx on uro_ipss (doctor_id, tarih desc);

-- ── PSA: ng/mL izlem (tanı değil); önceki değer / hız maddeler jsonb'de ─────────────────────
create table if not exists uro_psa (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_uro_id uuid references hasta_uro(id) on delete cascade,
  tarih date not null,
  deger_ng_ml numeric check (deger_ng_ml >= 0 and deger_ng_ml <= 1000),
  hekim_kilit boolean not null default false,
  maddeler jsonb,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists uro_psa_idx on uro_psa (patient_id, tarih desc);
create index if not exists uro_psa_doktor_idx on uro_psa (doctor_id, tarih desc);

-- ── Görevler: IPSS tekrarı, PSA izlem, kontrol, taş takibi, rapor ───────────────────────────
create table if not exists uro_gorevleri (
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
create index if not exists uro_gorev_idx on uro_gorevleri (patient_id, durum, due);
create index if not exists uro_gorev_doktor_idx on uro_gorevleri (doctor_id, durum, due);

-- ── Acil / kırmızı bayrak: hematuri, retansiyon, taş/pyelo, torsiyon, priapizm, üretra travması ─
create table if not exists uro_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_uro_id uuid references hasta_uro(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists uro_risk_idx on uro_risk (patient_id, tarih desc);
create index if not exists uro_risk_doktor_idx on uro_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_uro','uro_ipss','uro_psa','uro_gorevleri','uro_risk'] loop
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
values ('060', '060_uroloji_exceptional.sql', null, now(), false, 'UROLOJI-EXCEPTIONAL-01: hasta_uro, uro_ipss, uro_psa, uro_gorevleri, uro_risk + RLS')
on conflict (version) do nothing;
