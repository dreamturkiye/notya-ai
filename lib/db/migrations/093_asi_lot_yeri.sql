-- 093 — NOTYA-ASI-LOT-01 (Dr. Gökhan, 2026-09-24): aşının lot no + uygulama yeri kendi kolonunda.
--
-- Önce onay senkronu (lib/doktor/notAsiAktarim) bunları asilar.notlar'a "Lot: … · Uygulama yeri: …" diye yazıyordu ve
-- hiçbir görünüm notlar'ı göstermiyordu. Artık: Aşılar listesi ("Lot: X · Yer: Y") ve Aşı Karnesi (Sağlığım + PDF +
-- yazdırma, "Lot / Uygulama yeri" sütunu) bu kolonlardan okur.
--
-- YALNIZ EKLEME (nullable kolonlar) + mevcut paketlenmiş metnin taşınması: notlar " · " ile bölünür, "Lot: …" ve
-- "Uygulama yeri: …" parçaları kolona geçer (kolon boşsa; ilk dolu değer), DİĞER parçalar aynen ve aynı sırayla notlar'da
-- kalır (lib/asi/asiLotYeri.ts → notlardanLotYeri aynı kuralı test eder). İdempotent: ikinci çalıştırmada eşleşen satır yok.

alter table asilar add column if not exists lot_no text;
alter table asilar add column if not exists uygulama_yeri text;

update asilar a
   set lot_no = coalesce(a.lot_no, s.lot),
       uygulama_yeri = coalesce(a.uygulama_yeri, s.yer),
       notlar = s.kalan
  from (
    select x.id,
           (array_agg(nullif(left(regexp_replace(btrim(regexp_replace(t.p, '^Lot:\s*', '')), '\s+', ' ', 'g'), 60), '') order by u.i)
              filter (where t.p ~ '^Lot:' and btrim(regexp_replace(t.p, '^Lot:\s*', '')) <> ''))[1] as lot,
           (array_agg(nullif(left(regexp_replace(btrim(regexp_replace(t.p, '^Uygulama yeri:\s*', '')), '\s+', ' ', 'g'), 80), '') order by u.i)
              filter (where t.p ~ '^Uygulama yeri:' and btrim(regexp_replace(t.p, '^Uygulama yeri:\s*', '')) <> ''))[1] as yer,
           string_agg(t.p, ' · ' order by u.i) filter (where t.p !~ '^(Lot|Uygulama yeri):' and t.p <> '') as kalan
      from asilar x
      cross join lateral unnest(regexp_split_to_array(x.notlar, '\s*·\s*')) with ordinality as u(p0, i)
      cross join lateral (select btrim(u.p0) as p) t
     where x.notlar ~ '(^|·)\s*(Lot|Uygulama yeri):'
     group by x.id
  ) s
 where a.id = s.id;

notify pgrst, 'reload schema';

-- DOĞRULAMA (salt-okunur):
--   select column_name from information_schema.columns where table_name = 'asilar' and column_name in ('lot_no', 'uygulama_yeri');
--   select count(*) from asilar where notlar ~ '(^|·)\s*(Lot|Uygulama yeri):';   -- 0
