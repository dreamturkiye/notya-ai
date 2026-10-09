/**
 * NOTYA-ULKE-ARACLAR-01 — sample inputs for a tool of the kit, for tests: the same list every time it is asked.
 * Tests only (lib/ulke/testing/).
 */
import type { AracAlani, AracGirdisi, AracOrtami, AracTanimi } from '../araclar/tipler'
import { kosullariUygula } from '../araclar/yardimci'

export const ORNEK_BUGUN = '2026-10-09'

/**
 * NUMBERS FOR THE TESTS of a tool that leaves its thresholds and intervals to the country: the numbers the pre-split
 * application uses, so that the kit's mechanism can be compared with it input for input (esdegerlik.test.ts).
 * They are test data — no country build reads this file, and no pack may copy them without its own clinical source.
 */
export const ORNEK_PARAMETRELER: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'lab-izlem': { hba1c_dikkat: 7, hba1c_yuksek: 9, tsh_alt: 0.4, tsh_ust: 4.0, tsh_dikkat_alt: 0.1, tsh_dikkat_ust: 10, ay_hba1c_hedef: 6, ay_hba1c_dikkat: 3, ay_hba1c_yuksek: 3, ay_tsh_hedef: 6, ay_tsh_dikkat: 3, ay_tsh_yuksek: 2 },
  'dxa-tekrar': { yil_dusuk: 3, yil_orta: 2, yil_yuksek: 1 },
  'viral-izlem': { ay_hiv: 3, ay_hepatit: 6, ay_diger: 6 },
  'ibd-skor': { mayo_remisyon_ust: 2, mayo_hafif_ust: 5, mayo_orta_ust: 7, hbi_remisyon_alti: 5, hbi_hafif_ust: 7, hbi_orta_ust: 16, ibs_remisyon_alti: 75, ibs_hafif_alti: 175, ibs_orta_alti: 300, ay_remisyon: 6, ay_hafif: 3, ay_orta: 2, ay_siddetli: 1 },
  'hepatit-izlem': { ay_stabil: 12, ay_aktif_izlem: 6, ay_tedavi_degerlendirme: 3 },
  'kardiyo-izlem': { sbp_dikkat: 140, dbp_dikkat: 90, gun_ht_kontrol: 30, gun_ht_lab: 90, gun_kky_kontrol: 30, gun_kky_kilo: 14, gun_af_kontrol: 60, gun_af_lab: 30, gun_diger_kontrol: 90 },
}

/** What a tool's arithmetic is handed in a test: the day, and either a pack's numbers or the sample ones. */
export const ornekOrtam = (t: AracTanimi, paketinki?: Readonly<Record<string, number>>): AracOrtami => ({ bugun: ORNEK_BUGUN, p: paketinki ?? ORNEK_PARAMETRELER[t.anahtar] ?? {} })

/** Deterministic inputs for a tool: empty, everything at its first value, everything at its last, and a spread of mixes. */
export function ornekGirdiler(t: AracTanimi, adet = 40): AracGirdisi[] {
  const deger = (a: AracAlani, n: number): number | string | boolean | null => {
    if (a.tur === 'isaret') return n % 2 === 0
    if (a.tur === 'secim') return a.secenekler![n % a.secenekler!.length]
    if (a.tur === 'metin') return n % 3 === 0 ? null : `QA-TEXT-${a.anahtar}`
    if (a.tur === 'tarih') return `2026-${String((n % 12) + 1).padStart(2, '0')}-${String((n % 27) + 1).padStart(2, '0')}`
    const enAz = a.enAz ?? 0, enCok = a.enCok ?? 100
    const x = enAz + ((enCok - enAz) * (n % 11)) / 10
    return a.tam || a.tur === 'puan' ? Math.round(x) : Math.min(enCok, Math.max(enAz, Math.round(x * 100) / 100))
  }
  const bos = Object.fromEntries(t.alanlar.map((a) => [a.anahtar, a.tur === 'isaret' ? false : null]))
  const liste: AracGirdisi[] = [bos, Object.fromEntries(t.alanlar.map((a) => [a.anahtar, deger(a, 0)])), Object.fromEntries(t.alanlar.map((a) => [a.anahtar, deger(a, 10)]))]
  for (let i = 1; i <= adet; i++) liste.push(Object.fromEntries(t.alanlar.map((a, j) => [a.anahtar, (i * 7 + j * 3) % 5 === 0 && a.tur !== 'isaret' ? null : deger(a, i * 3 + j * 5 + (i % 2 ? j : 0))])))
  // A field whose condition does not hold is not there: the samples are what a screen would hand over.
  return liste.map((g) => kosullariUygula(t.alanlar, g))
}
