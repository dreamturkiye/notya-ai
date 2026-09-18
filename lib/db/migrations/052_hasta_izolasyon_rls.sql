-- 052 — HASTA-İZOLASYON: veritabanı katmanında ikinci savunma hattı (defense in depth).
--
-- MİMARİ (değişmedi): tüm sunucu rotaları SERVICE-ROLE istemcisiyle çalışır ve RLS'i bilerek atlar;
-- "doktor A, doktor B'nin hastasına ulaşamaz" kuralını birincil olarak UYGULAMA KODU uygular
-- (lib/doktor/hastaSahipligi.ts, sınanan: lib/security/hasta-izolasyon.test.ts). Bu migration o
-- kontrolü DEĞİŞTİRMEZ ve service-role rotalarını ETKİLEMEZ — yalnız anon/authenticated rolünün
-- (herkese açık NEXT_PUBLIC anon anahtarı + bir kullanıcı JWT'si) PostgREST'e DOĞRUDAN yaptığı
-- istekleri daraltır:
--   1. RLS'i hiç açılmamış hasta tablolarında RLS açılır + "yalnız kendi satırın" politikası.
--      Bunlar RLS'siz kaldıkça anon anahtarı + herhangi bir oturum ile tüm doktorların satırları
--      PostgREST üzerinden okunabilir/yazılabilir (Supabase varsayılan GRANT'leri).
--   2. patient_id taşıyan her tabloya RESTRICTIVE bir politika: satırın hastası, isteği yapan
--      doktorun hastası olmalı. Tarayıcı `sessions` satırını anon istemciyle KENDİSİ ekliyor
--      (app/session/new/page.tsx) ve eski politika yalnız doctor_id'yi denetliyordu — başka
--      doktorun hastasına seans açmak DB'de serbestti.
-- Tarayıcıdan bu tablolara doğrudan erişen başka kod yok (denetim: docs/OPEN-COMMITMENTS.md §
-- HASTA-IZOLASYON); meşru her istek zaten kendi hastasına gider, dolayısıyla davranış değişmez.
--
-- UYGULAMA: Supabase SQL Editor'da elle (050'deki gibi). İdempotent — tekrar çalıştırmak güvenli.
-- Olmayan tablo atlanır. ÖNCE / SONRA aşağıdaki salt-okunur sorguyla durumu görün:
--
--   select c.relname as tablo, c.relrowsecurity as rls,
--          (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as politika
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind = 'r'
--   order by rls, tablo;

-- 1) RLS kapalı hasta tabloları → RLS + "yalnız kendi satırın" (kolon adı tabloya göre).
do $$
declare
  r text[];
  tablolar text[] := array[
    -- 024 cihaz
    'cihaz_olcumleri:doctor_id', 'doktor_cihazlar:doctor_id', 'cihaz_uyumsuzluk_raporlari:doctor_id',
    -- 025 belge analizi
    'belge_analizleri:doctor_id', 'belge_revizyonlar:doctor_id', 'muayene_revizyonlar:doctor_id',
    -- 028 lab
    'lab_paneller:doctor_id', 'lab_satirlar:doctor_id', 'lab_takma_adlar:doctor_id',
    -- 029 kadın doğum / doğum
    'gebelik_gorevleri:doctor_id', 'onamlar:doctor_id', 'dogum_olaylari:doctor_id', 'travay_partograf:doctor_id',
    'komplikasyonlar:doctor_id', 'bebek_kartlari:doctor_id', 'taburcu_checklist:doctor_id',
    -- 030 / 031 jinekoloji
    'jine_vizitler:doctor_id', 'serviks_taramalari:doctor_id', 'cybh_episodlari:doctor_id', 'pcos_kartlari:doctor_id',
    'lezyon_myom_kist:doctor_id', 'kontrasepsiyon:doctor_id', 'menopoz_hrt:doctor_id', 'jine_gorevleri:doctor_id',
    'jine_aub:doctor_id', 'jine_kok:doctor_id', 'jine_endometriozis:doctor_id', 'jine_rm:doctor_id', 'jine_egk:doctor_id',
    -- 032 dermatoloji
    'derm_islemler:doctor_id', 'derm_ilac_guvenlik:doctor_id', 'derm_gorevleri:doctor_id',
    -- 033 / 039 dahiliye
    'dahiliye_ht:doctor_id', 'dahiliye_dm:doctor_id', 'dahiliye_lipid:doctor_id', 'dahiliye_tiroid:doctor_id',
    'dahiliye_checkup:doctor_id', 'dahiliye_gorevleri:doctor_id', 'sevkler:doctor_id', 'dahiliye_kirmizi:doctor_id',
    'dahiliye_kart_kilitleri:doctor_id', 'dahiliye_ev_kayitlari:doctor_id', 'dahiliye_kvr:doctor_id', 'dahiliye_ckd:doctor_id',
    -- 035 / 037
    'kd_wow_kayitlari:doctor_id', 'rrs_receteler:doctor_id',
    -- 007 entegrasyon kimlikleri (kurum/sicil bilgisi)
    'doctor_integrations:doctor_id',
    -- repo dışında (Supabase panelinde) oluşturulmuş: klinik metnin önce/sonra kaydı
    'not_duzenlemeleri:doctor_id'
  ];
  t text;
  kolon text;
begin
  foreach t in array tablolar loop
    kolon := split_part(t, ':', 2);
    t := split_part(t, ':', 1);
    if to_regclass('public.' || t) is null then continue; end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = kolon) then
      raise notice 'HASTA-IZOLASYON 052: % tablosunda % yok — yalnız RLS açılıyor (servis rolü dışı kapalı)', t, kolon;
      execute format('alter table public.%I enable row level security', t);
      continue;
    end if;
    execute format('alter table public.%I enable row level security', t);
    begin
      execute format('create policy "hasta_izolasyon_kendi_satiri" on public.%I for all using (%I = auth.uid()) with check (%I = auth.uid())', t, kolon, kolon);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- 1b) Doktor kolonu olmayan, yalnız sunucunun kullandığı hasta-bağlantılı tablolar → RLS, politika YOK
