/**
 * KD-RAPOR-01 (Kaan, 2026-11-05) — Canada: INTRAPARTUM FETAL HEALTH SURVEILLANCE BY THE SOGC CLASSIFICATION (normal,
 * atypical, abnormal), this country's own tool (a national guideline is never in the kit). Obstetrics and gynaecology.
 *
 * Source: Dore S, Ehman W. No. 396 — Fetal Health Surveillance: Intrapartum Consensus Guideline. JOGC 2020;42(3):
 * 316-348. Cited 2026-11-05 from the job's knowledge, NOT re-opened in this session (./onayBekleyen.ts).
 *   abnormal  baseline below 100, or above 160 for more than 80 minutes; variability 5 bpm or less for more than 80
 *             minutes, 25 or more for more than 10 minutes, or sinusoidal; repetitive (3 or more) complicated variable
 *             decelerations; late decelerations with more than half of contractions; a single prolonged deceleration of
 *             3 minutes or more
 *   atypical  baseline 100 to 110, or above 160 for 30 to 80 minutes; variability 5 bpm or less for 40 to 80 minutes;
 *             repetitive uncomplicated variable decelerations; occasional late decelerations; a single prolonged
 *             deceleration of more than 2 minutes and less than 3
 *   normal    everything else (baseline 110-160, variability 6-25, no or occasional uncomplicated / early decelerations)
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, gunMu, sayiMi } from '@/lib/ulke/araclar/yardimci'
import { KTG_ALANLARI } from '@/lib/ulke/araclar/tanimlar/kadinDogumCerrahi'

const D = 'en-CA'
const m = (metin: string) => ({ [D]: metin })
const n0 = (x: unknown): number => (sayiMi(x) ? x : 0)

export function sogcSinifi(g: Readonly<Record<string, unknown>>): { bant: 'normal' | 'atipik' | 'anormal'; uyarilar: string[] } | null {
  if (!sayiMi(g.bazal) || !sayiMi(g.varyabilite)) return null
  const b = g.bazal as number, v = g.varyabilite as number
  const kompl = g.degisken_komplike === true
  const a: string[] = [], t: string[] = []
  if (b < 100) a.push('bazal'); else if (b > 160 && n0(g.tasikardi_dk) > 80) a.push('bazal'); else if (b < 110 || (b > 160 && n0(g.tasikardi_dk) >= 30)) t.push('bazal')
  if ((v <= 5 && n0(g.azalmis_dk) > 80) || (v >= 25 && n0(g.artmis_dk) > 10) || n0(g.sinuzoidal_dk) > 0) a.push('varyabilite'); else if (v <= 5 && n0(g.azalmis_dk) >= 40) t.push('varyabilite')
  if ((n0(g.degisken) >= 3 && kompl) || (g.tekrarlayan === true && n0(g.gec) > 0) || n0(g.en_uzun_des) >= 3) a.push('deselerasyon')
  else if (n0(g.degisken) >= 3 || n0(g.gec) > 0 || n0(g.en_uzun_des) > 2) t.push('deselerasyon')
  const bant = a.length ? 'anormal' : t.length ? 'atipik' : 'normal'
  return { bant, uyarilar: [...a.map((x) => `${x}_anormal`), ...t.map((x) => `${x}_atipik`)] }
}

export const CA_KTG_SOGC: AracTanimi = {
  anahtar: 'ca-fhs-sogc', tur: 'olcek', yazdirilir: true,
  alanlar: KTG_ALANLARI,
  cikti: { sayilar: [], bantlar: ['normal', 'atipik', 'anormal'], uyarilar: ['bazal_anormal', 'varyabilite_anormal', 'deselerasyon_anormal', 'bazal_atipik', 'varyabilite_atipik', 'deselerasyon_atipik'], tarihler: [] },
  kaynak: 'Dore S, Ehman W. SOGC Clinical Practice Guideline No. 396, Fetal Health Surveillance: Intrapartum Consensus Guideline. JOGC 2020;42(3):316-348. Cited 2026-11-05.',
  hesapla: (g) => {
    if (!gunMu(g.tarih) || !sayiMi(g.sure)) return BOS_SONUC
    const r = sogcSinifi(g)
    return r ? { tamam: true, sayilar: [], bant: r.bant, uyarilar: r.uyarilar, tarihler: [] } : BOS_SONUC
  },
}

export const caKtgAraci = (roller: readonly string[]): PaketAraci => ({
  anahtar: 'ca-fhs-sogc',
  roller,
  lisans: { durum: 'serbest', kaynak: 'the classification thresholds of a published guideline (JOGC 2020), restated as facts in this product\'s own words; no table is reproduced. Cited 2026-11-05' },
  metin: {
    ad: m('Fetal heart rate tracing: SOGC classification'),
    aciklama: m('Baseline, variability and decelerations of an electronic fetal monitoring tracing classified as normal, atypical or abnormal with the thresholds of SOGC guideline No. 396 (2020). Printed on your letterhead.'),
    alanlar: {
      tarih: m('Date'), hafta: m('Gestational age (completed weeks)'), sure: m('Length of the tracing'), bazal: m('Baseline fetal heart rate (bpm)'), varyabilite: m('Variability (bpm)'),
      azalmis_dk: m('Minutes with variability of 5 bpm or less'), artmis_dk: m('Minutes with variability of 25 bpm or more'), sinuzoidal_dk: m('Minutes of a sinusoidal pattern'),
      tasikardi_dk: m('Minutes with the baseline above 160 bpm'), aksel_20dk: m('Accelerations'), erken: m('Early decelerations'), gec: m('Late decelerations'),
      degisken: m('Variable decelerations'), degisken_komplike: m('The variable decelerations are complicated'), uzamis: m('Prolonged decelerations'),
      tekrarlayan: m('Decelerations with more than half of contractions'), tekrar_dk: m('Minutes the repetitive decelerations have lasted'),
      en_uzun_des: m('Longest single deceleration (minutes)'), kontraksiyon: m('Contractions in 10 minutes'), sonuc: m('Interpretation and plan (the clinician\'s)'),
    },
    bantlar: { normal: m('Normal tracing'), atipik: m('Atypical tracing'), anormal: m('Abnormal tracing') },
    uyarilar: {
      bazal_anormal: m('Baseline: abnormal'), varyabilite_anormal: m('Variability: abnormal'), deselerasyon_anormal: m('Decelerations: abnormal'),
      bazal_atipik: m('Baseline: atypical'), varyabilite_atipik: m('Variability: atypical'), deselerasyon_atipik: m('Decelerations: atypical'),
    },
    not: m('The classification follows SOGC thresholds and says nothing else: the clinical response and every decision are the clinician\'s.'),
  },
})
