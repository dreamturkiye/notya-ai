/**
 * Clinical-review studios for every Australian role that still had none.
 *
 * CLASSIFIED BEFORE ADDING: specialty-only. Each studio's `roller` is exactly one role.
 * Cardiology never sees the paediatrics review; paediatrics never sees the cardiology review.
 * Roles that already have a dedicated plan (wellness, nonsurgical, cosmetic surgery, and the
 * six private-role studios in ./privatePlans.ts) are NOT duplicated here.
 *
 * Same session→interval arithmetic as the allied studios (./privatePlans.ts → seansStudyo):
 * next review = session date + days entered. No protocol, dose or college pathway is copied.
 * A tick / day is a note. Nothing is booked or sent.
 *
 * Switched on 2026-10-28 for AU pediatri-gold depth (owner: bring every offered AU role to
 * the Turkish pediatrics gold bar under Option A). Listed on ./onaysizAciklar.ts.
 */
import type { AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, gunEkle, gunMu, isaret, sayi, sayiMi, tarih } from '@/lib/ulke/araclar/yardimci'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const GONDERILMEDI = 'These days are worked out in this note. Nothing is booked and nothing is sent.'
const NUSHA = 'The copy kept on the file, or the copy given to the patient, is not recorded.'
const KAYNAK =
  'https://www.medicalboard.gov.au/Registration/Types/Specialist-Registration/Medical-Specialties-and-Specialty-Fields.aspx (read 2026-10-28): specialties and fields of specialty practice. This studio copies no pathway and no dose. The interval is the practitioner\'s.'

type RolSatiri = {
  anahtar: string
  rol: string
  ad: string
  aciklama: string
}

/** Roles that already ship a dedicated plan elsewhere — never get a second review studio. */
const ZATEN_VAR = new Set([
  'family-medicine', // au-wellness-plan
  'aesthetic-medicine', // au-nonsurgical-plan
  'aesthetic-surgery', // au-cosmetic-surgery-plan
  'physiotherapy',
  'clinical-psychology',
  'dietetics',
  'occupational-therapy',
  'audiology',
])

/**
 * One review studio per remaining offered AU role. Names follow the Medical Board / Ahpra
 * wording already used in ../ayarlar.ts `rolAdlari` and ./referanslar.ts.
 */
