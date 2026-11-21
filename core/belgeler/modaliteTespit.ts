/**
 * NOTYA-BELGE-TUR-01 (2026-11-20) — what a document actually IS, from the evaluator's own answer.
 *
 * Bug seen live: an unclassified upload ("auto") was given the branch's default modality (pediatri -> chest X-ray), so a hip
 * ultrasound report was headed "Röntgen (akciğer grafisi)" in the note while its own text said ultrasound. Rule now:
 *  - the note label comes from the modality the evaluator DETECTED (`rapor.modalite`, what it says it saw);
 *  - a doctor-chosen code is used only when the evaluator said nothing usable;
 *  - otherwise a safe generic label ("Görüntüleme raporu") — never a wrong specific default.
 * Pure (no I/O); shared by the automatic path (belgeNotaYaz), the manual path (onayla) and the evaluate route.
 */
import { MODALITE_TR, type Modalite } from './ontoloji'
import type { BlokDili } from './notaBlok'

/** Generic, never-wrong label when the document type is unknown. One per note language. */
export const GENEL_BELGE_ETIKETI: Record<BlokDili, string> = {
  tr: 'Görüntüleme raporu',
  en: 'Imaging report',
  ru: 'Заключение исследования',
  uz: 'Tekshiruv xulosasi',
  uzk: 'Текширув хулосаси',
}

const KODLAR = new Set(Object.keys(MODALITE_TR))
/** Codes that say nothing about what the document is. */
const BILGISIZ_KOD = new Set<string>(['serbest', 'pdf_rapor', 'auto'])
/** Evaluator answers that are not a document type. */
const BILGISIZ_METIN = /^(serbest(\s+görüntü)?|bilinmiyor|belirsiz|belirlenemedi|diğer|diger|other|unknown|n\/?a|yok|none|-+|\?+)$/i

const sade = (s: string) => s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')

/** Free text ("Kalça ultrasonu (Graf)", "Chest X-ray PA", "ЭКГ") -> a modality code, or null when unsure. Order matters. */
// Cyrillic words: JS \b is ASCII-only, so they are bounded with lookarounds instead.
const KR = (w: string) => `(?<![а-яе])${w}(?![а-яе])`
const KURALLAR: [RegExp, Modalite][] = [
  [new RegExp(`eko\\s*kardiyo|ekokardiyo|echocardio|\\becho\\b|\\beko\\b|эхокардио|${KR('эхо\\s*кг')}`), 'eko'],
  [/mamogra|mammogra|маммогра/, 'mamografi'],
  [new RegExp(`ultrason|ultrasound|\\busg\\b|sonogra|doppler|${KR('узи')}|ультразвук|ультрасон`), 'us'],
  [new RegExp(`\\bpet\\b|${KR('пэт')}`), 'pet'],
  [new RegExp(`\\bmr\\b|\\bmri\\b|\\bmrg\\b|manyetik rezonans|magnetic resonance|${KR('мрт')}`), 'mr'],
  [new RegExp(`\\bbt\\b|\\bct\\b|tomogra|${KR('кт')}|томогра`), 'ct'],
  [/holter|холтер/, 'holter'],
  [new RegExp(`\\bekg\\b|\\becg\\b|elektrokardiyo|electrocardio|${KR('экг')}`), 'ekg'],
  [/dental|panoramik|panoramic|periapikal|periapical|\bdis\b|стоматолог/, 'dental'],
  [/(akciger|toraks|gogus|chest|thorax|lung|грудн|легк|органов грудн)/, 'cxr'],
  [/(batin|abdom|karin|брюшн)/, 'xr_batin'],
  [/(grafi|rontgen|x[\s-]?ray|radiograph|рентген)/, 'xr_kemik'],
  [/dermatoskop|dermoscop|дерматоскоп/, 'dermatoskopi'],
  [/fundus|глазное дно/, 'fundus'],
  [/\boct\b/, 'oct'],
  [/otoskop|otoscop|отоскоп/, 'otoskopi'],
  [/odyogram|audiogram|аудиограм/, 'odyogram'],
  [/timpanogram|tympanogram|тимпанограм/, 'timpanogram'],
  [/spirometr|\bsft\b|спирометр/, 'spirometri'],
  [/endoskop|endoscop|колоноскоп|гастроскоп/, 'endoskopi'],
]

export function modaliteMetindenKod(metin: string | null | undefined): Modalite | null {
  const s = sade(String(metin || '')).trim()
  if (!s) return null
  if (KODLAR.has(s) && !BILGISIZ_KOD.has(s)) return s as Modalite
  // A plain X-ray word only counts as chest/abdomen when that body part is named; otherwise "bone/general X-ray".
  for (const [re, kod] of KURALLAR) {
    if (!re.test(s)) continue
    if ((kod === 'cxr' || kod === 'xr_batin') && !/(grafi|rontgen|x[\s-]?ray|radiograph|рентген|\bpa\b|\bap\b)/.test(s)) continue
    return kod
  }
  return null
}

/** Cleans the evaluator's free-text modality for display: one line, ≤ 60 chars, first letter upper case; '' when unusable. */
export function tespitMetni(metin: string | null | undefined, dil: BlokDili = 'tr'): string {
  const t = String(metin || '').replace(/[\r\n\t]+/g, ' ').replace(/["“”«»`]/g, '').replace(/\s+/g, ' ').trim().replace(/[.;:,]+$/, '')
  if (!t || t.length < 2 || BILGISIZ_METIN.test(t)) return ''
  if (KODLAR.has(t.toLowerCase())) return '' // a bare code is not a display text (handled by belgeEtiketi)
  const kisa = t.length > 60 ? `${t.slice(0, 59).trimEnd()}…` : t
  const yerel = dil === 'tr' ? 'tr-TR' : dil === 'en' ? 'en-GB' : dil === 'ru' || dil === 'uzk' ? 'ru-RU' : 'uz'
  return kisa.charAt(0).toLocaleUpperCase(yerel) + kisa.slice(1)
}

/**
 * The label in the note heading "— Belge değerlendirmesi (<label>, <date>) —".
 * `tespit` = the evaluator's detected modality text; `kod` = stored modality_final (may be the doctor's choice).
 */
export function belgeEtiketi(tespit: string | null | undefined, kod: string | null | undefined, dil: BlokDili = 'tr'): string {
  const t = tespitMetni(tespit, dil)
  if (t) return t
  // The evaluator returned only a code (or nothing): a known, informative code is shown by name (Turkish names exist for Türkiye).
  const tKod = String(tespit || '').trim().toLowerCase()
  const aday = KODLAR.has(tKod) && !BILGISIZ_KOD.has(tKod) ? tKod : String(kod || '').trim()
  if (dil === 'tr' && KODLAR.has(aday) && !BILGISIZ_KOD.has(aday)) return MODALITE_TR[aday as Modalite]
  return GENEL_BELGE_ETIKETI[dil] || GENEL_BELGE_ETIKETI.tr
}
