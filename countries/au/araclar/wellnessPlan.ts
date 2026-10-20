/**
 * Wellness and longevity, kept inside general practice.
 *
 * CLASSIFIED BEFORE ADDING: specialty-only. `roller` is family-medicine alone.
 * Cardiology, cosmetic roles, allied professions and every other role do not see it.
 *
 * READ 2026-10-20. The Medical Board specialty list (effective 22 September 2025) has General practice
 * and has no longevity title. The RACGP publishes preventive activities for general practice:
 *   https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice
 * No recommendation from that page is copied. No dose, no laboratory panel and no biological age is stored.
 *
 * THE PLAN IS SAVED on the patient's Australia record (ulke_arac_kayitlari) when the doctor presses keep.
 * A new result is a new record. Nothing is sent.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { isaret, secim } from '@/lib/ulke/araclar/yardimci'
import { kosulluListe } from './kosulluListe'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const KONU = ['onleme', 'saglik'] as const
const konu = (degerler: readonly string[] = KONU) => ({ kosul: { alan: 'konu', degerler } })
const kutu = (anahtar: string) => ({ ...isaret(anahtar), ...konu() })

const KAYNAK = 'https://www.racgp.org.au/clinical-resources/clinical-guidelines/key-racgp-guidelines/view-all-racgp-guidelines/preventive-activities-in-general-practice (read 2026-10-20): preventive activities are published for general practice. This checklist copies no recommendation from that page. Wellness and longevity are not a specialist title.'
const BILDIRIM = 'A tick is a note in this product. No sentence from the RACGP preventive-activities page is copied here. Nothing is sent.'

export const AU_WELLNESS = kosulluListe({
  anahtar: 'au-wellness-plan',
  alanlar: [
    secim('konu', KONU),
    kutu('yer'),
    kutu('yazildi'),
    kutu('dosya'),
  ],
  uyarilar: ['gonderilmedi'],
  uyari: () => ['gonderilmedi'],
  kaynak: KAYNAK,
})

/** General practice only. A plan note. Not a specialist title and not a dose. */
export function auWellnessPlan(): PaketAraci {
  return {
    anahtar: 'au-wellness-plan',
    roller: ['family-medicine'],
    metin: {
      ad: m('Wellness and longevity plan'),
      aciklama: m('A note kept on a general-practice file. Wellness and longevity are not a specialist title on the Medical Board list. Choose the review, then tick what you are recording. The RACGP publishes preventive activities for general practice. This screen copies no recommendation from that page. A tick is your note.'),
      alanlar: {
        konu: m('What this review is'),
        yer: m('This review sits in general practice. It is not a specialist title.'),
        yazildi: m('What will be reviewed was written by the doctor. This note stores the tick. It stores no diagnosis and no dose.'),
        dosya: m('The patient was told this note stays on their file in this product.'),
      },
      secenekler: {
        konu: {
          onleme: m('Preventive activities review'),
          saglik: m('Wellness and healthspan review'),
        },
      },
      sayilar: { isaretli: m('Plan notes') },
      uyarilar: {
        gonderilmedi: m('A tick is a note in this product. Nothing is sent. This is not a specialist registration.'),
      },
      not: m('A follow-up day, if you want one, is the day you enter when you keep this note. No laboratory panel is named here.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Notya',
      kaynak: KAYNAK,
      bildirim: m(BILDIRIM),
    },
  }
}
