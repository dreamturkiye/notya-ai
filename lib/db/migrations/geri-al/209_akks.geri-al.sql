-- Rollback of 209_akks.sql
drop table if exists public.akks_kor_puanlar;
drop table if exists public.akks_prof_cevaplar;
drop table if exists public.akks_panel_davetleri;
drop table if exists public.akks_soru_inceleme;
drop table if exists public.akks_insan_inceleme;
drop table if exists public.akks_cevaplar;
drop table if exists public.akks_kosular;
delete from public.degerlendirme_anahtarlari where amac = 'ayse-kalite-degerlendir';
alter table public.degerlendirme_anahtarlari drop constraint if exists degerlendirme_anahtarlari_amac_check;
alter table public.degerlendirme_anahtarlari add constraint degerlendirme_anahtarlari_amac_check check (amac in ('el-notu-degerlendir'));
delete from schema_migrations where version = '209';
