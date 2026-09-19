-- 056 — PSIK-EXCEPTIONAL-01 (2026-09-19): Ruh Sağlığı ve Hastalıkları (psikiyatri) bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: kapalı servis, istemsiz yatış yönetimi KAPSAM DIŞI.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
-- 054_derm_exceptional.sql biçemiyle aynı.
--
-- Hekim kilitleri: tanı, ilaç, doz ve "risk kapandı" kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- ölçek skorunu tanıya çevirmez (PHQ-9 / GAD-7 / CGI karar desteğidir — DSM-5-TR tanısı hekimdedir).
-- Medula'ya canlı e-imza / gönderim yoktur; yeşil-turuncu reçete kaydı hekimin kendi girdiğidir.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_psik (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- serbest bölüm notları (hekimin kendi girdiği): psikoterapi planı, izlem tercihleri, ilaç sınıfı işaretleri
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_psik_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_psik_idx on hasta_psik (doctor_id, next_kontrol);

-- ── Ölçekler: PHQ-9 / GAD-7 / CGI-S / CGI-I — madde dökümü jsonb, toplam int ────────────────
-- skor SINIRLARI motorda (specialties/psikiyatri/engines/phq9.ts, gad7.ts, cgi.ts) doğrulanır; DB yalnız saklar.
create table if not exists psik_olcek (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_psik_id uuid references hasta_psik(id) on delete cascade,
  tip text not null check (tip in ('phq9','gad7','cgi_s','cgi_i')),
  skor int not null check (skor >= 0 and skor <= 27),
  -- madde bazında ham yanıtlar (PHQ-9: 9 madde 0–3; GAD-7: 7 madde 0–3; CGI: tek değer)
  maddeler jsonb,
  tarih date not null,
  -- hekim ölçek sonucunu gördü ve kilitledi (şiddet bandı tanı DEĞİLDİR)
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists psik_olcek_idx on psik_olcek (patient_id, tip, tarih desc);
create index if not exists psik_olcek_doktor_idx on psik_olcek (doctor_id, tarih desc);

-- ── Görevler: ölçek tekrarı, ilaç izlem labı, kontrol randevusu (dahiliye_gorevleri deseni) ──
create table if not exists psik_gorevleri (
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
create index if not exists psik_gorev_idx on psik_gorevleri (patient_id, durum, due);
create index if not exists psik_gorev_doktor_idx on psik_gorevleri (doctor_id, durum, due);

-- ── Güvenlik / risk değerlendirmesi: bayraklar + hekimin eylemi ve onayı ────────────────────
-- Ayaktan muayenehane akışı: intihar düşüncesi / kendine zarar / şiddet riski / akut psikoz → 112 veya acil
-- psikiyatri başvurusu. Portal mesajı bu akışı YÖNETMEZ. "hekim_onay" = hekim gördü ve eylemi yazdı.
create table if not exists psik_risk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_psik_id uuid references hasta_psik(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists psik_risk_idx on psik_risk (patient_id, tarih desc);
create index if not exists psik_risk_doktor_idx on psik_risk (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
-- 052_hasta_izolasyon_rls.sql iki katman kurar: (1) elle yazılmış tablo listesi için "yalnız kendi satırın",
-- (2) patient_id + doctor_id taşıyan HER public tablo için DİNAMİK restrictive hasta sahipliği. Bu tablolar
-- (2)'nin kapsamına girer ama 052 zaten uygulanmış bir migration olduğu için oradaki liste geriye dönük
-- düzenlenmez — 053/054 deseni: politikalar burada, idempotent olarak kurulur.
do $$
declare t text;
begin
  foreach t in array array['hasta_psik','psik_olcek','psik_gorevleri','psik_risk'] loop
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
values ('056', '056_psikiyatri.sql', null, now(), false, 'PSIK-EXCEPTIONAL-01: hasta_psik, psik_olcek (PHQ-9/GAD-7/CGI), psik_gorevleri, psik_risk + RLS')
on conflict (version) do nothing;
