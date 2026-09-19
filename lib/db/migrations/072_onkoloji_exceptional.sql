-- 072 — ONKOLOJI-EXCEPTIONAL-01 (2026-09-19): Tıbbi Onkoloji bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: eczane kemoterapi doz motoru core ürünü DEĞİLDİR;
-- tanı/evre kilidi, uydurma doz ve canlı Medula e-imza KAPSAM DIŞI. 067_endokrinoloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, evre, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı/evre kilitlemez,
-- SUT taslağını canlı imzalamaz. Pediatri büyüme / baş çevresi sızmaz.
-- Dahiliye WOW bu tablolara bağlanmaz — onkoloji chapter yalnız onkoloji hekimine aittir.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_onkoloji (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- dates + cycle counts only: { protokolEtiket, mevcutKur, toplamKur, sonKurTarihi, sonrakiKurTarihi, not }
  kur jsonb,
  -- son toksisite checklist özeti (kod listesi) — grade/tanı yok
  toksisite jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_onkoloji_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_onkoloji_idx on hasta_onkoloji (doctor_id, next_kontrol);

-- ── Kür / döngü kayıtları — sayı + tarih; doz / BSA / AUC YOK ─────────────────────────────
create table if not exists onko_kur (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_onkoloji_id uuid references hasta_onkoloji(id) on delete cascade,
  tarih date not null,
  mevcut_kur integer not null,
  toplam_kur integer,
  protokol_etiket text,
  sonraki_kur date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists onko_kur_idx on onko_kur (patient_id, tarih desc);
create index if not exists onko_kur_doktor_idx on onko_kur (doctor_id, tarih desc);

-- ── Görevler: kontrol, kür günü, toksisite, lab, görüntü ──────────────────────────────────
create table if not exists onko_gorevleri (
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
create index if not exists onko_gorev_idx on onko_gorevleri (patient_id, durum, due);
create index if not exists onko_gorev_doktor_idx on onko_gorevleri (doctor_id, durum, due);

-- ── Acil / onkoloji kırmızı bayrak: febril nötropeni, spinal bası, TLS, … ─────────────────
-- Ayaktan muayenehane akışı → 112. Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz.
create table if not exists onko_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_onkoloji_id uuid references hasta_onkoloji(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists onko_acil_idx on onko_acil (patient_id, tarih desc);
create index if not exists onko_acil_doktor_idx on onko_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_onkoloji','onko_kur','onko_gorevleri','onko_acil'] loop
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
values ('072', '072_onkoloji_exceptional.sql', null, now(), false, 'ONKOLOJI-EXCEPTIONAL-01: hasta_onkoloji, onko_kur, onko_gorevleri, onko_acil + RLS')
on conflict (version) do nothing;
