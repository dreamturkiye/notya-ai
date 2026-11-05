/**
 * KD-RAPOR-01 (Kaan, 2026-11-05) — United States: FETAL HEART RATE TRACING BY THE NICHD THREE-TIER SYSTEM, this
 * country's own tool (a national classification is never in the kit). Obstetrics and gynecology only.
 *
 * Source: Macones GA, Hankins GDV, Spong CY, Hauth J, Moore T. The 2008 National Institute of Child Health and Human
 * Development workshop report on electronic fetal monitoring. Obstet Gynecol 2008;112:661-6; adopted in ACOG Practice
 * Bulletin No. 106 (2009). Cited 2026-11-05 from the job's knowledge, NOT re-opened in this session (./onayBekleyen.ts).
 *   variability   absent = undetectable (entered as 0); minimal = 5 bpm or less; moderate = 6 to 25; marked = over 25
 *   Category I    baseline 110-160, moderate variability, no late or variable decelerations (early may be present)
 *   Category III  absent variability with recurrent late decelerations, recurrent variable decelerations or
 *                 bradycardia (baseline below 110); or a sinusoidal pattern
 *   Category II   every tracing that is neither
 * "Recurrent" = with 50% or more of contractions (the tick box of the shared CTG fields).
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, gunMu, sayiMi } from '@/lib/ulke/araclar/yardimci'
import { KTG_ALANLARI } from '@/lib/ulke/araclar/tanimlar/kadinDogumCerrahi'

const D = 'en-US'
const m = (metin: string) => ({ [D]: metin })
const n0 = (x: unknown): number => (sayiMi(x) ? x : 0)

export function nichdKategori(g: Readonly<Record<string, unknown>>): { bant: 'kat1' | 'kat2' | 'kat3'; uyarilar: string[] } | null {
  if (!sayiMi(g.bazal) || !sayiMi(g.varyabilite)) return null
  const b = g.bazal as number, v = g.varyabilite as number
  const tekrar = g.tekrarlayan === true
  const sinus = n0(g.sinuzoidal_dk) > 0
  const u: string[] = []
  if (v === 0) u.push('varyabilite_yok'); else if (v <= 5) u.push('varyabilite_minimal'); else if (v > 25) u.push('varyabilite_belirgin')
  if (b < 110) u.push('bradikardi'); else if (b > 160) u.push('tasikardi')
  if (tekrar && n0(g.gec) > 0) u.push('gec_tekrarlayan')
  if (tekrar && n0(g.degisken) > 0) u.push('degisken_tekrarlayan')
  if (n0(g.uzamis) > 0) u.push('uzamis')
  if (sinus) u.push('sinuzoidal')
  const kat3 = sinus || (v === 0 && ((tekrar && n0(g.gec) > 0) || (tekrar && n0(g.degisken) > 0) || b < 110))
  const kat1 = !sinus && b >= 110 && b <= 160 && v >= 6 && v <= 25 && n0(g.gec) === 0 && n0(g.degisken) === 0 && n0(g.uzamis) === 0
  return { bant: kat3 ? 'kat3' : kat1 ? 'kat1' : 'kat2', uyarilar: u }
}

export const US_KTG_NICHD: AracTanimi = {
  anahtar: 'us-ctg-nichd', tur: 'olcek', yazdirilir: true,
  alanlar: KTG_ALANLARI,
  cikti: { sayilar: [], bantlar: ['kat1', 'kat2', 'kat3'], uyarilar: ['varyabilite_yok', 'varyabilite_minimal', 'varyabilite_belirgin', 'bradikardi', 'tasikardi', 'gec_tekrarlayan', 'degisken_tekrarlayan', 'uzamis', 'sinuzoidal'], tarihler: [] },
  kaynak: 'Macones GA et al. The 2008 NICHD workshop report on electronic fetal monitoring. Obstet Gynecol, September 2008 (three-tier interpretation; ACOG Practice Bulletin 106, 2009). Cited 2026-11-05.',
  hesapla: (g) => {
    if (!gunMu(g.tarih) || !sayiMi(g.sure)) return BOS_SONUC
    const r = nichdKategori(g)
    return r ? { tamam: true, sayilar: [], bant: r.bant, uyarilar: r.uyarilar, tarihler: [] } : BOS_SONUC
  },
}

export const usKtgAraci = (roller: readonly string[]): PaketAraci => ({
  anahtar: 'us-ctg-nichd',
  roller,
  lisans: { durum: 'serbest', kaynak: 'a published scientific consensus report (Obstet Gynecol 2008); the three category definitions are facts restated in this product\'s own words, cited 2026-11-05' },
  metin: {
    ad: m('Fetal heart rate tracing: NICHD three-tier category'),
    aciklama: m('Baseline, variability and decelerations of an electronic fetal monitoring tracing placed in Category I, II or III as the 2008 NICHD workshop defined them. Printed on your letterhead.'),
    alanlar: {
      tarih: m('Date'), hafta: m('Gestational age (completed weeks)'), sure: m('Length of the tracing'), bazal: m('Baseline fetal heart rate (bpm)'), varyabilite: m('Variability amplitude (bpm; enter 0 if undetectable)'),
      azalmis_dk: m('Minutes with variability of 5 bpm or less'), artmis_dk: m('Minutes with variability above 25 bpm'), sinuzoidal_dk: m('Minutes of a sinusoidal pattern'),
      tasikardi_dk: m('Minutes with the baseline above 160 bpm'), aksel_20dk: m('Accelerations'), erken: m('Early decelerations'), gec: m('Late decelerations'),
      degisken: m('Variable decelerations'), degisken_komplike: m('Variable decelerations with concerning features'), uzamis: m('Prolonged decelerations (2 to 10 minutes)'),
      tekrarlayan: m('Recurrent: decelerations with 50% or more of contractions'), tekrar_dk: m('Minutes the recurrent decelerations have lasted'),
      en_uzun_des: m('Longest single deceleration (minutes)'), kontraksiyon: m('Contractions in 10 minutes'), sonuc: m('Interpretation and plan (the clinician\'s)'),
    },
    bantlar: { kat1: m('Category I'), kat2: m('Category II'), kat3: m('Category III') },
    uyarilar: {
      varyabilite_yok: m('Absent variability'), varyabilite_minimal: m('Minimal variability (5 bpm or less)'), varyabilite_belirgin: m('Marked variability (above 25 bpm)'),
      bradikardi: m('Bradycardia (baseline below 110 bpm)'), tasikardi: m('Tachycardia (baseline above 160 bpm)'), gec_tekrarlayan: m('Recurrent late decelerations'),
      degisken_tekrarlayan: m('Recurrent variable decelerations'), uzamis: m('Prolonged deceleration'), sinuzoidal: m('Sinusoidal pattern'),
    },
    not: m('The category is a snapshot of the tracing at this time. Evaluation, intrauterine resuscitation and delivery decisions are the clinician\'s.'),
  },
})