const ROLLER: readonly RolSatiri[] = [
  { anahtar: 'au-emergency-medicine-review', rol: 'emergency-medicine', ad: 'Emergency medicine review', aciklama: 'Works out the next review from the visit date and the interval you enter. Records the consent copy on the file and the copy given to the patient. No triage scale and no dose is stored.' },
  { anahtar: 'au-anaesthesia-review', rol: 'anaesthesia', ad: 'Anaesthesia review', aciklama: 'Works out the next review from the visit date and the interval you enter. Records the consent copy on the file and the copy given to the patient. Fasting times stay off until the college licence is settled.' },
  { anahtar: 'au-neurosurgery-review', rol: 'neurosurgery', ad: 'Neurosurgery review', aciklama: 'Works out the next review after a neurosurgery visit from the date and the interval you enter. Wound care notes stay in the visit. Nothing is booked.' },
  { anahtar: 'au-paediatric-surgery-review', rol: 'paediatric-surgery', ad: 'Paediatric surgery review', aciklama: 'Works out the next review after a child\'s operation from the date and the interval you enter. A parent or guardian may hold the consent copy.' },
  { anahtar: 'au-internal-medicine-review', rol: 'internal-medicine', ad: 'General medicine review', aciklama: 'Works out the next physician review from the visit date and the interval you enter. No laboratory panel and no dose is stored.' },
  { anahtar: 'au-dermatology-review', rol: 'dermatology', ad: 'Dermatology review', aciklama: 'Works out the next dermatology review from the visit date and the interval you enter. Images stay under Documents.' },
  { anahtar: 'au-endocrinology-review', rol: 'endocrinology', ad: 'Endocrinology review', aciklama: 'Works out the next hormone review from the visit date and the interval you enter. Home readings stay in the note you keep. No dose is stored.' },
  { anahtar: 'au-infectious-diseases-review', rol: 'infectious-diseases', ad: 'Infectious diseases review', aciklama: 'Works out the next infection review from the visit date and the interval you enter. No course length is stored here.' },
  { anahtar: 'au-gastroenterology-review', rol: 'gastroenterology', ad: 'Gastroenterology review', aciklama: 'Works out the next digestive review, including after a procedure, from the date and the interval you enter.' },
  { anahtar: 'au-general-surgery-review', rol: 'general-surgery', ad: 'General surgery review', aciklama: 'Works out the next review after an operation from the date and the interval you enter. Wound care stays in the visit note.' },
  { anahtar: 'au-respiratory-medicine-review', rol: 'respiratory-medicine', ad: 'Respiratory review', aciklama: 'Works out the next breathing review from the visit date and the interval you enter. Inhaler technique stays on its own tool.' },
  { anahtar: 'au-ophthalmology-review', rol: 'ophthalmology', ad: 'Ophthalmology review', aciklama: 'Works out the next eye review from the visit date and the interval you enter. Visual acuity stays on its own tool.' },
  { anahtar: 'au-obstetrics-gynaecology-review', rol: 'obstetrics-gynaecology', ad: 'Obstetrics and gynaecology review', aciklama: 'Works out the next antenatal or gynaecology review from the visit date and the interval you enter. Bleeding or pain that worries the patient is not a message for the portal.' },
  { anahtar: 'au-cardiology-review', rol: 'cardiology', ad: 'Cardiology review', aciklama: 'Works out the next heart review from the visit date and the interval you enter. The CVD calculator stays a link-out tile; no equation is copied here.' },
  { anahtar: 'au-otolaryngology-review', rol: 'otolaryngology', ad: 'Ear, nose and throat review', aciklama: 'Works out the next ENT review from the visit date and the interval you enter. Hearing figures stay in the hearing tool.' },
  { anahtar: 'au-nephrology-review', rol: 'nephrology', ad: 'Nephrology review', aciklama: 'Works out the next kidney review from the visit date and the interval you enter. No eGFR equation and no risk colour is stored here.' },
  { anahtar: 'au-neurology-review', rol: 'neurology', ad: 'Neurology review', aciklama: 'Works out the next neurology review from the visit date and the interval you enter. A sudden weakness or a seizure is not a message for the portal.' },
  { anahtar: 'au-oncology-review', rol: 'oncology', ad: 'Medical oncology review', aciklama: 'Works out the next treatment review from the visit date and the interval you enter. No dose is named here.' },
  { anahtar: 'au-orthopaedics-review', rol: 'orthopaedics', ad: 'Orthopaedic review', aciklama: 'Works out the next bone and joint review from the visit date and the interval you enter.' },
  { anahtar: 'au-paediatrics-review', rol: 'paediatrics', ad: 'Paediatrics review', aciklama: 'Works out the next growth or immunisation review from the visit date and the interval you enter. Growth percentiles and the National Immunisation Program schedule stay on their own tools.' },
  { anahtar: 'au-plastic-surgery-review', rol: 'plastic-surgery', ad: 'Plastic and reconstructive review', aciklama: 'Works out the next reconstructive review from the visit date and the interval you enter. This is not the cosmetic-surgery booking plan.' },
  { anahtar: 'au-psychiatry-review', rol: 'psychiatry', ad: 'Psychiatry review', aciklama: 'Works out the next psychiatry review from the visit date and the interval you enter. No score and no diagnosis is stored here.' },
  { anahtar: 'au-radiology-review', rol: 'radiology', ad: 'Radiology review', aciklama: 'Works out the next imaging review from the visit date and the interval you enter. No reporting category (including BI-RADS) is stored here.' },
  { anahtar: 'au-rheumatology-review', rol: 'rheumatology', ad: 'Rheumatology review', aciklama: 'Works out the next joint review from the visit date and the interval you enter. No score is stored here.' },
  { anahtar: 'au-urology-review', rol: 'urology', ad: 'Urology review', aciklama: 'Works out the next urology review from the visit date and the interval you enter. No laboratory number is stored here.' },
  { anahtar: 'au-sports-medicine-review', rol: 'sports-medicine', ad: 'Sport and exercise review', aciklama: 'Works out the next injury or return-to-activity review from the visit date and the interval you enter. No concussion protocol is copied.' },
  { anahtar: 'au-rehabilitation-medicine-review', rol: 'rehabilitation-medicine', ad: 'Rehabilitation medicine review', aciklama: 'Works out the next rehabilitation review from the visit date and the interval you enter. No outcome measure (including FIM) is copied.' },
  { anahtar: 'au-cardio-thoracic-surgery-review', rol: 'cardio-thoracic-surgery', ad: 'Cardio-thoracic surgery review', aciklama: 'Works out the next review after chest surgery from the visit date and the interval you enter. This is not the cardiology check.' },
  { anahtar: 'au-vascular-surgery-review', rol: 'vascular-surgery', ad: 'Vascular surgery review', aciklama: 'Works out the next review after vascular surgery from the visit date and the interval you enter. This is not the cardiology check.' },
  { anahtar: 'au-radiation-oncology-review', rol: 'radiation-oncology', ad: 'Radiation oncology review', aciklama: 'Works out the next radiotherapy review from the visit date and the interval you enter. No dose is named here.' },
  { anahtar: 'au-geriatric-medicine-review', rol: 'geriatric-medicine', ad: 'Geriatric medicine review', aciklama: 'Works out the next later-life review from the visit date and the interval you enter. Bring the medicines list at the visit; nothing is stored as a dose here.' },
  { anahtar: 'au-immunology-and-allergy-review', rol: 'immunology-and-allergy', ad: 'Immunology and allergy review', aciklama: 'Works out the next allergy review from the visit date and the interval you enter. Action plans stay in the visit note.' },
  { anahtar: 'au-haematology-review', rol: 'haematology', ad: 'Haematology review', aciklama: 'Works out the next blood review from the visit date and the interval you enter. No laboratory number is stored here.' },
  { anahtar: 'au-pain-medicine-review', rol: 'pain-medicine', ad: 'Pain medicine review', aciklama: 'Works out the next pain review from the visit date and the interval you enter. No dose is named here.' },
  { anahtar: 'au-podiatry-review', rol: 'podiatry', ad: 'Podiatry review', aciklama: 'Works out the next foot review from the visit date and the interval you enter. No protocol is copied.' },
  { anahtar: 'au-speech-pathology-review', rol: 'speech-pathology', ad: 'Speech pathology review', aciklama: 'Works out the next speech session from the visit date and the interval you enter. No therapy protocol is copied.' },
]

