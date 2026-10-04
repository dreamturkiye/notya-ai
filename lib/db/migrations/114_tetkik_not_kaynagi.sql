-- 114 — NOTYA-TETKIK-NOT-01 (Kaan + Dr. Gökhan, 2026-10-04): muayenede istenen tetkikler notta yapılandırılır,
-- yazdırılır ve onayda hasta dosyasına geçer (reçete / aşı ile aynı kapı).
--
-- notes.content_tetkikler: SOAP/plan'dan çıkarılan veya hekimin düzenlediği istem listesi
--   [{ ad, numune?, aclik?, not? }] — katalog adı tercih; numune/açlık katalogdan doldurulabilir.
-- hasta_tetkik_istemleri: onaylı elektronik kayıt (kaynak_note_id = hangi not yazdı). Yeniden onayda
--   yalnız bu notun satırları güncellenir / silinir. Arşivde gizlenir (lib/doktor/arsiv → arsivsizTetkikler).
--
-- YALNIZ EKLEME (nullable kolon + yeni tablo). İdempotent.

alter table notes add column if not exists content_tetkikler jsonb;

create table if not exists hasta_tetkik_istemleri (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id),
  patient_id uuid not null references patients(id),
  kaynak_note_id uuid references notes(id) on delete set null,
  tetkik_adi text not null,
  numune text,
  aclik boolean not null default false,
  notlar text,
  istem_tarihi date not null default ((timezone('Europe/Istanbul', now()))::date),
  durum text not null default 'istendi' check (durum in ('istendi', 'sonuclandi', 'iptal')),
  created_at timestamptz not null default now()
);

create index if not exists hasta_tetkik_istemleri_hasta_idx
  on hasta_tetkik_istemleri (patient_id, istem_tarihi desc);
create index if not exists hasta_tetkik_istemleri_kaynak_idx
  on hasta_tetkik_istemleri (kaynak_note_id)
  where kaynak_note_id is not null;
create unique index if not exists hasta_tetkik_istemleri_kaynak_tekil
  on hasta_tetkik_istemleri (kaynak_note_id, tetkik_adi)
  where kaynak_note_id is not null;

alter table hasta_tetkik_istemleri enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'hasta_tetkik_istemleri' and policyname = 'tetkik_istem_doctor'
  ) then
    create policy tetkik_istem_doctor on hasta_tetkik_istemleri
      for all using (auth.uid() = doctor_id)
      with check (auth.uid() = doctor_id);
  end if;
end $$;

notify pgrst, 'reload schema';

-- DOĞRULAMA (salt-okunur):
--   select column_name from information_schema.columns
--    where table_name = 'notes' and column_name = 'content_tetkikler';
--   select table_name from information_schema.tables where table_name = 'hasta_tetkik_istemleri';
