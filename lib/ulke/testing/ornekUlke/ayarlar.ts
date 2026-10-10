/**
 * NOTYA-ULKE-OZEL-01 — THE TEST COUNTRY "xx": WHAT IT STATES when it takes the English language set, written the way
 * a real English-speaking country writes its `ayarlar.ts` — and using EVERY extension point a country has, so that
 * each one is exercised without any real country changing. TESTS ONLY; nothing here is clinical content, legal
 * wording or a decision about any country (see ./tanimlar.ts).
 *
 *   ROLES      takes four shared roles out and adds five of its own:
 *                a SPLIT   cardiovascular-surgery → xx-cardiac + xx-vascular (both behave like it)
 *                a MERGE   hair-transplant + aesthetic-medicine → xx-aesthetics (behaves like aesthetic-medicine)
 *                REMOVED   clinic-dermatology
 *                ADDED     xx-geriatrics (behaves like internal-medicine)
 *                ADDED     xx-nurse, with a note template and intake questions OF ITS OWN
 *              Their keys carry "xx-" only so that no real country's role can ever be mistaken for one of them: a
 *              real country names its roles plainly ("geriatric-medicine").
 *                RENAMED   family-medicine → "General practice" (as any country could before)
 *   TOOLS      its own tools, a link-out tile and placeholders (./araclar.ts); who sees a shared tool; a tool for
 *              every doctor role; a shared tool renamed and its options relabelled; a tool only for some patients
 *   UNITS      two accepted units for two quantities: the doctor chooses
 *   LICENCE    states the licence of every tool and placeholder (`lisansTam`)
 */
import { EN_ROL_ARACLARI, EN_TEMEL_ARACLAR } from '@/countries/_dil/en/araclar'
import { enAracYuvalari } from '@/countries/_dil/en/araclar/yuvalar'
import type { EnLisans } from '@/countries/_dil/en/araclar/yardimci'
import type { EnUlkeGirdisi } from '@/countries/_dil/en/girdi'
import { enRolSatirlari, type EnRolDegisimi } from '@/countries/_dil/en/klinik/roller'
import { kisa } from '@/countries/_dil/en/klinik/hastaFormu/yardimci'
import { hekimRolleri } from '../../araclar/paket'
import type { Birimler } from '../../tipler'
import { XX_EK_ARACLAR, XX_EK_YUVALAR } from './araclar'
import { XX_OLCULER, XX_TANIMLAR } from './tanimlar'

export const XX_BIRIMLER: Birimler = { agirlik: 'kg', boy: 'cm', sicaklik: 'C' }
export const XX_VELI_YASI = 16

/** WHERE THE ROLE LIST DIFFERS FROM THE SHARED FORTY. */
export const XX_ROLLER: EnRolDegisimi = {
  cikar: ['cardiovascular-surgery', 'hair-transplant', 'aesthetic-medicine', 'clinic-dermatology'],
  ekle: [
    // a SPLIT: two roles where the set has one; both write with its template and ask its questions
    { anahtar: 'xx-cardiac', taraf: 'doktor', ad: 'Cardiac surgery', gibi: 'cardiovascular-surgery', once: 'cardiology' },
    { anahtar: 'xx-vascular', taraf: 'doktor', ad: 'Vascular surgery', gibi: 'cardiovascular-surgery', once: 'cardiology' },
    // a role the set does not have, behaving like one it has
    { anahtar: 'xx-geriatrics', taraf: 'doktor', ad: 'Geriatric medicine', gibi: 'internal-medicine' },
    // a MERGE: one role where the set has two
    { anahtar: 'xx-aesthetics', taraf: 'klinik-hekim', ad: 'Aesthetic practice', gibi: 'aesthetic-medicine' },
    // a role with a template and questions OF ITS OWN: it behaves like none
    {
      anahtar: 'xx-nurse', taraf: 'klinik-muttefik', ad: 'Nurse practitioner', gibi: null,
      sablon: ['referral_diagnosis', 'functional_status', 'xx_scope_note'],
      form: { baslik: 'For the nurse practitioner', sorular: [kisa('xx_np_reason', 'What would you like help with today?'), kisa('xx_np_medicines', 'Which medicines do you take regularly?')] },
    },
  ],
  alanlar: { xx_scope_note: { bolum: 'p', ad: 'What was referred on, and to whom' } },
}

/** The country's roles as the tools need them: key and kind. */
const SATIRLAR = enRolSatirlari(XX_ROLLER)
const HEKIMLER = hekimRolleri(SATIRLAR)

/**
 * LICENCE OF EVERY TOOL AND PLACEHOLDER OF THE SET. INVENTED: "free" for every tool that is on (a tool that is not
 * free or permitted could not be on), and — to have each state somewhere — three placeholders in other states.
 */
