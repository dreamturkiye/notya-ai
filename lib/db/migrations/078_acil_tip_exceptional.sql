-- 078 — ACIL-TIP-EXCEPTIONAL-01 (2026-09-19): Acil Tıp bölüm derinliği.
-- Ticari acil tıp / acil servis klinik ürünü: full ED bed board HIS, yatış boarding HIS,
-- tanı auto-lock, uydurma doz ve canlı Medula e-imza KAPSAM DIŞI.
-- 077_beyin_cerrahisi_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- ESI / kritik yol bayrağını tanıya çevirmez. Kardiyoloji STEMI / nöroloji İnme araçları bu tablolara bağlanmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_acil_tip (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- son ESI özeti: { seviye, kaynaklar, tarih, not } — tanı/doz yok
  esi jsonb,
  -- kritik yol özeti: { yollar, tarih, not } — STEMI/inme/travma bayrak; tanı kilidi yok
  kritik_yol jsonb,
  -- sevk/yatış paket özeti: { secilen, hedef, tarih, not } — boarding HIS yok
  sevk jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_acil_tip_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_acil_tip_idx on hasta_acil_tip (doctor_id, next_kontrol);

-- ── ESI triyaj kayıtları — seviye 1–5 + kaynak bayrakları; tanı/doz YOK ─────────────────────
create table if not exists at_esi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_acil_tip_id uuid references hasta_acil_tip(id) on delete cascade,
  tarih date not null,
  seviye smallint not null check (seviye between 1 and 5),
  kaynaklar text[] not null default '{}',
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists at_esi_idx on at_esi (patient_id, tarih desc);
create index if not exists at_esi_doktor_idx on at_esi (doctor_id, tarih desc);

-- ── Kritik yol checklist — STEMI / inme / travma bayrakları; tanı kilidi YOK ───────────────
create table if not exists at_kritik_yol (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_acil_tip_id uuid references hasta_acil_tip(id) on delete cascade,
  tarih date not null,
  yollar text[] not null default '{}',
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists at_kritik_yol_idx on at_kritik_yol (patient_id, tarih desc);
create index if not exists at_kritik_yol_doktor_idx on at_kritik_yol (doctor_id, tarih desc);

-- ── Sevk / yatış paket taslağı — madde + hedef; boarding HIS YOK ───────────────────────────
create table if not exists at_sevk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_acil_tip_id uuid references hasta_acil_tip(id) on delete cascade,
  tarih date not null,
  hedef text,
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists at_sevk_idx on at_sevk (patient_id, tarih desc);
create index if not exists at_sevk_doktor_idx on at_sevk (doctor_id, tarih desc);

-- ── Görevler: taburcu kontrol, kritik yol izlem, sevk takip ────────────────────────────────
create table if not exists at_gorevleri (
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
create index if not exists at_gorev_idx on at_gorevleri (patient_id, durum, due);
create index if not exists at_gorev_doktor_idx on at_gorevleri (doctor_id, durum, due);

-- ── Acil kırmızı bayrak (kötüleşme / resus / hava yolu) ───────────────────────────────────
-- Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz. Bed board HIS yok.
create table if not exists at_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_acil_tip_id uuid references hasta_acil_tip(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists at_risk_idx on at_risk (patient_id, tarih desc);
create index if not exists at_risk_doktor_idx on at_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_acil_tip','at_esi','at_kritik_yol','at_sevk','at_gorevleri','at_risk'] loop
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
values ('078', '078_acil_tip_exceptional.sql', null, now(), false, 'ACIL-TIP-EXCEPTIONAL-01: hasta_acil_tip, at_esi, at_kritik_yol, at_sevk, at_gorevleri, at_risk + RLS')
on conflict (version) do nothing;
