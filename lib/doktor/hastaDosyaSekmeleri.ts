/**
 * Hasta dosyası tab visibility — specialty-first (universal chrome for all ~29 branşlar).
 *
 * Rules (specialty-universal-vs-chapter + CHART-TAB-POLICY 2026-09-17):
 *  - Exclusive chapter tabs (Göz, Deri, Dahiliye) only when that doctor’s specialty owns them.
 *  - Pediatric tool tabs (büyüme / M-CHAT / gelişim) only when age qualifies AND the
 *    doctor is pediatri or a baseline/aile-style practice — never on göz/derm/KD/dahiliye charts.
 *  - Gebelik tab stays sex+age (mixed care); portal Gebeliğim has its own eligibility.
 *  - Adults must not see M-CHAT / gelişim / büyüme.
 */
export type HastaDosyaSekmeId =
  | 'ozet'
  | 'muayene'
  | 'buyume'
  | 'belgeler'
  | 'goruntuleme'
  | 'ilaclar'
  | 'formu'
  | 'asilar'
  | 'mchat'
  | 'gelisim'
  | 'ayse'
  | 'gebelik'
  | 'deri'
  | 'dahiliye'
  | 'goz'
  | 'psikiyatri'
  | 'kbb'
  | 'kardiyoloji'
  | 'gogus'
  | 'noroloji'
  | 'uroloji'
  | 'ortopedi'
  | 'fizik-tedavi'
  | 'aile'
  | 'spor-hekimligi'
  | 'endokrinoloji'
  | 'romatoloji'
  | 'gastroenteroloji'
  | 'nefroloji'
  | 'enfeksiyon'
  | 'onkoloji'
  | 'genel-cerrahi'
  | 'plastik'
  | 'beyin'
  | 'gogus-cerrahisi'
  | 'cocuk-cerrahisi'
  | 'anestezi'
  | 'acil'
  | 'kalp-damar'
  | 'radyo'
  | 'konsultasyon'

export type HastaDosyaSekme = { id: HastaDosyaSekmeId; label: string }

const PED_TAB_IDS: ReadonlySet<HastaDosyaSekmeId> = new Set(['buyume', 'mchat', 'gelisim'])

/** Chapters that own exclusive chart tabs — they do not inherit another chapter’s tool strip. */
export function ozelBolumBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /göz|goz|oftalm|derma|deri ve z|dahiliye|iç hast|ic hast|kadın|kadin|jinek|obstet|pediatri|çocuk sağlığı|cocuk sagligi|çocuk hast|cocuk hast|çocuk cerrah|cocuk cerrah|cocuk-cerrahisi|psikiyatri|ruh sağlığı|ruh sagligi|kulak burun|kulak-burun|\bkbb\b|otolaring|göğüs hastal|gogus-hastalik|gogus hastal|göğüs cerrah|gogus cerrah|gogus-cerrah|kardiyo|kalp|n[öo]roloji|noroloji|[üu]roloji|urology|ortopedi|travmatoloji|orthop|fizik.?tedavi|fiziksel.?t[ıi]p|\bftr\b|spor hekim|spor-hekim|sports medicine|endokrin|romato|gastro|nefroloji|b[öo]brek hastal|enfeksiyon|infeksiyon|onkolo|genel.?cerrah|plastik|beyin.?cerrah|anestez|reanimasyon|acil.?t[ıi]p|acil tip|radyolo|radiolo/.test(b)
}

/**
 * PSIK-EXCEPTIONAL-01 — Psikiyatri bölüm sekmesinin sahibi: yalnız psikiyatri / ruh sağlığı ve hastalıkları.
 * Dahiliye, aile hekimliği, nöroloji ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi): ölçek,
 * güvenlik değerlendirmesi ve psikotrop izlem içeriği başka branşın hasta dosyasına taşınmaz.
 */
export function psikiyatriSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /psikiyatri|ruh sağlığı ve hastalıkları|ruh sagligi ve hastaliklari/.test(b)
}

/**
 * KBB-EXCEPTIONAL-01 — KBB bölüm sekmesinin sahibi: yalnız kulak burun boğaz / otolarengoloji.
 * Dahiliye, aile hekimliği, göz, pediatri ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi):
 * otoskopi, odyometri ve vestibüler muayene içeriği başka branşın hasta dosyasına taşınmaz.
 */
