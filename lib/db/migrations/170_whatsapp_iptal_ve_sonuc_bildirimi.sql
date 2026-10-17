-- 170 — WHATSAPP-CANCEL-01 (2026-10-16): WhatsApp cancel flow + doctor toggle for the "result ready" notice.
--
-- WRITTEN ONLY — NOT APPLIED by the agent that wrote it (the lead applies migrations). Idempotent and ADDITIVE.
-- Before it is applied the code fails closed / soft: the toggle reads as OFF and cannot be saved, and the cancel flow itself
-- needs NO schema change (it reuses whatsapp_yanitlar.otomatik_eylem / eylem_sonucu, randevular.durum + iptal_nedeni,
-- randevu_olaylari and the append-only whatsapp_mesaj_gunlugu, all from 169 and the randevu-v2 migrations).
--
-- 1) doktor_whatsapp_baglantilari.sonuc_bildirimi_acik
--    The doctor's switch for the generic "your notice is ready" WhatsApp template (`sonuc_hazir`). DEFAULT OFF. It is a
--    per-doctor preference on the doctor's own connection row (no patient data). Nothing sends the notice automatically yet
--    (no trigger event is decided — OPEN-COMMITMENTS WHATSAPP-API-01); when a trigger is built it must check this column.
--    ISOLATION: doktor_whatsapp_baglantilari already has the own-row policy from 097/169 (doctor_id = auth.uid()); a column
--    add does not change it. The server writes it with the service role scoped by .eq('doctor_id', <session doctor>).
alter table public.doktor_whatsapp_baglantilari add column if not exists sonuc_bildirimi_acik boolean not null default false;

-- 2) whatsapp_yanitlar: index the desk query of the Ön büro fısıltısı (the unread cards of one doctor, newest first).
--    whatsapp_yanitlar is patient-derived; its RLS (own-row + RESTRICTIVE hasta_izolasyon) was created in 169 and is untouched
--    here (this migration creates NO new table, so there is nothing new to protect; policies are not duplicated).
create index if not exists whatsapp_yanitlar_masa_idx on public.whatsapp_yanitlar (doctor_id, durum, created_at desc);
