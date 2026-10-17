-- PERF-SAGLAMLIK-2026-10: sıcak yol indeksleri (yalnız ekleme; davranış değişikliği yok).
-- Kaynak: Supabase performance advisor (unindexed_foreign_keys) + kod taraması (bkz. ana üründe 175_perf_sicak_yol_indeksleri.sql).
-- Bu ülke projesinde tablo var/yok farkına göre to_regclass ile korumalı; create index if not exists
-- dışında hiçbir drop/alter yok. Bu dört indeks Claude tarafından bu ülkenin Supabase projesine
-- uygulanmış ve doğrulanmıştır (PERF-SAGLAMLIK-2026-10) — bu dosya o uygulamanın kayda geçirilmesidir.
-- Sorgu şekilleri (hepsi doktor+hasta kapsamlı okuma, hasta-izolasyon desenine birebir):
--   hasta_lab_sonuclari:   .eq(patient_id).eq(doctor_id).order(created_at desc)
--   hasta_goruntulemeler:  .eq(patient_id).eq(doctor_id).order(created_at desc)
--   hasta_belgeler:        .eq(patient_id).eq(doctor_id).order(created_at desc)   (hastaDosyaDerleyici — her SOAP üretimi)
--   kontrasepsiyon:        .eq(patient_id).eq(doctor_id)
do $$
begin
  if to_regclass('public.hasta_lab_sonuclari') is not null then
    create index if not exists hasta_lab_sonuclari_hasta_idx
      on public.hasta_lab_sonuclari (doctor_id, patient_id, created_at desc);
  end if;
  if to_regclass('public.hasta_goruntulemeler') is not null then
    create index if not exists hasta_goruntulemeler_hasta_idx
      on public.hasta_goruntulemeler (doctor_id, patient_id, created_at desc);
  end if;
  if to_regclass('public.hasta_belgeler') is not null then
    create index if not exists hasta_belgeler_hasta_idx
      on public.hasta_belgeler (doctor_id, patient_id, created_at desc);
  end if;
  if to_regclass('public.kontrasepsiyon') is not null then
    create index if not exists kontrasepsiyon_hasta_idx
      on public.kontrasepsiyon (doctor_id, patient_id);
  end if;
end $$;