export function kbbSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /kulak burun|kulak-burun|\bkbb\b|otolaring/.test(b)
}

/**
 * KARDIO-EXCEPTIONAL-01 — Kardiyoloji bölüm sekmesinin sahibi: yalnız kardiyoloji.
 * Dahiliye, kalp-damar cerrahisi ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function kardiyolojiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b || /cerrah/.test(b)) return false
  return /kardiyoloji|^kardiyo$|kalp hastal/.test(b)
}

/**
 * GOGUS-EXCEPTIONAL-01 — Göğüs Hastalıkları sekmesi: yalnız gogus-hastaliklari.
 * gogus-cerrahisi, dahiliye, kardiyoloji ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function gogusSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b || /cerrah/.test(b)) return false
  return /göğüs hastal|gogus-hastalik|gogus hastal|^göğüs$|^gogus$/.test(b)
}

/**
 * NOROLOJI-EXCEPTIONAL-01 — Nöroloji bölüm sekmesinin sahibi: yalnız nöroloji.
 * Dahiliye, KBB, pediatri ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function norolojiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /n[öo]roloji|noroloji/.test(b)
}

/**
 * UROLOJI-EXCEPTIONAL-01 — Üroloji bölüm sekmesinin sahibi: yalnız üroloji.
 * Dahiliye, nefroloji, genel cerrahi ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function urolojiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /[üu]roloji|urology/.test(b)
}

/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Spor Hekimliği sekmesi: yalnız spor-hekimligi.
 * Ortopedi, FTR ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function sporHekimligiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /spor hekim|spor-hekim|sports medicine/.test(b)
}

/**
 * ORTOPEDI-EXCEPTIONAL-01 — Ortopedi bölüm sekmesinin sahibi: yalnız ortopedi / travmatoloji.
 * FTR, spor hekimliği, romatoloji ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function ortopediSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /ortopedi|travmatoloji|orthop/.test(b)
}

/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Aile Hekimliği bölüm sekmesinin sahibi: yalnız aile hekimliği.
 * Dahiliye, pediatri, endokrinoloji ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 * Not: aile ozelBolumBransi'na EKLENMEZ — çocuk hastada büyüme / M-CHAT sekmeleri korunur.
 */
export function aileHekimligiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /aile\s*hekim|aile-hekimligi|aile hekimliği|genel pratisyen/.test(b)
}

/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Endokrinoloji bölüm sekmesinin sahibi: yalnız endokrinoloji.
 * Dahiliye DM araçları / sekmesi bu branşa sızmaz (brans-alan-sizmasi).
 */

/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Romatoloji bölüm sekmesinin sahibi: yalnız romatoloji.
 * Ortopedi, FTR, dahiliye ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function romatolojiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /romato/.test(b)
}

export function endokrinolojiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /endokrin/.test(b)
}

/** ENFEKSIYON-EXCEPTIONAL-01 — yalnız enfeksiyon hastalıkları. */
export function enfeksiyonSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /enfeksiyon|infeksiyon|klinik mikrobiyoloji/.test(b)
}

/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Gastroenteroloji bölüm sekmesinin sahibi: yalnız gastroenteroloji.
 * Dahiliye FIB-4 / GGK araçları / sekmesi bu branşa sızmaz (brans-alan-sizmasi).
 */
export function gastroenterolojiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /gastro/.test(b)
}

/**
 * NEFROLOJI-EXCEPTIONAL-01 — Nefroloji bölüm sekmesinin sahibi: yalnız nefroloji.
 * Dahiliye CKD araçları / sekmesi bu branşa sızmaz (brans-alan-sizmasi).
 */
export function nefrolojiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /nefroloji|b[öo]brek hastal/.test(b)
}

/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — FTR bölüm sekmesinin sahibi: yalnız fizik-tedavi / FTR.
 * Ortopedi, nöroloji, romatoloji ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
