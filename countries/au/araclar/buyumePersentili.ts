/**
 * WHO growth percentiles — switched on for Australia without a clinician's sign-off
 * (same owner-order pattern as ./onaysizAciklar.ts for country-only tools).
 *
 * CLASSIFIED BEFORE ADDING: specialty-only. Paediatrics and general practice only
 * (children are seen in both). Adult-only roles never see it — same gate as
 * `hedef-boy` / `doz-hesabi` in ../ayarlar.ts.
 *
 * Mechanism is the kit's (`lib/ulke/araclar/tanimlar/buyumePersentili.ts` → WHO LMS).
 * ANZSPED/CDC choice for ages 2–18 stays on the link-out tile `au-growth-chart-reference`.
 * No second copy of WHO numbers; Neyzi (Türkiye) is not used.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

/** Paediatrics and general practice. Kit key `buyume-persentili` — no `au-` prefix, not on onaysizAciklar. */
export const AU_BUYUME_PERSENTILI_ARACI: PaketAraci = {
  anahtar: 'buyume-persentili',
  roller: ['paediatrics', 'family-medicine'],
  metin: {
    ad: m('WHO growth percentiles'),
    aciklama: m('Weight-for-age, height-for-age or head-circumference-for-age against the WHO Child Growth Standards (0–60 months) and WHO Growth Reference (61+ months). The percentile and z-score support a decision; which chart Australian practice uses from 2 to 18 years (WHO, ANZSPED or CDC) is the doctor\'s. The growth-chart reference tile names those charts without choosing.'),
    alanlar: {
      cinsiyet: m('Sex of the child'),
      parametre: m('What was measured'),
      dogum_tarihi: m('Date of birth'),
      olcum_tarihi: m('Date of the measurement'),
      deger_kilo: m('Weight'),
      deger_boy: m('Height / length'),
      deger_bas: m('Head circumference'),
    },
    secenekler: {
      cinsiyet: { male: m('Boy'), female: m('Girl') },
      parametre: {
        kilo: m('Weight for age'),
        boy: m('Height for age'),
        basCevresi: m('Head circumference for age'),
      },
    },
    sayilar: {
      persentil: m('Percentile'),
      z: m('Z-score'),
      ay: m('Age in months'),
    },
    uyarilar: {
      yas_disi: m('This measurement is outside the age range of the WHO tables for that parameter.'),
    },
    not: m('WHO tables only. For ages 2 to 18, Australian practice may instead follow ANZSPED\'s own charts or the CDC 2000 charts — open the growth-chart reference tile. Diagnosis and treatment are the doctor\'s.'),
  },
}
