-- 068 — GASTROENTEROLOJI-EXCEPTIONAL-01 (2026-09-19): Gastroenteroloji bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: tam endoskopi suite / HIS core ürünü DEĞİLDİR;
-- tanı kilidi ve uydurma antiviral / PPI / biyolojik dozu KAPSAM DIŞI. 067_endokrinoloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- IBD/IBS skorunu tanıya çevirmez. Medula'ya canlı e-imza yoktur. Pediatri büyüme / baş çevresi sızmaz.
-- Dahiliye FIB-4 / GGK araçları bu tablolara bağlanmaz — gastro chapter yalnız gastro hekimine aittir.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_gastroenteroloji (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- dates-only rejim kartı: { ppi_baslangic, ppi_kontrol, biyolojik_baslangic, biyolojik_kontrol, not }
  rejim jsonb,
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_gastroenteroloji_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_gastroenteroloji_idx on hasta_gastroenteroloji (doctor_id, next_kontrol);

-- ── IBD / IBS skor kaydı — karar desteği, tanı değil ──────────────────────────────────────
-- Skor hekim girer; motor yalnız şiddet bandı + sonraki kontrol önerisi üretir. Tanı / doz yazılmaz.
create table if not exists gastro_skor (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_gastroenteroloji_id uuid references hasta_gastroenteroloji(id) on delete cascade,
  tarih date not null,
  tur text not null check (tur in ('mayo_kismi','hbi','ibs_sss','diger')),
  skor numeric,
  bant text,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists gastro_skor_idx on gastro_skor (patient_id, tarih desc);
create index if not exists gastro_skor_doktor_idx on gastro_skor (doctor_id, tarih desc);

-- ── Endoskopi belge köprüsü — HIS / ameliyathane / canlı randevu DEĞİL ─────────────────────
-- Yalnız hekim dosyasındaki belgeye köprü + işlem türü + tarih + sonraki kontrol. Rapor üretmez.
create table if not exists gastro_endoskopi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_gastroenteroloji_id uuid references hasta_gastroenteroloji(id) on delete cascade,
  tarih date not null,
  tur text not null check (tur in ('egd','kolonoskopi','sigmoidoskopi','eus','ercp','kapsul','diger')),
  belge_id uuid,
  sonraki_kontrol date,
  hekim_not text,
  created_at timestamptz not null default now()
);
create index if not exists gastro_endoskopi_idx on gastro_endoskopi (patient_id, tarih desc);
create index if not exists gastro_endoskopi_doktor_idx on gastro_endoskopi (doctor_id, tarih desc);

-- ── HBV / HCV izlem vadeleri — antiviral doz YOK ──────────────────────────────────────────
create table if not exists gastro_hepatit (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_gastroenteroloji_id uuid references hasta_gastroenteroloji(id) on delete cascade,
  tarih date not null,
  tur text not null check (tur in ('hbv','hcv','diger')),
  -- karar desteği bandı (stabil / aktif_izlem / tedavi_degerlendirme) — tanı değil
  bant text,
  sonraki_izlem date,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists gastro_hepatit_idx on gastro_hepatit (patient_id, tarih desc);
create index if not exists gastro_hepatit_doktor_idx on gastro_hepatit (doctor_id, tarih desc);

-- ── Görevler: kontrol, skor, endoskopi, hepatit, PPI/biyolojik tarih hatırlatma ────────────
create table if not exists gastro_gorevleri (
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
create index if not exists gastro_gorev_idx on gastro_gorevleri (patient_id, durum, due);
create index if not exists gastro_gorev_doktor_idx on gastro_gorevleri (doctor_id, durum, due);

-- ── Acil / GI kırmızı bayrak: GI kanama, akut karın, pankreatit, ensefalopati ─────────────
-- Ayaktan muayenehane akışı → 112. Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz.
create table if not exists gastro_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_gastroenteroloji_id uuid references hasta_gastroenteroloji(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists gastro_acil_idx on gastro_acil (patient_id, tarih desc);
create index if not exists gastro_acil_doktor_idx on gastro_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_gastroenteroloji','gastro_skor','gastro_endoskopi','gastro_hepatit','gastro_gorevleri','gastro_acil'] loop
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
values ('068', '068_gastroenteroloji_exceptional.sql', null, now(), false, 'GASTROENTEROLOJI-EXCEPTIONAL-01: hasta_gastroenteroloji, gastro_skor, gastro_endoskopi, gastro_hepatit, gastro_gorevleri, gastro_acil + RLS')
on conflict (version) do nothing;
