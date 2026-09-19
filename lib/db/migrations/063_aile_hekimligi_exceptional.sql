-- 063 — AILE-HEKIMLIGI-EXCEPTIONAL-01 (2026-09-19): Aile Hekimliği bölüm derinliği.
-- Ticari birinci basamak / aile hekimliği muayenehanesi ürünü: tam ulusal AHIS, tanı kilidi ve
-- uydurma doz KAPSAM DIŞI. 062_noroloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- aşı/tarama veya kronik izlem vadelerini tanıya çevirmez. Medula'ya canlı e-imza yoktur.
-- Pediatri Baş Çevresi / Neyzi yalnız çocuk hastada (pediatrikBaglam: cocuk-hastada) — yetişkinde sızmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_aile (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_aile_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_aile_idx on hasta_aile (doctor_id, next_kontrol);

-- ── Aşı / tarama paketi: hekimin işaretlediği vade tarihleri (doz / aşı lot numarası yok) ──
-- Paket kodu ve vade SAF motorlarda (specialties/aile-hekimligi/engines/asiTarama.ts) doğrulanır.
create table if not exists aile_asi_tarama (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_aile_id uuid references hasta_aile(id) on delete cascade,
  tarih date not null,
  paket_kodlari text[] not null default '{}',
  not_hekim text,
  hekim_kilit boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists aile_asi_tarama_idx on aile_asi_tarama (patient_id, tarih desc);
create index if not exists aile_asi_tarama_doktor_idx on aile_asi_tarama (doctor_id, tarih desc);

-- ── Kronik paket (DM / HT): izlem vadesi — doz / hedef sayı / tanı yazılmaz ───────────────
create table if not exists aile_kronik (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_aile_id uuid references hasta_aile(id) on delete cascade,
  tarih date not null,
  paketler text[] not null default '{}',
  sonraki_izlem date,
  not_hekim text,
  hekim_kilit boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists aile_kronik_idx on aile_kronik (patient_id, tarih desc);
create index if not exists aile_kronik_doktor_idx on aile_kronik (doctor_id, sonraki_izlem);

-- ── Görevler: aşı/tarama vadesi, kronik izlem, sevk takip, kontrol ────────────────────────
create table if not exists aile_gorevleri (
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
create index if not exists aile_gorev_idx on aile_gorevleri (patient_id, durum, due);
create index if not exists aile_gorev_doktor_idx on aile_gorevleri (doctor_id, durum, due);

-- ── Sevk / acil kırmızı bayrak: bayraklar + hekimin eylemi ve onayı ───────────────────────
-- Birinci basamak: göğüs ağrısı, ani nefes darlığı, bilinç değişikliği, şiddetli kanama,
-- ani güç kaybı / yüz kayması → 112. Portal mesajı bu akışı YÖNETMEZ.
create table if not exists aile_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_aile_id uuid references hasta_aile(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists aile_risk_idx on aile_risk (patient_id, tarih desc);
create index if not exists aile_risk_doktor_idx on aile_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_aile','aile_asi_tarama','aile_kronik','aile_gorevleri','aile_risk'] loop
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
values ('063', '063_aile_hekimligi_exceptional.sql', null, now(), false, 'AILE-HEKIMLIGI-EXCEPTIONAL-01: hasta_aile, aile_asi_tarama, aile_kronik, aile_gorevleri, aile_risk + RLS')
on conflict (version) do nothing;
