/**
 * Catch-up for a missed dose on the National Immunisation Program schedule.
 *
 * BASE, every role. The same screen as the milestone record. Not a paediatrics-only tool.
 *
 * READ 2026-10-20 — Australian Immunisation Handbook, "Catch-up vaccination",
 *   https://immunisationhandbook.health.gov.au/contents/catch-up-vaccination
 *   last updated 30 September 2026. Three tables from that page are used:
 *   - number of doses a child should have received by the current age (all-children rows only);
 *   - minimum acceptable intervals for children under 10 years;
 *   - catch-up for people aged 10 years and over, population-level rows with a fixed interval.
 * A month in a vaccine interval is 4 weeks (28 days). Six months is 24 weeks (168 days).
 * Sixteen weeks is 112 days. Age bands are calendar months and calendar years, the same
 * day-counting as the milestone due days. The Register's planned catch-up "6 months" is
 * administrative, so it is 6 calendar months, and only once a catch-up day is shown for
 * a person under 20. Nothing is sent.
 *
 * NOT WORKED OUT, because the page sends them to another table or to status and risk:
 * Hib doses by age, hepatitis A, meningococcal B, extra pneumococcal doses, HPV, zoster,
 * and the brand upper-age limits for later rotavirus doses.
 */
import type { AracAlani, AracGirdisi, AracSayisi } from '@/lib/ulke/araclar/tipler'
import { ayEkle, gunEkle, gunMu, secim, tarih } from '@/lib/ulke/araclar/yardimci'
import { tamYas } from '@/lib/ulke/araclar/hastaKapisi'

const HAFTA = 7
const AY = 4 * HAFTA
const ALTI_AY = 6 * AY
const ON_ALTI_HAFTA = 16 * HAFTA

export const ASI_ANTIJEN = ['dtpa', 'hepb', 'hib', 'ipv', 'mmr', 'pcv', 'menacwy', 'rota', 'varicella'] as const
export const ASI_ADIM = ['d12', 'd23', 'd34', 'd45'] as const
export const ASI_BANT = ['ay0', 'ay2', 'ay4', 'ay6', 'ay12', 'ay18', 'yas4', 'yas10'] as const
export const YAKALAMA_SAYILAR = ['dtpa', 'hepb', 'menacwy', 'mmr', 'pcv', 'ipv', 'varicella', 'rota'] as const
export const YAKALAMA_TARIHLER = ['enErken', 'planBitis'] as const
export const YAKALAMA_UYARILAR = [
  'ozel', 'istisna', 'rota', 'rotaSinir', 'onYas', 'onYasAralik', 'yasGerek', 'adimYok',
  'hepb16', 'hepbIki', 'pcvYas', 'hib', 'menTek', 'kombinasyon',
] as const

type Antijen = (typeof ASI_ANTIJEN)[number]
type Adim = (typeof ASI_ADIM)[number]
type Bant = (typeof ASI_BANT)[number]

const COCUK_DOZ: Record<Exclude<Bant, 'yas10'>, Partial<Record<(typeof YAKALAMA_SAYILAR)[number], number>>> = {
  ay0: { dtpa: 0, hepb: 0, menacwy: 0, mmr: 0, pcv: 0, ipv: 0, varicella: 0, rota: 0 },
  ay2: { dtpa: 1, hepb: 1, menacwy: 0, mmr: 0, pcv: 1, ipv: 1, varicella: 0, rota: 1 },
  ay4: { dtpa: 2, hepb: 2, menacwy: 0, mmr: 0, pcv: 2, ipv: 2, varicella: 0, rota: 2 },
  ay6: { dtpa: 3, hepb: 3, menacwy: 0, mmr: 0, pcv: 2, ipv: 3, varicella: 0 },
  ay12: { dtpa: 3, hepb: 3, menacwy: 1, mmr: 1, pcv: 3, ipv: 3, varicella: 0 },
  ay18: { dtpa: 4, hepb: 3, menacwy: 1, mmr: 2, pcv: 3, ipv: 3, varicella: 1 },
  yas4: { dtpa: 5, hepb: 3, menacwy: 1, mmr: 2, pcv: 3, ipv: 4, varicella: 1 },
}

/** Intervals that are the same for a child under 10 and for a person of 10 and over. */
const ORTAK: Partial<Record<Antijen, Partial<Record<Adim, number>>>> = {
  dtpa: { d12: AY, d23: AY },
  hepb: { d12: AY, d23: 2 * AY },
  ipv: { d12: AY, d23: AY },
  mmr: { d12: AY },
  varicella: { d12: AY },
}
/** Extra steps on the under-10 table only. */
const COCUK_EK: Partial<Record<Antijen, Partial<Record<Adim, number>>>> = {
  dtpa: { d34: ALTI_AY, d45: ALTI_AY },
  hib: { d12: AY, d23: AY, d34: 2 * AY },
  ipv: { d34: AY },
  pcv: { d12: AY, d23: 2 * AY, d34: 2 * AY },
  menacwy: { d12: 2 * AY },
  rota: { d12: AY, d23: AY },
}

const ALTI_AYDAN_SONRA: ReadonlySet<Bant> = new Set(['ay6', 'ay12', 'ay18', 'yas4', 'yas10'])

export function yakalamaAlanlari(): AracAlani[] {
  const asisiVar = { kosul: { alan: 'asisi', degerler: [...ASI_ANTIJEN] } }
  return [
    secim('asisi', ASI_ANTIJEN, true),
    { ...secim('adim', ASI_ADIM, true), ...asisiVar },
    { ...tarih('sonDoz', true), ...asisiVar },
    { ...tarih('ilkDoz', true), kosul: { alan: 'asisi', degerler: ['hepb'] } },
  ]
}