const serbest: EnLisans = { durum: 'serbest' }
const YUVA_LISANSLARI: Readonly<Record<string, EnLisans>> = {
  midas: { durum: 'ucretli', hakSahibi: 'The owner of the questionnaire (invented)' },
  basdai: { durum: 'izin-gerekli', hakSahibi: 'The owner of the questionnaire (invented)' },
  'phq9-gad7': { durum: 'belirsiz', hakSahibi: 'The owner of the questionnaire (invented)' },
}
export const XX_LISANSLAR: Readonly<Record<string, EnLisans>> = {
  ...Object.fromEntries([...EN_TEMEL_ARACLAR, ...EN_ROL_ARACLARI].map((a) => [a.anahtar, serbest])),
  'takip-paneli': serbest,
  ...Object.fromEntries(enAracYuvalari('X').map((y) => [y.anahtar, serbest])),
  ...YUVA_LISANSLARI,
}

export const XX_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-GB',
    marka: 'Notya',
    kayitRizasi: 'TEST: the patient has agreed to this visit being recorded.',
    kimlikEtiketi: 'Patient identifier',
    cokSaatDilimi: false,
    saatDilimiCumlesi: 'All times are local time.',
    tarihOrnegi: 'DD/MM/YYYY',
  },
  ulkeAdi: 'the test country',
  kidemliHekim: 'consultant',
  rolAdlari: { 'family-medicine': 'General practice' },
  roller: XX_ROLLER,
  veliYasi: XX_VELI_YASI,
  birimler: XX_BIRIMLER,
  surum: 'xx-draft-2026-10-10',
  konusma: { saglayici: 'elevenlabs-scribe', model: 'scribe_v2', zorlamaDilKodlari: { 'en-GB': 'eng' }, beklenenDiller: { eng: 'en', en: 'en' }, dilOlasiligiEsigi: 0.8, ortalamaLogOlasilikEsigi: -0.36, asgariKarakter: 40 },
  gunlukMuayeneLimiti: 200,
  araclar: {
    // TWO ACCEPTED UNITS for two quantities: the doctor chooses beside the field; nothing is chosen for them.
    labBirimleri: { albuminKreatinin: ['mg/mmol', 'mg/g'], hemoglobin: ['g/L', 'g/dL'], 'xx-olcek': ['xx-a', 'xx-b'] },
    kapali: {
      'doz-hesabi': { eksik: 'TEST: kept as a placeholder by the test country.', kimden: 'TEST: nobody' },
    },
    birimAdlari: { 'xx-a': 'scale A', 'xx-b': 'scale B' },
    degisen: {
      // RENAMED, and its options RELABELLED: the same tool of the kit under this country's own words
      'asa-preop': { ad: 'Pre-anaesthetic record (test)', not: 'TEST DATA: the line under the result, as this country writes it.', secenekler: { asa_sinif: { I: 'Class one', II: 'Class two', III: 'Class three', IV: 'Class four', V: 'Class five', E: 'Emergency' } } },
      'psa-hizi': { aciklama: 'TEST: the description, as this country writes it.' },
    },
    // WHO SEES A SHARED TOOL HERE
    gorenler: {
      // every DOCTOR role, and no allied profession (distinct from a base tool)
      'kdigo-evre': 'hekimler',
      // the two halves of the specialty this country split take over its tools
      'kalp-damar-preop': ['xx-cardiac', 'xx-vascular'],
      'greft-yara-izlem': ['xx-vascular'],
      'antikoagulan-vadeleri': ['xx-cardiac', 'xx-vascular', 'xx-geriatrics'],
      // one more role for a tool of another specialty
      'vertigo-notu': ['otolaryngology', 'neurology', 'family-medicine'],
      // an allied profession gets a tool the set gives to doctors only
      'vas-fonksiyon': ['orthopaedics', 'physiotherapy', 'xx-nurse'],
    },
    // A TOOL BY THE PATIENT: adults of one sex only (INVENTED limits)
    hasta: { 'psa-hizi': { kapi: { cinsiyet: 'male', enAzYas: 18 }, metin: 'This tool is for men aged 18 and over.' } },
    lisanslar: XX_LISANSLAR,
    lisansTam: true,
    ek: {
      araclar: XX_EK_ARACLAR.map((p) => (p.sinif === 'hekimler' ? { ...p, roller: HEKIMLER } : p)),
      tanimlar: XX_TANIMLAR,
      yuvalar: XX_EK_YUVALAR,
      olculer: XX_OLCULER,
    },
  },
  acilis: { telefonOrnegi: '+00 000 000 000', aylikTutarKalibi: '% a month', fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } } },
}

/** The role keys only the test country has: none may be a role of a real pack. */
export const XX_OZEL_ROLLER: readonly string[] = (XX_ROLLER.ekle ?? []).map((r) => r.anahtar)
