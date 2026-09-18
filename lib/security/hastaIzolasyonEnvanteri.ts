/**
 * HASTA-IZOLASYON-01 — every API file that can reach patient data, and how its doctor-scoping is
 * guaranteed. lib/security/hasta-izolasyon-envanter.test.ts fails when:
 *   • a file under a patient-data tree (or any app/api file that starts using patient identifiers)
 *     is missing here — a new route cannot merge unclassified;
 *   • an entry marked 'test' is not actually exercised by lib/security/hasta-izolasyon.test.ts;
 *   • an entry points at a file that no longer exists.
 *
 * 'test'      → covered by the cross-doctor regression suite (A↔B, both directions, positive control).
 * 'incelendi' → reviewed by hand; `kapsam` states the exact mechanism. Prefer promoting to 'test'.
 * Audit: docs/OPEN-COMMITMENTS.md § HASTA-IZOLASYON. Rule: .cursor/skills/hasta-izolasyon/SKILL.md.
 */
export type Siniflama = { durum: 'test' } | { durum: 'incelendi'; kapsam: string }

const T = { durum: 'test' } as const
const I = (kapsam: string): Siniflama => ({ durum: 'incelendi', kapsam })

export const HASTA_IZOLASYON_ENVANTERI: Record<string, Siniflama> = {
  // ── Hasta kaydı ──
  'app/api/doktor/hastalar/route.ts': T,
  'app/api/doktor/hastalar/[id]/route.ts': T,
  'app/api/doktor/hastalar/[id]/sessions/route.ts': T,
  'app/api/doktor/hastalar/[id]/buyume-egrileri/route.ts': T,
  'app/api/doktor/hastalar/[id]/hedef-boy/route.ts': T,
  // ── Notlar / seanslar ──
  'app/api/notes/route.ts': T,
  'app/api/notes/[id]/route.ts': T,
  'app/api/notes/[id]/approve/route.ts': T,
  'app/api/notes/whatsapp/route.ts': I('note loaded by id AND doctor_id = user.id before anything is sent'),
  'app/api/notes/pdf/route.ts': I('renders only the body it is given (mali note); reads no patient table'),
  'app/api/doktor/son-notlar/route.ts': T,
  'app/api/sessions/start/route.ts': T,
  'app/api/sessions/[id]/end/route.ts': T,
  'app/api/sessions/ses-yukle/route.ts': T,
  'app/api/doktor/not-konsult/route.ts': I('note loaded by id AND doctor_id = doktorId; 404 otherwise'),
  'app/api/doktor/konsult/route.ts': I('hastaDosyasiniDerle(doktorId, patientId) returns null for a foreign patient → 404'),
  'app/api/doktor/medula/recete/route.ts': I('note by id AND doctor_id; patient read scoped by doctor_id'),
  'app/api/doktor/rrs/route.ts': I('note by id AND doctor_id, patient ownership re-checked; list/patch scoped by doctor_id'),
  'app/api/doktor/raporlar/route.ts': I('aggregates only rows with doctor_id = user.id'),
  // ── İlaç / aşı / lab / belge / görüntü / cihaz ──
  'app/api/doktor/ilaclar/route.ts': T,
  'app/api/doktor/ilaclar/[id]/route.ts': T,
  'app/api/doktor/ilaclar/doz-oner/route.ts': I('patient row fetched and doctor_id compared to user.id before any read → 404'),
  'app/api/doktor/asilar/route.ts': T,
  'app/api/doktor/asilar/[id]/route.ts': I('update/delete by id AND doktor_id = doktorId'),
  'app/api/doktor/belgeler/lab/route.ts': T,
  'app/api/doktor/belgeler/analiz/route.ts': I('document via vault getDocumentMeta(doctorId) (assertPatientOwned); analyses by doctor_id'),
  'app/api/doktor/belgeler/analiz/onayla/route.ts': I('analysis by id AND doctor_id; target note by id AND doctor_id'),
  'app/api/doktor/belgeler/ingest/route.ts': T,
  'app/api/doktor/documents/route.ts': I('vault listDocuments/uploadDocument — doctor-scoped, assertPatientOwned (lib/vault/service.acl.test.ts)'),
  'app/api/doktor/documents/[id]/route.ts': I('vault getDocumentMeta/softDeleteDocument by doctor_id (lib/vault/service.acl.test.ts)'),
  'app/api/doktor/documents/[id]/download/route.ts': I('vault downloadDocument by doctor_id (lib/vault/service.acl.test.ts)'),
  'app/api/doktor/goruntuleme/route.ts': T,
  'app/api/doktor/goruntuleme/[id]/route.ts': I('row fetched, doctor_id !== user.id → 403 before storage/DB delete'),
  'app/api/doktor/goruntuleme/yukle/route.ts': T,
  'app/api/doktor/cihaz-olcum/route.ts': T,
  'app/api/doktor/cihaz-olcum/dosya/route.ts': I('patient ownership check before vault upload (vault re-checks)'),
  // ── Randevu / takvim / mesaj / hatırlatma / intake ──
  'app/api/doktor/randevular/route.ts': T,
  'app/api/doktor/randevular/[id]/route.ts': T,
  'app/api/doktor/gun-programi/route.ts': T,
  'app/api/doktor/calisma-saatleri/route.ts': I('doctor working hours only (doktor_id); no patient data'),
  'app/api/doktor/mesajlar/route.ts': T,
  'app/api/doktor/mesajlar/[konuId]/route.ts': T,
  'app/api/doktor/mesajlar/unread-count/route.ts': I('count scoped by doctor_id'),
  'app/api/doktor/hatirlatma/route.ts': T,
  'app/api/doktor/intake-formlari/route.ts': T,
  'app/api/doktor/intake-formlari/[id]/route.ts': I('form by id AND doktor_id'),
  // ── Branş modülleri ──
  'app/api/doktor/mchat/route.ts': T,
  'app/api/doktor/gelisim-taramasi/route.ts': T,
  'app/api/doktor/kadin-sagligi/route.ts': T,
  // DERM-EXCEPTIONAL-01: 'goruntu-okuma' (belge_taslak / asistana_raporla) da bu dosyada — analiz ve görüntü
  // kimlikleri hastaSahibiMi() sonrası patient_id + doctor_id ile yeniden daraltılır; okuma epizoda yazılır.
  'app/api/doktor/dermatoloji/route.ts': T,
  'app/api/doktor/dermatoloji/spine/route.ts': T,
  'app/api/doktor/dermatoloji/_kohort.ts': I('patient ids drawn only from hasta_derm / derm_gorevleri / derm_ilac_guvenlik rows with doctor_id = doctorId; child tables (yama, fototerapi, lezyon) read by hasta_derm_id taken from those doctor-scoped episodes; patients read by doctor_id; dermHatirlatmaGonder runs only on ids that passed that filter'),
  'app/api/doktor/dermatoloji/kohort/route.ts': I('POST ids filtered through dermKohortVerisi(doctorId) before any message is written'),
  'app/api/doktor/gebelik/route.ts': T,
  'app/api/doktor/gebelik/dogum/route.ts': T,
  'app/api/doktor/yenidogan/route.ts': I('baby card fetched by patient AND doctor_id; every derived id comes from that card; patient reads doctor-scoped'),
  'app/api/doktor/jinekoloji/route.ts': T,
  'app/api/doktor/goz/route.ts': T,
  'app/api/doktor/goz/kohort/route.ts': T,
  'app/api/doktor/goz/_ek.ts': I('gozEkAdim / gozEkVeri run only after route.ts hasta(doctorId, patientId); every read/write .eq(patient_id, h.id).eq(doctor_id); child ids (katarakt, acil, görüntü) re-scoped by patient_id + doctor_id'),
  'app/api/doktor/goz/_kohort.ts': I('patient ids drawn only from goz_* rows with doctor_id = doctorId; patients read by doctor_id; gozHatirlatmaGonder runs only on ids that passed that filter or hasta()'),
  'app/api/doktor/pediatri/route.ts': T,
  'app/api/doktor/pediatri/_ortak.ts': I('pediHasta: patients by id AND doctor_id — the gate every pediatri handler passes first; pediOturum = doktorOturum + users.specialty pediatri'),
  'app/api/doktor/dahiliye/route.ts': T,
  'app/api/doktor/dahiliye/_ortak.ts': I('hastaBilgi/hastaAdi: patients by id AND doctor_id — the gate every dahiliye handler passes first'),
  'app/api/doktor/dahiliye/_wow2.ts': I('runs only after hastaBilgi(); id-keyed updates scoped by doctor_id or the verified patient'),
  'app/api/doktor/dahiliye/_wow3.ts': I('runs only after hastaBilgi(); id-keyed updates scoped by doctor_id or the verified patient'),
  'app/api/doktor/dahiliye/_wow4.ts': I('runs only after hastaBilgi(); id-keyed updates scoped by doctor_id or the verified patient'),
  'app/api/doktor/dahiliye/_wow5.ts': I('runs only after hastaBilgi(); id-keyed updates scoped by doctor_id or the verified patient'),
  'app/api/doktor/dahiliye/_kohort.ts': I('patient ids drawn only from rows with doctor_id = doctorId; patients read by doctor_id'),
  'app/api/doktor/dahiliye/kohort/route.ts': I('POST ids filtered through kohortVerisi(doctorId) before any message is written'),
  // ── Araçlar ──
  'app/api/doktor/araclar/epikriz/route.ts': T,
  'app/api/doktor/araclar/erecete/route.ts': I('patient ownership check (id AND doctor_id) before any read → 404'),
  'app/api/doktor/araclar/sgk-rapor/route.ts': I('patient ownership check (id AND doctor_id) before any read → 404'),
  'app/api/doktor/araclar/hasta-portali/route.ts': I('patient ownership check before token mint; share preview scoped by doctor_id'),
  'app/api/doktor/araclar/icd10/route.ts': I('reference lookup; no patient data'),
  'app/api/doktor/araclar/ilac-interaksiyon/route.ts': I('drug names from the body only; no patient table'),
  // ── Doktor hesabı (hasta verisi yok) ──
  'app/api/doktor/erecete-ayar/route.ts': I('users row of doktorId only'),
  'app/api/doktor/recete-baslik/route.ts': I('users row of doktorId only'),
  'app/api/doktor/hafiza/route.ts': I('doktor_hafiza scoped by doctor_id; no patient data'),
  'app/api/doktor/hesap/sifre-degistir/route.ts': I('own auth account only'),
  'app/api/doktor/id-card/parse/route.ts': I('OCR of an uploaded image; stores nothing'),
  'app/api/doktor/ilac-ara/route.ts': I('drug catalogue search; no patient data'),
  'app/api/doktor/integrations/route.ts': I('doctor_integrations of user.id only'),
  'app/api/doktor/integrations/[provider]/route.ts': I('doctor_integrations of user.id only'),
  'app/api/doktor/mernis-lookup/route.ts': I('identity lookup proxy; stores nothing'),
  'app/api/doktor/personel/route.ts': I('personel scoped by doktor_id'),
  'app/api/doktor/personel/[id]/route.ts': I('personel by id AND doktor_id'),
  'app/api/doktor/profil/avatar/route.ts': I('doctor_avatars of user.id only'),
  'app/api/doktor/sgk/route.ts': I('MEDULA provision stub; reads no patient table'),
  // ── Asistan ──
  'app/api/asistan/chat/route.ts': T,
  'app/api/asistan/learn/route.ts': T,
  'app/api/asistan/hasta-bul/route.ts': I('hastaninSozunuCoz(doktorId) searches only the doctor\'s patients; file via hastaDosyasiniDerle(doktorId)'),
  'app/api/asistan/signed-url/route.ts': I('voice-agent URL for the caller; no patient read'),
  'app/api/asistan/klinik-signed-url/route.ts': I('voice-agent URL for the caller; no patient read'),
  'app/api/asistan/avukat-chat/route.ts': I('lawyer product; no patient data'),
  'app/api/asistan/avukat-learn/route.ts': I('lawyer product; no patient data'),
  'app/api/asistan/avukat-signed-url/route.ts': I('lawyer product; no patient data'),
  'app/api/asistan/mali-chat/route.ts': I('accountant product; no patient data'),
  'app/api/asistan/mali-signed-url/route.ts': I('accountant product; no patient data'),
  // ── Sağlığım portalı / intake (token = kimlik) ──
  'app/api/portal/hasta/[token]/route.ts': T,
  'app/api/portal/hasta/[token]/mesajlar/route.ts': T,
  'app/api/portal/hasta/[token]/dahiliye-anket/route.ts': I('token → (patient_id, doctor_id); every read/write scoped by both'),
  'app/api/portal/hasta/[token]/unlock/route.ts': I('PIN check for the token row only'),
  'app/api/intake/[token]/route.ts': I('token → form row; patient from that row (form was created after an ownership check)'),
  // ── Entegrasyon / cron (oturumsuz, sunucu içi) ──
  'app/api/entegrasyon/fhir/isle/route.ts': I('cron-secret gated; exports notes only of doctors enrolled in that institution'),
  'app/api/entegrasyon/hl7/al/route.ts': I('per-institution inbound key; patient mapping scoped by kurum_id'),
  'app/api/entegrasyon/yonetim/route.ts': I('ADMIN_EMAILS only'),
  'app/api/cron/asi-hatirlatma/route.ts': I('cron-secret gated; reminder only to the patient of the row owner (doctor_id = row doktor_id)'),
  'app/api/cron/randevu-hatirlatma/route.ts': I('cron-secret gated; reminder only to the patient of the booking owner (doctor_id = row doktor_id)'),
  'app/api/cron/kvkk-imha/route.ts': I('cron-secret gated retention job; no cross-doctor read path'),
}
