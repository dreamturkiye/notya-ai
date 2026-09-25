-- 096 NOTYA-ILETISIM-02 (Kaan, 2026-09-25)
-- A doctor's own Gmail / Outlook mailbox, connected once with send-only permission, so appointment
-- reminders leave from the doctor's own address (they land in the doctor's Sent folder, replies
-- come back to the doctor's inbox).
-- One row per doctor. The long-lived provider credential is stored ONLY encrypted with the same
-- AES-256-GCM helper as patient *_encrypted fields (lib/security/encryption.ts encryptPII).
-- Server routes use the service role (bypasses RLS) and always scope by doctor_id.
-- RLS is the second line: a signed-in doctor may read only their own row, never the credential column,
-- and may not write from the browser at all.
create table if not exists public.doktor_eposta_baglantilari (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null unique references auth.users(id) on delete cascade,
  saglayici text not null check (saglayici in ('google', 'microsoft')),
  adres text not null,
  refresh_token_encrypted text not null,
  durum text not null default 'bagli' check (durum in ('bagli', 'yenilenmeli')),
  son_hata text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.doktor_eposta_baglantilari enable row level security;

create policy "doktor kendi eposta baglantisi" on public.doktor_eposta_baglantilari
  for select to authenticated using (doctor_id = auth.uid());

-- The credential never reaches the browser, not even encrypted: drop the default table-wide grants
-- and hand back only the harmless columns, read-only.
revoke all on table public.doktor_eposta_baglantilari from anon, authenticated;
grant select (id, doctor_id, saglayici, adres, durum, son_hata, created_at, updated_at)
  on table public.doktor_eposta_baglantilari to authenticated;
