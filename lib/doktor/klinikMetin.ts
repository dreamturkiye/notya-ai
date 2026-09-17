/**
 * KD-DERM-SAFETY-FINDINGS F4 — doctor-facing clinical text hygiene (SOAP note fields, chat speech). Pure, no I/O.
 *
 * 1. Internal identifiers never render: prompts describe storage with field names (coreImageId, dicomId, VisionRead …) and
 *    the model echoed them into notes ("fotoğraf kaydı (coreImageId) alınmamış"). Replaced with the Turkish clinical word;
 *    a parenthetical id after a word is dropped.
 * 2. No invented official-looking consent form: an izotretinoin note called the onam "BZBH Form 014 benzeri". BZBH Form 014
 *    is the notifiable communicable-disease (zührevi) report, not a consent form, and doctors use their own onam forms.
 *    A "Form NNN" reference in a consent sentence becomes "onam formu (hekimin kullandığı form)". Real bildirim sentences stay.
 */

const IC_ALANLAR: [string, string][] = [
  ['coreImageIds?', 'fotoğraf kaydı'],
  ['dicomIds?', 'DICOM görüntüsü'],
  ['pathologyIds?', 'patoloji raporu'],
  ['documentIds?', 'belge'],
  ['(?:before|after)PhotoIds?|photoIds?', 'fotoğraf'],
  ['lesionIds?', 'lezyon'],
  ['visitIds?', 'vizit'],
  ['patientIds?|hastaIds?', 'hasta'],
  ['sessionIds?', 'seans'],
  ['VisionRead', 'görüntü okuması taslağı'],
  ['islem_oncesi', 'işlem öncesi'],
  ['islem_sonrasi', 'işlem sonrası'],
  ['uzman_onayli', 'uzman onaylı'],
  ['sb_required', 'SB (yasal asgari)'],
  ['acog_recommended', 'ACOG (klinik öneri)'],
  ['pratik_altin_standart_tr_hekim', 'klinik öneri'],
  ['yasal_taban_sb', 'SB yasal taban'],
  ['risk_class', 'risk sınıfı'],
  ['current_ga', 'gebelik haftası'],
]
const GENEL_ID = String.raw`[a-z]+(?:[A-Z][a-z0-9]*)*(?:Id|ID)s?`
const HEPSI = [...IC_ALANLAR.map(([k]) => k), GENEL_ID].join('|')

export function icAlanAdiTemizle(metin: string): string {
  let s = metin.replace(new RegExp(String.raw`\s*\(\s*(?:${HEPSI})(?:\s*[,/]\s*(?:${HEPSI}))*\s*\)`, 'g'), '')
  for (const [k, v] of IC_ALANLAR) s = s.replace(new RegExp(String.raw`\b(?:${k})\b`, 'g'), v)
  return s.replace(new RegExp(String.raw`\b(?:${GENEL_ID})\b`, 'g'), 'kayıt')
}

const FORM_NO = String.raw`(?:BZBH\s*)?Form(?:u)?\s*(?:No\.?\s*|numaralı\s*)?0?\d{2,4}`
const ONAM_BAGLAMI = /onam|rıza|riza|[iİ]zotretinoin|[iİ]sotretinoin|gebelik önleme|kontrasepsiyon/i
const BILDIRIM_BAGLAMI = /bildirim|bulaşıcı|zührevi|TSİM|sifiliz|gonore/i

export function uydurmaFormTemizle(metin: string): string {
  return metin.split(/(?<=[.!?;\n])/).map((cumle) => {
    if (!new RegExp(FORM_NO, 'i').test(cumle) || !ONAM_BAGLAMI.test(cumle) || BILDIRIM_BAGLAMI.test(cumle)) return cumle
    const ad = 'onam formu (hekimin kullandığı form)'
    return cumle
      // "tedavi onam formu (BZBH Form 014)" → "tedavi onam formu (hekimin kullandığı form)"
      .replace(new RegExp(String.raw`(onam formu)\s*\(\s*${FORM_NO}[^)]*\)`, 'gi'), '$1 (hekimin kullandığı form)')
      .replace(new RegExp(String.raw`\s*\(\s*${FORM_NO}[^)]*\)`, 'gi'), '')
      // "BZBH Form 014 benzeri (gebelik önleme programı formu)" → generic onam formu (the sentence already names the drug)
      .replace(new RegExp(String.raw`${FORM_NO}(?:\s*benzeri)?(?:\s*\([^)]*\))?`, 'gi'), ad)
  }).join('')
}

export function doktorMetniTemizle(metin: string): string {
  return uydurmaFormTemizle(icAlanAdiTemizle(metin))
}

/** Every string leaf of a generated note (nested objects / arrays), through doktorMetniTemizle. */
export function notMetinleriniTemizle<T>(veri: T): T {
  const gez = (v: unknown): unknown => {
    if (typeof v === 'string') return doktorMetniTemizle(v)
    if (Array.isArray(v)) return v.map(gez)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, gez(x)]))
    return v
  }
  return gez(veri) as T
}