/**
 * ONKOLOJI-EXCEPTIONAL-01 — Onkoloji bölüm sekmesinin sahibi: yalnız tıbbi onkoloji.
 * Dahiliye, hematoloji ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function onkolojiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b || /radyasyon|radyo/.test(b)) return false
  return /onkolo|tibbi onkolo|tıbbi onkolo/.test(b)
}

/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Genel Cerrahi bölüm sekmesinin sahibi: yalnız genel cerrahi.
 * Ortopedi, üroloji, plastik, çocuk cerrahisi ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function genelCerrahiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  // Exact "genel cerrahi" / genel-cerrahi — not "genel" alone, not çocuk/göğüs/beyin/plastik/kalp-damar
  if (/[çc]ocuk|g[öo][ğg][üu]s|beyin|plastik|kalp.?damar|kardiyovask|toraks/.test(b) && /cerrah/.test(b)) return false
  return /genel.?cerrah|general.?surg/.test(b)
}

/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Plastik bölüm sekmesinin sahibi: yalnız plastik / rekonstrüktif / estetik cerrahi.
 * Dermatoloji, genel cerrahi ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */

/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Beyin Cerrahisi bölüm sekmesinin sahibi: yalnız beyin / nöroşirürji.
 * Nöroloji, genel cerrahi ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function beyinCerrahisiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /beyin.?cerrah|n[öo]ro[şs]ir[üu]rj|neurosurg/.test(b)
}

/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — Çocuk Cerrahisi sekmesi: yalnız cocuk-cerrahisi.
 * Pediatri (büyüme/Neyzi/Hedef Boy), genel cerrahi ve diğer branşlar bu sekmeyi GÖRMEZ.
 */
export function cocukCerrahisiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /çocuk cerrah|cocuk cerrah|cocuk-cerrahisi/.test(b)
}

/**
 * ANESTEZI-EXCEPTIONAL-01 — Anestezi bölüm sekmesinin sahibi: yalnız anestezi / anesteziyoloji.
 * Genel cerrahi, göğüs cerrahisi ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function anesteziSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /anestez|reanimasyon/.test(b)
}

/**
 * ACIL-TIP-EXCEPTIONAL-01 — Acil Tıp bölüm sekmesinin sahibi: yalnız acil tıp.
 * Kardiyoloji, nöroloji, anestezi ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function acilTipSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /acil.?t[ıi]p|acil tip|emergency medicine/.test(b)
}

/**
 * RADYOLOJI-EXCEPTIONAL-01 — Radyoloji bölüm sekmesinin sahibi: yalnız radyoloji.
 * Dahiliye, onkoloji, göğüs ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function radyolojiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /radyolo|radiolo/.test(b)
}



/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Göğüs Cerrahisi bölüm sekmesinin sahibi: yalnız gogus-cerrahisi.
 * gogus-hastaliklari (pulmonoloji), genel cerrahi ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */

/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — Kalp Damar Cerrahisi sekmesi: yalnız kalp-damar-cerrahisi.
 * kardiyoloji (SCORE2/Kalbim) ve diğer branşlar bu sekmeyi GÖRMEZ (brans-alan-sizmasi).
 */
export function kalpDamarCerrahisiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /kalp.{0,12}damar.?cerrah|kardiyovask.?cerrah|cardiovascular.?surg|damar cerrah/.test(b)
}

export function gogusCerrahisiSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  if (/hastal/.test(b) && !/cerrah/.test(b)) return false
  return /g[öo][ğg][üu]s.?cerrah|gogus.?cerrah|toraks.?cerrah|thoracic.?surg/.test(b)
}

export function plastikSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /plastik|rekonstr[üu]ktif|estetik cerrah/.test(b)
}


export function fizikTedaviSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /fizik.?tedavi|fiziksel.?t[ıi]p|fiziksel tip|\bftr\b|rehabilitasyon/.test(b)
}

export function yasYilKesir(dogumIso: string | null | undefined, nowMs = Date.now()): number | null {
  if (!dogumIso) return null
  const d = new Date(dogumIso)
  if (isNaN(d.getTime())) return null
  return (nowMs - d.getTime()) / (365.25 * 86_400_000)
}

/** Pediatric age gate: under 18, or unknown DOB. */
export function pediatriSekmesiUygun(dogumIso: string | null | undefined, nowMs = Date.now()): boolean {
  const y = yasYilKesir(dogumIso, nowMs)
  if (y == null) return true
  return y < 18
}

/**
 * Show pediatri tool tabs: age OK and doctor is pediatri or baseline (not another exclusive chapter).
 * Universal — same rule for göz, derm, KD, dahiliye, kardiyoloji, …
 * BRANS-ALAN-SIZMASI: unknown DOB keeps the tabs only for a pediatri doctor. For every other branch the patient
 * must be a KNOWN minor — an adult kardiyoloji/üroloji patient with no DOB on file used to get M-CHAT/gelişim tabs.
 */
