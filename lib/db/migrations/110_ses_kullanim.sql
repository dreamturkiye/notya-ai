-- NOTYA-SES-FISH-UCTAN-UCA-01 (Kaan, 2026-09-28): Ayşe Kaya'nın ElevenLabs'siz sesli yolunun gerçek kullanımı —
-- dakika başı toplam maliyet (Deepgram kulak + Fish ses + model) buradan ve ai_token_kullanim'dan hesaplanır
-- (scripts/fish-maliyet.mts). YALNIZ SAYAÇ: metin, hasta, ses kaydı YAZILMAZ.
--
-- Satır başına bir ölçü:
--   kaynak 'deepgram': olcu 'ses_saniye' (Deepgram'a gönderilen PCM süresi), 'baglanti_saniye' (WebSocket açık süre),
--                      'oturum_saniye' (görüşmenin duvar saati süresi)
--   kaynak 'fish':     olcu 'utf8_bayt' (Fish'e sentezlenmek üzere giden metnin UTF-8 bayt sayısı), 'karakter'
-- Eklemeli: mevcut tabloya dokunmaz. Uygulama: node scripts/run-sql-migration.mjs lib/db/migrations/110_ses_kullanim.sql

create table if not exists ses_kullanim (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  asistan_session_id uuid not null,
  kaynak text not null check (kaynak in ('deepgram', 'fish')),
  olcu text not null check (olcu in ('ses_saniye', 'baglanti_saniye', 'oturum_saniye', 'utf8_bayt', 'karakter')),
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
