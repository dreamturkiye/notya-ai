/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the signed-in application (first login, settings, home, patients,
 * visit, note, the assistant line, the role question). The same in every English-speaking country, except the
 * sentences a country states itself (./ulke.ts): the recording-consent sentence, the label of the patient identifier.
 *
 * MACHINE-WRITTEN. No native editor, no clinician and no lawyer of any of the five countries has read this text
 * (docs/COUNTRY-PACK-CHECKLIST.md E4, E11). Written fresh from the kit's keys
 * (lib/ulke/arayuz/metinTipleri.ts → UygulamaMetni); nothing is translated from another country's catalogue.
 *
 * Written in en-GB spelling; `enUygulama(country)` gives the catalogue in the country's form (./varyant.ts).
 * Placeholders inside a sentence are %, %1, %2, %3 and stay in the text.
 *
 * WORDS CHOSEN TO READ THE SAME IN ALL FIVE COUNTRIES: "doctor" (not physician, GP or consultant), "visit" for one
 * consultation, "visit note" for its record, "patient file" for the patient's record in this product, "select" for
 * a box (not tick or check), "sign in" and "sign out". A word that belongs to one country is that country's to write.
 */
import type { UygulamaMetni } from '@/lib/ulke/arayuz/metinTipleri'
import type { EnUlkeSozleri } from './ulke'
import { enCevir } from './varyant'

/** What the country states is left out of the base: it is put in by `enUygulama`, as the country wrote it. */
type Temel = Omit<UygulamaMetni, 'muayene' | 'yeniHasta' | 'ayarlar'> & {
  muayene: Omit<UygulamaMetni['muayene'], 'riza'>
  yeniHasta: Omit<UygulamaMetni['yeniHasta'], 'ulusalKimlik' | 'otaIsmi'>
  ayarlar: Omit<UygulamaMetni['ayarlar'], 'saatDilimi' | 'saatDilimiIzoh'>
}

