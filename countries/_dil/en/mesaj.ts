/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: messages between a doctor and a patient, inside the patient page.
 *
 * MACHINE-WRITTEN. No native editor and no lawyer of any of the five countries has read this text. A message stays
 * on the patient's page. Nothing is sent by SMS, e-mail or a messenger: that channel is a slot, switched off.
 *
 * Written in en-GB spelling; `enMesaj(form)` gives the catalogue in the country's form.
 * Placeholders inside a sentence are % and stay in the text. The emergency lines hold no digit: the ambulance
 * number is the pack's setting.
 */
import type { MesajAyarlari } from '@/lib/ulke/tipler'
import type { MesajMetni } from '@/lib/ulke/arayuz/metinTipleri'
import { enCevir, type EnBicim } from './varyant'

export const EN_MESAJ_TEMEL: MesajMetni = {
  hekim: {
    baslik: 'Messages',
    aciklama: 'The patient reads and answers on their own page, after signing in with their link and PIN. Nothing of the message leaves this product.',
    bildirimYok: 'Nothing tells the patient that a message is waiting. Tell them yourself.',
    erisimYok: 'This patient has no link that works. They cannot read a message until you give them access to their page.',
    bos: 'No messages yet.',
    yaz: 'Write a message',
    gonder: 'Send',
    gonderiliyor: 'Sending…',
    gonderilemedi: 'Could not send. Please try again.',
    bosMesaj: 'Write a message before you send it.',
    cokUzun: 'A message can hold at most % characters.',
    limit: 'The daily limit of messages has been reached. Please try again tomorrow.',
    siz: 'You',
    hasta: 'Patient',
    okundu: 'Read',
    okunmadi: 'Not read yet',
    yeni: 'New',
    acik: 'Open',
    kapali: 'Closed on %',
    kapat: 'Close this conversation',
    kapatUyari: 'Closing ends the writing. The messages stay, and can still be read.',
    kapatOnay: 'Close',
    vazgec: 'Cancel',
    kapatildi: 'The conversation is closed.',
    yapilamadi: 'Could not close the conversation. Please try again.',
    yuklenemedi: 'Could not load the messages. Please try again.',
    okunmamisBaslik: 'Unread messages',
    okunmamisAdet: '% unread',
  },
  hasta: {
    baslik: 'Messages',
    aciklama: 'Messages from your doctor, on this page. You can answer here.',
    acil: 'Messages are not for an emergency. If you need an ambulance, use the number shown with this notice.',
    acilNumara: 'Call %.',
    yanitSuresi: 'A reply is not promised for any particular time.',
    baslatamaz: 'You cannot start a conversation. Your doctor writes first.',
    yok: 'Your doctor has not written yet.',
    kapali: 'Your doctor closed this conversation. You can read it, and you cannot write in it.',
    kapandi: 'Closed on %',
    yaz: 'Write a reply',
    gonder: 'Send',
    gonderiliyor: 'Sending…',
    gonderilemedi: 'Could not send. Please try again.',
    bosMesaj: 'Write a reply before you send it.',
    cokUzun: 'A message can hold at most % characters.',
    limit: 'The daily limit of messages has been reached. Please try again tomorrow.',
    hekim: 'Your doctor',
    siz: 'You',
    yeni: 'New',
    okunmamis: '% unread',
    yuklenemedi: 'Could not load the messages. Please try again.',
  },
}

/** The catalogue in a country's form of English. */
export function enMesaj(bicim: EnBicim): MesajMetni {
  return enCevir(EN_MESAJ_TEMEL, bicim)
}

/**
 * The outbound channel is a slot in every English-speaking pack: off, no provider. `ulkeAdi` is the country's own
 * name, as the pack states it ("the United States", "Canada").
 */
export function enMesajAyarlari(ulkeAdi: string): MesajAyarlari {
  return {
    disBildirim: {
      acik: false,
      saglayici: null,
      eksik: `An outbound channel that tells a patient in ${ulkeAdi} that a message is waiting on their page (SMS, a messenger or e-mail): no provider is contracted and none is built. The notice would carry no content of the message.`,
      kimden: `the owner (which channel patients in ${ulkeAdi} really use, and the provider and its cost), then a lawyer of ${ulkeAdi} for the consent to be contacted`,
    },
  }
}
