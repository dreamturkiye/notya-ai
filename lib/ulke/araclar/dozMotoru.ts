/**
 * ULKE-BRANS-DERINLIK-09 (Kaan, 2026-11-08) — THE SPECIALTY DOSE ENGINE AND THE SPECIALTY ORDER PRESETS of a country
 * build. Shared kit: the same arithmetic and the same shapes in every country; a pack builds one tool of each per role,
 * with that role's own BASES (a paediatric role works per kilogram, an oncology role per square metre, a surgical role
 * with a fixed dose) and that role's own order list, in its own words.
 *
 * FOUNDER RULE (specialties/pediatri/engines/doz.ts, kept as it is): THE CLINICIAN ENTERS EVERY DOSE. This engine knows no
 * medicine, no default amount, no recommended dose and no ceiling of its own: the amount per basis, the concentration and
 * any ceiling are typed by the clinician; the engine does arithmetic and unit work only, and warns when the clinician's own
 * ceiling is passed. The name of the medicine is free text, for the record and the printout. Nothing is prescribed or sent.
 *
 * Bases:
 *   kg     amount per kilogram of body weight (per day or per dose)                        — Pediatri's engine
 *   m2     amount per square metre of body-surface area (per day or per dose); the area is the clinician's own figure or,
 *          when left empty, worked out from height and weight by Mosteller's formula (Mosteller RD. Simplified calculation
 *          of body-surface area. N Engl J Med 1987;317(17):1098 — PubMed 3657876, read 2026-11-08)
 *   sabit  a fixed amount per dose
 *
 * The ORDER PRESETS are a role's own list of what its clinicians commonly order (investigations, referrals, monitoring):
 * tick-boxes and a free line, printed on the letterhead with the document number (BELGE-NO-01). No result, threshold or
 * dose is in a preset; ticking one orders nothing — it is the clinician's own list for the note and the request form.
 *
 * Pure. Every amount of a medicine in a result is marked `doz` (written by the pack's `dozYazimi`).
 */
import type { AracAlani, AracSayisi, AracTanimi } from './tipler'
import { BOS_SONUC, isaret, isaretliler, metin, puan, sayi, sayiMi, secim } from './yardimci'

export const DOZ_TEMELLERI = ['kg', 'm2', 'sabit'] as const
export type DozTemeli = (typeof DOZ_TEMELLERI)[number]

/** The volume of one dose below which the result carries the small-volume caution, in mL (as the kit's doz-hesabi). */
export const DOZ_KUCUK_HACIM_ML = 1

/** Mosteller: √(height cm × weight kg / 3600), in m². */
export const mosteller = (boyCm: number, kiloKg: number): number => Math.sqrt((boyCm * kiloKg) / 3600)

export type DozGirdisi = {
  temel: DozTemeli
  kiloKg?: number | null
  boyCm?: number | null
  /** The clinician's own body-surface area, m². Wins over height and weight. */
  bsa?: number | null
  /** Amount in mg per kg, per m², or per dose (sabit). */
  miktar: number
  /** 'gun' = the amount is per day; 'doz' = per dose. Ignored for `sabit` (always per dose). */
  mod: 'gun' | 'doz'
  dozSayisi: number
  konsMg?: number | null
  konsMl?: number | null
  tavanDozMg?: number | null
  tavanGunMg?: number | null
}

export type DozSonucu = {
  dozMg: number
  gunlukMg: number
  araliksaat: number
  bsa: number | null
  dozMl: number | null
  gunlukMl: number | null
  tavanliDozMg: number | null
  tavanliDozMl: number | null
  uyarilar: readonly ('tavan_doz' | 'tavan_gun' | 'kilo_birim' | 'ml_yuvarlanmadi' | 'ml_kucuk')[]
}