function incelemeTanimi(anahtar: string): AracTanimi {
  return {
    anahtar,
    tur: 'takvim',
    alanlar: [
      tarih('seans'),
      sayi('aralik', 1, 366, { tam: true }),
      isaret('dosya'),
      isaret('hasta'),
    ],
    cikti: {
      sayilar: [],
      bantlar: [],
      uyarilar: ['gonderilmedi', 'nusha'],
      tarihler: ['sonraki'],
    },
    kaynak: KAYNAK,
    hesapla: (g) => {
      if (!gunMu(g.seans) || !sayiMi(g.aralik) || !Number.isInteger(g.aralik) || g.aralik < 1) return BOS_SONUC
      const uyarilar = ['gonderilmedi']
      if (g.dosya !== true || g.hasta !== true) uyarilar.push('nusha')
      return { tamam: true, sayilar: [], bant: null, uyarilar, tarihler: [{ anahtar: 'sonraki', tarih: gunEkle(g.seans, g.aralik) }] }
    },
  }
}

export const AU_INCELEME_TANIMLAR: readonly AracTanimi[] = ROLLER.map((r) => incelemeTanimi(r.anahtar))

function paket(s: RolSatiri): PaketAraci {
  return {
    anahtar: s.anahtar,
    roller: [s.rol],
    metin: {
      ad: m(s.ad),
      aciklama: m(s.aciklama),
      alanlar: {
        seans: m('Date of this visit'),
        aralik: m('Days until the next review you are arranging'),
        dosya: m('A copy of the consent is kept on this file.'),
        hasta: m('A copy of the consent was given to the patient (or parent/guardian).'),
      },
      uyarilar: {
        gonderilmedi: m(GONDERILMEDI),
        nusha: m(NUSHA),
      },
      tarihler: { sonraki: m('Next review this plan works out') },
      not: m('The next review above is worked out from the visit and the interval. The follow-up day you keep with this note is the day you enter below. Nothing is sent.'),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak: KAYNAK, bildirim: m(GONDERILMEDI) },
  }
}

export function auIncelemePlanlari(): readonly PaketAraci[] {
  return ROLLER.filter((r) => !ZATEN_VAR.has(r.rol)).map(paket)
}

/** Keys only — for onaysizAciklar and yasak-araclar. */
export const AU_INCELEME_ANAHTARLARI: readonly string[] = auIncelemePlanlari().map((p) => p.anahtar)
