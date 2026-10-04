-- NOTYA-SEKRETER-01 — personel ad + soyad (sekreter/asistan kimliği).
-- ad_soyad kalır (görünen tam ad / geriye uyum); ad ve soyad ayrı girilir.
alter table if exists personel add column if not exists ad text;
alter table if exists personel add column if not exists soyad text;

-- Mevcut tek alanlı ad_soyad → ad / soyad (ilk kelime ad, kalanı soyad).
update personel
set
  ad = nullif(trim(split_part(btrim(ad_soyad), ' ', 1)), ''),
  soyad = nullif(trim(regexp_replace(btrim(ad_soyad), '^\S+\s*', '')), '')
where (ad is null or soyad is null)
  and btrim(coalesce(ad_soyad, '')) <> '';
