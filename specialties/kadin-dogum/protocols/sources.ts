/**
 * Structured citation catalog. Cite role; do not dump copyrighted book text.
 * e-Nabız / MBYS / e-Doğum are integration adapters, not gold sources.
 *
 * Citation *display* order for Notya (product directive 2026-09-17): Turkish sources first —
 * Sağlık Bakanlığı / national TR → TJOD / ulusal specialty orgs → ACOG / international.
 * This overrides the prior ACOG-first ranking Dr. Gökhan used for clinical practice preference;
 * ACOG remains pratik_altin_standart_tr_hekim for dual SB/ACOG columns, but is listed after TR sources.
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
    id: 'ntp-hsgm',
    title: 'T.C. SB HSGM Ulusal Yenidoğan Tarama Programı (FKU, KHT, biotinidaz, KF, KAH, SMA)',
    year: 2025,
    role: 'yasal_taban_sb',
    when_to_cite: 'taburcu NTP-1/NTP-2, tarama≠tanı disclaimer, topuk sonuçları bebek belgelerinde',
  },
  {
    id: 'bebek-izlem',
    title: 'T.C. SB Bebek İzlem Protokolü',
    year: 2018,
    role: 'yasal_taban_sb',
    when_to_cite: 'bebek izlem pencereleri (doğum, 1–10. gün, 15, 41, 2/3/4/6/9. ay), D vit, demir',
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

export const UI_HINT_YASAL_VS_KLINIK = 'yasal asgari / klinik öneri' as const

export type DualRecommendation<T> = {
  sb_required: T
  acog_recommended: T
  conflict: boolean
  uiHint: typeof UI_HINT_YASAL_VS_KLINIK
  citations: string[]
}

export type CiteKind = 'obstetrik' | 'jinekoloji' | 'lohusa' | 'risk' | 'acil'

/**
 * Mandatory citation display order (TR-first; overrides prior ACOG-first ranking):
 * SB / national TR → ulusal specialty wording (Temel KD) → ACOG → Williams → Novak (gyn).
 * Never collapse ACOG and DÖBYR into one recommendation when they differ.
 */
export function citeProtocol(kind: CiteKind = 'obstetrik'): string[] {
  const out: string[] = []
  if (kind === 'lohusa') out.push('dsbyr')
  else if (kind === 'risk') out.push('dobyr-2026', 'riskli-gebelikler')
  else out.push('dobyr-2026')
  out.push('temel-kd-4', 'acog', 'williams-26')
  if (kind === 'jinekoloji') out.push('berek-novak-16-17')
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
