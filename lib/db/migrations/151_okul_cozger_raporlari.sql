-- 151 NOTYA-OKUL-RAPOR-01 (Kaan, 2026-10-15) — Üç yeni base Doktor Araçları tablosu:
--   1. istirahat_raporlari     İstirahat ve Geçici Hastalık Raporu (okul/kreş izin raporu). Tek rapor en
--                              fazla 10 gün (uygulama katmanında da sınırlanır); egitim_yili ile eğitim
--                              yılı başına biriken 20 günlük hak sayacı (bkz. lib/doktor/istirahatRaporu.ts).
--                              e_okula_iletildi: gerçek bir MEB/Sağlık Bakanlığı e-Okul entegrasyonu YOKTUR —
--                              bu yalnız hekimin kendi okul/veli iletişimini kaydettiği bir işaret kutusudur
--                              (DERM-FORM014-BILDIRIM ile aynı desen). docs/OPEN-COMMITMENTS.md § NOTYA-OKUL-RAPOR-01.
--   2. katilim_raporlari       Durum Bildirir Sağlık Raporları / Katılım Belgeleri — spor / kreş / erteleme
--                              (tur enum), sonuç alanları serbest bir jsonb'de (lib/doktor/katilimRaporu.ts
--                              türe göre doğrular).
--   3. cozger_basvurulari      Hasta başına BU DOKTORUN patients satırında bir başvuru (unique doctor_id+
--                              patient_id — "hasta_id başına bir başvuru" bu doktorun kendi hasta kaydı
--                              kapsamında okunur; bkz. docs/README_OKUL_COZGER_RAPORLARI.md "kapsam" notu).
--                              Durum elle güncellenir, dış sistem entegrasyonu yoktur.
--   4. cozger_kurul_katkilari  Bir başvuruya N katkı: her kurul üyesi doktor KENDİ patients satırı için
--                              kendi branşındaki bulgusunu ekler (basvuru_id ile ortak başvuruya bağlanır,
--                              ama her katkı satırı YİNE o katkıyı yazan doktorun kendi hasta sahipliğiyle
--                              korunur — iki doktor arasında YENİ bir çapraz-erişim yolu açılmaz, bkz.
--                              .cursor/skills/hasta-izolasyon/SKILL.md). Kurul üyeleri arasında başvuru_id'nin
--                              nasıl paylaşılacağı (davet/bildirim akışı) bu migration'ın kapsamı DIŞINDADIR —
--                              docs/OPEN-COMMITMENTS.md § NOTYA-OKUL-RAPOR-01.
--
-- Classification (.cursor/skills/specialty-doktor-araclari/SKILL.md): base / ORTAK_DOKTOR_ARACLARI, tüm
-- ~30 branş görür; gate PATIENT yaşı/öğrenci bayrağıdır (lib/doktor/okulAraclariKapisi.ts), branş DEĞİL.
--
-- Additive only. Safe to run twice. One transaction. No destructive changes to any existing table.

begin;
set local lock_timeout = '4s';

-- ── 1. İstirahat ve Geçici Hastalık Raporu ──────────────────────────────────────────────────────────────
create table if not exists public.istirahat_raporlari (
  id                    uuid primary key default gen_random_uuid(),
  doctor_id             uuid not null references auth.users(id) on delete cascade,
  patient_id            uuid not null references public.patients(id) on delete cascade,
  tani                  text not null check (char_length(tani) > 0),
  gun_sayisi            int not null check (gun_sayisi >= 1 and gun_sayisi <= 10),
  baslangic_tarihi      date not null,
  bitis_tarihi          date not null,
  -- "2026-2027" biçimi — eğitim yılı başına biriken 20 günlük hak sayacının kapsamı.
  egitim_yili           text not null check (egitim_yili ~ '^\d{4}-\d{4}$'),
  -- Gerçek e-Okul API entegrasyonu YOK — bu sadece hekimin kendi iletişimini işaretlediği kutu.
  e_okula_iletildi      boolean not null default false,
  e_okula_iletildi_at   timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists istirahat_raporlari_hasta_yil_idx
  on public.istirahat_raporlari (doctor_id, patient_id, egitim_yili);

alter table public.istirahat_raporlari enable row level security;
do $$ begin
  create policy "hasta_izolasyon_kendi_satiri" on public.istirahat_raporlari for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.istirahat_raporlari as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- ── 2. Durum Bildirir Sağlık Raporları / Katılım Belgeleri (spor / kreş / erteleme) ────────────────────
create table if not exists public.katilim_raporlari (
  id                uuid primary key default gen_random_uuid(),
  doctor_id         uuid not null references auth.users(id) on delete cascade,
  patient_id        uuid not null references public.patients(id) on delete cascade,
  tur               text not null check (tur in ('spor', 'kres', 'erteleme')),
  sonuc             jsonb not null default '{}'::jsonb,
  rapor_tarihi      date not null default current_date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists katilim_raporlari_hasta_idx on public.katilim_raporlari (doctor_id, patient_id, tur);

alter table public.katilim_raporlari enable row level security;
do $$ begin
  create policy "hasta_izolasyon_kendi_satiri" on public.katilim_raporlari for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.katilim_raporlari as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- ── 3. ÇÖZGER başvuru takibi (hasta — bu doktorun kaydı — başına bir başvuru) ──────────────────────────
create table if not exists public.cozger_basvurulari (
  id                uuid primary key default gen_random_uuid(),
  doctor_id         uuid not null references auth.users(id) on delete cascade,
  patient_id        uuid not null references public.patients(id) on delete cascade,
  durum             text not null default 'basvuruldu'
                      check (durum in ('basvuruldu', 'randevu_alindi', 'heyet_tarihi_belli', 'sonuc_bekleniyor', 'okgv_sonucu_geldi')),
  heyet_tarihi      date,
  okgv_duzeyi       text,
  okgv_sonuc_metni  text,
  not_metni         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (doctor_id, patient_id)
);

alter table public.cozger_basvurulari enable row level security;
do $$ begin
  create policy "hasta_izolasyon_kendi_satiri" on public.cozger_basvurulari for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.cozger_basvurulari as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- ── 4. ÇÖZGER kurul katkıları (1 başvuruya N katkı; her katkı yine kendi yazarının hasta sahipliğiyle korunur) ──
create table if not exists public.cozger_kurul_katkilari (
  id                uuid primary key default gen_random_uuid(),
  basvuru_id        uuid not null references public.cozger_basvurulari(id) on delete cascade,
  doctor_id         uuid not null references auth.users(id) on delete cascade,
  patient_id        uuid not null references public.patients(id) on delete cascade,
  brans             text not null,
  bulgu             text not null check (char_length(bulgu) > 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists cozger_kurul_katkilari_basvuru_idx on public.cozger_kurul_katkilari (basvuru_id);
create index if not exists cozger_kurul_katkilari_hasta_idx on public.cozger_kurul_katkilari (doctor_id, patient_id);

alter table public.cozger_kurul_katkilari enable row level security;
do $$ begin
  create policy "hasta_izolasyon_kendi_satiri" on public.cozger_kurul_katkilari for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.cozger_kurul_katkilari as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null; end $$;

commit;
