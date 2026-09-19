-- 059 — NOROLOJI-EXCEPTIONAL-01 (2026-09-19): Nöroloji bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: inme ünitesi / inpatient stroke HIS, tanı kilidi ve
-- uydurma doz KAPSAM DIŞI. 057_kbb_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- MIDAS/atak skorunu tanıya çevirmez. Medula'ya canlı e-imza yoktur. Pediatri büyüme / baş çevresi sızmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_noroloji (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_noroloji_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_noroloji_idx on hasta_noroloji (doctor_id, next_kontrol);

-- ── Migren günlüğü: atak günleri + engellilik günleri (MIDAS tarzı karar desteği) ─────────
-- Skor SINIRLARI motorda (specialties/noroloji/engines/migren.ts) doğrulanır; DB yalnız saklar.
-- Skor bandı KARAR DESTEĞİDİR — "migren tanısı" veya doz yazılmaz.
create table if not exists noro_migren (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_noroloji_id uuid references hasta_noroloji(id) on delete cascade,
  tarih date not null,
  -- son 3 ay: ağrılı gün, iş/okul kaçırılan, verim düşüren, boş zaman kaçırılan gün sayıları
  maddeler jsonb,
  toplam integer,
  bant text,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists noro_migren_idx on noro_migren (patient_id, tarih desc);
create index if not exists noro_migren_doktor_idx on noro_migren (doctor_id, tarih desc);

-- ── Görevler: kontrol, ilaç izlem (AED lab), ölçek tekrarı, rapor ─────────────────────────
create table if not exists noro_gorevleri (
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
create index if not exists noro_gorev_idx on noro_gorevleri (patient_id, durum, due);
create index if not exists noro_gorev_doktor_idx on noro_gorevleri (doctor_id, durum, due);

-- ── Acil / inme-TIA kırmızı bayrak: bayraklar + hekimin eylemi ve onayı ───────────────────
-- Ayaktan muayenehane akışı: ani yüz kayması, konuşma bozukluğu, güç kaybı, görme kaybı,
-- ani şiddetli baş ağrısı, bilinç değişikliği → 112. Portal mesajı bu akışı YÖNETMEZ.
create table if not exists noro_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_noroloji_id uuid references hasta_noroloji(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists noro_risk_idx on noro_risk (patient_id, tarih desc);
create index if not exists noro_risk_doktor_idx on noro_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_noroloji','noro_migren','noro_gorevleri','noro_risk'] loop
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
values ('062', '062_noroloji_exceptional.sql', null, now(), false, 'NOROLOJI-EXCEPTIONAL-01: hasta_noroloji, noro_migren, noro_gorevleri, noro_risk + RLS')
on conflict (version) do nothing;
