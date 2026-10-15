/**
 * NOTYA-ASISTAN-SABLON — the two international textbooks behind a role.
 *
 * They are the shared international titles (lib/asistan/uluslararasiKitaplar.ts), the English form of the
 * secondary list. A change there is a change here: country assistants do not keep a second copy. The country's
 * own national source is the first of the three, and it is not in this file.
 *
 * A clinic role is not a medical specialty of the Turkish catalogue. Its two books are named once here, for
 * every country, and a country still supplies the national source of that profession.
 */
import { ULUSLARARASI_KITAP, type UluslararasiAnahtar } from '@/lib/asistan/uluslararasiKitaplar'

/** English role key → the Turkish catalogue key. Held to countries/rol-eslemesi.json by the test. */
export const EN_TR_ROL = {
  'emergency-medicine': 'acil-tip',
  'family-medicine': 'aile-hekimligi',
  anaesthesia: 'anestezi',
  neurosurgery: 'beyin-cerrahisi',
  'paediatric-surgery': 'cocuk-cerrahisi',
  'internal-medicine': 'dahiliye',
  dermatology: 'dermatoloji',
  endocrinology: 'endokrinoloji',
  'infectious-diseases': 'enfeksiyon-hastaliklari',
  gastroenterology: 'gastroenteroloji',
  'general-surgery': 'genel-cerrahi',
  'thoracic-surgery': 'gogus-cerrahisi',
  'respiratory-medicine': 'gogus-hastaliklari',
  ophthalmology: 'goz-hastaliklari',
  'obstetrics-gynaecology': 'kadin-hastaliklari-dogum',
  'cardiovascular-surgery': 'kalp-damar-cerrahisi',
  cardiology: 'kardiyoloji',
  otolaryngology: 'kulak-burun-bogaz',
  nephrology: 'nefroloji',
  neurology: 'noroloji',
  oncology: 'onkoloji',
  orthopaedics: 'ortopedi',
  paediatrics: 'pediatri',
  'plastic-surgery': 'plastik-cerrahi',
  psychiatry: 'psikiyatri',
  radiology: 'radyoloji',
  rheumatology: 'romatoloji',
  urology: 'uroloji',
  'sports-medicine': 'spor-hekimligi',
  'rehabilitation-medicine': 'fizik-tedavi',
  'hair-transplant': 'sac-ekimi',
  'aesthetic-surgery': 'estetik-cerrahi',
  'aesthetic-medicine': 'medikal-estetik',
  'clinic-dermatology': 'klinik-dermatoloji',
  longevity: 'longevity',
  physiotherapy: 'fizyoterapi',
  'clinical-psychology': 'klinik-psikolog',
  dietetics: 'diyetisyen',
  'occupational-therapy': 'ergoterapi',
  audiology: 'odyoloji',
} as const

const SAC = ['Unger and Shapiro, Hair Transplantation', 'International Society of Hair Restoration Surgery core curriculum'] as const
const ESTETIK = ["Grabb and Smith's Plastic Surgery", 'Plastic Surgery (Neligan)'] as const
const MEDIKAL = ['Cosmetic Injection Techniques', 'Soft Tissue Augmentation'] as const
const KLINIK_DERM = ["Bolognia Dermatology", "Andrews' Diseases of the Skin"] as const
const LONGEVITY = ["Harrison's Principles of Internal Medicine", 'Goldman-Cecil Medicine'] as const
const FIZYO = ["Braddom's Physical Medicine and Rehabilitation", 'Therapeutic Exercise: Foundations and Techniques (Kisner)'] as const
const PSIKOLOG = ["Bergin and Garfield's Handbook of Psychotherapy and Behavior Change", 'Cognitive Behavior Therapy: Basics and Beyond (Beck)'] as const
const DIYET = ["Krause's Food and the Nutrition Care Process", 'Modern Nutrition in Health and Disease'] as const
const ERGO = ["Willard and Spackman's Occupational Therapy", 'Occupational Therapy for Physical Dysfunction (Trombly)'] as const
const ODYO = ['Handbook of Clinical Audiology (Katz)', 'Audiology: Science to Practice'] as const

/** Two books for a clinic role, keyed by the Turkish key and by the English key. */
export const KLINIK_KITAP: Readonly<Record<string, readonly [string, string]>> = {
  'sac-ekimi': SAC,
  'hair-transplant': SAC,
  'estetik-cerrahi': ESTETIK,
  'aesthetic-surgery': ESTETIK,
  'medikal-estetik': MEDIKAL,
  'aesthetic-medicine': MEDIKAL,
  'klinik-dermatoloji': KLINIK_DERM,
  'clinic-dermatology': KLINIK_DERM,
  longevity: LONGEVITY,
  fizyoterapi: FIZYO,
  physiotherapy: FIZYO,
  'klinik-psikolog': PSIKOLOG,
  'clinical-psychology': PSIKOLOG,
  diyetisyen: DIYET,
  dietetics: DIYET,
  ergoterapi: ERGO,
  'occupational-therapy': ERGO,
  odyoloji: ODYO,
  audiology: ODYO,
}

/** The two international titles of a specialty. */
export function ikiKitap(brans: UluslararasiAnahtar): readonly [string, string] {
  return ULUSLARARASI_KITAP[brans]
}

const UZMANLIK = new Set<string>(Object.keys(ULUSLARARASI_KITAP))

/**
 * Two international titles for a role. `gibi` is the shared role a country-only role behaves like, used only
 * when the role itself is not in the catalogue.
 */
export function ikiUluslararasi(rol: string, gibi?: string | null): readonly [string, string] {
  for (const k of [rol, gibi].filter((x): x is string => Boolean(x))) {
    const tr = (EN_TR_ROL as Readonly<Record<string, string>>)[k] ?? k
    if (UZMANLIK.has(tr)) return ikiKitap(tr as UluslararasiAnahtar)
    if (KLINIK_KITAP[tr]) return KLINIK_KITAP[tr]
    if (KLINIK_KITAP[k]) return KLINIK_KITAP[k]
  }
  throw new Error(`ikiUluslararasi: no textbooks for ${rol}`)
}
