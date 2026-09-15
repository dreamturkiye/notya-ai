/**
 * Structured citation catalog. Cite role; do not dump copyrighted book text.
 * e-Nabız / MBYS / e-Doğum are integration adapters, not gold sources.
 */
export type SourceRole =
  | 'obstetrik-gold'
  | 'jinekoloji-gold'
  | 'ulusal-tr'
  | 'zorunlu-kamu'
  | 'adapter'

export type ProtocolSource = {
  id: string
  title: string
  year: number
  when_to_cite: string
  role: SourceRole
}

export const PROTOCOL_SOURCES: ProtocolSource[] = [
  {
    id: 'williams-26',
    title: 'Williams Obstetrik 26 (Cunningham; TR çev. Tıraş / Çakıroğlu, Güneş)',
    year: 2025,
    role: 'obstetrik-gold',
    when_to_cite: 'doğum, preeklampsi, kanama, IUGR, GDM, Rh, preterm',
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
    id: 'dobyr-2026',
    title: 'T.C. Sağlık Bakanlığı Doğum Öncesi Bakım Yönetim Rehberi DÖBYR 2026 HSGM Kadın ve Üreme Sağlığı DB Yayın No. 1402',
    year: 2026,
    role: 'zorunlu-kamu',
    when_to_cite: 'yasal izlem asgari, tarama pencereleri, gebe bildirimi',
  },
  {
    id: 'dsbyr',
    title: 'Doğum Sonu Bakım Yönetim Rehberi',
    year: 2018,
    role: 'zorunlu-kamu',
    when_to_cite: 'lohusa izlem, taburculuk süreleri, emzirme',
  },
  {
    id: 'riskli-gebelikler',
    title: 'Riskli Gebelikler Yönetim Rehberi',
    year: 2014,
    role: 'zorunlu-kamu',
    when_to_cite: 'yüksek risk sınıflaması, sevk',
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
