/**
 * NOTYA-ULKE-EN-01 — United States: the country pack. Code `us`, served at /us. Record of decisions and of
 * everything unverified: docs/COUNTRY-PACK-UNITED-STATES.md.
 *
 * AN ENGLISH-SPEAKING PACK: its text is the English language set (countries/_dil/en/) in American spelling (en-US); this
 * folder holds only what is this country's. Everything is OFF unless listed here. Nothing in this folder comes
 * from another country's folder (scripts/ulke-duvarlari.mjs), and nothing falls back to another country's content.
 *
 * Keep this file light: data and pure functions only (the middleware and the browser bundle load it).
 * EVERY VALUE IS UNVERIFIED until somebody in the United States confirms it (see ./ayarlar.ts).
 */
import { paketMetinleri, type UlkePaketi } from '@/lib/ulke/tipler'
import { enCekirdek } from '../_dil/en/cekirdek'
import { EN_ROLLER } from '../_dil/en/klinik/roller'
import { US_BIRIMLER, US_VELI_YASI } from './ayarlar'

const cekirdek = enCekirdek('en-US')
const metin = paketMetinleri({
  acikDiller: ['en-US'],
  yuzeyler: ['hesap', 'giris', 'davetliKayit', 'bekletme', 'sistem'],
  metinler: { 'en-US': cekirdek },
})

/**
 * Phone number: ten digits, with or without +1 or 1 in front (area code and exchange each beginning 2 to 9), in any
 * common spelling. The shape is the numbering plan's own, NXX-NXX-XXXX with N = 2 to 9 (nanpa.com/about, read
 * 2026-10-09); mobile and fixed numbers cannot be told apart here. No person of the country has checked the rule.
 */
function usTelefonGecerliMi(ham: string | null | undefined): boolean {
  const t = String(ham ?? '').trim()
  if (!t || !/^[0-9+()\-.\s]+$/.test(t)) return false
  let rakam = t.replace(/\D/g, '')
  if (rakam.length === 11 && rakam.startsWith('1')) rakam = rakam.slice(1)
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(rakam)
}

export const US_PAKETI: UlkePaketi = {
  kod: 'us',
  // Unique marker: the build proof looks for it to show that a build holds this pack and no other. Never reuse it.
  iz: 'notya-ulke-paketi:us:9a889eeb9c',
  diller: ['en-US'],
  acikDiller: metin.acikDiller,
  varsayilanDil: 'en-US',
  paraBirimi: { kod: 'USD', simge: '$', ondalikHane: 2 },
  // The default time zone of a new account. UNVERIFIED choice.
  saatDilimi: 'America/New_York',
  // HOW THIS COUNTRY WRITES A DAY AND A NUMBER. Sources read 2026-10-09 (docs/COUNTRY-AUDIT-UNITED-STATES.md):
  // month, day, four-digit year — Medicare's claim form asks every date of birth as "MM | DD | CCYY"
  // (hhs.gov/guidance/sites/default/files/hhs-guidance-documents/CMS/clm104c26.pdf); a point for decimals and a comma
  // in numbers of four or more digits — the federal style manual, rules 12.9d and 12.14
  // (govinfo.gov/content/pkg/GPO-STYLEMANUAL-2016/pdf/GPO-STYLEMANUAL-2016-14.pdf); the week begins on Sunday — the
  // Unicode locale data for this country, as the platform holds it (a test asks it).
  bicim: { yerel: 'en-US', tarihDeseni: 'MM/DD/YYYY', ondalikAyraci: '.', binlikAyraci: ',', haftaBasi: 7 },
  // The example is written the national way and is nobody's number (./ayarlar.ts, the same value).
  telefon: { ulkeOnEki: '+1', ulusalHane: 10, ornek: '202-555-0123', cepGecerliMi: usTelefonGecerliMi },
  // THE PATIENT IDENTIFIER: an OPTIONAL FREE-TEXT field, stored encrypted and never validated (`dogrula: false`
  // below). `hane: 0` = no length is assumed. The label ("Patient identifier") is unverified wording (./ayarlar.ts). NEVER A SOCIAL
  // SECURITY NUMBER: no screen of this pack asks for one, and a test fails if any text mentions it.
  ulusalKimlik: { ad: 'Patient identifier', hane: 0, gecerliMi: (ham) => String(ham ?? '').trim().length > 0 },
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
  yolOnEki: '/us',
  // HIDDEN FROM SEARCH. Only the owner changes this, after the pilot approves the site (checklist K2).
  aramaMotorlarinaGizli: true,
  kabuk: {
    baslik: 'Notya',
    aciklama: 'A clinical assistant for doctors and clinics.',
    zemin: '#f4eee3',
  },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { 'en-US': 'English' },
  uygulama: {
    diller: ['en-US'],
    hastaDilleri: ['en'],
    roller: EN_ROLLER,
    // STARTING VALUES, to verify with a local clinical lead (checklist J4). An account changes all of it for itself.
    // PUBLIC HOLIDAYS are deliberately absent: they are local content (federal and state holidays differ).
    randevu: {
      varsayilan: { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '17:00', sureDk: 30, molalar: [{ baslangic: '12:00', bitis: '13:00' }] },
      sureSecenekleri: [10, 15, 20, 30, 45, 60, 90],
    },
    // A portal link works for 30 days: a STARTING VALUE the owner confirms; how long a patient's access may stand is
    // for a lawyer. THE EMERGENCY NUMBER: read on 2026-10-09 at the National 911 Program's own site ("In an
    // emergency, dial 911": 911.gov/calling-911). No person of the country has confirmed it for this product, and one
    // must before any patient sees the portal. The kit has room for ONE number: the suicide and crisis line 988
    // (fcc.gov/988-suicide-and-crisis-lifeline) is not named anywhere. null here = the patient's page names no number.
    portal: { baglantiGecerlilikGun: 30, acilNumara: '911' },
    // One language in one script: no account is asked a language question.
    dilGruplari: [{ temel: 'en', bicimler: [{ yazi: null, dil: 'en-US' }] }],
    // Several time zones: an account chooses its own (settings). The law names nine zones (49 CFR part 71,
    // ecfr.gov/current/title-49/subtitle-A/part-71, read 2026-10-09). THE EIGHT BELOW COVER THE FIFTY STATES AND THE
    // DISTRICT: Eastern, Central, Mountain, Arizona (Mountain time with no daylight saving), Pacific, Alaska, the
    // western Aleutian Islands (Hawaii-Aleutian time WITH daylight saving: 49 CFR 71.12; added by the audit) and
    // Hawaii (no daylight saving). THE TERRITORIES ARE NOT LISTED (Atlantic, Samoa and Chamorro time): whether this
    // pack serves them is the owner's decision. The default is an unverified choice.
    saatDilimleri: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'America/Adak', 'Pacific/Honolulu'],
    // The 12-hour clock with a.m. and p.m. is the everyday form (the federal style manual, rule 12.9b: "4:30 p.m.").
    // FOR A LOCAL CLINICAL LEAD: hospitals often chart in 24-hour time, and the federal rule on hospital records asks
    // only that an entry be "dated, timed" by the hospital's own policy (42 CFR 482.24(c)(1)). One setting serves both.
    saatBicimi: 12,
    birimler: US_BIRIMLER,
    adAlanlari: { ikinciAd: false },
    kimlikNumarasi: { dogrula: false },
    veliYasi: US_VELI_YASI,
    // SIGN-UP IS CLOSED: invitation code only. Only the owner opens it, after section A of the checklist passes.
    kayitAcik: false,
  },
}
