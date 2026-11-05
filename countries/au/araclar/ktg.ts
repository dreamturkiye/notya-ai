/**
 * KD-RAPOR-01 (Kaan, 2026-11-05) — the CTG BY THE RANZCOG INTRAPARTUM FETAL SURVEILLANCE GUIDELINE (normal or abnormal,
 * with the abnormal features named), this country's own tool (a national college guideline is never in the kit).
 * Obstetrics and gynaecology only.
 *
 * Source: RANZCOG, Intrapartum Fetal Surveillance Clinical Guideline, Fourth Edition (2019). Cited 2026-11-05 from the
 * job's knowledge, NOT re-opened in this session (listed for a clinician's sign-off).
 *   normal features   baseline 110-160 bpm; variability 6-25 bpm; no late, variable or prolonged decelerations; no
 *                     sinusoidal pattern (early decelerations and absent accelerations alone do not make it abnormal)
 *   abnormal          any feature outside those, each named; the guideline's response to it is the clinician's
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, gunMu, sayiMi } from '@/lib/ulke/araclar/yardimci'
import { KTG_ALANLARI } from '@/lib/ulke/araclar/tanimlar/kadinDogumCerrahi'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const n0 = (x: unknown): number => (sayiMi(x) ? x : 0)

export function ranzcogKtg(g: Readonly<Record<string, unknown>>): { bant: 'normal' | 'anormal'; uyarilar: string[] } | null {
  if (!sayiMi(g.bazal) || !sayiMi(g.varyabilite)) return null
  const b = g.bazal as number, v = g.varyabilite as number
  const u: string[] = []
  if (b < 110) u.push('bradikardi'); else if (b > 160) u.push('tasikardi')
  if (v < 3) u.push('varyabilite_yok'); else if (v <= 5) u.push('varyabilite_azalmis'); else if (v > 25) u.push('varyabilite_artmis')
  if (n0(g.sinuzoidal_dk) > 0) u.push('sinuzoidal')
  if (n0(g.gec) > 0) u.push('gec')
  if (n0(g.degisken) > 0) u.push(g.degisken_komplike === true ? 'degisken_komplike' : 'degisken')
  if (n0(g.uzamis) > 0 || n0(g.en_uzun_des) >= 3) u.push('uzamis')
  return { bant: u.length ? 'anormal' : 'normal', uyarilar: u }
}

const UYARILAR = ['bradikardi', 'tasikardi', 'varyabilite_yok', 'varyabilite_azalmis', 'varyabilite_artmis', 'sinuzoidal', 'gec', 'degisken', 'degisken_komplike', 'uzamis']
export const AU_KTG_RANZCOG: AracTanimi = {
  anahtar: 'au-ctg-ranzcog', tur: 'olcek', yazdirilir: true,
  alanlar: KTG_ALANLARI,
  cikti: { sayilar: [], bantlar: ['normal', 'anormal'], uyarilar: UYARILAR, tarihler: [] },
  kaynak: 'RANZCOG Intrapartum Fetal Surveillance Clinical Guideline, Fourth Edition (2019): features of a normal CTG. Cited 2026-11-05.',
  hesapla: (g) => {
    if (!gunMu(g.tarih) || !sayiMi(g.sure)) return BOS_SONUC
    const r = ranzcogKtg(g)
    return r ? { tamam: true, sayilar: [], bant: r.bant, uyarilar: r.uyarilar, tarihler: [] } : BOS_SONUC
  },
}

export const auKtgAraci = (roller: readonly string[]): PaketAraci => ({
  anahtar: 'au-ctg-ranzcog',
  roller,
  lisans: { durum: 'serbest', kaynak: 'the normal ranges of a published college guideline (RANZCOG 2019), restated as facts in this product\'s own words; no text or table is reproduced. Cited 2026-11-05' },
  metin: {
    ad: m('CTG: normal or abnormal features (RANZCOG)'),
    aciklama: m('Baseline, variability and decelerations of a CTG checked against the normal features of the RANZCOG intrapartum fetal surveillance guideline (2019); every abnormal feature is named. Printed on your letterhead.'),
    alanlar: {
      tarih: m('Date'), hafta: m('Gestation (completed weeks)'), sure: m('Length of the trace'), bazal: m('Baseline fetal heart rate (bpm)'), varyabilite: m('Variability (bpm)'),
      azalmis_dk: m('Minutes with variability of 5 bpm or less'), artmis_dk: m('Minutes with variability above 25 bpm'), sinuzoidal_dk: m('Minutes of a sinusoidal pattern'),
      tasikardi_dk: m('Minutes with the baseline above 160 bpm'), aksel_20dk: m('Accelerations'), erken: m('Early decelerations'), gec: m('Late decelerations'),
      degisken: m('Variable decelerations'), degisken_komplike: m('The variable decelerations have complicating features'), uzamis: m('Prolonged decelerations'),
      tekrarlayan: m('Decelerations with more than half of contractions'), tekrar_dk: m('Minutes the repetitive decelerations have lasted'),
      en_uzun_des: m('Longest single deceleration (minutes)'), kontraksiyon: m('Contractions in 10 minutes'), sonuc: m('Assessment and plan (the clinician\'s)'),
    },
    bantlar: { normal: m('Normal CTG'), anormal: m('Abnormal CTG') },
    uyarilar: {
      bradikardi: m('Baseline below 110 bpm'), tasikardi: m('Baseline above 160 bpm'), varyabilite_yok: m('Absent variability (below 3 bpm)'),
      varyabilite_azalmis: m('Reduced variability (3 to 5 bpm)'), varyabilite_artmis: m('Increased variability (above 25 bpm)'), sinuzoidal: m('Sinusoidal pattern'),
      gec: m('Late decelerations'), degisken: m('Variable decelerations'), degisken_komplike: m('Complicated variable decelerations'), uzamis: m('Prolonged deceleration (3 minutes or more)'),
    },
    not: m('An abnormal CTG calls for the clinical response the guideline describes; the assessment and every decision are the clinician\'s.'),
  },
})
