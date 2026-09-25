-- 097 NOTYA-ILETISIM-03 (Kaan, 2026-09-25): doktorun KENDİ WhatsApp Business numarası (Meta coexistence).
-- Doktor bir kez "WhatsApp'ı bağla" der (Embedded Signup); Notya randevu hatırlatmalarını onun
-- numarasından Cloud API şablon mesajıyla gönderir, o da telefonundaki WhatsApp Business uygulamasını
-- kullanmaya devam eder.
--
-- Gizlilik: gelen mesaj GÖVDESİ hiçbir tabloya yazılmaz. Webhook yalnız teslim durumunu kaydeder.
-- Erişim anahtarı yalnız şifreli (lib/security/encryption.ts encryptPII, AES-256-GCM) saklanır ve
-- tarayıcıya asla gönderilmez — aşağıda authenticated rolünden kolon düzeyinde de geri alınır.
-- Sunucu kodu service-role ile yazar/okur (RLS'i atlar) ve her sorguyu doctor_id ile kapsar.
-- Bu dosya YALNIZ yazıldı; hiçbir veritabanına uygulanmadı.

create table if not exists public.doktor_whatsapp_baglantilari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null unique references public.users(id) on delete cascade,
  business_id text,
  waba_id text not null,
  phone_number_id text not null unique,
  gorunen_numara text,
  gorunen_ad text,
  token_encrypted text not null,
  -- { "randevu_hatirlatma": { "id": "...", "durum": "PENDING|APPROVED|REJECTED|PAUSED|DISABLED|YOK", "guncellendi": "..." }, ... }
  sablon_durumlari jsonb not null default '{}'::jsonb,
  durum text not null default 'bagli' check (durum in ('bagli', 'kaldirildi', 'hata')),
  son_hata text,
  baglandi_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doktor_whatsapp_baglantilari_waba_idx on public.doktor_whatsapp_baglantilari (waba_id);

-- Teslim durumu (gönderildi / iletildi / okundu / başarısız). Mesaj metni, alıcı numarası YOK:
-- Meta'nın mesaj kimliği (wamid) iletişim kaydıyla (iletisim_kayitlari.dis_id) eşleşir.
create table if not exists public.whatsapp_teslim_durumlari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.users(id) on delete cascade,
  mesaj_id text not null,
  durum text not null check (durum in ('sent', 'delivered', 'read', 'failed')),
  hata_kodu text,
  olay_zamani timestamptz,
  created_at timestamptz not null default now(),
  unique (mesaj_id, durum)
);

create index if not exists whatsapp_teslim_durumlari_doktor_idx on public.whatsapp_teslim_durumlari (doctor_id, created_at desc);

alter table public.doktor_whatsapp_baglantilari enable row level security;
alter table public.whatsapp_teslim_durumlari enable row level security;

-- Doktor yalnız kendi satırını görür (anon anahtarla gelen istekler için ikinci savunma hattı).
drop policy if exists doktor_whatsapp_kendi_satiri on public.doktor_whatsapp_baglantilari;
create policy doktor_whatsapp_kendi_satiri on public.doktor_whatsapp_baglantilari
  for select to authenticated using (auth.uid() = doctor_id);

drop policy if exists whatsapp_teslim_kendi_satiri on public.whatsapp_teslim_durumlari;
create policy whatsapp_teslim_kendi_satiri on public.whatsapp_teslim_durumlari
  for select to authenticated using (auth.uid() = doctor_id);

-- Yazma yalnız sunucudan (service role). Şifreli anahtar kolonu tarayıcı rollerine hiç açılmaz:
-- tablo düzeyi SELECT geri alınır, yalnız zararsız kolonlar tek tek verilir.
revoke all on public.doktor_whatsapp_baglantilari from anon, authenticated;
grant select (id, doctor_id, waba_id, phone_number_id, gorunen_numara, gorunen_ad, sablon_durumlari, durum, baglandi_at, created_at, updated_at)
  on public.doktor_whatsapp_baglantilari to authenticated;
revoke all on public.whatsapp_teslim_durumlari from anon, authenticated;
grant select on public.whatsapp_teslim_durumlari to authenticated;

-- Rollback: drop table public.whatsapp_teslim_durumlari; drop table public.doktor_whatsapp_baglantilari;
