/**
 * NOTYA-ULKE-EN-01 — New Zealand: the country pack. Code `nz`, served at /nz. Record of decisions and of
 * everything unverified: docs/COUNTRY-PACK-NEW-ZEALAND.md.
 *
 * AN ENGLISH-SPEAKING PACK: its text is the English language set (countries/_dil/en/) in New Zealand spelling (en-NZ); this
 * folder holds only what is this country's. Everything is OFF unless listed here. Nothing in this folder comes
 * from another country's folder (scripts/ulke-duvarlari.mjs), and nothing falls back to another country's content.
 *
 * Keep this file light: data and pure functions only (the middleware and the browser bundle load it).
 * EVERY VALUE IS UNVERIFIED until somebody in New Zealand confirms it (see ./ayarlar.ts).
 */
import { paketMetinleri, type UlkePaketi } from '@/lib/ulke/tipler'
import { enCekirdek } from '../_dil/en/cekirdek'
import { EN_ROLLER } from '../_dil/en/klinik/roller'
import { NZ_BIRIMLER, NZ_VELI_YASI } from './ayarlar'

const cekirdek = enCekirdek('en-NZ')
const metin = paketMetinleri({
  acikDiller: ['en-NZ'],
  yuzeyler: ['hesap', 'giris', 'davetliKayit', 'bekletme', 'sistem'],
  metinler: { 'en-NZ': cekirdek },
})

/** Mobile number: +64 and eight to ten digits beginning with 2, in any common spelling (02… at home). UNVERIFIED format rule. */
function nzCepGecerliMi(ham: string | null | undefined): boolean {
  const t = String(ham ?? '').trim()
  if (!t || !/^[0-9+()\-.\s]+$/.test(t)) return false
  let rakam = t.replace(/\D/g, '')
  if (rakam.startsWith('00')) rakam = rakam.slice(2)
  if (rakam.startsWith('64')) rakam = rakam.slice(2)
  if (rakam.startsWith('0')) rakam = rakam.slice(1)
  return /^2\d{7,9}$/.test(rakam)
}

export const NZ_PAKETI: UlkePaketi = {
  kod: 'nz',
  // Unique marker: the build proof looks for it to show that a build holds this pack and no other. Never reuse it.
  iz: 'notya-ulke-paketi:nz:083007d75b',
  diller: ['en-NZ'],
  acikDiller: metin.acikDiller,
  varsayilanDil: 'en-NZ',
  paraBirimi: { kod: 'NZD', simge: '$', ondalikHane: 2 },
  // The default time zone of a new account. UNVERIFIED choice.
  saatDilimi: 'Pacific/Auckland',
  bicim: { yerel: 'en-NZ', tarihDeseni: 'DD/MM/YYYY', ondalikAyraci: '.', binlikAyraci: ',', haftaBasi: 1 },
  telefon: { ulkeOnEki: '+64', ulusalHane: 9, ornek: '+64 2X XXX XXXX', cepGecerliMi: nzCepGecerliMi },
  // THE PATIENT IDENTIFIER: an OPTIONAL FREE-TEXT field, stored encrypted and never validated (`dogrula: false`
  // below). `hane: 0` = no length is assumed. The label ("NHI number") is unverified wording (./ayarlar.ts).
  ulusalKimlik: { ad: 'NHI number', hane: 0, gecerliMi: (ham) => String(ham ?? '').trim().length > 0 },
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
  yolOnEki: '/nz',
  // HIDDEN FROM SEARCH. Only the owner changes this, after the pilot approves the site (checklist K2).
  aramaMotorlarinaGizli: true,
  kabuk: {
    baslik: 'Notya',
    aciklama: 'A clinical assistant for doctors and clinics.',
    zemin: '#f4eee3',
  },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { 'en-NZ': 'English' },
  uygulama: {
    diller: ['en-NZ'],
    hastaDilleri: ['en'],
    roller: EN_ROLLER,
    // STARTING VALUES, to verify with a local clinical lead (checklist J4). An account changes all of it for itself.
    // PUBLIC HOLIDAYS are deliberately absent: they are local content (national and regional anniversary days).
    randevu: {
      varsayilan: { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '17:00', sureDk: 30, molalar: [{ baslangic: '12:00', bitis: '13:00' }] },
      sureSecenekleri: [10, 15, 20, 30, 45, 60, 90],
    },
    // A portal link works for 30 days: a STARTING VALUE the owner confirms; how long a patient's access may stand is
    // for a lawyer. THE EMERGENCY NUMBER IS UNVERIFIED LOCAL CONTENT: written from general knowledge, to be confirmed
    // by a local source before any patient sees the portal. null here = the patient's page names no number.
    portal: { baglantiGecerlilikGun: 30, acilNumara: '111' },
    // One language in one script: no account is asked a language question.
    dilGruplari: [{ temel: 'en', bicimler: [{ yazi: null, dil: 'en-NZ' }] }],
    // Two time zones (the main islands and the Chatham Islands): an account chooses its own (settings). UNVERIFIED choice.
    saatDilimleri: ['Pacific/Auckland', 'Pacific/Chatham'],
    // UNVERIFIED choice between the 24-hour and the 12-hour clock for clinic screens.
    saatBicimi: 12,
    birimler: NZ_BIRIMLER,
    adAlanlari: { ikinciAd: false },
    kimlikNumarasi: { dogrula: false },
    veliYasi: NZ_VELI_YASI,
    // SIGN-UP IS CLOSED: invitation code only. Only the owner opens it, after section A of the checklist passes.
    kayitAcik: false,
  },
}
