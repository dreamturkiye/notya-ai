/**
 * UNITED STATES — a record of the 2025 adult immunization age table.
 * The age grid was read on 14 October 2026 at the page cited below. The color
 * legend did not travel with the cells, so no row is marked routine, risk, or
 * shared decision. Notes, Table 2, the appendix, and the addendum text were
 * not loaded. A tick records a row. It does not choose a product.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { BicimliMetin } from '@/lib/ulke/arayuz/tipler'
import { kontrolListesi } from '@/lib/ulke/araclar/yardimci'

const D = 'en-US'
const m = (metin: string): BicimliMetin => ({ [D]: metin })

export const US_YETISKIN_ASI_SAYFASI = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-age.html'
const CDC = 'Centers for Disease Control and Prevention'
const MALZEME = 'https://www.cdc.gov/other/agencymaterials.html'

const ASILAR: readonly { anahtar: string; etiket: string }[] = [
  { anahtar: 'covid', etiket: 'COVID-19: 1 or more doses of 2024–2025 vaccine (See Notes). Also the cell “2 or more doses of 2024-2025 vaccine (See Notes).”' },
  { anahtar: 'iiv', etiket: 'Influenza inactivated (IIV3, ccIIV3) and recombinant (RIV3): 1 dose annually. Also the cell “1 dose annually (HD–IIV3, RIV3, or aIIV3 preferred).”' },
  { anahtar: 'aiiv', etiket: 'Influenza inactivated (aIIV3; HD–IIV3) and recombinant (RIV3): Solid organ transplant (See Notes).' },
  { anahtar: 'laiv', etiket: 'Influenza live, attenuated (LAIV3): 1 dose annually.' },
  { anahtar: 'rsv', etiket: 'Respiratory syncytial virus: Seasonal administration during pregnancy. (See Notes). 50 through 74 years (See Notes). ≥75 years.' },
  { anahtar: 'tdap', etiket: 'Tetanus, diphtheria, pertussis (Tdap or Td): 1 dose Tdap each pregnancy; 1 dose Td/Tdap for wound management (See Notes). 1 dose Tdap, then Td or Tdap booster every 10 years.' },
  { anahtar: 'mmr', etiket: 'Measles, mumps, rubella: 1 or 2 doses depending on indication (if born in 1957 or later). For health care personnel, (See Notes).' },
  { anahtar: 'var', etiket: 'Varicella: 2 doses (if born in 1980 or later). Also a cell that prints “2 doses.”' },
  { anahtar: 'rzv', etiket: 'Zoster recombinant: 2 doses for immunocompromising conditions (See Notes). Also a cell that prints “2 doses.”' },
  { anahtar: 'hpv', etiket: 'Human papillomavirus: 2 or 3 doses depending on age at initial vaccination or condition. 27 through 45 years.' },
  { anahtar: 'pneumo', etiket: 'Pneumococcal (PCV15, PCV20, PCV21, PPSV23): the age table prints See Notes. This tick does not assign an age and does not state a dose number.' },
  { anahtar: 'hepa', etiket: 'Hepatitis A: 2, 3, or 4 doses depending on vaccine.' },
  { anahtar: 'hepb', etiket: 'Hepatitis B: 2, 3, or 4 doses depending on vaccine or condition.' },
  { anahtar: 'menacwy', etiket: 'Meningococcal A, C, W, Y: 1 or 2 doses depending on indication (See Notes for booster recommendations).' },
  { anahtar: 'menb', etiket: 'Meningococcal B: 2 or 3 doses depending on vaccine and indication (See Notes for booster recommendations). 19 through 23 years.' },
  { anahtar: 'hib', etiket: 'Haemophilus influenzae type b: 1 or 3 doses depending on indication.' },
  { anahtar: 'mpox', etiket: 'Mpox: 2 doses.' },
  { anahtar: 'ipv', etiket: 'Inactivated poliovirus: Complete 3-dose series if incompletely vaccinated. Self–report of previous doses acceptable (See Notes).' },
]

export const US_YETISKIN_ASI_ANAHTARLARI = ASILAR.map((a) => a.anahtar)

const ham = kontrolListesi({
  anahtar: 'us-adult-immunization',
  maddeler: US_YETISKIN_ASI_ANAHTARLARI,
  uyarilar: ['kayit', 'notlar'],
  uyari: () => ['kayit', 'notlar'],
  kaynak: `${CDC}. Adult Immunization Schedule by Age, recommendations for ages 19 years or older, United States, 2025. Addendum updated July 2, 2025. Page dated July 2, 2025. Opened 14 October 2026. ${US_YETISKIN_ASI_SAYFASI}`,
})

/** The row count stays off the screen. */
export const US_YETISKIN_ASI: AracTanimi = {
  ...ham,
  hesapla: (g, ortam) => {
    const s = ham.hesapla(g, ortam)
    if (!s.tamam) return s
    return { ...s, sayilar: s.sayilar.map(({ enCok: _enCok, ...kalan }) => kalan) }
  },
}

export function usYetiskinAsiAraci(hekimler: readonly string[]): PaketAraci {
  return {
    anahtar: 'us-adult-immunization',
    roller: [...hekimler],
    sinif: 'hekimler',
    metin: {
      ad: m('Adult immunization record'),
      aciklama: m('Tick a row from the 2025 adult age table, ages 19 and older. One tick is a row you are recording. The tool does not work out a catch-up, and it does not choose a product.'),
      alanlar: Object.fromEntries(ASILAR.map((a) => [a.anahtar, m(a.etiket)])),
      sayilar: { isaretli: m('Rows ticked') },
      uyarilar: {
        kayit: m('A tick records a row of the age table. It is not an appointment and it is not a catch-up calculation.'),
        notlar: m('The page says the table must be read with its notes, with Table 2, and with the appendix. Those parts, and the addendum text, are not loaded here. The color legend was not kept with the cells, so no row is marked routine, risk, or shared decision.'),
      },
      not: m('Product names are not shown. Ages 18 and younger are on the child and adolescent record. Diagnosis and treatment are the doctor\'s.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: CDC,
      kaynak: `Schedule page read 2026-10-14 (${US_YETISKIN_ASI_SAYFASI}). Agency materials page read 2026-10-10 (${MALZEME}): most information on CDC sites may be used without permission; credit the agency; the use must not imply endorsement; say the material is available from the agency at no charge. The addendum is named in the page title and its own text was not a separate section of the page read.`,
      bildirim: m('Source: Centers for Disease Control and Prevention, "Adult Immunization Schedule by Age" (United States, 2025; page dated July 2, 2025), available on the CDC website at no charge. Use of this material does not imply endorsement of this product by CDC, ATSDR, HHS or the United States Government.'),
    },
  }
}
