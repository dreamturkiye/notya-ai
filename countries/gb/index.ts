/**
 * NOTYA-ULKE-EN-01 — United Kingdom: the country pack. Code `gb`, served at /uk. Record of decisions and of
 * everything unverified: docs/COUNTRY-PACK-UNITED-KINGDOM.md.
 *
 * AN ENGLISH-SPEAKING PACK: its text is the English language set (countries/_dil/en/) in British spelling; this
 * folder holds only what is the United Kingdom's. Everything is OFF unless listed here. Nothing in this folder comes
 * from another country's folder (scripts/ulke-duvarlari.mjs), and nothing falls back to another country's content.
 *
 * Keep this file light: data and pure functions only (the middleware and the browser bundle load it).
 * EVERY VALUE IS UNVERIFIED until somebody in the United Kingdom confirms it (see ./ayarlar.ts).
 */
import { paketMetinleri, type UlkePaketi } from '@/lib/ulke/tipler'
import { enCekirdek } from '../_dil/en/cekirdek'
import { enRolAnahtarlari } from '../_dil/en/klinik/roller'
import { GB_BIRIMLER, GB_KIMLIK_ETIKETI, GB_VELI_YASI } from './temel'
import { GB_ROLLER } from './roller'

const cekirdek = enCekirdek('en-GB')
const metin = paketMetinleri({
  acikDiller: ['en-GB'],
  yuzeyler: ['hesap', 'giris', 'davetliKayit', 'bekletme', 'sistem'],
  metinler: { 'en-GB': cekirdek },
})

/** Mobile number: +44 and ten digits beginning with 7, in any common spelling (07… at home). UNVERIFIED format rule. */
function gbCepGecerliMi(ham: string | null | undefined): boolean {
  const t = String(ham ?? '').trim()
  if (!t || !/^[0-9+()\-.\s]+$/.test(t)) return false
  let rakam = t.replace(/\D/g, '')
  if (rakam.startsWith('00')) rakam = rakam.slice(2)
  if (rakam.startsWith('44')) rakam = rakam.slice(2)
  if (rakam.startsWith('0')) rakam = rakam.slice(1)
  return /^7\d{9}$/.test(rakam)
}

export const GB_PAKETI: UlkePaketi = {
  kod: 'gb',
  // Unique marker: the build proof looks for it to show that a build holds this pack and no other. Never reuse it.
  iz: 'notya-ulke-paketi:gb:7159aab885',
  diller: ['en-GB'],
  acikDiller: metin.acikDiller,
  varsayilanDil: 'en-GB',
  paraBirimi: { kod: 'GBP', simge: '£', ondalikHane: 2 },
  saatDilimi: 'Europe/London',
  bicim: { yerel: 'en-GB', tarihDeseni: 'DD/MM/YYYY', ondalikAyraci: '.', binlikAyraci: ',', haftaBasi: 1 },
  telefon: { ulkeOnEki: '+44', ulusalHane: 10, ornek: '+44 7700 900123', cepGecerliMi: gbCepGecerliMi },
  // THE PATIENT IDENTIFIER: an OPTIONAL FREE-TEXT field, stored encrypted and never validated (`dogrula: false`
  // below). `hane: 0` = no length is assumed. The label names the identifiers of all four nations (./temel.ts):
  // unverified wording, and whether a private clinic may record one is for a lawyer.
  ulusalKimlik: { ad: GB_KIMLIK_ETIKETI, hane: 0, gecerliMi: (ham) => String(ham ?? '').trim().length > 0 },
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
  // The country's code is `gb`; the path it is served under is /uk.
  yolOnEki: '/uk',
  // HIDDEN FROM SEARCH. Only the owner changes this, after the pilot approves the site (checklist K2).
  aramaMotorlarinaGizli: true,
  kabuk: {
    baslik: 'Notya',
    aciklama: 'A clinical assistant for doctors and clinics.',
    zemin: '#f4eee3',
  },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { 'en-GB': 'English' },
  uygulama: {
    diller: ['en-GB'],
    hastaDilleri: ['en'],
    // THE COUNTRY'S OWN ROLE LIST: the shared forty with this country's differences (./roller.ts → GB_ROLLER).
    roller: enRolAnahtarlari(GB_ROLLER),
    // STARTING VALUES, to verify with a local clinical lead (checklist J4). An account changes all of it for itself.
    // PUBLIC HOLIDAYS are deliberately absent: they are local content (and differ between the four nations).
    randevu: {
      varsayilan: { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '17:00', sureDk: 30, molalar: [{ baslangic: '13:00', bitis: '14:00' }] },
      sureSecenekleri: [10, 15, 20, 30, 45, 60, 90],
    },
    // A portal link works for 30 days: a STARTING VALUE the owner confirms; how long a patient's access may stand is
    // for a lawyer. THE AMBULANCE NUMBER IS LOCAL CONTENT, UNVERIFIED BY A PERSON: to be confirmed by a local source
    // before any patient sees the portal. null here = the patient's page names no number.
    // LOCALISATION AUDIT 2026-10-09: "999 is for life-threatening emergencies" was read on the health service's own page
    // (https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/). The non-emergency line
    // (111 in England, Scotland and Wales; none of that kind in Northern Ireland) has no place in the kit: reported.
    portal: { baglantiGecerlilikGun: 30, acilNumara: '999' },
    // One language in one script: no account is asked a language question.
    dilGruplari: [{ temel: 'en', bicimler: [{ yazi: null, dil: 'en-GB' }] }],
    // One time zone in the country: no account is asked.
    saatDilimleri: ['Europe/London'],
    // UNVERIFIED choice between the 24-hour and the 12-hour clock for clinic screens.
    // LOCALISATION AUDIT 2026-10-09: a clinical record is timed with the 24-hour clock (Royal College of Physicians,
    // generic medical record keeping standards: https://www.rcp.ac.uk/resources/generic-medical-record-keeping-standards/);
    // text for PATIENTS is written with the 12-hour clock in the health service's content guide. The kit has one
    // setting for both readers, so the patient's page and the reminder text also show 24-hour times: reported.
    saatBicimi: 24,
    birimler: GB_BIRIMLER,
    adAlanlari: { ikinciAd: false },
    kimlikNumarasi: { dogrula: false },
    veliYasi: GB_VELI_YASI,
    // SIGN-UP IS CLOSED: invitation code only. Only the owner opens it, after section A of the checklist passes.
    kayitAcik: false,
  },
}
