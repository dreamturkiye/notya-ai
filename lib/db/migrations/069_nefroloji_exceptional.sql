-- 069 — NEFROLOJI-EXCEPTIONAL-01 (2026-09-19): Nefroloji bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: tam diyaliz makinesi HIS core ürünü DEĞİLDİR;
-- tanı kilidi ve uydurma ESA dozu KAPSAM DIŞI. 067_endokrinoloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- eGFR/Hb değerini tanıya çevirmez. Medula'ya canlı e-imza yoktur. Pediatri büyüme / baş çevresi sızmaz.
-- Dahiliye CKD araçları bu tablolara bağlanmaz — nefro chapter yalnız nefroloji hekimine aittir.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_nefroloji (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- diyaliz plan özeti (dates/modality labels only): { modality, baslangic, sonraki_seans, not }
  diyaliz jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_nefroloji_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_nefroloji_idx on hasta_nefroloji (doctor_id, next_kontrol);

-- ── eGFR / UACR kayıtları — KDIGO G×A karar desteği, tanı değil ───────────────────────────
create table if not exists nef_egfr (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_nefroloji_id uuid references hasta_nefroloji(id) on delete cascade,
  tarih date not null,
  egfr numeric,
  uacr numeric,
  g_evre text,
  a_evre text,
  renk text,
  sonraki_izlem date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists nef_egfr_idx on nef_egfr (patient_id, tarih desc);
create index if not exists nef_egfr_doktor_idx on nef_egfr (doctor_id, tarih desc);

-- ── Diyaliz seans / takip — tarihler ve modalite etiketi; makine HIS / reçete yok ──────────
create table if not exists nef_diyaliz (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_nefroloji_id uuid references hasta_nefroloji(id) on delete cascade,
  tarih date not null,
  -- hd | pd | hdf | diger — etiket; cihaz parametresi / UF / reçete yazılmaz
  modalite text not null check (modalite in ('hd','pd','hdf','diger')),
  sonraki_seans date,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists nef_diyaliz_idx on nef_diyaliz (patient_id, tarih desc);
create index if not exists nef_diyaliz_doktor_idx on nef_diyaliz (doctor_id, tarih desc);

-- ── Anemi-CKD izlem: Hb (ve isteğe bağlı ferritin) — ESA dozu YOK ─────────────────────────
create table if not exists nef_anemi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_nefroloji_id uuid references hasta_nefroloji(id) on delete cascade,
  tarih date not null,
  hb numeric,
  ferritin numeric,
  bant text,
  sonraki_izlem date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists nef_anemi_idx on nef_anemi (patient_id, tarih desc);
create index if not exists nef_anemi_doktor_idx on nef_anemi (doctor_id, tarih desc);

-- ── Görevler: kontrol, eGFR/UACR, diyaliz seans, anemi izlem ──────────────────────────────
create table if not exists nef_gorevleri (
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
create index if not exists nef_gorev_idx on nef_gorevleri (patient_id, durum, due);
create index if not exists nef_gorev_doktor_idx on nef_gorevleri (doctor_id, durum, due);

-- ── Acil / nefro kırmızı bayrak: hiperkalemi, aşırı sıvı, üremik acil ─────────────────────
-- Ayaktan muayenehane akışı → 112. Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz.
create table if not exists nef_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_nefroloji_id uuid references hasta_nefroloji(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists nef_acil_idx on nef_acil (patient_id, tarih desc);
create index if not exists nef_acil_doktor_idx on nef_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_nefroloji','nef_egfr','nef_diyaliz','nef_anemi','nef_gorevleri','nef_acil'] loop
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
values ('069', '069_nefroloji_exceptional.sql', null, now(), false, 'NEFROLOJI-EXCEPTIONAL-01: hasta_nefroloji, nef_egfr, nef_diyaliz, nef_anemi, nef_gorevleri, nef_acil + RLS')
on conflict (version) do nothing;