/** Arithmetic only. null = something the basis needs is missing. */
export function dozHesapla(g: DozGirdisi): DozSonucu | null {
  const n = Math.round(g.dozSayisi)
  if (!sayiMi(g.miktar) || !(g.miktar > 0) || !(n >= 1 && n <= 6)) return null
  let carpan: number
  let bsa: number | null = null
  if (g.temel === 'kg') {
    if (!sayiMi(g.kiloKg) || !(g.kiloKg > 0)) return null
    carpan = g.kiloKg
  } else if (g.temel === 'm2') {
    if (sayiMi(g.bsa) && g.bsa > 0) bsa = g.bsa
    else if (sayiMi(g.boyCm) && g.boyCm > 0 && sayiMi(g.kiloKg) && g.kiloKg > 0) bsa = mosteller(g.boyCm, g.kiloKg)
    else return null
    carpan = bsa
  } else carpan = 1
  const gunlukMg = g.temel === 'sabit' ? g.miktar * n : g.mod === 'gun' ? carpan * g.miktar : carpan * g.miktar * n
  const dozMg = gunlukMg / n
  const mgPerMl = sayiMi(g.konsMg) && sayiMi(g.konsMl) && g.konsMg > 0 && g.konsMl > 0 ? g.konsMg / g.konsMl : null
  const ml = (mg: number) => (mgPerMl ? mg / mgPerMl : null)
  const tDoz = sayiMi(g.tavanDozMg) && g.tavanDozMg > 0 ? g.tavanDozMg : null
  const tGun = sayiMi(g.tavanGunMg) && g.tavanGunMg > 0 ? g.tavanGunMg : null
  const asim = Boolean((tDoz && dozMg > tDoz) || (tGun && gunlukMg > tGun))
  const tavanli = asim ? Math.min(tDoz ?? Infinity, tGun ? tGun / n : Infinity, dozMg) : null
  const dozMl = ml(dozMg), gunlukMl = ml(gunlukMg), tavanliMl = tavanli !== null ? ml(tavanli) : null
  const kucuk = (dozMl !== null && dozMl < DOZ_KUCUK_HACIM_ML) || (tavanliMl !== null && tavanliMl < DOZ_KUCUK_HACIM_ML)
  const uyarilar: DozSonucu['uyarilar'][number][] = []
  if (tDoz && dozMg > tDoz) uyarilar.push('tavan_doz')
  if (tGun && gunlukMg > tGun) uyarilar.push('tavan_gun')
  if (sayiMi(g.kiloKg) && g.kiloKg > 150) uyarilar.push('kilo_birim')
  if (dozMl !== null) uyarilar.push('ml_yuvarlanmadi')
  if (kucuk) uyarilar.push('ml_kucuk')
  return { dozMg, gunlukMg, araliksaat: 24 / n, bsa, dozMl, gunlukMl, tavanliDozMg: tavanli, tavanliDozMl: tavanliMl, uyarilar }
}

const dozSayisi = (anahtar: string, deger: number, birim: string): AracSayisi => ({ anahtar, deger, ondalik: 2, anlamli: 3, birim, doz: true })

/** Field keys of a dose tool (the pack names each). `temel` lists only the role's own bases. */
export const DOZ_CIKTI = {
  sayilar: ['doz_mg', 'gunluk_mg', 'aralik_saat', 'bsa', 'doz_ml', 'gunluk_ml', 'tavanli_doz_mg', 'tavanli_doz_ml'],
  bantlar: [] as string[],
  uyarilar: ['tavan_doz', 'tavan_gun', 'kilo_birim', 'ml_yuvarlanmadi', 'ml_kucuk'],
  tarihler: [] as string[],
} as const

/**
 * A role's dose tool. `temeller` = the bases this specialty works with, in the order offered (at least one).
 * The fields a basis does not need are not shown (`kosul`).
 */
