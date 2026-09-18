/**
 * When the doctor edits the muayene form (başvuru / vitals / SOAP), Ayşe must re-read
 * the note and refresh ICD, reçete, alarm, özet and related suggestions — same intent
 * as the İnceleme "Notu AI ile yeniden değerlendir" action, but automatic after idle.
 */
export const NOT_YENIDEN_DEGERLENDIR_ISTEK =
  "Notu yeniden değerlendir: mevcut başvuru yakınması, yaşamsal bulgular ve SOAP (anamnez / fizik muayene / tanı / tedavi) metnine göre ICD-10 kodlarını, reçete önerini, ilaçlar listesini (plan/Tedavi'deki ürün adı ve dozla BİREBİR aynı olacak şekilde), klinik değerlendirmeni, evde dikkat maddelerini ve hasta özetini baştan, tutarlı biçimde güncelle."

/** Debounce after the last clinical keystroke before calling not-konsult. */
export const NOT_YENIDEN_DEGERLENDIR_DEBOUNCE_MS = 1800

export function klinikNotImzasi(parts: {
  basvuru: string
  vitaller: Record<string, string>
  subjektif: string
  objektif: string
  degerlendirme: string
  plan: string
}): string {
  return JSON.stringify({
    basvuru: parts.basvuru,
    vitaller: parts.vitaller,
    subjektif: parts.subjektif,
    objektif: parts.objektif,
    degerlendirme: parts.degerlendirme,
    plan: parts.plan,
  })
}
