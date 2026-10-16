-- 158 NOTYA-COZGER-TAKIP-01 (Kaan, 2026-10-15)
-- ÇÖZGER (Çocuklar İçin Özel Gereksinim Değerlendirmesi Raporu) TAKİP — Araçlar → Hasta Raporları
-- alt bölümü (Çocuk Hasta Raporları ile AYNI ekran/governance; yeni üst seviye bölüm DEĞİL).
--
-- Notya resmi ÇÖZGER raporu ÜRETMEZ ve ÜRETEMEZ: 20.02.2019 tarihli (RG 30692) "Çocuklar İçin Özel
-- Gereksinim Değerlendirmesi Hakkında Yönetmelik" madde 6 ve 7 — rapor, Sağlık Bakanlığı'nca
-- yetkilendirilmiş 2./3. basamak sağlık kurumlarında, çok branşlı başvurularda en az 6, tek branşlı
-- başvurularda en az 2-3 üyeli bir ÇÖZGER sağlık kurulu tarafından düzenlenir; tek bir hekim (özel
-- muayenehane dahil) resmi raporu düzenleyemez (madde 6/1, 6/6, 7/2). Bu tablo SADECE bu hekimin
-- KENDİ hastasının bu süreçteki aşamasını takip eder (başvuru, heyet tarihi, sonuç düzeyi,
-- geçerlilik, yenileme) — resmi kurul kaydı/raporu değildir; lib/doktor/cozgerTakip.ts
-- COZGER_UYARI_METNI her ekranda ve basılı çıktıda bunu sabit olarak belirtir.
--
-- Sınıflama (.cursor/skills/specialty-doktor-araclari): Çocuk Hasta Raporları ile AYNI gate —
-- cocukHastaRaporuBransiMi() → pediatri + çocuk cerrahisi. Çocuk cerrahisi genişletmesi regülasyonla
-- doğrulanmıştır: madde 6/1 çok branşlı kurul üyeleri arasında "çocuk cerrahisi" açıkça sayılıyor.
--
-- Hasta başına (bu doktorun kendi patients satırı kapsamında) TEK takip kaydı — unique(doctor_id,
-- patient_id), cozger_basvurulari ile aynı desen (bkz. referans: origin/feat/pediatri-okul-raporlari,
-- esinlenme amaçlı okundu, üzerine inşa edilmedi). Bu sürümde kurul üyeleri arası paylaşım YOK —
-- görev kapsamı tek hekimin kendi hasta kaydı için süreç takibi (hasta-izolasyon: hastaSahibiMi).
--
-- Additive only. Safe to run twice. One transaction. No destructive changes to any existing table.

begin;
set local lock_timeout = '4s';

create table if not exists public.cozger_takip (
  id                        uuid primary key default gen_random_uuid(),
  doctor_id                 uuid not null references auth.users(id) on delete cascade,
  patient_id                uuid not null references public.patients(id) on delete cascade,
  durum                     text not null default 'hazirlik'
                              check (durum in ('hazirlik', 'basvuru_yapildi', 'heyet_tarihi_belli', 'sonuc_bekleniyor', 'sonuclandi', 'itiraz_sureci')),
  -- Madde 7: yetkili kurumlar ve hakem hastaneler Sağlık Bakanlığı'nca ilan edilir; Notya bu resmî
  -- listeyi tutmaz — hekim ailenin başvurduğu/yönlendirildiği kurumu burada serbest metin kaydeder.
  kurum_adi                 text,
  basvuru_tarihi            date,
  heyet_tarihi              date,
  -- Madde 8(f): rapora "%" oranı YAZILMAZ — metinsel düzey (madde 15/1) kullanılır.
  sonuc_duzeyi              text check (sonuc_duzeyi is null or sonuc_duzeyi in
                              ('Özel koşul gereksinimi var (ÖKGV)', 'Belirgin ÖGV', 'Çok ileri düzeyde ÖGV', 'Özel gereksinim saptanmadı')),
  sonuc_tarihi              date,
  -- Madde 11: rapor "sürekli" ya da "süreli" — süreli ise geçerlilik süresi belirtilir.
  gecerlilik_tipi           text check (gecerlilik_tipi is null or gecerlilik_tipi in ('sureli', 'surekli')),
  gecerlilik_bitis_tarihi   date,
  -- Madde 8(ğ): sistem numarası olmayan rapor geçersizdir — hekim resmi raporu aldığında burada saklar.
  rapor_no                  text,
  not_metni                 text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (doctor_id, patient_id)
);
create index if not exists cozger_takip_yenileme_idx
  on public.cozger_takip (doctor_id, gecerlilik_bitis_tarihi) where gecerlilik_tipi = 'sureli';

alter table public.cozger_takip enable row level security;
do $$ begin
  create policy "hasta_izolasyon_kendi_satiri" on public.cozger_takip for all
    using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hasta_izolasyon_hasta_sahipligi" on public.cozger_takip as restrictive for all to authenticated, anon
    using (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
    with check (exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()));
exception when duplicate_object then null; end $$;

commit;
