-- 092 — NOTYA-FISILTI-GIZLE-01 (Kaan + Dr. Gökhan, 2026-09-24): hekim bir Fısıltı uyarısını gizleyebilsin.
--
-- Satır = "bu hekim, bu hastanın bu uyarısını, bu içerikle gördü ve gizledi". Klinik veriye dokunmaz.
--   tur          Fısıltı öğesinin anahtarı (ör. 'pediatri:<patient_id>', 'mesaj:<patient_id>:<konu_id>').
--   icerik_ozeti Öğenin olgularının SHA-256 özeti (başlık + ayrıntı satırları). Olgular değişirse (yeni geciken doz,
--                yeni tarih) özet tutmaz ve uyarı yeniden görünür. Düz metin / hasta adı SAKLANMAZ.
--   until        NULL = olgular değişene kadar gizli; dolu = "7 gün sonra hatırlat" (bu andan sonra yeniden görünür).
--   kaldirildi_at "Geri getir" — yumuşak kaldırma (fisilti_sessizler / sessions.archived_at ile aynı desen).
--
-- İZOLASYON: API her sorguyu doctor_id = oturum sahibi ile daraltır; RLS ikinci hattır (yalnız hekimin kendisi).
-- YALNIZ EKLEME: yeni tablo; mevcut veri değişmez. İdempotent.

create table if not exists fisilti_gizlenen (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  tur text not null check (char_length(tur) between 1 and 200),
  icerik_ozeti text not null check (char_length(icerik_ozeti) = 64),
  until timestamptz,
  created_at timestamptz not null default now(),
  kaldirildi_at timestamptz
);
create index if not exists fisilti_gizlenen_aktif_idx on fisilti_gizlenen (doctor_id, created_at desc) where kaldirildi_at is null;

alter table fisilti_gizlenen enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'fisilti_gizlenen' and policyname = 'doktor kendi fisilti gizlemeleri') then
    create policy "doktor kendi fisilti gizlemeleri" on fisilti_gizlenen for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());
  end if;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('092', '092_fisilti_gizlenen.sql', null, now(), false, 'NOTYA-FISILTI-GIZLE-01: fisilti_gizlenen (hekime özel Fısıltı gizleme) — RLS + doktor politikası')
on conflict (version) do nothing;

-- DOĞRULAMA (salt-okunur):
--   select column_name, data_type from information_schema.columns where table_name = 'fisilti_gizlenen' order by ordinal_position;
--   select policyname from pg_policies where tablename = 'fisilti_gizlenen';
