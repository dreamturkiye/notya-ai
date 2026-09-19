-- 077 — BEYIN-CERRAHISI-EXCEPTIONAL-01 (2026-09-19): Beyin ve Sinir Cerrahisi bölüm derinliği.
-- Ticari ayaktan muayenehane / poliklinik ürünü: ameliyathane OR / full HIS, tanı kilidi ve
-- uydurma AED dozu KAPSAM DIŞI. 072_onkoloji_exceptional.sql biçemiyle aynı.
-- YALNIZ EKLEME: yeni tablolar, nullable kolonlar. Veri silinmez / değişmez. İdempotent — tekrar çalıştırmak güvenli.
--
-- Hekim kilitleri: tanı, ilaç ve doz kararı YALNIZ hekimin. Notya doz üretmez, tanı kilitlemez,
-- nöbet/bilinç bayrağını tanıya çevirmez. Nöroloji Migren/İnme araçları bu tablolara bağlanmaz.

-- ── Bölüm kaydı: hasta başına tek satır (doctor_id ile izole) ───────────────────────────────
create table if not exists hasta_beyin_cerrahisi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  next_kontrol date,
  -- post-op checklist özeti: { secilen: string[], tarih, not } — tanı/doz yok
  postop jsonb,
  -- nöbet/bilinç izlem özeti: { bayraklar, tarih, not } — tanı/AED doz yok
  bilinc jsonb,
  -- görüntü belge köprü: { sonraki, etiket, belgeId? }
  notes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hasta_beyin_cerrahisi_hasta_hekim_uniq unique (patient_id, doctor_id)
);
create index if not exists hasta_beyin_cerrahisi_idx on hasta_beyin_cerrahisi (doctor_id, next_kontrol);

-- ── Post-op checklist kayıtları — madde kodları + tarih; tanı/OR HIS YOK ──────────────────
create table if not exists bc_postop (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_beyin_cerrahisi_id uuid references hasta_beyin_cerrahisi(id) on delete cascade,
  tarih date not null,
  maddeler jsonb,
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists bc_postop_idx on bc_postop (patient_id, tarih desc);
create index if not exists bc_postop_doktor_idx on bc_postop (doctor_id, tarih desc);

-- ── Nöbet / bilinç izlem — bayraklar + tarihler; AED doz / tanı YOK ───────────────────────
create table if not exists bc_bilinc (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_beyin_cerrahisi_id uuid references hasta_beyin_cerrahisi(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  hekim_kilit boolean not null default false,
  not_hekim text,
  created_at timestamptz not null default now()
);
create index if not exists bc_bilinc_idx on bc_bilinc (patient_id, tarih desc);
create index if not exists bc_bilinc_doktor_idx on bc_bilinc (doctor_id, tarih desc);

-- ── Görevler: kontrol, post-op, görüntü, bilinç izlem ─────────────────────────────────────
create table if not exists bc_gorevleri (
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
create index if not exists bc_gorev_idx on bc_gorevleri (patient_id, durum, due);
create index if not exists bc_gorev_doktor_idx on bc_gorevleri (doctor_id, durum, due);

-- ── Acil / nöroşirürji kırmızı bayrak ─────────────────────────────────────────────────────
-- Ayaktan muayenehane: ani bilinç kaybı, fokal defisit, şiddetli baş ağrısı, yara sızıntısı → 112.
-- Portal mesajı bu akışı YÖNETMEZ. Tanı yazılmaz.
create table if not exists bc_acil (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  doctor_id uuid not null references auth.users(id),
  hasta_beyin_cerrahisi_id uuid references hasta_beyin_cerrahisi(id) on delete cascade,
  tarih date not null,
  bayraklar text[] not null default '{}',
  eylem text,
  hekim_onay boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists bc_acil_idx on bc_acil (patient_id, tarih desc);
create index if not exists bc_acil_doktor_idx on bc_acil (doctor_id, tarih desc);

-- ── RLS (HASTA-İZOLASYON) ──────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['hasta_beyin_cerrahisi','bc_postop','bc_bilinc','bc_gorevleri','bc_acil'] loop
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
values ('077', '077_beyin_cerrahisi_exceptional.sql', null, now(), false, 'BEYIN-CERRAHISI-EXCEPTIONAL-01: hasta_beyin_cerrahisi, bc_postop, bc_bilinc, bc_gorevleri, bc_acil + RLS')
on conflict (version) do nothing;
