/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the INTAKE FORM's screens — the screens' own words, NOT the questions.
 *
 *   hekim   the doctor's controls: asking for the form, the invitation, the answers
 *   davet   PATIENT-FACING: the invitation the doctor copies and sends. The address (%2, or % without a name) is the
 *           LAST thing in the text; the two "baglantisiz" texts are for a patient who already has a link and name no
 *           address. The PIN is never written into an invitation.
 *   hasta   PATIENT-FACING: the form on the patient's own page
 *   birim   the name of each unit of measure a country may use, as a patient reads it: each country's pack measures
 *           in three of the six (uygulama.birimler), and a question is never shown without its unit
 *
 * MACHINE-WRITTEN. No native editor of any of the five countries has read this text; `davet` and `hasta` come first
 * for the native reader (checklist E8, E11). THE QUESTIONS are clinical content (./klinik/hastaFormu/).
 *
 * Written in en-GB spelling; `enForm(country)` gives the catalogue in the country's form.
 */
import type { FormMetni } from '@/lib/ulke/arayuz/metinTipleri'
import type { EnUlkeSozleri } from './ulke'
import { enCevir } from './varyant'

export const EN_FORM_TEMEL: FormMetni = {
  hekim: {
    baslik: 'Form before the visit',
    aciklama: 'Before a visit the patient fills in a short form on their own page: general questions first, then the questions of your specialty. The system sends nothing to the patient.',
    durumYok: 'This patient has not been asked for a form yet.',
    durumBekliyor: 'The form was asked for on %. The patient has not started it yet.',
    durumTaslak: 'The patient has started the form and has not sent it yet. Last saved: %.',
    durumGonderildi: 'The patient sent the form on %.',
    iste: 'Ask the patient to fill in the form',
    bekliyor: 'Please wait…',
    yapilamadi: 'That did not work. Please try again.',
    istendi: 'The form is waiting for the patient on their page.',
    acikVar: 'This patient already had a form that was not filled in: it has been left as it is.',
    davetBaslik: 'Invitation text',
    davetDil: 'Language of the text (the patient\'s language)',
    davetIzoh: 'Nothing is sent automatically: you send the text to the patient yourself. Give the PIN separately.',
    baglantiVar: 'This patient already has a link. It cannot be shown again, so the text holds no link: the patient opens the one they have.',
    yeniBaglanti: 'Give a new link and add it to the text',
    yeniBaglantiUyari: 'If you give a new link, the patient\'s old link stops working at once and the PIN changes. The patient will need both the new link and the new PIN from you.',
    yeniBaglantiOnay: 'Yes, give a new link',
    vazgec: 'Cancel',
    cevaplar: 'The patient\'s answers',
    beyan: 'As stated by the patient. Not verified.',
    veliBeyani: 'Filled in by a parent or guardian. Not verified.',
    notaGirmez: 'These answers are not used when the visit note is written.',
    surumFarkli: 'The list of questions has changed since this form was asked for: some answers may not be shown.',
    yenidenAc: 'Reopen',
    yenidenAcUyari: 'The patient will then be able to change the answers and will have to send the form again.',
    yenidenAcildi: 'The form has been reopened.',
    geriCek: 'Withdraw the request',
    geriCekildi: 'The request has been withdrawn. The form has been removed from the patient\'s page.',
    oncekiler: 'Earlier forms',
  },
  // PATIENT-FACING. The address comes last, with nothing after it.
  davet: {
    metin: 'Hello. %1 asks you to fill in a short form before your visit. You will be given the PIN separately. The link to your page: %2',
    metinAdsiz: 'Hello. Your doctor asks you to fill in a short form before your visit. You will be given the PIN separately. The link to your page: %',
    baglantisiz: 'Hello. % asks you to fill in a short form before your visit. To do so, open your page with the link you were given earlier.',
    baglantisizAdsiz: 'Hello. Your doctor asks you to fill in a short form before your visit. To do so, open your page with the link you were given earlier.',
  },
  // PATIENT-FACING.
  hasta: {
    bekliyorBaslik: 'Form before your visit',
    bekliyorAciklama: 'Your doctor asks you to answer a few questions before your visit. It takes a few minutes.',
    veliAciklama: 'The doctor asks you to answer a few questions about your child before the visit. It takes a few minutes.',
    baslat: 'Start',
    devam: 'Continue',
    yenidenAcildi: 'Your doctor has reopened the form. Check your answers and send it again.',
    rizaBaslik: 'Before you start',
    rizaKabul: 'I agree',
    rizaGerekli: 'Your agreement is needed to continue.',
    zorunlu: 'required',
    evet: 'Yes',
    hayir: 'No',
    kaydediliyor: 'Saving…',
    kaydedildi: 'Your answers have been saved.',
    kaydedilemedi: 'Could not save. Check your internet connection and try again.',
    ileri: 'Next',
    geri: 'Back',
    bolum: 'Part %1 of %2',
    gonder: 'Send to the doctor',
    gonderiliyor: 'Sending…',
    gonderilemedi: 'Could not send. Please try again.',
    gonderUyari: 'After you send the form you can read your answers but you cannot change them.',
    eksik: 'Answer the questions marked as required.',
    sayiGecersiz: 'Enter a number from %1 to %2.',
    gonderildiBaslik: 'The form has been sent',
    gonderildi: 'You sent the form on %. Your doctor will read it before your visit.',
    cevaplarim: 'My answers',
    degistirilemez: 'The answers cannot be changed. If something is wrong, tell your doctor.',
    kapat: 'Back to my page',
  },
  // Unit SYMBOLS: never rewritten by the spelling table (it holds words, and none of these is one).
  birim: { cm: 'cm', in: 'in', kg: 'kg', lb: 'lb', C: '°C', F: '°F' },
}

/** The intake form's catalogue in a country's form of English. */
export function enForm(u: EnUlkeSozleri): FormMetni {
  return enCevir(EN_FORM_TEMEL, u.bicim)
}
