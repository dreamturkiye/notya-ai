/**
 * AU-DIETETICS-TREND-01 — adult anthropometry trend from kept body-size tool results.
 *
 * Pure functions over `ulke_arac_kayitlari` rows. The pack names WHICH tool feeds the chart
 * (`UlkeAraclari.antropometriTrendAraci`); this file never hard-codes a country key (wall rule D7).
 *
 * Values shown: weight (kg), waist (cm), BMI (kg/m²) — Australian conventions already used by
 * the pack's body-size tool (weight kg, height/waist cm, BMI to one decimal). No new clinical
 * calculation: BMI and waist are repeated from the kept result, not recomputed here.
 */
import type { AracKaydi } from './kayitTipleri'

export type AntropometriParametresi = 'agirlik' | 'bel' | 'bmi'

export type AntropometriNoktasi = {
  /** Calendar day of the kept result (account timezone day from the kayit), YYYY-MM-DD. */
  tarih: string
  deger: number
}

/** Field keys the AU body-size tool (and equivalents) use for inputs / results. Pack-agnostic names. */
const GIRDI_AGIRLIK = 'agirlik'
const GIRDI_BEL = 'bel'
const SONUC_BMI = 'bmi'
const SONUC_BEL = 'bel'

/** One patient's measurements of ONE parameter, oldest first, from every completed kept result of `aracAnahtari`. */
export function antropometriNoktalari(
  kayitlar: readonly AracKaydi[],
  aracAnahtari: string,
  parametre: AntropometriParametresi,
): AntropometriNoktasi[] {
  const noktalar: AntropometriNoktasi[] = []
  for (const k of kayitlar) {
    if (k.arac !== aracAnahtari || !k.sonuc?.tamam || !k.gun) continue
    let deger: number | null = null
    if (parametre === 'agirlik') {
      const v = k.girdiler?.[GIRDI_AGIRLIK]
      deger = typeof v === 'number' ? v : null
    } else if (parametre === 'bel') {
      const fromSonuc = k.sonuc.sayilar.find((s) => s.anahtar === SONUC_BEL)?.deger
      const fromGirdi = k.girdiler?.[GIRDI_BEL]
      deger = typeof fromSonuc === 'number' ? fromSonuc : typeof fromGirdi === 'number' ? fromGirdi : null
    } else {
      const v = k.sonuc.sayilar.find((s) => s.anahtar === SONUC_BMI)?.deger
      deger = typeof v === 'number' ? v : null
    }
    if (deger !== null && Number.isFinite(deger)) noktalar.push({ tarih: k.gun, deger })
  }
  return noktalar.sort((a, b) => (a.tarih < b.tarih ? -1 : a.tarih > b.tarih ? 1 : 0))
}

export const ANTROPOMETRI_PARAMETRELERI: readonly AntropometriParametresi[] = ['agirlik', 'bel', 'bmi']
