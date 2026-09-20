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

const KUME: ReadonlySet<string> = new Set<string>(T3_YASAKLI_ANAHTARLAR)

export function t3Mi(anahtar: string): boolean {
  return KUME.has(anahtar)
}
