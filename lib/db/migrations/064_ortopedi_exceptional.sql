-- 064 — ORTOPEDI-EXCEPTIONAL-01 (2026-09-19): Ortopedi ve Travmatoloji bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: ameliyathane planlama / OR scheduling, full HIS ve canlı Medula
-- e-imza KAPSAM DIŞI. 060_uroloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç, doz ve "kırık kaynamadı / artroz" kararı YALNIZ hekimin. Notya doz üretmez, tanı
-- kilitlemez, VAS / fonksiyon bandını tanıya çevirmez (bantlar karar desteğidir).

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_ortopedi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- serbest bölüm notları (hekimin girdiği): bölge, alçı/ortez tercihi, op-sonrası kilometre taşları
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_ortopedi_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_ortopedi_idx on hasta_ortopedi (doctor_id, next_kontrol);

-- ── Kırık / alçı / ortez izlem: yalnız hekimin girdiği alanlar + motor özeti (tanı değil) ───
create table if not exists orto_kirik_alci (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_ortopedi_id uuid references hasta_ortopedi(id) on delete cascade,
  tarih date not null,
  tip text not null check (tip in ('kirik','alci','ortez','op_sonrasi')),
  -- hekim alanları: bölge, taraf, NV durumu, alçı alma / yük verme tarihleri — doz YOK
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists orto_kirik_alci_idx on orto_kirik_alci (patient_id, tarih desc);
create index if not exists orto_kirik_alci_doktor_idx on orto_kirik_alci (doctor_id, tarih desc);

-- ── VAS / fonksiyon: 0–10 ağrı + mini fonksiyon maddeleri (şiddet karar desteği, tanı değil) ─
create table if not exists orto_vas (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_ortopedi_id uuid references hasta_ortopedi(id) on delete cascade,
  tarih date not null,
  vas numeric check (vas >= 0 and vas <= 10),
  fonksiyon_toplam numeric,
  bant text,
  hekim_kilit boolean not null default false,
  maddeler jsonb,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists orto_vas_idx on orto_vas (patient_id, tarih desc);
create index if not exists orto_vas_doktor_idx on orto_vas (doctor_id, tarih desc);

-- ── Görevler: alçı alma, yük verme, görüntü kontrolü, VAS tekrarı, op kilometre taşı ───────
create table if not exists orto_gorevleri (
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
create index if not exists orto_gorev_idx on orto_gorevleri (patient_id, durum, due);
create index if not exists orto_gorev_doktor_idx on orto_gorevleri (doctor_id, durum, due);

-- ── Acil / kırmızı bayrak: kompartman, NV kayıp, açık kırık, septik eklem, kauda, çıkık+NV ─
-- Ayaktan muayenehane akışı → 112 veya en yakın acil. Portal mesajı bu akışı YÖNETMEZ.
create table if not exists orto_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_ortopedi_id uuid references hasta_ortopedi(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists orto_risk_idx on orto_risk (patient_id, tarih desc);
create index if not exists orto_risk_doktor_idx on orto_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_ortopedi','orto_kirik_alci','orto_vas','orto_gorevleri','orto_risk'] loop
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
values ('064', '064_ortopedi_exceptional.sql', null, now(), false, 'ORTOPEDI-EXCEPTIONAL-01: hasta_ortopedi, orto_kirik_alci, orto_vas, orto_gorevleri, orto_risk + RLS')
on conflict (version) do nothing;
