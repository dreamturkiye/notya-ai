/**
 * When the doctor edits the muayene form (başvuru / vitals / SOAP), Ayşe must re-read
 * the note and refresh ICD, reçete, alarm, özet and related suggestions — same intent
 * as the İnceleme "Notu AI ile yeniden değerlendir" action, but automatic after idle.
 *
 * NOTYA-NOT-HEKIM-01: hekimin yazdığı not gövdesi ve İlaçlar listesi yeniden-değerlendirmede
 * ASLA yeniden yazılmaz. Tutarsızlık varsa yalnız aiDegerlendirme'de uyarılır; düzeltme hekimindir.
 */
export const NOT_YENIDEN_DEGERLENDIR_ISTEK =
  "Notu yeniden değerlendir: mevcut başvuru yakınması, yaşamsal bulgular, SOAP (anamnez / fizik muayene / tanı / tedavi) ve hekimin İlaçlar / aşı listesini SABİT kabul et. Bunlara göre ICD-10 kodlarını, reçete önerini, klinik değerlendirmeni (aiDegerlendirme), evde dikkat maddelerini ve hasta özetini baştan, tutarlı biçimde güncelle. Plan ile İlaçlar veya aşı öyküsü arasında çelişki görürsen yalnız aiDegerlendirme'de uyar — İlaçlar, aşılar veya SOAP alanlarını duzenlemeler ile değiştirme / yeniden yazma."

/** Debounce after the last clinical keystroke before calling not-konsult. */
export const NOT_YENIDEN_DEGERLENDIR_DEBOUNCE_MS = 1800

/**
 * Yeniden-değerlendirme yanıtında hekim notuna ait alanlar — sunucu ve istemci siler.
 * (Açık sohbet "ilaç listesini şöyle değiştir" isteği bu listeyi kullanmaz.)
 */
export const YENIDEN_DEGERLENDIR_KORUNAN_ALANLAR = [
  'ilaclar',
  'asilar',
  'subjektif',
  'objektif',
  'degerlendirme',
  'plan',
  'basvuruYakinmasi',
  'vitaller',
] as const

/** Model yanlışlıkla hekim alanlarını döndürse bile ekrana / kayda işlemesin. */
export function yenidenDegerlendirDuzenlemeTemizle(
  dz: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(dz && typeof dz === 'object' ? dz : {}) }
  for (const k of YENIDEN_DEGERLENDIR_KORUNAN_ALANLAR) delete out[k]
  return out
}

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
