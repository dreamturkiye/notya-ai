/**
 * NOTYA-ULKE-EN-01 — Canada: the country pack. Code `ca`, served at /ca. Record of decisions and of
 * everything unverified: docs/COUNTRY-PACK-CANADA.md.
 *
 * AN ENGLISH-SPEAKING PACK: its text is the English language set (countries/_dil/en/) in Canadian spelling (en-CA); this
 * folder holds only what is this country's. Everything is OFF unless listed here. Nothing in this folder comes
 * from another country's folder (scripts/ulke-duvarlari.mjs), and nothing falls back to another country's content.
 *
 * Keep this file light: data and pure functions only (the middleware and the browser bundle load it).
 * EVERY VALUE IS UNVERIFIED until somebody in Canada confirms it (see ./ayarlar.ts).
 */
import { paketMetinleri, type UlkePaketi } from '@/lib/ulke/tipler'
import { enCekirdek } from '../_dil/en/cekirdek'
import { EN_ROLLER } from '../_dil/en/klinik/roller'
import { CA_BIRIMLER, CA_VELI_YASI } from './ayarlar'

const cekirdek = enCekirdek('en-CA')
const metin = paketMetinleri({
  acikDiller: ['en-CA'],
  yuzeyler: ['hesap', 'giris', 'davetliKayit', 'bekletme', 'sistem'],
  metinler: { 'en-CA': cekirdek },
})

/** Phone number: +1 and ten digits (area code and exchange each beginning 2 to 9), in any common spelling. UNVERIFIED format rule; mobile and fixed numbers cannot be told apart here. */
function caTelefonGecerliMi(ham: string | null | undefined): boolean {
  const t = String(ham ?? '').trim()
  if (!t || !/^[0-9+()\-.\s]+$/.test(t)) return false
  let rakam = t.replace(/\D/g, '')
  if (rakam.length === 11 && rakam.startsWith('1')) rakam = rakam.slice(1)
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(rakam)
}

export const CA_PAKETI: UlkePaketi = {
  kod: 'ca',
  // Unique marker: the build proof looks for it to show that a build holds this pack and no other. Never reuse it.
  iz: 'notya-ulke-paketi:ca:3008e501aa',
  diller: ['en-CA'],
  acikDiller: metin.acikDiller,
  varsayilanDil: 'en-CA',
  paraBirimi: { kod: 'CAD', simge: '$', ondalikHane: 2 },
  // The default time zone of a new account. UNVERIFIED choice.
  saatDilimi: 'America/Toronto',
  bicim: { yerel: 'en-CA', tarihDeseni: 'YYYY-MM-DD', ondalikAyraci: '.', binlikAyraci: ',', haftaBasi: 7 },
  telefon: { ulkeOnEki: '+1', ulusalHane: 10, ornek: '+1 613 555 0123', cepGecerliMi: caTelefonGecerliMi },
  // THE PATIENT IDENTIFIER: an OPTIONAL FREE-TEXT field, stored encrypted and never validated (`dogrula: false`
  // below). `hane: 0` = no length is assumed. The label ("Provincial health card number") is unverified wording (./ayarlar.ts).
  ulusalKimlik: { ad: 'Provincial health card number', hane: 0, gecerliMi: (ham) => String(ham ?? '').trim().length > 0 },
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
  yolOnEki: '/ca',
  // HIDDEN FROM SEARCH. Only the owner changes this, after the pilot approves the site (checklist K2).
  aramaMotorlarinaGizli: true,
  kabuk: {
    baslik: 'Notya',
    aciklama: 'A clinical assistant for doctors and clinics.',
    zemin: '#f4eee3',
  },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { 'en-CA': 'English' },
  uygulama: {
    diller: ['en-CA'],
    hastaDilleri: ['en'],
    roller: EN_ROLLER,
    // STARTING VALUES, to verify with a local clinical lead (checklist J4). An account changes all of it for itself.
    // PUBLIC HOLIDAYS are deliberately absent: they are local content (federal and provincial holidays differ).
    randevu: {
      varsayilan: { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '17:00', sureDk: 30, molalar: [{ baslangic: '12:00', bitis: '13:00' }] },
      sureSecenekleri: [10, 15, 20, 30, 45, 60, 90],
    },
    // A portal link works for 30 days: a STARTING VALUE the owner confirms; how long a patient's access may stand is
    // for a lawyer. THE EMERGENCY NUMBER IS UNVERIFIED LOCAL CONTENT: written from general knowledge, to be confirmed
    // by a local source before any patient sees the portal. null here = the patient's page names no number.
    portal: { baglantiGecerlilikGun: 30, acilNumara: '911' },
    // One language in one script: no account is asked a language question.
    dilGruplari: [{ temel: 'en', bicimler: [{ yazi: null, dil: 'en-CA' }] }],
    // Several time zones: an account chooses its own (settings). The default and the list are UNVERIFIED choices.
    saatDilimleri: ['America/Toronto', 'America/St_Johns', 'America/Halifax', 'America/Winnipeg', 'America/Regina', 'America/Edmonton', 'America/Vancouver'],
    // UNVERIFIED choice between the 24-hour and the 12-hour clock for clinic screens.
    saatBicimi: 12,
    birimler: CA_BIRIMLER,
    adAlanlari: { ikinciAd: false },
    kimlikNumarasi: { dogrula: false },
    veliYasi: CA_VELI_YASI,
    // SIGN-UP IS CLOSED: invitation code only. Only the owner opens it, after section A of the checklist passes.
    kayitAcik: false,
  },
}
