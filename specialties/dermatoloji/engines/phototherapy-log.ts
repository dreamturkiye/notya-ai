/**
 * Phototherapy log. NO solarium modality (ban 2018).
 * NB-UVB 311, BB-UVB, PUVA oral/bath, local PUVA, excimer 308, UVA1, MED test.
 */
export const PHOTO_DEVICES = [
  'nb-uvb-311',
  'bb-uvb',
  'puva-oral',
  'puva-bath',
  'local-puva',
  'excimer-308',
  'uva1',
] as const

export type PhotoDevice = (typeof PHOTO_DEVICES)[number]

export type PhotoSession = {
  date: string
  device: PhotoDevice
  j_cm2: number
  med_test?: boolean
  burn?: boolean
  sessionPhotoCoreImageId?: string
  /** MED testi ölçülen eşik (J/cm²) — SUT defterinde aranır. */
  med_j_cm2?: number
  /** Hekimin bu seansta uyguladığı artış adımı (J/cm²). */
  dose_step?: number
  /** Yanık işaretliyse hekimin işaretlediği eylemler (BURN_CHECKLIST kodları). */
  burn_checklist?: string[]
}

/** Yanık işaretlenen seansta hekimin gözden geçirdiği maddeler — doz kararı hekimindir. */
export const BURN_CHECKLIST: readonly { kod: string; ad: string }[] = [
  { kod: 'seans_durduruldu', ad: 'Seans durduruldu / atlandı' },
  { kod: 'doz_geri', ad: 'Doz bir önceki basamağa çekildi' },
  { kod: 'fotosensitizan', ad: 'Fotosensitizan ilaç / bitkisel ürün sorgulandı' },
  { kod: 'koruma', ad: 'Yüz / genital koruma ve gözlük kontrol edildi' },
  { kod: 'cihaz_kalibrasyon', ad: 'Cihaz kalibrasyonu / lamba saati kontrol edildi' },
  { kod: 'hasta_bilgi', ad: 'Hastaya yanık bakımı ve bir sonraki seans planı anlatıldı' },
]

export function cumulativeJ(sessions: PhotoSession[], device?: PhotoDevice): number {
  const sum = sessions
    .filter((s) => device == null || s.device === device)
    .reduce((acc, s) => acc + s.j_cm2, 0)
  return Math.round(sum * 100) / 100
}

/** Aynı cihazdaki son seans (tarihe göre). */
export function sonSeans(sessions: PhotoSession[], device?: PhotoDevice): PhotoSession | null {
  const liste = sessions
    .filter((s) => device == null || s.device === device)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  return liste.length ? liste[liste.length - 1] : null
}

export type FototerapiOzet = {
  seans: number
  kumulatif: number
  sonTarih: string | null
  sonDoz: number | null
  yanik: number
  medJ: number | null
  /** Son doz + hekimin girdiği artış adımı. Yanık işaretli seanstan sonra taslak verilmez. */
  sonrakiDozTaslagi: number | null
}

/** Defter özeti. Aritmetiktir; protokol, endikasyon ve doz kararı hekimindir. */
export function fototerapiOzeti(sessions: PhotoSession[], device?: PhotoDevice): FototerapiOzet {
  const liste = sessions.filter((s) => device == null || s.device === device)
  const son = sonSeans(liste)
  const med = liste.filter((s) => s.med_j_cm2 != null).slice(-1)[0]?.med_j_cm2
  const adim = son?.dose_step ?? null
  const taslak = son && !son.burn && adim != null ? Math.round((son.j_cm2 + adim) * 100) / 100 : null
  return {
    seans: liste.length,
    kumulatif: cumulativeJ(liste),
    sonTarih: son?.date ?? null,
    sonDoz: son?.j_cm2 ?? null,
    yanik: liste.filter((s) => s.burn).length,
    medJ: med ?? null,
    sonrakiDozTaslagi: taslak,
  }
}

export function annualTbseDue(lastTbseIso: string | null, todayIso: string): boolean {
  if (!lastTbseIso) return true
  const last = Date.parse(lastTbseIso + 'T00:00:00Z')
  const today = Date.parse(todayIso + 'T00:00:00Z')
  return (today - last) / (365 * 86_400_000) >= 1
}

export const SOLARIUM_FORBIDDEN = true
