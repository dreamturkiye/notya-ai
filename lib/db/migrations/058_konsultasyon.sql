-- 058 — KONSULTASYON-01 (2026-09-19): kapalı döngü konsültasyon (yönlendirme).
--
-- TERMİNOLOJİ: tablo adı `sevkler` VERİ olarak kalır (dahiliye + göz + kadın doğum 033'ten beri yazıyor).
-- Ürün dili "Konsültasyon" / "yönlendirme"dir. "Sevk" Türkiye'de SGK'nın düzenleyici aracıdır (SUT EK-2/F
-- Hasta Sevk Formu / e-sevk, 5 işgünü geçerlilik) — muayenehane hekiminin meslektaşından klinik görüş istemesi
-- o belge DEĞİLDİR. Gerekçe: docs/OPEN-COMMITMENTS.md § KONSULTASYON-01.
--
-- YALNIZ EKLEME: yeni tablo YOK, yalnız nullable kolonlar. Mevcut satırlar DEĞİŞMEZ (UPDATE yok).
-- `hedef` (NOT NULL, serbest anahtar) geri uyum için KALIR; yeni kayıtlar hedef_brans'ı da doldurur.
-- `durum`'da CHECK yok (033) ve eklenmez: eski 'acik' / 'kapandi' değerleri geçerli kalır. Yeni değerler
-- 'yanit_bekleniyor' | 'yanitlandi' | 'kapandi_yanitsiz' — anlamları lib/doktor/konsultasyon.ts'te.
--
-- RLS: sevkler 052'de RLS + "yalnız kendi satırın" (doctor_id) + RESTRICTIVE hasta sahipliği aldı. Politikalar
-- satır düzeyindedir; yeni kolonlar aynı politikayı miras alır — burada yeni politika gerekmez.
-- İdempotent — tekrar çalıştırmak güvenli.

alter table sevkler add column if not exists klinik_soru text;        -- TTB: açık, anlaşılır, kısaltmasız
alter table sevkler add column if not exists hedef_brans text;        -- kanonik branş anahtarı (lib/doktor/specialties.ts)
alter table sevkler add column if not exists hedef_hekim text;        -- "Dr. X" (isteğe bağlı)
alter table sevkler add column if not exists aciliyet text;           -- 'rutin' | 'oncelikli' | 'acil'
alter table sevkler add column if not exists istem_tarihi date;
alter table sevkler add column if not exists yanit_tarihi date;
alter table sevkler add column if not exists yanit_ozeti text;        -- hekimin KENDİ cümlesi
alter table sevkler add column if not exists belge_id uuid;           -- KANIT: Kasa'daki (medical_documents) rapor
alter table sevkler add column if not exists note_id uuid;            -- yanıtın eklendiği muayene notu
-- TTB istem formu alanları (muhtemel/kesin tanılar, mevcut hali) — hekim yazar, isteğe bağlı
alter table sevkler add column if not exists tanilar text;
alter table sevkler add column if not exists mevcut_durum text;
-- "Hatırlat" (Sağlığım mesajı) en son ne zaman gönderildi — 7 günde bir sınırı
alter table sevkler add column if not exists son_hatirlatma_at timestamptz;

-- Yabancı anahtarlar: tablo varsa ve kısıt yoksa (idempotent). medical_documents / notes silinirse bağ boşalır.
do $$
begin
  if to_regclass('public.medical_documents') is not null and not exists (
    select 1 from pg_constraint where conname = 'sevkler_belge_id_fkey'
  ) then
    alter table sevkler add constraint sevkler_belge_id_fkey foreign key (belge_id) references medical_documents(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sevkler_note_id_fkey') then
    alter table sevkler add constraint sevkler_note_id_fkey foreign key (note_id) references notes(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sevkler_aciliyet_check') then
    alter table sevkler add constraint sevkler_aciliyet_check check (aciliyet is null or aciliyet in ('rutin', 'oncelikli', 'acil'));
  end if;
end $$;

-- Hastanın zaman çizelgesi ve hekimin "yanıt bekleyen" listesi (kohort satırı) için
create index if not exists sevkler_hasta_idx on sevkler (patient_id, created_at desc);
create index if not exists sevkler_hekim_durum_idx on sevkler (doctor_id, durum);

-- DOĞRULAMA (salt-okunur):
--   select relrowsecurity from pg_class where relname = 'sevkler';                        -- true
--   select policyname, permissive from pg_policies where tablename = 'sevkler';           -- ≥ 2 (kendi + RESTRICTIVE)
--   select column_name from information_schema.columns where table_name = 'sevkler' order by ordinal_position;