export function dozAraciTanimi(anahtar: string, temeller: readonly DozTemeli[]): AracTanimi {
  if (!temeller.length) throw new Error(`${anahtar}: a dose tool needs at least one basis`)
  const kg = temeller.includes('kg'), m2 = temeller.includes('m2')
  const govde = temeller.filter((t) => t !== 'sabit')
  const alanlar: AracAlani[] = [
    metin('ilac', { enCok: 80 }),
    secim('temel', temeller),
    ...(kg || m2 ? [sayi('kilo', 0.3, 300, { olcu: 'agirlik', kosul: { alan: 'temel', degerler: govde }, ...(m2 && !kg ? { istege: true } : {}) })] : []),
    ...(m2 ? [sayi('boy', 30, 250, { olcu: 'boy', istege: true, kosul: { alan: 'temel', degerler: ['m2'] } }), sayi('bsa', 0.1, 3.5, { birim: 'm²', istege: true, kosul: { alan: 'temel', degerler: ['m2'] } })] : []),
    sayi('miktar', 0.001, 100000, { birim: 'mg' }),
    ...(govde.length ? [secim('mod', ['gun', 'doz'], false)].map((a) => ({ ...a, kosul: { alan: 'temel', degerler: govde } })) : []),
    puan('doz_sayisi', 1, 6),
    sayi('kons_mg', 0.001, 100000, { birim: 'mg', istege: true }), sayi('kons_ml', 0.001, 10000, { birim: 'mL', istege: true }),
    sayi('tavan_doz_mg', 0.001, 100000, { birim: 'mg', istege: true }), sayi('tavan_gun_mg', 0.001, 100000, { birim: 'mg', istege: true }),
  ]
  return {
    anahtar,
    tur: 'hesap',
    alanlar,
    cikti: { sayilar: [...DOZ_CIKTI.sayilar], bantlar: [], uyarilar: [...DOZ_CIKTI.uyarilar], tarihler: [] },
    sonucBirimleri: ['mg', 'mL', 'saat', 'm²'],
    dozYazar: true,
    yazdirilir: true,
    kaynak: m2 ? 'Mosteller RD. Simplified calculation of body-surface area. N Engl J Med 1987;317(17):1098 (body-surface area when not entered). The amounts are the clinician\'s own.' : null,
    hesapla: (g) => {
      const temel = typeof g.temel === 'string' && (temeller as readonly string[]).includes(g.temel) ? (g.temel as DozTemeli) : null
      if (!temel || !sayiMi(g.miktar) || !sayiMi(g.doz_sayisi)) return BOS_SONUC
      if (temel !== 'sabit' && g.mod !== 'gun' && g.mod !== 'doz') return BOS_SONUC
      const s = dozHesapla({
        temel, kiloKg: sayiMi(g.kilo) ? g.kilo : null, boyCm: sayiMi(g.boy) ? g.boy : null, bsa: sayiMi(g.bsa) ? g.bsa : null,
        miktar: g.miktar, mod: g.mod === 'gun' ? 'gun' : 'doz', dozSayisi: g.doz_sayisi,
        konsMg: sayiMi(g.kons_mg) ? g.kons_mg : null, konsMl: sayiMi(g.kons_ml) ? g.kons_ml : null,
        tavanDozMg: sayiMi(g.tavan_doz_mg) ? g.tavan_doz_mg : null, tavanGunMg: sayiMi(g.tavan_gun_mg) ? g.tavan_gun_mg : null,
      })
      if (!s) return BOS_SONUC
      return {
        tamam: true,
        sayilar: [
          dozSayisi('doz_mg', s.dozMg, 'mg'), dozSayisi('gunluk_mg', s.gunlukMg, 'mg'), { anahtar: 'aralik_saat', deger: s.araliksaat, ondalik: 1, birim: 'saat' },
          ...(s.bsa !== null ? [{ anahtar: 'bsa', deger: s.bsa, ondalik: 2, birim: 'm²' }] : []),
          ...(s.dozMl !== null ? [dozSayisi('doz_ml', s.dozMl, 'mL')] : []), ...(s.gunlukMl !== null ? [dozSayisi('gunluk_ml', s.gunlukMl, 'mL')] : []),
          ...(s.tavanliDozMg !== null ? [dozSayisi('tavanli_doz_mg', s.tavanliDozMg, 'mg')] : []), ...(s.tavanliDozMl !== null ? [dozSayisi('tavanli_doz_ml', s.tavanliDozMl, 'mL')] : []),
        ],
        bant: null,
        uyarilar: s.uyarilar,
        tarihler: [],
      }
    },
  }
}

/** A role's order presets: one tick-box per item (keys from the pack), a free line and a note; printable. */
export function siparisAraciTanimi(anahtar: string, kalemler: readonly string[]): AracTanimi {
  if (kalemler.length < 3) throw new Error(`${anahtar}: an order preset list needs at least three items`)
  if (new Set(kalemler).size !== kalemler.length) throw new Error(`${anahtar}: an item is listed twice`)
  const hepsi = [...kalemler]
  return {
    anahtar,
    tur: 'liste',
    alanlar: [...hepsi.map(isaret), metin('diger', { enCok: 200 }), metin('aciklama', { uzun: true })],
    cikti: { sayilar: ['secilen'], bantlar: [], uyarilar: [], tarihler: [] },
    kaynak: null,
    yazdirilir: true,
    hesapla: (g) => {
      const secili = isaretliler(g, hepsi)
      const diger = typeof g.diger === 'string' && g.diger.trim() ? 1 : 0
      if (!secili.length && !diger) return BOS_SONUC
      return { tamam: true, sayilar: [{ anahtar: 'secilen', deger: secili.length + diger, ondalik: 0 }], bant: null, uyarilar: [], tarihler: [] }
    },
  }
}
