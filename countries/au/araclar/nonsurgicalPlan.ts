/**
 * Hair transplants, listed where the Medical Board lists them.
 *
 * CLASSIFIED BEFORE ADDING: specialty-only. `roller` is aesthetic-medicine alone
 * ("Non-surgical cosmetic procedures"). Cosmetic surgery, plastic surgery, dermatology
 * and every other role do not see this note.
 *
 * READ 2026-10-20 — Medical Board of Australia, Guidelines for registered medical practitioners
 * who perform cosmetic surgery and procedures. Non-surgical cosmetic procedures do not involve
 * cutting beneath the skin but may involve piercing the skin. Hair transplants are in that list.
 * For a patient under 18, the same non-surgical section requires at least seven days between
 * informed consent and the procedure, and no money until after that period other than for the
 * initial consultation. Photographs and videos need consent and an explanation of proposed use.
 * The surgical cooling-off periods are not applied to this note.
 *
 * No graft count is stored. No sentence from the guideline is copied as a passage.
 * The ticks are the doctor's own confirmations. The image file, when one is kept, is the
 * patient photo archive under Documents (every offered role), not this checklist.
 *
 * THE PLAN IS SAVED on the patient's Australia record (ulke_arac_kayitlari) when the doctor presses keep.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { isaret, secim } from '@/lib/ulke/araclar/yardimci'
import { kosulluListe } from './kosulluListe'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })
const ISLEM = ['sac', 'diger'] as const
const yalniz = (degerler: readonly string[]) => ({ kosul: { alan: 'islem', degerler } })
const kutu = (anahtar: string, degerler: readonly string[] = ISLEM) => ({ ...isaret(anahtar), ...yalniz(degerler) })

const KAYNAK = 'https://www.medicalboard.gov.au/Codes-Guidelines-Policies.aspx (read 2026-10-20): the codes and guidelines index. The cosmetic-procedure guideline opened the same day lists hair transplants with non-surgical cosmetic procedures. No sentence from the guideline is copied as arithmetic.'
const BILDIRIM = 'A tick is a note in this product. No sentence from the Medical Board guideline is copied here. Nothing is booked and nothing is sent.'

export const AU_NONSURGICAL = kosulluListe({
  anahtar: 'au-nonsurgical-plan',
  alanlar: [
    secim('islem', ISLEM),
    kutu('listede', ['sac']),
    kutu('foto'),
    kutu('onsekiz'),
  ],
  uyarilar: ['gonderilmedi'],
  uyari: () => ['gonderilmedi'],
  kaynak: KAYNAK,
})

/** Non-surgical cosmetic procedures only. Hair transplants are named here, not as their own role. */
export function auNonsurgicalPlan(): PaketAraci {
  return {
    anahtar: 'au-nonsurgical-plan',
    roller: ['aesthetic-medicine'],
    metin: {
      ad: m('Non-surgical cosmetic plan'),
      aciklama: m('A note for non-surgical cosmetic procedures. The Medical Board guideline lists hair transplants in that group. Hair transplantation is not its own role. Choose the procedure, then tick the notes that apply. A photograph, if you keep one, is stored under Documents on this patient\'s file. A tick is your note.'),
      alanlar: {
        islem: m('Which procedure this note is for'),
        listede: m('Hair transplants are listed with non-surgical cosmetic procedures. They may pierce the skin. This note does not record a graft count.'),
        foto: m('Consent was requested for any photograph or video, and the proposed use of the images was explained. The image file, if one is kept, is stored under Documents.'),
        onsekiz: m('Where the patient is under 18, at least seven days pass between informed consent and the procedure, and no money is taken before that period ends apart from the first consultation.'),
      },
      secenekler: {
        islem: {
          sac: m('Hair transplant'),
          diger: m('Another non-surgical cosmetic procedure'),
        },
      },
      sayilar: { isaretli: m('Plan notes') },
      uyarilar: {
        gonderilmedi: m('A tick is a note in this product. Nothing is booked and nothing is sent.'),
      },
      not: m('The cooling-off period named here is the non-surgical one for a patient under 18. A follow-up day, if you want one, is the day you enter when you keep this note.'),
    },
    lisans: {
      durum: 'serbest',
      hakSahibi: 'Notya',
      kaynak: KAYNAK,
      bildirim: m(BILDIRIM),
    },
  }
}