export const EN_UYGULAMA_TEMEL: Temel = {
  kabuk: {
    bugun: 'Today',
    hastalar: 'Patients',
    ayarlar: 'Settings',
    cikis: 'Sign out',
    menu: 'Main menu',
    yukleniyor: 'Loading…',
    hata: 'Something went wrong. Please try again.',
    baglanti: 'No connection. Check your internet connection.',
    geri: 'Back',
  },
  diller: { en: 'English' },
  yazilar: {},
  baslangic: {
    baslik: 'Which language do you work in?',
    aciklama: 'The screens and your visit notes will be in this language. You can change it later in Settings.',
    dil: 'Language',
    yazi: 'Script',
    devam: 'Continue',
    kaydediliyor: 'Saving…',
    kaydedilemedi: 'Could not save. Please try again.',
  },
  ayarlar: {
    baslik: 'Settings',
    dilBolumu: 'Language',
    arayuzDili: 'Language of the screens',
    notDili: 'Language of visit notes',
    yazi: 'Script',
    yaziIzoh: 'Used for the screens and for visit notes.',
    kaydet: 'Save',
    kaydediliyor: 'Saving…',
    kaydedildi: 'Saved.',
    kaydedilemedi: 'Could not save. Please try again.',
  },
  arama: {
    etiket: 'Find a patient',
    ornek: 'Name or phone number',
    dugme: 'Search',
    sonucYok: 'Nothing found.',
  },
  durum: {
    taslak: 'Draft',
    onayli: 'Approved',
  },
  bugun: {
    selam: 'Hello',
    baslik: 'Today\'s visits',
    bos: 'No visits yet today.',
    yeniHasta: 'New patient',
    muayeneBaslat: 'Start a visit',
    hastasiz: 'No patient chosen',
    tumHastalar: 'All patients',
  },
  hastalar: {
    baslik: 'Patients',
    bos: 'No patients yet.',
    dosya: 'Open file',
  },
  yeniHasta: {
    baslik: 'New patient',
    ad: 'Full name',
    istegeBagli: 'optional',
    dogumTarihi: 'Date of birth',
    cinsiyet: 'Sex',
    erkek: 'Male',
    kadin: 'Female',
    telefon: 'Phone number',
    dil: 'Patient\'s language',
    kaydet: 'Save patient',
    kaydediliyor: 'Saving…',
    iptal: 'Cancel',
    adGerekli: 'Enter the patient\'s name.',
    dogumGecersiz: 'The date of birth is not valid.',
    dilGerekli: 'Choose the patient\'s language.',
    kaydedilemedi: 'Could not save the patient. Please try again.',
  },
  hasta: {
    baslik: 'Patient file',
    yas: 'Age',
    ay: 'months',
    bulunamadi: 'Patient not found.',
    notlar: 'Approved notes',
    notYok: 'No approved notes yet.',
    taslaklar: 'Drafts not yet approved',
    notsuzlar: 'Visits without a note',
    notsuz: 'Transcript',
    ac: 'Open',
  },
  muayene: {
    baslik: 'Visit',
    hasta: 'Patient',
    sablon: 'Note template',
    sablonGenel: 'General',
    sablonPediatri: 'Paediatrics',
    rizaGerekli: 'Confirm consent before you start recording.',
    kayitBaslat: 'Start recording',
    kayitDurdur: 'Stop and prepare the visit note',
    kaydediliyor: 'Recording',
    vazgec: 'Discard recording',
    mikrofonYok: 'The microphone cannot be reached. Check your browser\'s settings.',
    yukleniyor: 'Uploading the recording…',
    isleniyor: 'The recording is being transcribed and the visit note prepared. This can take a few minutes.',
    kisaKayit: 'There is not enough speech in the recording. Please record again.',
    sesOkunamadi: 'The recording could not be processed. Please try again.',
    notYazilamadi: 'The visit note could not be prepared. The transcript has been saved.',
    yenidenDene: 'Prepare the note again',
    limit: 'The daily limit of recorded visits has been reached. Please try again tomorrow.',
    hazirDegil: 'Speech recognition has not been set up yet.',
    taninanDil: 'Language of the visit',
    konusmaDili: { en: 'English' },
    dilKarma: 'not determined (possibly mixed)',
    dilBaska: 'another language',
    ikinciGecis: 'Recognition confidence was low, so the recording was processed a second time.',
    dusukGuven: 'Because of the quality or the language of the recording, the transcript may be inaccurate. Read the visit note carefully.',
    metinKaydedildi: 'The transcript has been saved.',
    bulunamadi: 'Visit not found.',
    yeniHasta: 'Add a new patient',
    notHazirla: 'Prepare the visit note',
    notYaziliyor: 'Preparing the visit note…',
    notuAc: 'Open the visit note',
    hastaSec: 'Choose a patient first.',
  },
  not: {
    baslik: 'Visit note',
    uyari: 'This note was drafted by artificial intelligence. Read it and correct it where needed before you approve it.',
    s: 'History and presenting complaint',
    o: 'Examination',
    a: 'Assessment',
    p: 'Plan',
    notDili: 'Language of the note',
    cevir: {},
    cevriliyor: 'Rewriting…',
    cevrilemedi: 'Could not rewrite. The note has not been changed.',
    kaydet: 'Save draft',
    kaydedildi: 'Draft saved.',
    onayla: 'Approve and save to the patient file',
    onaylaniyor: 'Approving…',
    onaylandi: 'The note has been approved and saved to the patient file.',
    bosNot: 'An empty note cannot be approved.',
    transkript: 'Transcript',
    dosyayaDon: 'Go to the patient file',
    bulunamadi: 'Note not found.',
    kaydedilemedi: 'Could not save the draft. Please try again.',
    onaylanamadi: 'Could not approve. Please try again.',
    zatenOnayli: 'This note has already been approved. An approved note is not changed.',
    ikinciTaslak: 'This is a second draft. The first draft has not been changed: choose one of them to approve.',
  },
  asistan: {
    etiket: 'Your assistant',
    notr: '% assistant',
    satir: 'Your senior colleague',
    qayd: 'Note drafted by',
    qoralama: 'Draft written by',
  },
  rol: {
    baslik: 'What is your specialty?',
    aciklama: 'Your assistant and the structure of your visit notes depend on it. You can change it later in Settings.',
    etiket: 'Specialty or profession',
    sec: 'Choose from the list',
    grupDoktor: 'Medical specialty',
    grupKlinikHekim: 'Clinic doctor',
    grupKlinikMuttefik: 'Clinic health professional',
    devam: 'Continue',
    kaydediliyor: 'Saving…',
    kaydedilemedi: 'Could not save. Please try again.',
    gerekli: 'Choose a specialty from the list.',
    ayarBaslik: 'Specialty',
    ayarIzoh: 'The change applies from your next visit. Notes already written are not changed.',
    kaydet: 'Save specialty',
    kaydedildi: 'Saved.',
  },
}

/** Shared by the multi-zone countries: the label of the account's time zone in Settings, and the line under it. */
const SAAT_DILIMI = { saatDilimi: 'Time zone', saatDilimiIzoh: 'Your calendar and every time on the screens are shown in this time zone.' } as const

/** The application's catalogue in a country's form of English, with the country's own sentences put in as written. */
export function enUygulama(u: EnUlkeSozleri): UygulamaMetni {
  const t = enCevir(EN_UYGULAMA_TEMEL, u.bicim)
  return {
    ...t,
    ayarlar: { ...t.ayarlar, ...(u.cokSaatDilimi ? enCevir(SAAT_DILIMI, u.bicim) : {}) },
    yeniHasta: { ...t.yeniHasta, ...(u.kimlikEtiketi ? { ulusalKimlik: u.kimlikEtiketi } : {}) },
    muayene: { ...t.muayene, riza: u.kayitRizasi },
  }
}
