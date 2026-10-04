-- 115 — Sağlığım mesaj ekleri (Kaan): hasta belgeyi mesajla gönderir; dosyaya (belgeler) doğrudan yükleyemez.
-- Hekim mesajdaki eki gözlemler, belgelere kaydeder veya mesajı silince ek de gider (ON DELETE CASCADE).
-- Şifreli baytlar satırda (ciphertext_b64); vault'a ancak hekim "Belgeler'e kaydet" deyince kopyalanır.
-- ADDITIVE ONLY. Idempotent. Uygulanmamış ortamda kod yumuşak düşer.

create table if not exists hasta_mesaj_ekleri (
  id uuid primary key default gen_random_uuid(),
  mesaj_id uuid not null references hasta_mesajlar(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 200),
  file_type text not null,
  file_size integer not null check (file_size > 0 and file_size <= 4194304),
  ciphertext_b64 text not null,
  medical_document_id uuid references medical_documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists hasta_mesaj_ekleri_mesaj_idx on hasta_mesaj_ekleri (mesaj_id);
create index if not exists hasta_mesaj_ekleri_doktor_idx on hasta_mesaj_ekleri (doctor_id, created_at desc);
create index if not exists hasta_mesaj_ekleri_hasta_idx on hasta_mesaj_ekleri (patient_id, created_at desc);

alter table hasta_mesaj_ekleri enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'hasta_mesaj_ekleri' and policyname = 'mesaj_ek_doctor'
  ) then
    create policy mesaj_ek_doctor on hasta_mesaj_ekleri
      for all using (auth.uid() = doctor_id)
      with check (auth.uid() = doctor_id);
  end if;
end $$;

notify pgrst, 'reload schema';

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values (
  '115',
  '115_hasta_mesaj_ekleri.sql',
  null,
  now(),
  false,
  'Sağlığım mesaj ekleri — hasta mesajla dosya; hekim belgelere kaydet / sil'
)
on conflict (version) do nothing;
