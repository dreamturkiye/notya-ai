/**
 * KD-RAPOR-01 (Kaan, 2026-11-05) — United Kingdom: CTG FEATURES BY NICE NG229 ("Fetal monitoring in labour", December
 * 2022), the classification the United Kingdom uses, as this country's own tool (a national guideline is never in the
 * kit). Obstetrics and gynaecology only.
 *
 * NICE-sourced (./nice-kaynakli.json): the feature colours of NG229's table "Description of fetal heart rate features"
 *   baseline       white 110 to 160 bpm; amber 100 to 109 or 161 to 180 bpm; red below 100 or above 180 bpm
 *   variability    white 5 to 25 bpm; amber below 5 bpm for 30 to 50 minutes, or above 25 bpm for 15 to 25 minutes;
 *                  red below 5 bpm for more than 50 minutes, above 25 bpm for more than 25 minutes, or sinusoidal
 *   decelerations  red: any late deceleration (NG229 as amended in November 2025: late decelerations are a red feature
 *                  whatever their duration; KD-OPERATOR-01 re-check, 2026-11-05), acute bradycardia, or a single prolonged
 *                  deceleration lasting 3 minutes or more; otherwise the
 *                  colour the clinician reads from the NG229 table (the tool does not judge "concerning
 *                  characteristics" of a variable deceleration, which needs the trace itself)
 * The result is the WORST colour among the features, named as such: NG229 asks for a holistic assessment, and the tool
 * does not replace it. Machine-written; no clinician of the United Kingdom has read it (./onaysiz-araclar.json).
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, gunMu, sayiMi, secim } from '@/lib/ulke/araclar/yardimci'
import { KTG_ALANLARI } from '@/lib/ulke/araclar/tanimlar/kadinDogumCerrahi'

const D = 'en-GB'
const m = (metin: string) => ({ [D]: metin })
const n0 = (x: unknown): number => (sayiMi(x) ? x : 0)
type Renk = 'beyaz' | 'amber' | 'kirmizi'
const SIRA: readonly Renk[] = ['beyaz', 'amber', 'kirmizi']
const enKotu = (r: readonly Renk[]): Renk => r.reduce((a, b) => (SIRA.indexOf(b) > SIRA.indexOf(a) ? b : a), 'beyaz')

export function niceKtg(g: Readonly<Record<string, unknown>>): { bant: Renk; uyarilar: string[] } | null {
  if (!sayiMi(g.bazal) || !sayiMi(g.varyabilite)) return null
  const b = g.bazal as number, v = g.varyabilite as number
  const bazal: Renk = b < 100 || b > 180 ? 'kirmizi' : b < 110 || b > 160 ? 'amber' : 'beyaz'
  const varyabilite: Renk = n0(g.azalmis_dk) > 50 || n0(g.artmis_dk) > 25 || n0(g.sinuzoidal_dk) > 0 ? 'kirmizi'
    : (v < 5 && n0(g.azalmis_dk) >= 30) || (v > 25 && n0(g.artmis_dk) >= 15) ? 'amber' : v >= 5 && v <= 25 ? 'beyaz' : 'amber'
  const des: Renk = n0(g.en_uzun_des) >= 3 || n0(g.gec) > 0 ? 'kirmizi' : g.des_renk === 'kirmizi' ? 'kirmizi' : g.des_renk === 'amber' ? 'amber' : 'beyaz'
  const uyarilar = [
    ...(bazal !== 'beyaz' ? [`bazal_${bazal}`] : []),
    ...(varyabilite !== 'beyaz' ? [`varyabilite_${varyabilite}`] : []),
    ...(des !== 'beyaz' ? [`des_${des}`] : []),
  ]
  return { bant: enKotu([bazal, varyabilite, des]), uyarilar }
}

export const GB_KTG_NICE_TANIMI: AracTanimi = {
  anahtar: 'gb-ktg-nice', tur: 'olcek', yazdirilir: true,
  alanlar: [...KTG_ALANLARI.filter((a) => a.anahtar !== 'sonuc'), secim('des_renk', ['beyaz', 'amber', 'kirmizi'], true), ...KTG_ALANLARI.filter((a) => a.anahtar === 'sonuc')],
  cikti: { sayilar: [], bantlar: ['beyaz', 'amber', 'kirmizi'], uyarilar: ['bazal_amber', 'bazal_kirmizi', 'varyabilite_amber', 'varyabilite_kirmizi', 'des_amber', 'des_kirmizi'], tarihler: [] },
  kaynak: 'NICE guideline NG229, Fetal monitoring in labour (December 2022, amended November 2025): table "Description of fetal heart rate features". Cited 2026-11-05.',
  hesapla: (g) => {
    if (!gunMu(g.tarih) || !sayiMi(g.sure)) return BOS_SONUC
    const r = niceKtg(g)
    return r ? { tamam: true, sayilar: [], bant: r.bant, uyarilar: r.uyarilar, tarihler: [] } : BOS_SONUC
  },
}

export const GB_KTG_NICE: PaketAraci = {
  anahtar: 'gb-ktg-nice',
  roller: ['obstetrics-gynaecology'],
  // NICE-KAYNAKLI: NG229 numbers and colour names only, credited to NICE (UK Open Content Licence, inside the United
  // Kingdom); the NICE terms on use for AI purposes are for the lawyer (./nice-kaynakli.json).
  lisans: {
    durum: 'serbest',
    hakSahibi: 'National Institute for Health and Care Excellence (NICE)',
    kaynak: 'NICE UK Open Content Licence, for reuse of NICE content inside the United Kingdom (https://www.nice.org.uk/re-using-our-content/uk-open-content-licence), cited 2026-11-05',
    bildirim: m('Feature colours: NICE guideline NG229 (2022), © NICE. Available from www.nice.org.uk/guidance/ng229. All rights reserved. Subject to Notice of rights.'),
  },
  metin: {
    ad: m('CTG: fetal heart rate features (NICE NG229)'),
    aciklama: m('Baseline, variability and decelerations coloured white, amber or red as NICE NG229 describes them, with the worst colour shown. NG229 asks for a holistic assessment of the woman and the baby: this record does not replace it. Printed on your letterhead.'),
    alanlar: {
      tarih: m('Date'), hafta: m('Gestation (completed weeks)'), sure: m('Length of the trace'), bazal: m('Baseline fetal heart rate (bpm)'), varyabilite: m('Variability (bpm)'),
      azalmis_dk: m('Minutes with variability below 5 bpm'), artmis_dk: m('Minutes with variability above 25 bpm'), sinuzoidal_dk: m('Minutes of a sinusoidal pattern'),
      tasikardi_dk: m('Minutes with the baseline above 160 bpm'), aksel_20dk: m('Accelerations'), erken: m('Early decelerations'), gec: m('Late decelerations'),
      degisken: m('Variable decelerations'), degisken_komplike: m('Variable decelerations with concerning characteristics'), uzamis: m('Prolonged decelerations'),
      tekrarlayan: m('Decelerations with more than 50% of contractions'), tekrar_dk: m('Minutes the repetitive decelerations have lasted'),
      en_uzun_des: m('Longest single deceleration (minutes)'), kontraksiyon: m('Contractions in 10 minutes'),
      des_renk: m('Decelerations: the colour you read from the NG229 table'), sonuc: m('Assessment and plan (the clinician\'s)'),
    },
    secenekler: { des_renk: { beyaz: m('White'), amber: m('Amber'), kirmizi: m('Red') } },
    bantlar: { beyaz: m('All features white'), amber: m('At least one amber feature'), kirmizi: m('At least one red feature') },
    uyarilar: {
      bazal_amber: m('Baseline amber (100 to 109 or 161 to 180 bpm)'), bazal_kirmizi: m('Baseline red (below 100 or above 180 bpm)'),
      varyabilite_amber: m('Variability amber'), varyabilite_kirmizi: m('Variability red (below 5 bpm for more than 50 minutes, above 25 bpm for more than 25 minutes, or sinusoidal)'),
      des_amber: m('Decelerations amber'), des_kirmizi: m('Decelerations red (any late deceleration, or a single prolonged deceleration of 3 minutes or more)'),
    },
    not: m('Feature colours from NICE NG229, credited to NICE. The overall assessment, the escalation and every decision are the clinician\'s.'),
  },
}
