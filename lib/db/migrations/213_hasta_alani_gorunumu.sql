-- 213 — HASTA-ALANI-MARKA (Kaan, 2026-11-25). CORE: every one of the 30 medical branches and the 10 Özel Branşlar.
--
-- Kaan: "Hasta portalında ağırlığı doktora vermeliyiz … it should be brought to you by the doctor, not brought to you by
-- the Notya company." The patient portal (Sağlığım) now opens under the doctor's own identity: logo → photo → monogram,
-- the doctor's (or the Notya Klinik clinic's) name, a quieter "Sağlığım", and only a small "Notya altyapısıyla" footer.
--
--   hasta_alani_gorunumu         one row per doctor: the portal logo (storage path, content-hashed → immutable URL), a
--                                display-name override ("Dr. Kaan Arıoğlu Çocuk Kliniği"), an accent chosen from a fixed
--                                accessible list, and whether the doctor's existing profile photo (doctor_avatars) may be
--                                shown when there is no logo. No patient data in this table.
--   storage bucket               'hasta-alani-marka' — PUBLIC read by exact URL (a logo is not PHI and must load on the
--                                patient's PIN screen, in the PWA icon and in link previews). No storage.objects policy is
--                                created for it, so anon / authenticated can NOT list or write it; uploads go through the
--                                server (service role) after doktorOturum. Per-doctor folder <doctor_id>/, Notya Klinik
--                                logos under klinik/<clinic_id>/. PNG / JPEG / WebP only (no SVG), 2 MB at most — the app
--                                also checks the magic bytes, caps the pixel size and strips metadata before upload.
--
-- Access (hasta-izolasyon): RLS on; a doctor may SELECT only his own row (doctor_id = auth.uid()); anon has no privilege;
-- no write policy (writes go through the server). Applied to production with the Supabase tools on 2026-11-25 UTC
-- (migration log name: 213_hasta_alani_gorunumu).

create table if not exists public.hasta_alani_gorunumu (
  doctor_id uuid primary key references auth.users(id) on delete cascade,
  logo_yol text check (logo_yol is null or (char_length(logo_yol) <= 200 and logo_yol ~ '^[0-9a-f-]{36}/logo-[0-9a-f]{16}\.(png|jpg|webp)$')),
  logo_mime text check (logo_mime is null or logo_mime in ('image/png', 'image/jpeg', 'image/webp')),
  gorunen_ad text check (gorunen_ad is null or char_length(gorunen_ad) between 2 and 80),
  vurgu text check (vurgu is null or vurgu in ('petrol', 'cam', 'lacivert', 'bordo', 'murdum', 'toprak')),
  foto_goster boolean not null default true,
  updated_at timestamptz not null default now()
);
comment on table public.hasta_alani_gorunumu is 'HASTA-ALANI-MARKA: how the doctor''s patient portal (Sağlığım) is branded — logo path, display name, accent, photo on/off. Not PHI.';

alter table public.hasta_alani_gorunumu enable row level security;
do $$
begin
  create policy "doktor kendi satiri" on public.hasta_alani_gorunumu for select to authenticated using (doctor_id = auth.uid());
exception when duplicate_object then null;
end $$;
revoke all on public.hasta_alani_gorunumu from anon;
revoke insert, update, delete, truncate, references, trigger on public.hasta_alani_gorunumu from authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hasta-alani-marka', 'hasta-alani-marka', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('213', '213_hasta_alani_gorunumu.sql', null, now(), false,
  'HASTA-ALANI-MARKA: hasta_alani_gorunumu (logo path, display name, accent, photo on/off; RLS on, doctor select own row, anon nothing, writes service role only) + public-read storage bucket hasta-alani-marka (no list/write policy; png/jpeg/webp, 2 MB)')
on conflict (version) do nothing;

-- VERIFY (read-only):
--   select relname, relrowsecurity from pg_class where relname = 'hasta_alani_gorunumu';
--   select policyname, cmd, roles from pg_policies where tablename = 'hasta_alani_gorunumu';
--   select grantee, privilege_type from information_schema.role_table_grants where table_name = 'hasta_alani_gorunumu' and grantee = 'anon';  -- expect 0 rows
--   select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'hasta-alani-marka';
--   select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and (qual like '%hasta-alani-marka%' or with_check like '%hasta-alani-marka%');  -- expect 0 rows
