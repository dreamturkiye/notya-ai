-- 057 — KBB-EXCEPTIONAL-01 (2026-09-19): Kulak Burun Boğaz Hastalıkları bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: ameliyathane planlama, cerrahi HIS ve koklear implant
-- cerrahi iş akışı KAPSAM DIŞI. 056_psikiyatri.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç, doz ve "işitme kaybı tipi" kararı YALNIZ hekimin. Notya doz üretmez, tanı
-- kilitlemez, odyometri PTA'sını tanıya çevirmez (PTA bandı karar desteğidir). Medula'ya canlı e-imza yoktur.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_kbb (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- serbest bölüm notları (hekimin kendi girdiği): otoskopi tercihleri, OSAS sevk işareti, izlem planı
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_kbb_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_kbb_idx on hasta_kbb (doctor_id, next_kontrol);

-- ── Odyometri: saf ses ortalaması (PTA) ve hekimin işaretlediği tip ─────────────────────────
-- Bant SINIRLARI motorda (specialties/kulak-burun-bogaz/engines/odyometri.ts) doğrulanır; DB yalnız saklar.
-- pta_db nullable: hekim sayı girmeden yalnız niteliksel not bırakabilir.
create table if not exists kbb_odyometri (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_kbb_id uuid references hasta_kbb(id) on delete cascade,
  tarih date not null,
  yan text not null check (yan in ('sag','sol','iki')),
  pta_db numeric check (pta_db >= -10 and pta_db <= 130),
  -- hekimin seçtiği kayıp tipi: iletim / sensorinöral / mikst / normal / belirsiz — Notya tip ATAMAZ
  tip text,
  -- hekim sonucu gördü ve kilitledi (bant tanı DEĞİLDİR)
  hekim_kilit boolean not null default false,
  -- frekans bazında ham eşikler ve ek testler (timpanogram tipi, SRT, konuşmayı ayırt etme)
  maddeler jsonb,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists kbb_odyometri_idx on kbb_odyometri (patient_id, tarih desc);
create index if not exists kbb_odyometri_doktor_idx on kbb_odyometri (doctor_id, tarih desc);

-- ── Görevler: odyometri tekrarı, kontrol randevusu, OSAS sevk, rapor yenileme ────────────────
create table if not exists kbb_gorevleri (
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
create index if not exists kbb_gorev_idx on kbb_gorevleri (patient_id, durum, due);
create index if not exists kbb_gorev_doktor_idx on kbb_gorevleri (doctor_id, durum, due);

-- ── Acil / kırmızı bayrak değerlendirmesi: bayraklar + hekimin eylemi ve onayı ───────────────
-- Ayaktan muayenehane akışı: ani işitme kaybı, durdurulamayan burun kanaması, hava yolu tehdidi,
-- baş dönmesi + nörolojik bulgu, travma → 112 veya en yakın acil. Portal mesajı bu akışı YÖNETMEZ.
create table if not exists kbb_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_kbb_id uuid references hasta_kbb(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists kbb_risk_idx on kbb_risk (patient_id, tarih desc);
create index if not exists kbb_risk_doktor_idx on kbb_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
-- 052_hasta_izolasyon_rls.sql iki katman kurar: (1) elle yazılmış tablo listesi için "yalnız kendi satırın",
-- (2) patient_id + doctor_id taşıyan HER public tablo için DİNAMİK restrictive hasta sahipliği. Bu tablolar
-- (2)'nin kapsamına girer ama 052 zaten uygulanmış bir migration olduğu için oradaki liste geriye dönük
-- düzenlenmez — 053/054/056 deseni: politikalar burada, idempotent olarak kurulur.
do $$
declare t text;
begin
  foreach t in array array['hasta_kbb','kbb_odyometri','kbb_gorevleri','kbb_risk'] loop
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
values ('057', '057_kbb_exceptional.sql', null, now(), false, 'KBB-EXCEPTIONAL-01: hasta_kbb, kbb_odyometri, kbb_gorevleri, kbb_risk + RLS')
on conflict (version) do nothing;
