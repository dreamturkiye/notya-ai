-- 080 — RADYOLOJI-EXCEPTIONAL-01 (2026-09-19): Radyoloji bölüm derinliği.
-- Ticari ayaktan görüntüleme / raporlama ürünü: full PACS / RIS / HIS, AI otomatik tanı ve
-- uydurma bulgu KAPSAM DIŞI. 077_beyin_cerrahisi_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, BI-RADS kategori seçimi ve kritik bulgu bildirimi YALNIZ hekimin.
-- Notya kategori/tanı kilitlemez, bulgu uydurmaz, PACS yönetmez.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_radyoloji (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- kuyruk özeti: { oncelik, modalite, tarih, not } — tanı yok
  kuyruk jsonb,
  -- rapor taslağı özeti: { kategori, sablon, tarih } — otomatik tanı değil
  rapor jsonb,
  -- kritik bulgu özeti: { bayraklar, bildirim, tarih }
  kritik jsonb,
  -- belge köprü: { sonraki, etiket, belgeId? }
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_radyoloji_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_radyoloji_idx on hasta_radyoloji (doctor_id, next_kontrol);

-- ── Tetkik kuyruğu / öncelik — modalite + öncelik + tarih; PACS/RIS YOK ───────────────────
create table if not exists radyo_kuyruk (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_radyoloji_id uuid references hasta_radyoloji(id) on delete cascade,
  tarih date not null,
  modalite text not null,
  oncelik text not null default 'rutin' check (oncelik in ('acil','ayni_gun','rutin','kontrol')),
  durum text not null default 'bekliyor' check (durum in ('bekliyor','cekildi','rapor_hazir','arsiv')),
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists radyo_kuyruk_idx on radyo_kuyruk (patient_id, tarih desc);
create index if not exists radyo_kuyruk_doktor_idx on radyo_kuyruk (doctor_id, oncelik, durum);

-- ── Yapılandırılmış rapor taslağı — BI-RADS-style kategori hekim seçer; AI tanı YOK ───────
create table if not exists radyo_rapor (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_radyoloji_id uuid references hasta_radyoloji(id) on delete cascade,
  tarih date not null,
  kategori text not null,
  sablon_kodlari text[] not null default '{}',
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists radyo_rapor_idx on radyo_rapor (patient_id, tarih desc);
create index if not exists radyo_rapor_doktor_idx on radyo_rapor (doctor_id, tarih desc);

-- ── Kritik bulgu bayrak + klinisyen bildirimi checklist ───────────────────────────────────
create table if not exists radyo_kritik (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_radyoloji_id uuid references hasta_radyoloji(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  bildirim_maddeleri text[] not null default '{}',
  hekim_onay boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists radyo_kritik_idx on radyo_kritik (patient_id, tarih desc);
create index if not exists radyo_kritik_doktor_idx on radyo_kritik (doctor_id, hekim_onay);

-- ── Görevler: tetkik, rapor, kritik bildirim, kontrol, belge ──────────────────────────────
create table if not exists radyo_gorevleri (
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
create index if not exists radyo_gorev_idx on radyo_gorevleri (patient_id, durum, due);
create index if not exists radyo_gorev_doktor_idx on radyo_gorevleri (doctor_id, durum, due);

-- ── Acil / radyoloji kırmızı bayrak (kontrast reaksiyon, gebelik+iyonizan, kritik bulgu) ──
-- Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz. AI bulgu uydurmaz.
create table if not exists radyo_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_radyoloji_id uuid references hasta_radyoloji(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists radyo_acil_idx on radyo_acil (patient_id, tarih desc);
create index if not exists radyo_acil_doktor_idx on radyo_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_radyoloji','radyo_kuyruk','radyo_rapor','radyo_kritik','radyo_gorevleri','radyo_acil'] loop
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
values ('080', '080_radyoloji_exceptional.sql', null, now(), false, 'RADYOLOJI-EXCEPTIONAL-01: hasta_radyoloji, radyo_kuyruk, radyo_rapor, radyo_kritik, radyo_gorevleri, radyo_acil + RLS')
on conflict (version) do nothing;
