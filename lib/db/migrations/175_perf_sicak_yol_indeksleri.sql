-- 175 — PERF-SAGLAMLIK-2026-10: sıcak yol indeksleri (yalnız ekleme; davranış değişikliği yok).
-- Kaynak: Supabase performance advisor (unindexed_foreign_keys) + kod taraması.
-- Sorgu şekilleri (hepsi doktor+hasta kapsamlı okuma, hasta-izolasyon desenine birebir):
--   hasta_lab_sonuclari:   .eq(patient_id).eq(doctor_id).order(created_at desc)   (portal, hasta dosyası, lab kaydet)
--   hasta_goruntulemeler:  .eq(patient_id).eq(doctor_id).order(created_at desc)   (portal, görüntüleme sekmesi)
--   hasta_belgeler:        .eq(patient_id).eq(doctor_id).order(created_at desc)   (hastaDosyaDerleyici — her SOAP üretimi)
--   kontrasepsiyon:        .eq(patient_id).eq(doctor_id).eq(aktif, true)          (portal KD modülü, jinekoloji)
-- Bugünkü satır sayılarında fark ölçülemez küçüklükte; bu indeksler büyüme sigortasıdır.
-- NOT: yalnız create index if not exists — drop/alter yok.

create index if not exists hasta_lab_sonuclari_hasta_idx
  on public.hasta_lab_sonuclari (doctor_id, patient_id, created_at desc);

create index if not exists hasta_goruntulemeler_hasta_idx
  on public.hasta_goruntulemeler (doctor_id, patient_id, created_at desc);

create index if not exists hasta_belgeler_hasta_idx
  on public.hasta_belgeler (doctor_id, patient_id, created_at desc);

create index if not exists kontrasepsiyon_hasta_idx
  on public.kontrasepsiyon (doctor_id, patient_id);
