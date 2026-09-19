-- 083 — AYSE-KONSULTASYON-01 (2026-09-19): konsültasyon istemi DÜZENLENEBİLİR — düzenleme izi.
--
-- Dr. Gökhan Mamur (canlı): "Oluştur'a bastım… doktor değişiklik yapmak istiyorsa yapamıyor, düzeltme olanağı yok."
-- Karar: istem 'acik' / 'yanit_bekleniyor' iken düzenlenebilir; 'yanitlandi' (ve kapanmış) kayıtta istem KİLİTLİDİR
-- (sunucu reddeder). Yanıt özeti düzeltilebilir kalır. Klinik kayıt olduğu için sessiz üzerine yazma YOK: her
-- değişiklikte önceki metin bu tabloya yazılır — kim (doctor_id), ne zaman (created_at), hangi alan, önceki → sonraki.
--
-- DESEN: 025'teki belge_revizyonlar (analiz_id, doctor_id, alan, onceki, sonraki, created_at) — aynı şekil, ayrı tablo
-- (sevkler satırına bağlı). jsonb kolon yerine tablo: belge/muayene revizyonlarıyla aynı desen, satır başına sınırsız
-- büyüyen bir jsonb dizisi yok, sorgu ve RLS satır düzeyinde.
--
-- YALNIZ EKLEME: yeni tablo + dizin + RLS. Mevcut hiçbir satır değişmez. İdempotent — tekrar çalıştırmak güvenli.
-- Yazan: app/api/doktor/konsultasyon (servis rolü) — PATCH 'duzenle' ve yanıt düzeltmesi. İstemciden yazma yok.

create table if not exists konsultasyon_revizyonlar (
  id          uuid primary key default gen_random_uuid(),
  sevk_id     uuid not null references sevkler(id) on delete cascade,
  doctor_id   uuid not null references auth.users(id),
  patient_id  uuid not null references patients(id),
  alan        text not null,                           -- klinik_soru|aciliyet|hedef_hekim|tanilar|mevcut_durum|not_metni|yanit_ozeti
  onceki      text,
  sonraki     text,
  created_at  timestamptz not null default now()
);
create index if not exists konsultasyon_revizyonlar_sevk_idx on konsultasyon_revizyonlar (sevk_id, created_at);

-- RLS (HASTA-IZOLASYON, 052 deseni): servis rolü atlar; anon/authenticated yalnız kendi satırı + hasta sahipliği.
alter table public.konsultasyon_revizyonlar enable row level security;
do $$
begin
  create policy "hasta_izolasyon_kendi_satiri" on public.konsultasyon_revizyonlar for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.konsultasyon_revizyonlar as restrictive for all to authenticated, anon
    using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;

-- DOĞRULAMA (salt-okunur):
--   select relrowsecurity from pg_class where relname = 'konsultasyon_revizyonlar';               -- true
--   select policyname, permissive from pg_policies where tablename = 'konsultasyon_revizyonlar';  -- 2 (kendi + RESTRICTIVE)
