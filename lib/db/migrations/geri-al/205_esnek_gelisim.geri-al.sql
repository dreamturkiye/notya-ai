-- Rollback of 205_esnek_gelisim.sql (the bucket's objects must be emptied first in the Storage UI / API)
drop function if exists public.el_notu_kalite_haftalik(integer);
drop table if exists public.el_notu_regresyon_olcumleri;
drop table if exists public.el_notu_regresyon_sayfalari;
drop table if exists public.brans_sozluk_onerileri;
alter table public.esnek_muayene_ayarlari drop column if exists gelistirme_onayi_at;
alter table public.esnek_muayene_ayarlari drop column if exists gelistirme_onayi;
delete from storage.buckets where id = 'el-notu-regresyon';
delete from schema_migrations where version = '205';
