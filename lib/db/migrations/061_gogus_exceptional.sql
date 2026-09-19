-- 061 — GOGUS-EXCEPTIONAL-01 (2026-09-19): Göğüs Hastalıkları bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: tam SFT cihaz entegrasyonu, tanı auto-lock,
-- uydurma doz ve göğüs cerrahisi / toraks OR iş akışı KAPSAM DIŞI (gogus-cerrahisi ayrı branş).
-- 057_kbb_exceptional.sql biçemiyle aynı. YALNIZ EKLEME. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz YALNIZ hekimin. CAT/mMRC/GOLD grubu KARAR DESTEĞİDİR.
-- Medula'ya canlı e-imza yoktur.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_gogus (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- serbest bölüm notları (hekimin kendi girdiği): sigara paketyılı, aksiyon planı tercihi, izlem
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_gogus_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_gogus_idx on hasta_gogus (doctor_id, next_kontrol);

-- ── Skorlar: CAT, mMRC, hekim kilidi (tanı değil) ──────────────────────────────────────────
-- Bant/grup SINIRLARI motorda (specialties/gogus-hastaliklari/engines/catMmrc.ts) doğrulanır; DB yalnız saklar.
create table if not exists gogus_skor (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_gogus_id uuid references hasta_gogus(id) on delete cascade,
  tarih date not null,
  -- 'cat' | 'mmrc' | 'astim_kontrol' — motor doğrular
  tur text not null,
  toplam integer,
  -- hekim sonucu gördü ve kilitledi (skor tanı DEĞİLDİR)
  hekim_kilit boolean not null default false,
  maddeler jsonb,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists gogus_skor_idx on gogus_skor (patient_id, tarih desc);
create index if not exists gogus_skor_doktor_idx on gogus_skor (doctor_id, tarih desc);

-- ── Görevler: spirometri tekrarı, kontrol, inhaler teknik, rapor yenileme ───────────────────
create table if not exists gogus_gorevleri (
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
create index if not exists gogus_gorev_idx on gogus_gorevleri (patient_id, durum, due);
create index if not exists gogus_gorev_doktor_idx on gogus_gorevleri (doctor_id, durum, due);

-- ── Acil / kırmızı bayrak: hemoptizi, hipoksi, pnömotoraks şüphesi, … ───────────────────────
-- Ayaktan muayenehane: masif hemoptizi, SpO₂ düşük + solunum sıkıntısı, ani göğüs ağrısı + nefes
-- darlığı → 112. Portal mesajı bu akışı YÖNETMEZ. gogus-cerrahisi OR akışı buraya girmez.
create table if not exists gogus_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_gogus_id uuid references hasta_gogus(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists gogus_risk_idx on gogus_risk (patient_id, tarih desc);
create index if not exists gogus_risk_doktor_idx on gogus_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_gogus','gogus_skor','gogus_gorevleri','gogus_risk'] loop
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
values ('061', '061_gogus_exceptional.sql', null, now(), false, 'GOGUS-EXCEPTIONAL-01: hasta_gogus, gogus_skor, gogus_gorevleri, gogus_risk + RLS')
on conflict (version) do nothing;
