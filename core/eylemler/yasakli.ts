/**
 * NOTYA-EYLEM — T3: what Ayşe may NEVER do through chat, at any tier, on any surface.
 *
 * docs/AYSE-EYLEM-MIMARISI.md §3: for these the assistant prepares and DEEP-LINKS to the screen;
 * the act itself happens where the doctor can see the full context and the legal weight of it.
 * Enforcement is by ABSENCE from the registry — this list exists so the absence is *tested*
 * (core/eylemler/tests/yasakli.test.ts) rather than merely intended. Adding a key here does not
 * block anything on its own; registering an action with one of these keys makes the suite red.
 *
 * Do not add a T3 capability to the registry "temporarily". A prescription sent by a tap in a chat
 * bubble is not recoverable by an undo button.
 */
export const T3_YASAKLI_ANAHTARLAR = [
  // Klinik kayıt kilidi — the note and the diagnosis are the doctor's signature, not a card
  'not_onayla',
  'not_imzala',
  'resmi_tani_kilitle',
  'tani_kesinlestir',
  // Reçete — leaves the system, legally binding
  'recete_olustur',
  'recete_gonder',
  'erecete_gonder',
  'ilac_recete_et',
  // Onam
  'onam_al',
  'onam_imzala',
  // Silme — anything destructive
  'hasta_sil',
  'not_sil',
  'ilac_sil',
  'asi_sil',
  'belge_sil',
  'kayit_sil',
  // Sistemden çıkan her şey
  'fhir_gonder',
  'hl7_gonder',
  'medula_gonder',
  'enabiz_gonder',
  'sgk_rapor_gonder',
  'hastaya_mesaj_gonder',
  'portal_mesaj_gonder',
  'sms_gonder',
  'eposta_gonder',
] as const

export type T3Anahtar = (typeof T3_YASAKLI_ANAHTARLAR)[number]

/**
 * NOTYA-EYLEM-24 — the OLD action vocabulary of `/api/asistan/chat`.
 *
 * Before this list existed, a model turn could emit `{ "action": { "type": "ADD_PRESCRIPTION" } }`
 * and `lib/asistan/actionExecutor.ts` wrote the row: a prescription line, a diagnosis, a note field,
 * a patient, a session (with `patient_consent_given: true`) — all with no doctor tap anywhere.
 * The executor is now a gate that writes nothing. These names are kept here so the closure is
 * TESTED, not merely intended:
 *   • none of them may ever become an eylem anahtar (they are not proposals, they are a dead path);
 *   • none of them may reach a clinical table without core/eylemler/onayla.ts.
 * `ADD_NOTE_CONTENT` is on the list too: it now routes to the `dosya_notu_ekle` taslak, which is a
 * card, not a write — the legacy name itself must still never execute.
 */
export const ESKI_SESSIZ_EYLEM_TIPLERI = [
  'CREATE_PATIENT',
  'CREATE_SESSION',
  'UPDATE_SESSION',
  'ADD_NOTE_CONTENT',
  'ADD_PRESCRIPTION',
  'SET_DIAGNOSIS',
] as const

export type EskiSessizEylemTipi = (typeof ESKI_SESSIZ_EYLEM_TIPLERI)[number]

const KUME: ReadonlySet<string> = new Set<string>(T3_YASAKLI_ANAHTARLAR)
const ESKI_KUME: ReadonlySet<string> = new Set<string>(ESKI_SESSIZ_EYLEM_TIPLERI.map((t) => t.toLowerCase()))

export function t3Mi(anahtar: string): boolean {
  return KUME.has(anahtar)
}

/** True for the old silent-path type names, in any casing — they are not valid eylem anahtarları. */
export function eskiSessizTipMi(anahtar: string): boolean {
  return ESKI_KUME.has(String(anahtar || '').toLowerCase())
}
