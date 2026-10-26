-- HASTA-GORUNTU-GIZLILIK-01 (2026-10-26) — the `hasta-goruntuleme` storage bucket
-- (app/api/doktor/goruntuleme/*) referenced a bucket that was NEVER CREATED in production (confirmed:
-- `select id, public from storage.buckets` had no row for it) and the upload/read/delete code was
-- written assuming it would be PUBLIC (`getPublicUrl`, a plain `/hasta-goruntuleme/` URL marker parsed
-- back out of a stored "URL") — inconsistent with every other patient-data bucket in this system
-- (hasta-belgeler, mali-belgeler, ses-kayitlari are all private) and a real privacy exposure for
-- patient medical imagery (dermoscopy, radiology, fundus photos) once the bucket existed at all.
--
-- Found live, 2026-10-26: Dr. Gökhan Mamur hit "Depolama kovası (hasta-goruntuleme) yok veya
-- erişilemiyor" trying to attach a dermoscopic photo from the muayene notu revizyon sayfası.
--
-- Fix: create the bucket PRIVATE (matching hasta-belgeler) and give it storage.objects RLS scoped to
-- the uploading doctor's own folder — the SAME pattern already proven for `ses-kayitlari`
-- (`(storage.foldername(name))[1] = auth.uid()::text`), which this bucket's path layout
-- (`${doctorId}/${hastaId}/${modalite}/${fileName}`) already matches. The app code
-- (app/api/doktor/goruntuleme/{yukle,[id]}/route.ts) already double-checks patient ownership
-- (hastaSahibiMi/seansSahibi) before any storage call — this RLS is the second, DB-enforced layer, not
-- the only one. lib/doktor/goruntulemeImzaliUrl.ts stores a storage REFERENCE
-- ("hasta-goruntuleme/<path>") in hasta_goruntulemeler.dosya_url and mints a short-lived signed URL
-- fresh on every read — nothing public, nothing permanent, is ever stored or returned.

insert into storage.buckets (id, name, public)
values ('hasta-goruntuleme', 'hasta-goruntuleme', false)
on conflict (id) do update set public = false;

drop policy if exists goruntu_oku on storage.objects;
create policy goruntu_oku on storage.objects for select to authenticated
  using (bucket_id = 'hasta-goruntuleme' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists goruntu_yukle on storage.objects;
create policy goruntu_yukle on storage.objects for insert to authenticated
  with check (bucket_id = 'hasta-goruntuleme' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists goruntu_sil on storage.objects;
create policy goruntu_sil on storage.objects for delete to authenticated
  using (bucket_id = 'hasta-goruntuleme' and (storage.foldername(name))[1] = auth.uid()::text);

-- DOĞRULAMA (salt-okunur):
--   select id, public from storage.buckets where id = 'hasta-goruntuleme';
--   select policyname, cmd from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'goruntu_%' order by 2;
