-- NOTYA-SES-FISH-UCTAN-UCA-01 / SADECE-01 (Kaan, 2026-09-28): Ayşe Kaya'nın uçtan uca Fish sesli yolunun gerçek
-- kullanımı ve tur gecikmesi — dakika başı toplam maliyet (Fish ASR kulak + Fish TTS ses + model) ve aşama
-- gecikmeleri buradan ve ai_token_kullanim'dan hesaplanır (scripts/fish-maliyet.mts). YALNIZ SAYI: metin, hasta,
-- ses kaydı YAZILMAZ.
--
-- Satır başına bir ölçü:
--   kaynak 'fish':     olcu 'utf8_bayt' (Fish TTS'e giden metnin UTF-8 bayt sayısı), 'karakter'
--   kaynak 'fish_asr': olcu 'ses_saniye' (Fish /v1/asr'nin döndürdüğü süre, istek başına yukarı yuvarlanmış saniye)
--   kaynak 'oturum':   olcu 'oturum_saniye' (görüşmenin duvar saati süresi — tarayıcı)
--   kaynak 'gecikme':  tur başına bir aşamanın süresi (ms):
--                      'asr_ms' (sunucu: Fish ASR round trip), 'ilk_soz_ms' (sunucu: fish-tur isteği → ilk cümle),
--                      'soz_sonu_ms' (tarayıcı: son ses → VAD söz sonu), 'dinle_ms' (tarayıcı: WAV yükleme + ASR),
--                      'ilk_ses_ms' (tarayıcı: ilk cümle → Fish sesi), 'toplam_ms' (tarayıcı: doktorun son sesi →
--                      Ayşe'nin ilk sesi)
-- Eklemeli: mevcut tabloya dokunmaz. Uygulama: node scripts/run-sql-migration.mjs lib/db/migrations/110_ses_kullanim.sql

create table if not exists ses_kullanim (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  asistan_session_id uuid not null,
  kaynak text not null check (kaynak in ('fish', 'fish_asr', 'oturum', 'gecikme')),
  olcu text not null check (olcu in ('utf8_bayt', 'karakter', 'ses_saniye', 'oturum_saniye',
                                     'asr_ms', 'ilk_soz_ms', 'soz_sonu_ms', 'dinle_ms', 'ilk_ses_ms', 'toplam_ms')),
  miktar numeric not null check (miktar >= 0),
  model text
);
create index if not exists ses_kullanim_oturum_idx on ses_kullanim (asistan_session_id, created_at);
create index if not exists ses_kullanim_doktor_idx on ses_kullanim (doctor_id, created_at desc);

-- RLS: servis rolü RLS'i atlar (yazma yalnız sunucudan). Hekim yalnız KENDİ satırlarını okuyabilir;
-- ekleme/güncelleme/silme politikası YOK → istemci (anon/authenticated) yazamaz.
alter table public.ses_kullanim enable row level security;
do $$
begin
  create policy "ses_kullanim_kendi_satiri_oku" on public.ses_kullanim for select to authenticated using (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
