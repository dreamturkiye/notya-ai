/**
 * Saved plans for the private roles Australia offers and that had no plan of their own.
 *
 * CLASSIFIED BEFORE ADDING: specialty-only. Each plan's `roller` is one role.
 * Cardiology, dermatology, general practice and every other role do not see it.
 * Cosmetic surgery does not see the non-surgical plan, and non-surgical cosmetic
 * procedures do not see this surgical plan.
 *
 * READ 2026-10-20 — Medical Board of Australia, Guidelines for registered medical
 * practitioners who perform cosmetic surgery and procedures:
 *   https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Cosmetic-medical-and-surgical-procedures-guidelines
 * Cosmetic surgery: at least two pre-operative consultations, one of them in person
 * with the surgeon; consent is not requested at the first consultation; at least
 * seven days after two consultations and signed consent before the surgery is booked
 * or a deposit is paid; a patient under 18 has at least three months between informed
 * consent and the surgery, and is evaluated by an independent psychologist, psychiatrist
 * or general practitioner. Images need documented consent, an explanation of proposed
 * use, and must not be stored on a personal device. A copy of the signed consent is
 * given to the person. No sentence from the guideline is copied as a passage.
 *
 * The allied plans copy no code and no protocol. The ticks are the practitioner's
 * own confirmations. Any image file is the patient photo archive under Documents.
 *
 * EACH PLAN IS SAVED on the patient's Australia record (ulke_arac_kayitlari).
 * A follow-up day, when the practitioner enters one, is the day stored with that row.
 * Nothing is sent.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { AracTanimi } from '@/lib/ulke/araclar/tipler'
import { isaret, secim } from '@/lib/ulke/araclar/yardimci'
import { kosulluListe } from './kosulluListe'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const GONDERILMEDI = 'A tick is a note in this product. Nothing is booked and nothing is sent.'
const KURUL = 'https://www.medicalboard.gov.au/Codes-Guidelines-Policies/Cosmetic-medical-and-surgical-procedures-guidelines (read 2026-10-20)'

const YAS = ['yetiskin', 'onsekiz'] as const
const yalniz = (degerler: readonly string[]) => ({ kosul: { alan: 'yas', degerler } })
const cerrahiKutu = (anahtar: string, degerler: readonly string[] = YAS) => ({ ...isaret(anahtar), ...yalniz(degerler) })

const CERRAHI_KAYNAK = `${KURUL}: cosmetic surgery consultations, cooling-off, consent and images. No sentence from the guideline is copied as arithmetic.`

export const AU_COSMETIC = kosulluListe({
  anahtar: 'au-cosmetic-surgery-plan',
  alanlar: [
    secim('yas', YAS),
    cerrahiKutu('gorusme'),
    cerrahiKutu('yedi', ['yetiskin']),
    cerrahiKutu('ucay', ['onsekiz']),
    cerrahiKutu('bagimsiz', ['onsekiz']),
    cerrahiKutu('kopya'),
    cerrahiKutu('foto'),
  ],
  uyarilar: ['gonderilmedi'],
  uyari: () => ['gonderilmedi'],
  kaynak: CERRAHI_KAYNAK,
})

function duzPlan(anahtar: string, kaynak: string): AracTanimi {
  return kosulluListe({
    anahtar,
    alanlar: [isaret('onam'), isaret('kopya'), isaret('foto')],
    uyarilar: ['gonderilmedi'],
    uyari: () => ['gonderilmedi'],
    kaynak,
  })
}

export const AU_PHYSIO = duzPlan(
  'au-physio-plan',
  'https://australian.physio/ (read 2026-10-19): the profession page. This checklist copies no protocol. The ticks are the physiotherapist\'s notes.',
)
export const AU_PSYCHOLOGY = duzPlan(
  'au-psychology-plan',
  'https://psychology.org.au/ (read 2026-10-19): the profession page. This checklist copies no protocol. A photograph is not part of an ordinary consultation.',
)
export const AU_DIETETICS = duzPlan(
  'au-dietetics-plan',
  'https://dietitiansaustralia.org.au/ (read 2026-10-19): the profession page. This checklist copies no meal plan and no dose.',
)
export const AU_OT = duzPlan(
  'au-ot-plan',
  'https://www.otaus.com.au/ (read 2026-10-19): the profession page. This checklist copies no protocol.',
)
export const AU_AUDIOLOGY = duzPlan(
  'au-audiology-plan',
  'https://audiology.asn.au/ (read 2026-10-19): the profession page. Hearing figures stay in the hearing tool. This checklist copies no protocol.',
)

export const AU_OZEL_TANIMLAR: readonly AracTanimi[] = [AU_COSMETIC, AU_PHYSIO, AU_PSYCHOLOGY, AU_DIETETICS, AU_OT, AU_AUDIOLOGY]

type PlanMetin = {
  ad: string
  aciklama: string
  alanlar: Record<string, string>
  secenekler?: Record<string, Record<string, string>>
  not: string
}

function paket(anahtar: string, rol: string, kaynak: string, metin: PlanMetin): PaketAraci {
  return {
    anahtar,
    roller: [rol],
    metin: {
      ad: m(metin.ad),
      aciklama: m(metin.aciklama),
      alanlar: Object.fromEntries(Object.entries(metin.alanlar).map(([k, v]) => [k, m(v)])),
      ...(metin.secenekler
        ? {
            secenekler: Object.fromEntries(
              Object.entries(metin.secenekler).map(([k, sec]) => [k, Object.fromEntries(Object.entries(sec).map(([s, v]) => [s, m(v)]))]),
            ),
          }
        : {}),
      sayilar: { isaretli: m('Plan notes') },
      uyarilar: { gonderilmedi: m(GONDERILMEDI) },
      not: m(metin.not),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Notya',
      kaynak,
      bildirim: m(GONDERILMEDI),
    },
  }
}

const TAKIP = 'A follow-up day, if you want one, is the day you enter when you keep this note.'
const FOTO = 'If an image was kept, consent for it was obtained and the proposed use was explained. The file is stored under Documents. It is not stored on a personal device.'

/** Cosmetic surgery only. Hair transplants stay on the non-surgical plan. */
export function auCosmeticSurgeryPlan(): PaketAraci {
  return paket('au-cosmetic-surgery-plan', 'aesthetic-surgery', CERRAHI_KAYNAK, {
    ad: 'Cosmetic surgery plan',
    aciklama: 'A note for cosmetic surgery. Hair transplants are not recorded here. Choose the patient\'s age group, then tick the notes that apply. A photograph, if you keep one, is stored under Documents. A tick is your note.',
    alanlar: {
      yas: 'Which age group this note is for',
      gorusme: 'There were at least two consultations before surgery. One was in person with the surgeon who will operate. Consent was not requested at the first consultation.',
      yedi: 'At least seven days pass after the two consultations and signed consent, before the surgery is booked or a deposit is paid.',
      ucay: 'The patient is under 18, and at least three months pass between informed consent and the surgery.',
      bagimsiz: 'The patient is under 18, and was evaluated by a psychologist, psychiatrist or general practitioner who works independently of the surgeon.',
      kopya: 'A copy of the signed consent was given to the patient.',
      foto: 'Consent for any photograph or video was documented, and the proposed use was explained. The file, if one is kept, is stored under Documents and not on a personal device.',
    },
    secenekler: {
      yas: {
        yetiskin: '18 or older',
        onsekiz: 'Under 18',
      },
    },
    not: TAKIP,
  })
}

