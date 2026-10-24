-- Rollback of 180. Refuses while an appointment without a patient exists (link or delete those first).
begin;
set local lock_timeout = '4s';
do $$
begin
  if exists (select 1 from public.ulke_randevulari where patient_id is null) then
    raise exception 'rollback 180 refused: appointments without a patient record exist';
  end if;
end $$;
drop policy if exists "hasta_izolasyon_hasta_sahipligi" on public.ulke_randevulari;
create policy "hasta_izolasyon_hasta_sahipligi" on public.ulke_randevulari as restrictive for all to authenticated, anon
  using (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()))
  with check (exists (select 1 from public.ulke_hastalar p where p.id = patient_id and p.doctor_id = auth.uid() and p.ulke = public.ulke_oturum_ulkesi()));
alter table public.ulke_randevulari drop constraint if exists ulke_randevulari_hasta_ya_da_ad;
alter table public.ulke_randevulari drop constraint if exists ulke_randevulari_tur_gecerli;
alter table public.ulke_randevulari alter column patient_id set not null;
alter table public.ulke_randevulari drop column if exists serbest_telefon_encrypted;
alter table public.ulke_randevulari drop column if exists serbest_ad_encrypted;
alter table public.ulke_randevulari drop column if exists tur;
delete from schema_migrations where version = '180';
commit;
