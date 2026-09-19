-- 067 — ENDOKRINOLOJI-EXCEPTIONAL-01 (2026-09-19): Endokrinoloji bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: CGM cihaz entegrasyonu core ürünü DEĞİLDİR;
-- tanı kilidi ve uydurma insülin dozu KAPSAM DIŞI. 062_noroloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- HbA1c/TSH değerini tanıya çevirmez. Medula'ya canlı e-imza yoktur. Pediatri büyüme / baş çevresi sızmaz.
-- Dahiliye DM araçları bu tablolara bağlanmaz — endokrin chapter yalnız endokrin hekimine aittir.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_endokrinoloji (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- dates-only rejim kartı: { insulin_baslangic, insulin_kontrol, tiroid_baslangic, tiroid_kontrol, not }
  rejim jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_endokrinoloji_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_endokrinoloji_idx on hasta_endokrinoloji (doctor_id, next_kontrol);

-- ── Lab izlem: HbA1c / TSH (ve isteğe bağlı FT4) kayıtları — karar desteği, tanı değil ─────
-- Değerler hekim girer; motor yalnız sonraki izlem aralığı önerir. Tanı / doz yazılmaz.
create table if not exists endo_lab (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_endokrinoloji_id uuid references hasta_endokrinoloji(id) on delete cascade,
  tarih date not null,
  tur text not null check (tur in ('hba1c','tsh','ft4','diger')),
  deger numeric,
  birim text,
  -- motor çıktısı: sonraki önerilen izlem tarihi (hekim onaylar)
  sonraki_izlem date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists endo_lab_idx on endo_lab (patient_id, tarih desc);
create index if not exists endo_lab_doktor_idx on endo_lab (doctor_id, tarih desc);

-- ── Görevler: kontrol, HbA1c/TSH izlem, DXA, rejim tarih hatırlatma ────────────────────────
create table if not exists endo_gorevleri (
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
create index if not exists endo_gorev_idx on endo_gorevleri (patient_id, durum, due);
create index if not exists endo_gorev_doktor_idx on endo_gorevleri (doctor_id, durum, due);

-- ── Acil / endokrin kırmızı bayrak: ciddi hipoglisemi, DKA şüphesi, tiroid fırtınası ───────
-- Ayaktan muayenehane akışı → 112. Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz.
create table if not exists endo_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_endokrinoloji_id uuid references hasta_endokrinoloji(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists endo_acil_idx on endo_acil (patient_id, tarih desc);
create index if not exists endo_acil_doktor_idx on endo_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_endokrinoloji','endo_lab','endo_gorevleri','endo_acil'] loop
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
values ('067', '067_endokrinoloji_exceptional.sql', null, now(), false, 'ENDOKRINOLOJI-EXCEPTIONAL-01: hasta_endokrinoloji, endo_lab, endo_gorevleri, endo_acil + RLS')
on conflict (version) do nothing;