/** The Handbook age column for this birth date on `bugun`. null = no usable birth date. */
export function yasBandi(dogum: string, bugun: string): Bant | null {
  if (!gunMu(dogum) || !gunMu(bugun) || dogum > bugun) return null
  const sinir = (ay: number) => ayEkle(dogum, ay)
  if (bugun < sinir(2)) return 'ay0'
  if (bugun < sinir(4)) return 'ay2'
  if (bugun < sinir(6)) return 'ay4'
  if (bugun < sinir(12)) return 'ay6'
  // The Handbook column is "12–18 months", and the next column starts at ">18 months".
  if (bugun <= sinir(18)) return 'ay12'
  if (bugun < sinir(48)) return 'ay18'
  if (bugun < sinir(120)) return 'yas4'
  return 'yas10'
}

function antijenMi(x: unknown): x is Antijen {
  return typeof x === 'string' && (ASI_ANTIJEN as readonly string[]).includes(x)
}
function adimMi(x: unknown): x is Adim {
  return typeof x === 'string' && (ASI_ADIM as readonly string[]).includes(x)
}

function aralik(asisi: Antijen, adim: Adim, bant: Bant | null): { gun: number | null; uyari: string | null } {
  const ortak = ORTAK[asisi]?.[adim]
  const cocuk = ortak ?? COCUK_EK[asisi]?.[adim] ?? null
  if (bant === null) {
    if (asisi === 'rota') return { gun: null, uyari: 'rota' }
    if (ortak !== undefined) return { gun: ortak, uyari: null }
    if (asisi === 'pcv' && (adim === 'd23' || adim === 'd34') && cocuk !== null) return { gun: cocuk, uyari: 'pcvYas' }
    return { gun: null, uyari: 'yasGerek' }
  }
  if (asisi === 'rota' && (bant === 'ay6' || ALTI_AYDAN_SONRA.has(bant))) return { gun: null, uyari: 'rota' }
  if (bant === 'yas10') {
    if (ortak === undefined) return { gun: null, uyari: 'onYasAralik' }
    return { gun: ortak, uyari: null }
  }
  if (cocuk === null) return { gun: null, uyari: 'adimYok' }
  return { gun: cocuk, uyari: null }
}

export type YakalamaParca = {
  sayilar: AracSayisi[]
  uyarilar: string[]
  tarihler: { anahtar: string; tarih: string }[]
  bant: string | null
  /** The three catch-up fields were filled, whether or not a day could be worked out. */
  istendi: boolean
}

export function yakalamaSonuc(g: AracGirdisi, bugun: string, dogum: string | null): YakalamaParca {
  const bant = dogum ? yasBandi(dogum, bugun) : null
  const uyarilar: string[] = []
  const sayilar: AracSayisi[] = []
  if (bant && bant !== 'yas10') {
    const doz = COCUK_DOZ[bant]
    for (const k of YAKALAMA_SAYILAR) {
      const deger = doz[k]
      if (deger !== undefined) sayilar.push({ anahtar: k, deger, ondalik: 0 })
    }
    uyarilar.push('ozel')
    if (bant === 'yas4') uyarilar.push('istisna')
    if (ALTI_AYDAN_SONRA.has(bant)) uyarilar.push('rota')
  }
  if (bant === 'yas10') uyarilar.push('onYas')

  const asisi = antijenMi(g.asisi) ? g.asisi : null
  const adim = adimMi(g.adim) ? g.adim : null
  const son = gunMu(g.sonDoz) ? g.sonDoz : null
  const istendi = !!(asisi && adim && son)
  const tarihler: { anahtar: string; tarih: string }[] = []
  if (!istendi || !asisi || !adim || !son) return { sayilar, uyarilar, tarihler, bant, istendi: false }

  const adimAralik = aralik(asisi, adim, bant)
  if (adimAralik.uyari) uyarilar.push(adimAralik.uyari)
  if (adimAralik.gun === null) return { sayilar, uyarilar, tarihler, bant, istendi: true }

  let gun = gunEkle(son, adimAralik.gun)
  if (asisi === 'hepb' && adim === 'd23') {
    const ilk = gunMu(g.ilkDoz) ? g.ilkDoz : null
    if (ilk) {
      const ucuncu = gunEkle(ilk, ON_ALTI_HAFTA)
      if (ucuncu > gun) gun = ucuncu
    } else uyarilar.push('hepb16')
    const yas = dogum ? tamYas(dogum, bugun) : null
    if (yas !== null && yas >= 11 && yas <= 15) uyarilar.push('hepbIki')
  } else if (asisi === 'hepb' && adim === 'd12') {
    const yas = dogum ? tamYas(dogum, bugun) : null
    if (yas !== null && yas >= 11 && yas <= 15) uyarilar.push('hepbIki')
  }
  if (asisi === 'pcv' && (adim === 'd23' || adim === 'd34') && dogum && bant !== 'yas10' && bant !== null) {
    const onIki = ayEkle(dogum, 12)
    if (onIki > gun) gun = onIki
  }
  if (asisi === 'hib') uyarilar.push('hib')
  if (asisi === 'menacwy') uyarilar.push('menTek')
  if (asisi === 'rota') uyarilar.push('rotaSinir')
  uyarilar.push('kombinasyon')
  tarihler.push({ anahtar: 'enErken', tarih: gun })
  const yas = dogum ? tamYas(dogum, bugun) : null
  if (yas !== null && yas < 20 && gunMu(bugun)) tarihler.push({ anahtar: 'planBitis', tarih: ayEkle(bugun, 6) })
  return { sayilar, uyarilar, tarihler, bant, istendi: true }
}
