/**
 * Structured citation catalog. Cite role; do not dump copyrighted book text.
 * e-Nabız / MBYS / e-Doğum are integration adapters, not gold sources.
 *
 * Ranking confirmed for Notya by Dr. Gokhan Mamur: TR kadın doğum hekimleri
 * pratikte ACOG (PB / CO / OCC) cite eder; DÖBYR yasal tabandır; Williams ders kitabı derinliğidir.
 */
export type SourceRole =
  | 'pratik_altin_standart_tr_hekim'
  | 'obstetrik_ders_kitabi'
  | 'yasal_taban_sb'
  | 'jinekoloji-gold'
  | 'ulusal-tr'
  | 'adapter'
  /** @deprecated use obstetrik_ders_kitabi */
  | 'obstetrik-gold'
  /** @deprecated use yasal_taban_sb */
  | 'zorunlu-kamu'

export type ProtocolSource = {
  id: string
  title: string
  year: number
  when_to_cite: string
  role: SourceRole
}

export const PROTOCOL_SOURCES: ProtocolSource[] = [
  {
    id: 'acog',
    title: 'ACOG Practice Bulletin / Committee Opinion / Obstetric Care Consensus',
    year: 2024,
    role: 'pratik_altin_standart_tr_hekim',
    when_to_cite: 'what do we do — izlem cadence, GDM, PE, Rh, PTL/PPROM/ACS, aneuploidy, CS/VBAC, GBS, NST/BPP/Doppler, postpartum',
  },
  {
    id: 'dobyr-2026',
    title: 'T.C. Sağlık Bakanlığı Doğum Öncesi Bakım Yönetim Rehberi DÖBYR 2026 HSGM Kadın ve Üreme Sağlığı DB Yayın No. 1402',
    year: 2026,
    role: 'yasal_taban_sb',
    when_to_cite: 'what is legally required in Türkiye — yasal izlem asgari, tarama pencereleri, gebe bildirimi',
  },
  {
    id: 'dsbyr',
    title: 'Doğum Sonu Bakım Yönetim Rehberi',
    year: 2018,
    role: 'yasal_taban_sb',
    when_to_cite: 'lohusa izlem, taburculuk süreleri, emzirme',
  },
  {
    id: 'riskli-gebelikler',
    title: 'Riskli Gebelikler Yönetim Rehberi',
    year: 2014,
    role: 'yasal_taban_sb',
    when_to_cite: 'yüksek risk sınıflaması, sevk',
  },
  {
    id: 'williams-26',
    title: 'Williams Obstetrik 26 (Cunningham; TR çev. Tıraş / Çakıroğlu, Güneş)',
    year: 2025,
    role: 'obstetrik_ders_kitabi',
    when_to_cite: 'mechanism / depth — doğum, preeklampsi, kanama, IUGR, GDM, Rh, preterm',
  },
  {
    id: 'berek-novak-16-17',
    title: 'Berek & Novak Jinekoloji 16–17',
    year: 2020,
    role: 'jinekoloji-gold',
    when_to_cite: 'serviks, endometrium, over, ürojinekoloji, reprodüktif endokrin, jinekolojik onkoloji',
  },
  {
    id: 'temel-kd-4',
    title: 'Temel Kadın Hastalıkları ve Doğum Bilgisi 4. baskı (Hacettepe, 242 yazar)',
    year: 2020,
    role: 'ulusal-tr',
    when_to_cite: 'TR muayenehane language',
  },
  {
    id: 'e-nabiz',
    title: 'e-Nabız / MBYS',
    year: 2024,
    role: 'adapter',
    when_to_cite: 'field map only — do not fake live writes',
  },
  {
    id: 'e-dogum',
    title: 'e-Doğum',
    year: 2024,
    role: 'adapter',
    when_to_cite: 'canlı doğum + ölü doğum ≥22w veya ≥500g',
  },
]

export const UI_HINT_YASAL_VS_KLINIK = 'yasal asgari vs klinik öneri' as const

export type DualRecommendation<T> = {
  sb_required: T
  acog_recommended: T
  conflict: boolean
  uiHint: typeof UI_HINT_YASAL_VS_KLINIK
  citations: string[]
}

export type CiteKind = 'obstetrik' | 'jinekoloji' | 'lohusa' | 'risk' | 'acil'

/**
 * Mandatory citation order: ACOG → DÖBYR/DSB/Riskli → Williams → Novak (gyn) → Temel KD.
 * Never collapse ACOG and DÖBYR into one recommendation when they differ.
 */
export function citeProtocol(kind: CiteKind = 'obstetrik'): string[] {
  const out: string[] = ['acog']
  if (kind === 'lohusa') out.push('dsbyr')
  else if (kind === 'risk') out.push('dobyr-2026', 'riskli-gebelikler')
  else out.push('dobyr-2026')
  out.push('williams-26')
  if (kind === 'jinekoloji') out.push('berek-novak-16-17')
  out.push('temel-kd-4')
  return out
}

export function dualWhenConflict<T>(sb: T, acog: T, conflict: boolean, kind: CiteKind = 'obstetrik'): DualRecommendation<T> {
  return {
    sb_required: sb,
    acog_recommended: acog,
    conflict,
    uiHint: UI_HINT_YASAL_VS_KLINIK,
    citations: citeProtocol(kind),
  }
}