--     (anon/authenticated için kapalı; service-role etkilenmez). audit_logs erişim kaydı tutar.
do $$
declare t text;
begin
  foreach t in array array['kurum_hasta_eslesme', 'fhir_export_kuyruk', 'fhir_audit', 'audit_logs', 'motor_kayit'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- 2) patient_id taşıyan her tabloda RESTRICTIVE hasta sahipliği (izin VERMEZ, yalnız daraltır; diğer
--    politikalarla VE'lenir). doctor_id / doktor_id kolonu olan tüm public tablolar, dinamik.
do $$
declare
  t text;
begin
  for t in
    select c.table_name
    from information_schema.columns c
    where c.table_schema = 'public' and c.column_name = 'patient_id'
      and c.table_name <> 'patients'
      and exists (select 1 from information_schema.tables x where x.table_schema = 'public' and x.table_name = c.table_name and x.table_type = 'BASE TABLE')
      and exists (select 1 from information_schema.columns d where d.table_schema = 'public' and d.table_name = c.table_name and d.column_name in ('doctor_id', 'doktor_id'))
  loop
    begin
      execute format(
        'create policy "hasta_izolasyon_hasta_sahipligi" on public.%I as restrictive for all to authenticated, anon
           using (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))
           with check (patient_id is null or exists (select 1 from public.patients p where p.id = patient_id and p.doctor_id = auth.uid()))',
        t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

insert into schema_migrations (version, filename, checksum, applied_at, backfilled, note)
values ('052', '052_hasta_izolasyon_rls.sql', null, now(), false, 'HASTA-IZOLASYON: RLS kapalı hasta tabloları + restrictive hasta sahipliği')
on conflict (version) do nothing;
