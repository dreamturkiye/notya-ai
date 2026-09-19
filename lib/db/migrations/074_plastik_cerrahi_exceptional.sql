-- 074 — PLASTIK-CERRAHI-EXCEPTIONAL-01 (2026-09-19): Plastik, Rekonstrüktif ve Estetik Cerrahi.
-- Ticari ayaktan muayenehane / poliklinik ürünü: ameliyathane planlama / OR scheduling, full HIS,
-- tanı auto-lock ve uydurma doz KAPSAM DIŞI. 072_onkoloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, işlem endikasyonu, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez,
-- tanı kilitlemez, foto zaman çizgisini tanıya çevirmez. Dermatoloji / genel cerrahi bu tablolara bağlanmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_plastik (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- son yara/greft özeti (dates + bölge etiketi; tanı yok): { bolge, tip, dresing, dikisAlma, not }
  yara jsonb,
  -- foto zaman çizgisi köprü özeti: { sonraki, etiket, sonTarih }
  foto jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_plastik_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_plastik_idx on hasta_plastik (doctor_id, next_kontrol);

-- ── Yara / greft / flep izlem — tarih + bölge; tanı / skor / doz YOK ───────────────────────
create table if not exists plastik_yara (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_plastik_id uuid references hasta_plastik(id) on delete cascade,
  tarih date not null,
  tip text not null check (tip in ('yara','greft','flep','dikis','pansiyel','diger')),
  -- hekim alanları: bölge, taraf, pansuman/dikiş alma tarihleri — doz YOK
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists plastik_yara_idx on plastik_yara (patient_id, tarih desc);
create index if not exists plastik_yara_doktor_idx on plastik_yara (doctor_id, tarih desc);

-- ── Foto zaman çizgisi köprü — yalnız tarih + etiket; AI tanı / morfoloji YOK ──────────────
create table if not exists plastik_foto (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_plastik_id uuid references hasta_plastik(id) on delete cascade,
  tarih date not null,
  etiket text not null,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists plastik_foto_idx on plastik_foto (patient_id, tarih desc);
create index if not exists plastik_foto_doktor_idx on plastik_foto (doctor_id, tarih desc);

-- ── Görevler: pansuman, dikiş alma, foto kontrol, greft izlem, onam ───────────────────────
create table if not exists plastik_gorevleri (
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
create index if not exists plastik_gorev_idx on plastik_gorevleri (patient_id, durum, due);
create index if not exists plastik_gorev_doktor_idx on plastik_gorevleri (doctor_id, durum, due);

-- ── Acil / kırmızı bayrak: flep kompromisi, hematom, enfeksiyon, ayrışma ───────────────────
-- Ayaktan muayenehane akışı → 112 veya en yakın acil. Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz.
create table if not exists plastik_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_plastik_id uuid references hasta_plastik(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists plastik_acil_idx on plastik_acil (patient_id, tarih desc);
create index if not exists plastik_acil_doktor_idx on plastik_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_plastik','plastik_yara','plastik_foto','plastik_gorevleri','plastik_acil'] loop
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
values ('074', '074_plastik_cerrahi_exceptional.sql', null, now(), false, 'PLASTIK-CERRAHI-EXCEPTIONAL-01: hasta_plastik, plastik_yara, plastik_foto, plastik_gorevleri, plastik_acil + RLS')
on conflict (version) do nothing;
