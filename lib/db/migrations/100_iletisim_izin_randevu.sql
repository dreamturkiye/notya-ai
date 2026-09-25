-- NOTYA-BETA-0925 (Kaan, 2026-09-25) — WhatsApp consent ticked in the appointment (randevu) window.
--
-- The randevu create/edit modal has one checkbox: "Hasta, randevu ve form mesajlarını WhatsApp'tan almayı kabul
-- etti". It sets patients.iletisim_izni_whatsapp = true and appends a history row to iletisim_izin_kayitlari with
-- kaynak 'randevu' (lib/randevu/hastaIletisimKaydet.ts). Migration 095 allowed only bilgi_formu / hasta_profili /
-- gonder_dugmesi. Until this file is applied, the code writes the same history row with kaynak 'gonder_dugmesi'
-- (the staff "İzin alındı olarak işaretle" tap, same meaning) — nothing is lost either way.
--
-- Written only — NOT applied by the agent. Idempotent.

alter table iletisim_izin_kayitlari drop constraint if exists iletisim_izin_kayitlari_kaynak_check;
alter table iletisim_izin_kayitlari add constraint iletisim_izin_kayitlari_kaynak_check
  check (kaynak in ('bilgi_formu', 'hasta_profili', 'gonder_dugmesi', 'randevu'));
