/**
 * Hasta dosyası tab visibility — specialty-first (universal chrome for all ~29 branşlar).
 *
 * Rules (specialty-universal-vs-chapter + CHART-TAB-POLICY 2026-09-17):
 *  - Exclusive chapter tabs (Göz, Deri, Dahiliye) only when that doctor’s specialty owns them.
 *  - Pediatric tool tabs (büyüme / M-CHAT / gelişim / bebek) only when age qualifies AND the
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
  | 'bebek'
  | 'goz'
  | 'psikiyatri'
  | 'kbb'

export type HastaDosyaSekme = { id: HastaDosyaSekmeId; label: string }

const PED_TAB_IDS: ReadonlySet<HastaDosyaSekmeId> = new Set(['buyume', 'mchat', 'gelisim'])

/** Chapters that own exclusive chart tabs — they do not inherit another chapter’s tool strip. */
export function ozelBolumBransi(specialtyHam: string | null | undefined): boolean {
  const b = String(specialtyHam || '').trim().toLocaleLowerCase('tr-TR')
  if (!b) return false
  return /göz|goz|oftalm|derma|deri ve z|dahiliye|iç hast|ic hast|kadın|kadin|jinek|obstet|pediatri|çocuk sağlığı|cocuk sagligi|çocuk hast|cocuk hast|psikiyatri|ruh sağlığı|ruh sagligi|kulak burun|kulak-burun|\bkbb\b|otolaring/.test(b)
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
  return /dahiliye|iç hast|ic hast|aile|genel|endokrin|nefro|kardiyo|gastro|romato|hemato|onkolo|göğüs|gogus/.test(b)
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
    { id: 'goruntuleme', label: 'Görüntüleme' },
    { id: 'ilaclar', label: 'İlaçlar' },
    { id: 'formu', label: 'Hasta Formu' },
    { id: 'asilar', label: 'Aşılar' },
  )
  if (opts.pediatriUygun) {
    tabs.push({ id: 'bebek', label: 'Bebek kartı' }, { id: 'mchat', label: 'M-CHAT-R/F' }, { id: 'gelisim', label: 'Gelişim Taraması' })
  }
  if (opts.gozUygun) tabs.push({ id: 'goz', label: 'Göz' })
  tabs.push({ id: 'ayse', label: "Ayşe'ye Danış" })
  // Kadın Sağlığı & Gebelik: top-level değil — Muayene Geçmişi altında (Boss 2026-09-18)
  if (opts.deriUygun) tabs.push({ id: 'deri', label: 'Deri & Lezyon' })
  if (opts.dahiliyeUygun) tabs.push({ id: 'dahiliye', label: 'Dahiliye' })
  if (opts.psikiyatriUygun) tabs.push({ id: 'psikiyatri', label: 'Psikiyatri' })
  if (opts.kbbUygun) tabs.push({ id: 'kbb', label: 'KBB' })
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
