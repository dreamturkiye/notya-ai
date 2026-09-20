-- 085 — NOTYA-EYLEM (2026-09-19): Ayşe dosyaya YAZABİLİR — hazırlar, hekim onaylar.
--
-- Dr. Gökhan Mamur (canlı, "Ayşe'ye Danış"): doğum epikrizinde bulduğu Hepatit B dozunu kaydetmesini istedi;
-- Ayşe "veri girişi yapabilen bir araç değilim" dedi. Kaan'ın kararı: bu çekirdek bir yetenek, 30+ branşın
-- tamamı ve klinik dikeyi için. İlişki modeli KİLİTLİ: **Ayşe HAZIRLAR, hekim ONAYLAR.** Modelin sözüyle
-- hiçbir şey yazılmaz — araç çağrısı yalnız bir TASLAK üretir (eylem_onerileri); hekimin onay kartına
-- dokunması kaydı yazar (eylem_kayitlari). Cihaz Köprüsü'yle aynı kural: onay kartı HER ZAMAN, sessiz asla.
--
-- İKİ TABLO
--   eylem_onerileri  — taslak öneri. `veri` hekimin göreceği alanlar; `alan_kaynaklari` her alanın nereden
--                      geldiği (doktor_soyledi | dosyadan | tahmin); `eksik_alanlar` hekimin doldurması
--                      gerekenler. TAHMİN DEĞER OLARAK ASLA YAZILMAZ — alan boş kalır ve buraya düşer
--                      (core/eylemler/oneri.ts). "tahminen Eylül 2026" hatası yapısal olarak imkânsız.
--   eylem_kayitlari  — onaylanan eylemin izi: hangi tabloya/satıra yazıldı, önce/sonra JSON, geri alındı mı.
--                      Denetim okuması: hazırlayan = Ayşe, onaylayan = hekim.
--
-- YALNIZ EKLEME: iki yeni tablo + dizinler + RLS. Mevcut hiçbir tablo/kolonun anlamı değişmez.
-- İdempotent — tekrar çalıştırmak güvenli.
-- Yazan: app/api/doktor/eylem + /api/asistan/chat (servis rolü). İstemciden doğrudan yazma YOK.

create table if not exists eylem_onerileri (
  id             uuid primary key default gen_random_uuid(),
  doctor_id      uuid not null references auth.users(id) on delete cascade,
  hasta_id       uuid not null references patients(id) on delete cascade,
  eylem_anahtar  text not null,                       -- core/eylemler/kayit.ts anahtarı (asi_kaydi_ekle, ilac_ekle…)
  veri           jsonb not null default '{}'::jsonb,  -- hekimin onaylayacağı alanlar (tahmin edilenler YOK)
  alan_kaynaklari jsonb not null default '{}'::jsonb, -- { alan: { kaynak, alinti, belgeId, notId } }
  eksik_alanlar  text[] not null default '{}',        -- hekimin doldurması gerekenler (boş-sarı alanlar)
  uyarilar       text[] not null default '{}',        -- mükerrer / makullük / ilaç etkileşimi uyarıları
  kademe         text not null check (kademe in ('T1','T2')),
  durum          text not null default 'taslak' check (durum in ('taslak','onaylandi','vazgecildi','suresi_doldu')),
  grup_id        uuid,                                -- toplu kart (bir belgeden çıkan çok satır) aynı grup
  yuzey          text not null check (yuzey in ('danis','sohbet','ses','not')),
  mesaj_id       text,                                -- öneriyi doğuran sohbet mesajı
  created_at     timestamptz not null default now(),
  karar_at       timestamptz
);
create index if not exists eylem_onerileri_bekleyen_idx on eylem_onerileri (doctor_id, hasta_id, durum, created_at desc);
create index if not exists eylem_onerileri_grup_idx on eylem_onerileri (grup_id) where grup_id is not null;

create table if not exists eylem_kayitlari (
  id             uuid primary key default gen_random_uuid(),
  oneri_id       uuid not null references eylem_onerileri(id) on delete cascade,
  doctor_id      uuid not null references auth.users(id) on delete cascade,
  hasta_id       uuid not null references patients(id) on delete cascade,
  eylem_anahtar  text not null,
  hedef_tablo    text not null,                       -- yazının düştüğü tablo (asilar, hasta_ilaclar…)
  hedef_id       text not null,                       -- o tablodaki satır
  once           jsonb,                               -- T2 için satırın önceki hali; T1 eklemede null
  sonra          jsonb,
  kaynak         text not null default 'ayse_oneri',  -- hazırlayan; onaylayan her zaman doctor_id
  mesaj_id       text,
  created_at     timestamptz not null default now(),
  geri_alindi_at timestamptz
);
create index if not exists eylem_kayitlari_hasta_idx on eylem_kayitlari (doctor_id, hasta_id, created_at desc);
create index if not exists eylem_kayitlari_oneri_idx on eylem_kayitlari (oneri_id);

-- RLS (HASTA-IZOLASYON, 052/083 deseni): servis rolü atlar; anon/authenticated yalnız kendi satırı + hasta sahipliği.
alter table public.eylem_onerileri enable row level security;
alter table public.eylem_kayitlari enable row level security;
do $$
begin
  create policy "hasta_izolasyon_kendi_satiri" on public.eylem_onerileri for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_kendi_satiri" on public.eylem_kayitlari for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
-- patient_id yerine hasta_id kolonu: 052'deki dinamik RESTRICTIVE politika patient_id arar, bu yüzden
-- aynı daraltma burada elle yazılır (aynı ifade, kolon adı hasta_id).
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.eylem_onerileri as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = hasta_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = hasta_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;
do $$
begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.eylem_kayitlari as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = hasta_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = hasta_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null;
end $$;

-- DOĞRULAMA (salt-okunur):
--   select relname, relrowsecurity from pg_class where relname in ('eylem_onerileri','eylem_kayitlari');  -- true, true
--   select tablename, policyname, permissive from pg_policies where tablename in ('eylem_onerileri','eylem_kayitlari');  -- 2 + 2