/** Physiotherapy only. */
export function auPhysioPlan(): PaketAraci {
  return paket('au-physio-plan', 'physiotherapy', AU_PHYSIO.kaynak, {
    ad: 'Physiotherapy plan',
    aciklama: 'A note kept on a physiotherapy file. Tick the consent you obtained. No exercise protocol is copied onto this screen. A photograph, if you keep one, is stored under Documents. A tick is your note.',
    alanlar: {
      onam: 'Consent for this assessment and treatment was obtained.',
      kopya: 'A copy of that consent was offered to the patient.',
      foto: `If a photograph of posture, a wound, or the task was kept: ${FOTO}`,
    },
    not: `${TAKIP} No exercise dose is stored here.`,
  })
}

/** Psychology only. An ordinary consultation does not include a photograph. */
export function auPsychologyPlan(): PaketAraci {
  return paket('au-psychology-plan', 'clinical-psychology', AU_PSYCHOLOGY.kaynak, {
    ad: 'Psychology plan',
    aciklama: 'A note kept on a psychology file. Tick the consent you obtained. A photograph is not part of an ordinary consultation. If an image is kept, it is stored under Documents. A tick is your note.',
    alanlar: {
      onam: 'Consent for this consultation was obtained, and the person was told this note stays on their file in this product.',
      kopya: 'A copy of that consent was offered to the person.',
      foto: `A photograph is not required. ${FOTO}`,
    },
    not: TAKIP,
  })
}

/** Dietetics only. No meal plan and no dose. */
export function auDieteticsPlan(): PaketAraci {
  return paket('au-dietetics-plan', 'dietetics', AU_DIETETICS.kaynak, {
    ad: 'Dietetics plan',
    aciklama: 'A note kept on a dietetics file. Tick the consent you obtained. This screen stores no meal plan and no dose. A photograph, if you keep one, is stored under Documents. A tick is your note.',
    alanlar: {
      onam: 'Consent for this nutrition review was obtained.',
      kopya: 'A copy of that consent was offered to the patient.',
      foto: FOTO,
    },
    not: `${TAKIP} No kilocalorie target and no protein target is stored here.`,
  })
}

/** Occupational therapy only. */
export function auOtPlan(): PaketAraci {
  return paket('au-ot-plan', 'occupational-therapy', AU_OT.kaynak, {
    ad: 'Occupational therapy plan',
    aciklama: 'A note kept on an occupational therapy file. Tick the consent you obtained. No activity protocol is copied onto this screen. A photograph, if you keep one, is stored under Documents. A tick is your note.',
    alanlar: {
      onam: 'Consent for this activity assessment was obtained.',
      kopya: 'A copy of that consent was offered to the patient.',
      foto: `If a photograph of the task or the setting was kept: ${FOTO}`,
    },
    not: TAKIP,
  })
}

/** Audiology only. Hearing figures stay in the hearing tool. */
export function auAudiologyPlan(): PaketAraci {
  return paket('au-audiology-plan', 'audiology', AU_AUDIOLOGY.kaynak, {
    ad: 'Audiology plan',
    aciklama: 'A note kept on an audiology file. Tick the consent you obtained. Hearing figures stay in the hearing tool. A photograph, if you keep one, is stored under Documents. A tick is your note.',
    alanlar: {
      onam: 'Consent for this hearing assessment was obtained.',
      kopya: 'A copy of that consent was offered to the patient.',
      foto: 'If a photograph of the ear or the device was kept, consent for it was obtained. The file is stored under Documents and not on a personal device.',
    },
    not: TAKIP,
  })
}

export function auOzelPlanlar(): readonly PaketAraci[] {
  return [auCosmeticSurgeryPlan(), auPhysioPlan(), auPsychologyPlan(), auDieteticsPlan(), auOtPlan(), auAudiologyPlan()]
}