export function pediatriAracSekmesiUygun(input: {
  dogumIso: string | null | undefined
  doktorBransi: string | null | undefined
  pediatriDoktoru: boolean
}, nowMs = Date.now()): boolean {
  if (!pediatriSekmesiUygun(input.dogumIso, nowMs)) return false
  if (input.pediatriDoktoru) return true
  if (yasYilKesir(input.dogumIso, nowMs) == null) return false
  return !ozelBolumBransi(input.doktorBransi)
}

/**
 * NOTYA-DAH-01 Dahiliye tab owners: iç hastalıkları + its subspecialties, aile hekimliği and the branch-less pratisyen.
 * BRANS-ALAN-SIZMASI: the old inline regex matched `genel-cerrahi` (via "genel") and `gogus-cerrahisi` (via "göğüs") —
 * surgeons got the Dahiliye chapter. Any cerrahi branch is excluded.
 */
export function dahiliyeSekmesiBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b || /cerrah/.test(b)) return false
  // GOGUS-EXCEPTIONAL-01: gogus-hastaliklari kendi "Göğüs" sekmesine sahip — dahiliye WOW'a düşmez.
  if (/göğüs hastal|gogus-hastalik|gogus hastal/.test(b)) return false
  // KARDIO-EXCEPTIONAL-01: kardiyoloji kendi sekmesine sahip — dahiliye WOW'a düşmez.
  if (/kardiyoloji|^kardiyo$|kalp hastal/.test(b) && !/damar/.test(b)) return false
  // AILE-HEKIMLIGI-EXCEPTIONAL-01: aile hekimliği kendi sekmesine sahip — dahiliye WOW'a düşmez.
  if (/aile\s*hekim|aile-hekimligi|aile hekimliği|genel pratisyen/.test(b)) return false
  // ENDOKRINOLOJI-EXCEPTIONAL-01: endokrinoloji kendi sekmesine sahip — dahiliye DM/WOW'a düşmez.
  if (/endokrin|romato/.test(b)) return false
  // GASTROENTEROLOJI-EXCEPTIONAL-01: gastroenteroloji kendi sekmesine sahip — dahiliye WOW'a düşmez.
  if (/gastro/.test(b)) return false
  // NEFROLOJI-EXCEPTIONAL-01: nefroloji kendi sekmesine sahip — dahiliye WOW'a düşmez.
  if (/nefroloji|b[öo]brek hastal/.test(b)) return false
  // ONKOLOJI-EXCEPTIONAL-01: onkoloji kendi sekmesine sahip — dahiliye WOW'a düşmez.
  if (/onkolo/.test(b)) return false
  // ENFEKSIYON-EXCEPTIONAL-01
  if (/enfeksiyon/.test(b)) return false
  // ROMATOLOJI-EXCEPTIONAL-01
  if (/romato/.test(b)) return false
  return /dahiliye|iç hast|ic hast|aile|genel|hemato/.test(b)
}

export function gebelikSekmesiUygun(input: {
  cinsiyet: string | null | undefined
  dogumIso: string | null | undefined
}, nowMs = Date.now()): boolean {
  if (!input.cinsiyet || input.cinsiyet !== 'Kadın') return false
  const y = yasYilKesir(input.dogumIso, nowMs)
  if (y == null) return true
  return y >= 12
}

