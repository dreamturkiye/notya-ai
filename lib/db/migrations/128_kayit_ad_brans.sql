-- 128 — Kayıt: ad soyad ve branş, hesap açılır açılmaz saklanır.
--
-- /kayit, auth.users.raw_user_meta_data içine full_name ve signup_specialty yazar.
-- Bu tetikleyici aynı değerleri public.users satırına kopyalar. users.specialty ve
-- onboarding_completed bilinçli olarak yazılmaz: branş seçilmiş diye sihirbaz
-- atlanmasın (unvan, klinik, hitap hâlâ orada sorulur). Onboarding bitince mevcut
-- profil kaydı specialty sütununu doldurur.
--
-- Sekreter daveti (user_metadata.personel = true) dokunulmaz.
-- Tetikleyici hata verirse hesap oluşturma yine tamamlanır; ad ve branş metadata'da kalır.
-- Additive, idempotent. Supabase SQL Editor'da bir kez çalıştırın.

alter table public.users add column if not exists signup_specialty text;

create or replace function public.notya_kayit_profili()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ad text;
  brans text;
begin
  if coalesce(new.raw_user_meta_data->>'personel', '') = 'true' then
    return new;
  end if;
  ad := nullif(btrim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  brans := nullif(btrim(coalesce(new.raw_user_meta_data->>'signup_specialty', '')), '');
  if ad is null and brans is null then
    return new;
  end if;
  begin
    insert into public.users (
      id, email, full_name, signup_specialty, onboarding_completed, profession_type,
      kvkk_consent_at, kvkk_consent_version
    )
    values (
      new.id,
      coalesce(new.email, ''),
      coalesce(ad, split_part(coalesce(new.email, 'hekim'), '@', 1)),
      brans,
      false,
      null,
      case when new.raw_user_meta_data->>'kvkk_onay' in ('true', 't') then now() else null end,
      nullif(new.raw_user_meta_data->>'kvkk_metin_versiyonu', '')
    )
    on conflict (id) do update set
      full_name = case
        when public.users.onboarding_completed is true then public.users.full_name
        else coalesce(excluded.full_name, public.users.full_name)
      end,
      signup_specialty = case
        when public.users.onboarding_completed is true then public.users.signup_specialty
        else coalesce(excluded.signup_specialty, public.users.signup_specialty)
      end,
      kvkk_consent_at = coalesce(public.users.kvkk_consent_at, excluded.kvkk_consent_at),
      kvkk_consent_version = coalesce(public.users.kvkk_consent_version, excluded.kvkk_consent_version),
      updated_at = now()
    where public.users.onboarding_completed is distinct from true;
  exception when others then
    raise warning 'notya_kayit_profili: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists notya_kayit_profili on auth.users;
create trigger notya_kayit_profili
  after insert on auth.users
  for each row execute function public.notya_kayit_profili();

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('128', '128_kayit_ad_brans.sql', null, now(), false,
  'Kayıt ad soyad + signup_specialty; specialty ve onboarding bayrağı yazılmaz')
on conflict (version) do nothing;
