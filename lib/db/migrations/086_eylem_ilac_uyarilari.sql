-- 086 — NOTYA-EYLEM-21 (2026-09-19): ilaç güvenlik uyarıları KARTIN ÜSTÜNDE, dokunuştan önce.
--
-- Mimari not (docs/AYSE-EYLEM-MIMARISI.md §5): "Drug-interaction warning runs before an ilac_ekle
-- card is shown and is printed on the card. Memory (hafıza) never softens a safety check."
-- 085 ile gelen `uyarilar text[]` yalnız düz metin taşıyor (mükerrer / makullük). Alerji, aynı etken
-- madde, etkileşim ve pediatrik yaş uyarılarının ŞİDDETİ var: `ciddi` bir uyarı hekimi ENGELLEMEZ
-- (yetki hekimdedir) ama ayrı, bilinçli bir ikinci dokunuş ister ("Uyarıyı gördüm, kaydet") ve bu
-- onay denetim satırına yazılır. Şiddet bir text[] satırında taşınamaz — bu yüzden jsonb.
--
-- YALNIZ EKLEME: iki yeni kolon. Mevcut hiçbir kolonun anlamı değişmez, `uyarilar` olduğu gibi kalır
-- (mükerrer/makullük hâlâ oradan okunur). İdempotent — tekrar çalıştırmak güvenli.
--
--   eylem_onerileri.uyari_detay  jsonb  [{ tur, siddet, baslik, metin, kaynak }]
--       tur    : alerji | mukerrer_etken | etkilesim | pediatrik | kapsam_disi | ayse_notu
--       siddet : ciddi | orta | bilgi
--       `ayse_notu` modelin kendi cümlesidir; ASLA `ciddi` olmaz — dokunuşu kapılayan şey
--       sistemin yeniden üretebildiği bir şey olmalı (core/eylemler/ilacUyari.ts).
--
--   eylem_kayitlari.uyari_onayi  jsonb  { uyarilar, ciddi, goruldu, onaylayan, at }
--       Onay anında YENİDEN hesaplanan uyarılar + hekimin ikinci dokunuşu. Denetim okuması:
--       "hekim şu uyarıları gördü ve yine de kaydetti" — ya da uyarı yoktu.

alter table if exists public.eylem_onerileri
  add column if not exists uyari_detay jsonb not null default '[]'::jsonb;

alter table if exists public.eylem_kayitlari
  add column if not exists uyari_onayi jsonb;

-- Denetim sorgusu için: ciddi uyarıya rağmen kaydedilenler kolay bulunsun.
create index if not exists eylem_kayitlari_uyari_idx
  on public.eylem_kayitlari (doctor_id, created_at desc)
  where uyari_onayi is not null;

-- DOĞRULAMA (salt-okunur):
--   select column_name, data_type, column_default from information_schema.columns
--    where table_name = 'eylem_onerileri' and column_name = 'uyari_detay';   -- jsonb, '[]'::jsonb
--   select column_name, data_type from information_schema.columns
--    where table_name = 'eylem_kayitlari' and column_name = 'uyari_onayi';   -- jsonb
