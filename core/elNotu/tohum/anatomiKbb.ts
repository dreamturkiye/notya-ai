/**
 * ESNEK-MUAYENE-A — anatomy keys a KBB form template's drawing regions can be mapped to (data; labels per language).
 * Other branches map regions with a free label (their forms rarely carry drawings); the side always comes from the region.
 */
export type AnatomiTanimi = { anahtar: string; tr: string; en: string; uz: string; taraf: boolean }

export const KBB_ANATOMI: AnatomiTanimi[] = [
  { anahtar: 'kulak_zari', tr: 'Kulak zarı', en: 'Tympanic membrane', uz: 'Quloq pardasi', taraf: true },
  { anahtar: 'dis_kulak', tr: 'Dış kulak / kulak yolu', en: 'External ear / canal', uz: 'Tashqi quloq / quloq yoʻli', taraf: true },
  { anahtar: 'burun', tr: 'Burun / septum, konkalar', en: 'Nose / septum, turbinates', uz: 'Burun / toʻsiq, chig‘anoqlar', taraf: true },
  { anahtar: 'nazofarenks', tr: 'Nazofarenks', en: 'Nasopharynx', uz: 'Burun-halqum', taraf: false },
  { anahtar: 'agiz_ici', tr: 'Ağız içi / orofarenks', en: 'Oral cavity / oropharynx', uz: 'Ogʻiz boʻshligʻi / orofarinks', taraf: true },
  { anahtar: 'larenks', tr: 'Larenks', en: 'Larynx', uz: 'Hiqildoq', taraf: true },
  { anahtar: 'boyun', tr: 'Boyun', en: 'Neck', uz: 'Boʻyin', taraf: true },
]