export function hastaDosyaSekmeleri(opts: {
  dahiliyeUygun?: boolean
  /** GOZ-CHAPTER: doctor specialty göz hastalıkları */
  gozUygun?: boolean
  /** DERM: doctor specialty dermatoloji — never always-on */
  deriUygun?: boolean
  /** PSIK-EXCEPTIONAL-01: doctor specialty psikiyatri only */
  psikiyatriUygun?: boolean
  /** KBB-EXCEPTIONAL-01: doctor specialty kulak burun boğaz only */
  kbbUygun?: boolean
  /** KARDIO-EXCEPTIONAL-01: doctor specialty kardiyoloji only */
  kardiyolojiUygun?: boolean
  /** GOGUS-EXCEPTIONAL-01: doctor specialty gogus-hastaliklari only (not gogus-cerrahisi) */
  gogusUygun?: boolean
  /** NOROLOJI-EXCEPTIONAL-01: doctor specialty noroloji only */
  norolojiUygun?: boolean
  /** UROLOJI-EXCEPTIONAL-01: doctor specialty uroloji only */
  urolojiUygun?: boolean
  /** ORTOPEDI-EXCEPTIONAL-01: doctor specialty ortopedi only */
  ortopediUygun?: boolean
  /** FIZIK-TEDAVI-EXCEPTIONAL-01: doctor specialty fizik-tedavi only */
  fizikTedaviUygun?: boolean
  /** AILE-HEKIMLIGI-EXCEPTIONAL-01: doctor specialty aile-hekimligi only */
  aileUygun?: boolean
  /** SPOR-HEKIMLIGI-EXCEPTIONAL-01: doctor specialty spor-hekimligi only (not ortopedi/FTR) */
  sporHekimligiUygun?: boolean
  /** ENDOKRINOLOJI-EXCEPTIONAL-01: doctor specialty endokrinoloji only (not dahiliye) */
  endokrinolojiUygun?: boolean
  /** ENFEKSIYON-EXCEPTIONAL-01: doctor specialty enfeksiyon-hastaliklari only */
  enfeksiyonUygun?: boolean
  /** GASTROENTEROLOJI-EXCEPTIONAL-01: doctor specialty gastroenteroloji only (not dahiliye) */
  gastroenterolojiUygun?: boolean
  /** NEFROLOJI-EXCEPTIONAL-01: doctor specialty nefroloji only (not dahiliye) */
  nefrolojiUygun?: boolean
  /** ROMATOLOJI-EXCEPTIONAL-01: doctor specialty romatoloji only */
  romatolojiUygun?: boolean
  /** ONKOLOJI-EXCEPTIONAL-01: doctor specialty onkoloji only (not dahiliye) */
  onkolojiUygun?: boolean
  /** GOGUS-CERRAHISI-EXCEPTIONAL-01: doctor specialty gogus-cerrahisi only (not gogus-hastaliklari) */
  gogusCerrahisiUygun?: boolean
  /** GENEL-CERRAHI-EXCEPTIONAL-01: doctor specialty genel-cerrahi only (not ortopedi/üroloji/plastik) */
  genelCerrahiUygun?: boolean
  /** PLASTIK-CERRAHI-EXCEPTIONAL-01: doctor specialty plastik-cerrahi only (not dermatoloji / genel-cerrahi) */
  plastikUygun?: boolean
  /** BEYIN-CERRAHISI-EXCEPTIONAL-01: doctor specialty beyin-cerrahisi only (not noroloji) */
  beyinCerrahisiUygun?: boolean
  /** KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 */
  kalpDamarCerrahisiUygun?: boolean
  /** COCUK-CERRAHISI-EXCEPTIONAL-01: doctor specialty cocuk-cerrahisi only (not pediatri) */
  cocukCerrahisiUygun?: boolean
  /** ANESTEZI-EXCEPTIONAL-01: doctor specialty anestezi only (not genel-cerrahi) */
  anesteziUygun?: boolean
  /** ACIL-TIP-EXCEPTIONAL-01: doctor specialty acil-tip only (not kardiyoloji / noroloji) */
  acilTipUygun?: boolean
  /** RADYOLOJI-EXCEPTIONAL-01: doctor specialty radyoloji only */
  radyolojiUygun?: boolean
  pediatriUygun: boolean
  gebelikUygun: boolean
}): HastaDosyaSekme[] {
  const tabs: HastaDosyaSekme[] = [
    { id: 'ozet', label: 'Özet' },
    { id: 'muayene', label: 'Muayene Geçmişi' },
  ]
  if (opts.pediatriUygun) tabs.push({ id: 'buyume', label: 'Büyüme Eğrileri' })
  tabs.push(
    { id: 'belgeler', label: 'Belgeler' },
    // KONSULTASYON-01: evrensel — her branş, her yaş (istem → Kasa'daki rapor → hekimin yanıt özeti)
    { id: 'konsultasyon', label: 'Konsültasyonlar' },
    { id: 'goruntuleme', label: 'Görüntüler' },
    { id: 'ilaclar', label: 'İlaçlar' },
    { id: 'formu', label: 'Hasta Formu' },
    { id: 'asilar', label: 'Aşılar' },
  )
  if (opts.pediatriUygun) {
    tabs.push({ id: 'mchat', label: 'M-CHAT-R/F' }, { id: 'gelisim', label: 'Gelişim Taraması' })
  }
  if (opts.gozUygun) tabs.push({ id: 'goz', label: 'Göz' })
  // Ayşe'ye Danış artık sekme değil — sekmeler ile içerik arasında şerit (HastaKonsult).
  // Kadın Sağlığı & Gebelik: top-level değil — Muayene Geçmişi altında (Boss 2026-09-18)
  if (opts.deriUygun) tabs.push({ id: 'deri', label: 'Deri & Lezyon' })
  if (opts.dahiliyeUygun) tabs.push({ id: 'dahiliye', label: 'Dahiliye' })
  if (opts.psikiyatriUygun) tabs.push({ id: 'psikiyatri', label: 'Psikiyatri' })
  if (opts.kbbUygun) tabs.push({ id: 'kbb', label: 'KBB' })
  if (opts.kardiyolojiUygun) tabs.push({ id: 'kardiyoloji', label: 'Kardiyoloji' })
  if (opts.gogusUygun) tabs.push({ id: 'gogus', label: 'Göğüs' })
  if (opts.norolojiUygun) tabs.push({ id: 'noroloji', label: 'Nöroloji' })
  if (opts.urolojiUygun) tabs.push({ id: 'uroloji', label: 'Üroloji' })
  if (opts.ortopediUygun) tabs.push({ id: 'ortopedi', label: 'Ortopedi' })
  if (opts.fizikTedaviUygun) tabs.push({ id: 'fizik-tedavi', label: 'FTR' })
  if (opts.aileUygun) tabs.push({ id: 'aile', label: 'Aile Hekimliği' })
  if (opts.sporHekimligiUygun) tabs.push({ id: 'spor-hekimligi', label: 'Spor Hekimliği' })
  if (opts.endokrinolojiUygun) tabs.push({ id: 'endokrinoloji', label: 'Endokrinoloji' })
  if (opts.enfeksiyonUygun) tabs.push({ id: 'enfeksiyon', label: 'Enfeksiyon' })
  if (opts.gastroenterolojiUygun) tabs.push({ id: 'gastroenteroloji', label: 'Gastroenteroloji' })
  if (opts.nefrolojiUygun) tabs.push({ id: 'nefroloji', label: 'Nefroloji' })
  if (opts.romatolojiUygun) tabs.push({ id: 'romatoloji', label: 'Romatoloji' })
  if (opts.onkolojiUygun) tabs.push({ id: 'onkoloji', label: 'Onkoloji' })
  if (opts.gogusCerrahisiUygun) tabs.push({ id: 'gogus-cerrahisi', label: 'Göğüs Cerrahisi' })
  if (opts.genelCerrahiUygun) tabs.push({ id: 'genel-cerrahi', label: 'Genel Cerrahi' })
  if (opts.plastikUygun) tabs.push({ id: 'plastik', label: 'Plastik' })
  if (opts.beyinCerrahisiUygun) tabs.push({ id: 'beyin', label: 'Beyin Cerrahisi' })
  if (opts.kalpDamarCerrahisiUygun) tabs.push({ id: 'kalp-damar', label: 'Kalp Damar Cerrahisi' })
  if (opts.cocukCerrahisiUygun) tabs.push({ id: 'cocuk-cerrahisi', label: 'Çocuk Cerrahisi' })
  if (opts.anesteziUygun) tabs.push({ id: 'anestezi', label: 'Anestezi' })
  if (opts.acilTipUygun) tabs.push({ id: 'acil', label: 'Acil Tıp' })
  if (opts.radyolojiUygun) tabs.push({ id: 'radyo', label: 'Radyoloji' })
  return tabs
}

/** Sub-tabs under Muayene Geçmişi when the patient qualifies for KD / kadın sağlığı. */
export type MuayeneAltiId = 'vizitler' | 'gebelik'

export function muayeneAltiSekmeler(gebelikUygun: boolean): Array<{ id: MuayeneAltiId; label: string }> {
  const alti: Array<{ id: MuayeneAltiId; label: string }> = [{ id: 'vizitler', label: 'Vizitler' }]
  if (gebelikUygun) alti.push({ id: 'gebelik', label: 'Kadın Sağlığı & Gebelik' })
  return alti
}

export function pediatriSekmeIdleri(): readonly HastaDosyaSekmeId[] {
  return [...PED_TAB_IDS]
}
