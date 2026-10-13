/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the PATIENT PORTAL.
 *
 *   erisim, ozet, istek   the doctor's controls (the patient's file, an approved note, the calendar)
 *   giris, sayfa          what the PATIENT reads: the PIN page and their own page
 *
 * MACHINE-WRITTEN. No native editor of any of the five countries has read this text. `giris` and `sayfa` are
 * PATIENT-FACING: a patient reads them on their own phone, with nobody beside them to explain. They come first for
 * the native reader, and must be read before a real doctor gives a patient a link (checklist E8, E11).
 *
 * `sayfa.acilNumara` is the sentence that carries the ambulance number. THE NUMBER IS NOT IN THIS FILE and never
 * will be: it is a setting of each country's pack (`uygulama.portal.acilNumara`), confirmed there by a local source.
 * A sentence with a digit in it fails the pack check.
 *
 * Written in en-GB spelling; `enPortal(country)` gives the catalogue in the country's form.
 * PLACEHOLDERS: '%' one value; '%1' and '%2' two (each key of the kit's type PortalMetni says which).
 */
import type { PortalMetni } from '@/lib/ulke/arayuz/metinTipleri'
import type { EnUlkeSozleri } from './ulke'
import { enCevir } from './varyant'

type Temel = Omit<PortalMetni, 'sayfa'> & { sayfa: Omit<PortalMetni['sayfa'], 'saatDilimi'> }

export const EN_PORTAL_TEMEL: Temel = {
  erisim: {
    baslik: 'Patient\'s page',
    aciklama: 'With a link and a PIN the patient opens a page of their own: it shows their appointments and the summaries you have shared. The visit note itself is never shown to the patient.',
    durumYok: 'This patient has not been given access yet.',
    durumAcik: 'Access is open. The link works until %.',
    durumKilitli: 'The link is locked: the PIN was entered wrongly too many times. Give the patient a new link.',
    durumBitti: 'The link has expired. Give the patient a new link.',
    sonGiris: 'Last opened: %',
    sonGirisYok: 'The patient has not opened the page yet.',
    ver: 'Give access',
    yenile: 'New link and PIN',
    yenileUyari: 'The old link stops working at once.',
    iptal: 'Withdraw access',
    iptalEdildi: 'Access has been withdrawn. The link no longer works.',
    bekliyor: 'Please wait…',
    yapilamadi: 'That did not work. Please try again.',
    birKez: 'The link and the PIN are shown only now. Copy them: they cannot be shown again.',
    baglanti: 'Link',
    pin: 'PIN',
    kopyala: 'Copy',
    kopyalandi: 'Copied.',
    kopyalanamadi: 'Could not copy. Select the text and copy it by hand.',
    nasil: 'Give the link and the PIN to the patient yourself, in two different ways if you can. The system sends nothing to the patient.',
    kayitlar: 'History',
    kayitYok: 'Nothing yet.',
    olay: {
      erisim: 'Access given',
      iptal: 'Access withdrawn',
      giris: 'Patient opened the page',
      kilit: 'Link locked: the PIN was entered wrongly too many times',
      paylasim: 'Summary shared with the patient',
      geriAlma: 'Summary withdrawn',
    },
  },
  ozet: {
    baslik: 'Summary for the patient',
    aciklama: 'A short text in plain words, written from the approved note. The patient sees it only after you share it. The note itself is not shown to the patient.',
    dil: 'Language of the summary: %',
    yaz: 'Prepare a draft',
    yenidenYaz: 'Prepare again',
    yaziliyor: 'Preparing the text…',
    yazilamadi: 'The summary could not be prepared. Please try again.',
    makine: 'This draft was written by artificial intelligence. Read it and correct it where needed before you share it.',
    etiket: 'Text of the summary',
    kaydet: 'Save',
    kaydedildi: 'Saved.',
    kaydedilemedi: 'Could not save. Please try again.',
    bos: 'The summary is empty.',
    paylas: 'Share with the patient',
    paylasildi: 'The patient has been able to see this summary since %',
    paylasilmadi: 'Not shared. The patient does not see it.',
    geriAl: 'Withdraw',
    geriAlindi: 'Withdrawn. The patient no longer sees it.',
    degistirmekIcin: 'To change a summary you have shared, withdraw it first.',
    yapilamadi: 'That did not work. Please try again.',
    erisimIpucu: 'The patient reads the summary on their own page. Access is given on the patient file.',
  },
  istek: {
    baslik: 'Appointment requests',
    gunler: 'Days that suit the patient',
    neden: 'Reason',
    sec: 'Choose a time',
    reddet: 'Decline',
    reddedildi: 'The request has been declined.',
    formBaslik: 'Answer the request',
    kabul: 'Book the appointment',
    cevaplandi: 'This request has already been answered.',
    yapilamadi: 'That did not work. Please try again.',
    istekTarihi: 'Sent: %',
  },
  // PATIENT-FACING from here on.
  giris: {
    baslik: 'Your page',
    aciklama: 'Enter the PIN your doctor gave you.',
    pin: 'PIN',
    gonder: 'Open',
    gonderiliyor: 'Checking…',
    pinBicimi: 'The PIN has % digits.',
    pinYanlis: 'That PIN is not right. Tries left: %',
    kilitli: 'The PIN was entered wrongly too many times and this link is now locked. Ask your doctor for a new link.',
    yavas: 'Too fast. Wait a few seconds and try again.',
    gecersiz: 'This link does not work or has expired. Ask your doctor for a new link.',
    hata: 'Something went wrong. Please try again.',
    baglanti: 'No connection. Check your internet connection.',
    gizlilik: 'Do not share the link or the PIN with anyone.',
    yukleniyor: 'Loading…',
  },
  sayfa: {
    selam: 'Hello, %',
    hekim: 'Your doctor',
    cikis: 'Close',
    oturumBitti: 'For your safety the page has been closed. Enter your PIN again.',
    randevular: 'Your appointments',
    randevuYok: 'You have no appointment booked in the coming days.',
    ozetler: 'From your doctor',
    ozetYok: 'Your doctor has not shared anything with you yet.',
    muayene: 'Visit on %',
    istekBaslik: 'Ask for an appointment',
    istekAciklama: 'Choose the days that suit you (% at most). Your doctor will set the time.',
    istekNeden: 'Reason (a few words, optional)',
    istekGonder: 'Send the request',
    istekGonderiliyor: 'Sending…',
    istekGunGerekli: 'Choose at least one day.',
    istekCokGun: 'Choose no more than % days.',
    istekGonderilemedi: 'The request could not be sent. Please try again.',
    istekBekliyor: 'Your request has been sent. Your doctor has not answered yet.',
    istekGunler: 'The days you asked for: %',
    istekKabul: 'Your doctor has booked an appointment for you: %1, %2.',
    istekRed: 'Your doctor cannot see you on those days. You can send a new request.',
    acil: 'This page is not for emergencies.',
    acilNumara: 'If you are very unwell, call an ambulance: %.',
    yalniz: 'Only what your doctor has shared with you is shown here.',
  },
}

/** For a country with several time zones: which zone the times on the patient's page are in. % the zone's name. */
const SAAT_DILIMI = 'Times are shown in your doctor\'s time zone: %.'

/** The portal's catalogue in a country's form of English. */
export function enPortal(u: EnUlkeSozleri): PortalMetni {
  const t = enCevir(EN_PORTAL_TEMEL, u.bicim)
  return { ...t, sayfa: { ...t.sayfa, ...(u.cokSaatDilimi ? { saatDilimi: enCevir(SAAT_DILIMI, u.bicim) } : {}) } }
}
