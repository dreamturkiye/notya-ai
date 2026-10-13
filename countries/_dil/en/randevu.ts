/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the appointment screens (calendar, booking, one appointment, working
 * pattern, the home's and the patient file's lists) and the REMINDER TEXT a doctor copies for a patient.
 *
 * MACHINE-WRITTEN. No native editor of any of the five countries has read this text. The reminder sentences
 * (`hatirlatma.metin*`) are PATIENT-FACING: a patient reads them in a message, under the doctor's own name; they come
 * first for the native reader (docs/COUNTRY-PACK-CHECKLIST.md E8, E11). Written fresh from the kit's keys
 * (lib/ulke/arayuz/metinTipleri.ts → RandevuMetni).
 *
 * Written in en-GB spelling; `enRandevu(country)` gives the catalogue in the country's form.
 * PLACEHOLDERS of the reminder: %1 the day in the country's own pattern, %2 the time as the country writes it,
 * %3 the doctor's name. The country states how a date is typed and which time its calendar is in (./ulke.ts).
 * No public holiday is named or known here: `duzen.tatilNotu` tells the doctor exactly that.
 */
import type { RandevuMetni } from '@/lib/ulke/arayuz/metinTipleri'
import type { EnUlkeSozleri } from './ulke'
import { enCevir } from './varyant'

/** `%D` stands where the country's date pattern is written; the country's calendar sentence is put in whole. */
export const EN_RANDEVU_TEMEL: RandevuMetni = {
  kabuk: { takvim: 'Calendar' },
  gunKisa: { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' },
  gunUzun: { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' },
  durum: {
    planlandi: 'Booked',
    geldi: 'Arrived',
    tamamlandi: 'Completed',
    gelmedi: 'Did not attend',
    iptal: 'Cancelled',
  },
  takvim: {
    baslik: 'Calendar',
    gun: 'Day',
    hafta: 'Week',
    bugun: 'Today',
    onceki: 'Previous',
    sonraki: 'Next',
    yeni: 'Book an appointment',
    duzen: 'Working hours',
    bos: 'Nobody is booked for this day.',
    bosSaat: 'Free',
    mola: 'Break',
    isGunuDegil: 'This is not a working day.',
    mesaiDisi: 'outside working hours',
    gunuAc: 'Open the day',
  },
  form: {
    baslik: 'Book an appointment',
    hasta: 'Patient',
    hastaSec: 'Choose a patient first.',
    hastaDegistir: 'Choose another patient',
    tarih: 'Date',
    tarihOrnek: '%D',
    saat: 'Time',
    sure: 'Length',
    dakika: 'min',
    neden: 'Reason for the appointment',
    nedenOrnek: 'A few words, optional',
    kaydet: 'Book',
    kaydediliyor: 'Saving…',
    vazgec: 'Cancel',
    dolu: 'This time is taken: you already have an appointment then. Choose another time.',
    mesaiDisi: 'This time is outside your working hours. The appointment has not been booked yet.',
    yineDe: 'Book anyway',
    tarihGecersiz: 'The date is not valid. Enter it as %D. A day in the past cannot be booked.',
    saatGecersiz: 'The time is not valid.',
    sureGecersiz: 'Choose a length from the list.',
    kaydedilemedi: 'Could not book the appointment. Please try again.',
  },
  randevu: {
    baslik: 'Appointment',
    durum: 'Status',
    vakit: 'Time',
    geldi: 'Patient has arrived',
    tamamla: 'Mark as completed',
    gelmedi: 'Patient did not attend',
    iptalEt: 'Cancel the appointment',
    planaAl: 'Return to booked',
    geldiyeAl: 'Undo completed',
    muayeneyiAc: 'Open the visit',
    tasi: 'Move to another time',
    tasiKaydet: 'Move',
    tasiYineDe: 'Move anyway',
    tasindi: 'The appointment has been moved.',
    tasiMesaiDisi: 'This time is outside your working hours. The appointment has not been moved yet.',
    bulunamadi: 'Appointment not found.',
    gecisYok: 'The status of this appointment cannot be changed in this way.',
    mesaiDisiIsareti: 'Booked outside working hours.',
    degistirilemedi: 'Could not change it. Please try again.',
    yenidenYaz: 'Book again',
    takvimeDon: 'Back to the calendar',
    dosya: 'Patient file',
  },
  hatirlatma: {
    baslik: 'Reminder text',
    kopyala: 'Copy the reminder text',
    kopyalandi: 'Copied. Paste it into the messaging app you use.',
    kopyalanamadi: 'Could not copy. Select the text and copy it by hand.',
    izoh: 'Nothing is sent automatically: you send the text to the patient yourself.',
    dil: 'Language of the text (the patient\'s language)',
    dilAdi: { en: 'English' },
    // PATIENT-FACING. %1 day, %2 time, %3 the doctor's name.
    metin: 'Hello. This is a reminder of your appointment with %3 on %1 at %2.',
    metinAdsiz: 'Hello. This is a reminder of your appointment with your doctor on %1 at %2.',
  },
  duzen: {
    baslik: 'Working hours',
    aciklama: 'Free times on the calendar follow these hours. Booking outside them asks you to confirm first.',
    gunler: 'Working days',
    baslangic: 'Start of the day',
    bitis: 'End of the day',
    sure: 'Usual length of an appointment',
    molalar: 'Breaks',
    molaBas: 'From',
    molaBit: 'To',
    molaEkle: 'Add a break',
    molaSil: 'Remove',
    kaydet: 'Save working hours',
    kaydediliyor: 'Saving…',
    kaydedildi: 'Saved.',
    kaydedilemedi: 'Could not save. Please try again.',
    gunGerekli: 'Choose at least one working day.',
    saatGecersiz: 'The hours are not valid: the end must be later than the start.',
    sureGecersiz: 'Choose a length from the list.',
    molaGecersiz: 'The break is not valid: it must be inside the working hours and must not overlap another break.',
    saatDilimi: '%Z',
    tatilNotu: 'Public holidays are not taken into account automatically. Take care not to book a patient on a public holiday.',
    varsayilan: 'The standard hours apply for now. Save your own.',
  },
  bugun: {
    randevular: 'Today\'s appointments',
    randevuYok: 'Nobody is booked for today.',
    takvimiAc: 'Open the calendar',
  },
  hasta: {
    randevular: 'Coming appointments',
    randevuAl: 'Book an appointment',
  },
}

/** The appointment catalogue in a country's form of English, with the country's date pattern and calendar sentence. */
export function enRandevu(u: EnUlkeSozleri): RandevuMetni {
  const t = enCevir(EN_RANDEVU_TEMEL, u.bicim)
  return {
    ...t,
    form: { ...t.form, tarihOrnek: u.tarihOrnegi, tarihGecersiz: t.form.tarihGecersiz.replace('%D', u.tarihOrnegi) },
    duzen: { ...t.duzen, saatDilimi: u.saatDilimiCumlesi },
  }
}
