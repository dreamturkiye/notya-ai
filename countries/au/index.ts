/**
 * NOTYA-ULKE-EN-01 — Australia: the country pack. Code `au`, served at /au. Record of decisions and of
 * everything unverified: docs/COUNTRY-PACK-AUSTRALIA.md.
 *
 * AN ENGLISH-SPEAKING PACK: its text is the English language set (countries/_dil/en/) in Australian spelling (en-AU); this
 * folder holds only what is this country's. Everything is OFF unless listed here. Nothing in this folder comes
 * from another country's folder (scripts/ulke-duvarlari.mjs), and nothing falls back to another country's content.
 *
 * Keep this file light: data and pure functions only (the middleware and the browser bundle load it).
 * EVERY VALUE IS UNVERIFIED until somebody in Australia confirms it (see ./ayarlar.ts).
 */
import { paketMetinleri, type UlkePaketi } from '@/lib/ulke/tipler'
import { enCekirdek } from '../_dil/en/cekirdek'
import { EN_ROLLER } from '../_dil/en/klinik/roller'
import { AU_BIRIMLER, AU_VELI_YASI } from './ayarlar'

const cekirdek = enCekirdek('en-AU')
const metin = paketMetinleri({
  acikDiller: ['en-AU'],
  yuzeyler: ['hesap', 'giris', 'davetliKayit', 'bekletme', 'sistem'],
  metinler: { 'en-AU': cekirdek },
})

/** Mobile number: +61 and nine digits beginning with 4, in any common spelling (04… at home). UNVERIFIED format rule. */
function auCepGecerliMi(ham: string | null | undefined): boolean {
  const t = String(ham ?? '').trim()
  if (!t || !/^[0-9+()\-.\s]+$/.test(t)) return false
  let rakam = t.replace(/\D/g, '')
  if (rakam.startsWith('00')) rakam = rakam.slice(2)
  if (rakam.startsWith('61')) rakam = rakam.slice(2)
  if (rakam.startsWith('0')) rakam = rakam.slice(1)
  return /^4\d{8}$/.test(rakam)
}

export const AU_PAKETI: UlkePaketi = {
  kod: 'au',
  // Unique marker: the build proof looks for it to show that a build holds this pack and no other. Never reuse it.
  iz: 'notya-ulke-paketi:au:3127d7dfaa',
  diller: ['en-AU'],
  acikDiller: metin.acikDiller,
  varsayilanDil: 'en-AU',
  paraBirimi: { kod: 'AUD', simge: '$', ondalikHane: 2 },
  // The default time zone of a new account. UNVERIFIED choice.
  saatDilimi: 'Australia/Sydney',
  bicim: { yerel: 'en-AU', tarihDeseni: 'DD/MM/YYYY', ondalikAyraci: '.', binlikAyraci: ',', haftaBasi: 1 },
  telefon: { ulkeOnEki: '+61', ulusalHane: 9, ornek: '+61 491 570 006', cepGecerliMi: auCepGecerliMi },
  // THE PATIENT IDENTIFIER: an OPTIONAL FREE-TEXT field, stored encrypted and never validated (`dogrula: false`
  // below). `hane: 0` = no length is assumed. The label is the national data element's name (./ayarlar.ts).
  ulusalKimlik: { ad: 'Medicare card number', hane: 0, gecerliMi: (ham) => String(ham ?? '').trim().length > 0 },
  // Fail closed: what the country kit has built is on; everything else (the assistant in text and voice, the voice
  // profile, image evaluation, consultation, messaging) is off.
  ozellikler: {
    acilisSayfasi: true,
    cekirdekGiris: true,
    davetliKayit: true,
    bekletmeSayfasi: true,
    cekirdekMuayene: true,
    randevu: true,
    hastaPortali: true,
    hastaFormu: true,
    araclar: true,
  },
  araclar: [],
  // The ONLY paths that exist in this country's deployment; every other path answers 404 in the middleware.
  rotalar: {
    sayfalar: ['/', '/login', '/signup', '/welcome', '/start', '/today', '/settings', '/patients', '/patients/new', '/patient', '/visit', '/calendar', '/portal', '/tools'],
    apiOnEkleri: ['/api/ulke/'],
  },
  // The path of the main site this country is served under.
  yolOnEki: '/au',
  // HIDDEN FROM SEARCH. Only the owner changes this, after the pilot approves the site (checklist K2).
  aramaMotorlarinaGizli: true,
  kabuk: {
    baslik: 'Notya',
    aciklama: 'A clinical assistant for doctors and clinics.',
    zemin: '#f4eee3',
  },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { 'en-AU': 'English' },
  uygulama: {
    diller: ['en-AU'],
    hastaDilleri: ['en'],
    roller: EN_ROLLER,
    // STARTING VALUES, to verify with a local clinical lead (checklist J4). An account changes all of it for itself.
    // PUBLIC HOLIDAYS are deliberately absent: they are local content (and differ between the states and territories).
    randevu: {
      varsayilan: { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '17:00', sureDk: 30, molalar: [{ baslangic: '12:00', bitis: '13:00' }] },
      sureSecenekleri: [10, 15, 20, 30, 45, 60, 90],
    },
    // A portal link works for 30 days: a STARTING VALUE the owner confirms; how long a patient's access may stand is
    // for a lawyer. THE EMERGENCY NUMBER: 000 ("Triple Zero (000)", police, fire or ambulance; triplezero.gov.au, read
    // on 2026-10-09). Written as it is dialled: the kit takes digits only. Not yet confirmed by a person of the
    // country. The national health advice line is NOT named: the patient's page has one place for one number
    // (docs/COUNTRY-AUDIT-AUSTRALIA.md, A11). null here = the patient's page names no number.
    portal: { baglantiGecerlilikGun: 30, acilNumara: '000' },
    // One language in one script: no account is asked a language question.
    dilGruplari: [{ temel: 'en', bicimler: [{ yazi: null, dil: 'en-AU' }] }],
    // Several time zones: an account chooses its own (settings). One zone for each state's and mainland territory's
    // capital; the Australian Capital Territory keeps Sydney's time. New South Wales, Victoria, South Australia,
    // Tasmania and the Australian Capital Territory observe daylight saving; Queensland, Western Australia and the
    // Northern Territory do not (nsw.gov.au/about-nsw/daylight-saving, read on 2026-10-09). The offsets come from
    // the platform's time-zone database, never from this file. NOT LISTED, an open item (docs/COUNTRY-AUDIT-AUSTRALIA.md,
    // A6): Lord Howe Island and the external territories (Norfolk Island, Christmas Island, Cocos (Keeling) Islands).
    // The default is the most populous zone: the owner's choice.
    saatDilimleri: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Perth', 'Australia/Hobart'],
    // The 12-hour clock, as the Australian Government Style Manual writes a time of day ("2:30 pm"). Medication charts
    // are written with the 24-hour clock; the kit has ONE setting for every screen. For a local clinical lead to confirm.
    saatBicimi: 12,
    birimler: AU_BIRIMLER,
    adAlanlari: { ikinciAd: false },
    kimlikNumarasi: { dogrula: false },
    veliYasi: AU_VELI_YASI,
    // SIGN-UP IS CLOSED: invitation code only. Only the owner opens it, after section A of the checklist passes.
    kayitAcik: false,
  },
}
