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
import { enKlinikHesaplari } from '../_dil/en/klinikHesaplari'
import { enRolAnahtarlari } from '../_dil/en/klinik/roller'
import { enMesajAyarlari } from '../_dil/en/mesaj'
import { medicareKartGecerli } from './kimlik'
import { AU_ROL_LISTESI } from './klinik/rolListesi'
import { AU_RESMI_GUNLER } from './resmiGunler'
import { AU_BESLENME_ETIKET } from './portalBeslenmeEtiket'
import { AU_PORTAL_BOLUMLERI } from './portalBolumleri'
import { AU_KOCLUK_MODULLERI } from './portalBransModulleri'
import { AU_MUAYENE_MOTORLARI } from './klinik/muayeneMotorlari'
import { AU_UZANTI } from './uzanti'
import { AU_BIRIMLER, AU_VELI_YASI } from './temel'

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
  // THE PATIENT IDENTIFIER: optional. Empty is still accepted. A non-empty value must pass the Medicare
  // card checksum (./kimlik.ts). `hane: 0` = both the 10-digit card and the 11-digit card-plus-reference are valid.
  ulusalKimlik: { ad: 'Medicare card number', hane: 0, gecerliMi: medicareKartGecerli },
  // Fail closed. Messages stay on the patient's page (no outbound channel). Clinic accounts are on, with starting
  // values a lawyer has not read. Every offered role names the two Australian English voices (./ses.ts, Charlie and
  // Clara). Today and Settings can play each voice saying that role's line. Still off: a conversation, the voice
  // profile, image evaluation, and a doctor's own templates.
  // CONSULTATION BETWEEN DOCTORS (`konsultasyon`) is ON from NOTYA-ARACLAR-DENETIM-02-AU, 2026-10-13. The audit of
  // 2026-10-10 found it was left off only because its consent sentence was never drafted (docs/araclar-denetim/AU.md,
  // "Still unverified, and why": "a lawyer, not a web page" — true of the sentence, but nobody had been asked to
  // draft one for a lawyer to start from). The owner's instruction: draft a sensible sentence, switch it on, flag it
  // for an actual lawyer's review before the business relies on it. The sentence is ./araclar/konsultasyonMetinleri.ts
  // (`iste.riza`); the lawyer flag is ./klinik/index.ts (`konsultasyonRizasi.hukukcuInceledi: false`).
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
    hastaMesajlari: true,
    klinikHesaplari: true,
    konsultasyon: true,
    // MUAYENE-EKLERI-07 (2026-10-17): "uploaded files" — a lab report, a scanned referral or a photographed document
    // attached to one visit. Storage and listing only; no evaluation of any kind (lib/ulke/muayeneEki/muayeneEki.ts).
    muayeneEkleri: true,
    // FOTO-ARSIV-01 (2026-10-17): the patient photo archive — upload, a viewer, a basic two-up compare. Storage and
    // viewing only: NO model reads a photo kept here (lib/ulke/fotoArsivi/fotoArsivi.ts). FOTO-ARSIV-02 (AI photo
    // evaluation) stays a separate, not-yet-authorized item and is untouched.
    fotoArsivi: true,
  },
  araclar: [],
  // AU-BETA-01 (2026-10-22): practice details, consent record, access/correction requests, invoices (bring-your-own merchant
  // account; demo adapter), official-site lookups and the My Health Record stub. All words: ./uzanti/. Initial draft – external review later.
  uzanti: AU_UZANTI,
  // The ONLY paths that exist in this country's deployment; every other path answers 404 in the middleware.
  rotalar: {
    // NOTYA-SIFRE-SIFIRLA-ULKE-01 (Kaan, 2026-10-20): '/password-reset' was missing here — the page file
    // (app/password-reset/page.ulke.tsx) existed and built fine, but this allow-list is the second 404 gate
    // (lib/ulke/rotaKapisi.ts) and it answered "Page not found" for any path it does not list, login included
    // once, before this fix. Keep it next to '/login' so the two stay paired.
    // /dietitian-beta — temporary Clinical Dietitian invite landing (remove when the invite closes).
    sayfalar: ['/', '/for-clinics', '/login', '/password-reset', '/signup', '/welcome', '/start', '/today', '/settings', '/settings/communication', '/settings/integrations', '/account', '/reports', '/patients', '/patients/new', '/messages', '/patient', '/visit', '/calendar', '/portal', '/tools', '/medical', '/clinic', '/desk', '/privacy', '/terms', '/cookies', '/data-request', '/accessibility', '/medical-disclaimer', '/security', '/refund', '/copyright', '/demo', '/billing', '/privacy-requests', '/data-breach', '/asistan', '/diagnosis-codes', '/procedure-codes', '/dietitian-beta'],
    // STRIPE-NOTYA-AU-02: without this prefix, /api/billing/checkout and /api/billing/webhook 404 at this
    // gate before Next.js ever serves them — the Stripe-side plumbing (catalog, env vars, trial) built and
    // verified earlier today was never actually reachable from au.notya.io. This is the fix.
    apiOnEkleri: ['/api/ulke/', '/api/billing/'],
  },
  // The path of the main site this country is served under.
  yolOnEki: '/au',
  // AU-SEO-01: THE single indexing switch. au.notya.io is indexable (owner decision 2026-10-22); set NOTYA_AU_INDEXABLE=false
  // in the Vercel project and redeploy to hide it again. Signed-in pages are noindex whatever this says. See docs/au/SEO.md.
  aramaMotorlarinaGizli: process.env.NOTYA_AU_INDEXABLE === 'false',
  kabuk: {
    baslik: 'Notya',
    aciklama: 'A clinical assistant for doctors and clinics.',
    zemin: '#f4eee3',
  },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { 'en-AU': 'English' },
  resmiGunler: AU_RESMI_GUNLER,
  uygulama: {
    diller: ['en-AU'],
    hastaDilleri: ['en'],
    // AUSTRALIA'S OWN ROLE LIST: the shared forty with this country's differences (./klinik/rolListesi.ts): the two
    // surgical roles split along the Medical Board's line, clinic dermatology removed, hair transplantation
    // listed with non-surgical cosmetic procedures, wellness kept inside general practice, nine roles added.
    roller: enRolAnahtarlari(AU_ROL_LISTESI),
    // STARTING VALUES, to verify with a local clinical lead (checklist J4). An account changes all of it for itself.
    // The working pattern does not close a public day. National days and the state selector are `resmiGunler` on this pack.
    randevu: {
      varsayilan: { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '17:00', sureDk: 30, molalar: [{ baslangic: '12:00', bitis: '13:00' }] },
      sureSecenekleri: [10, 15, 20, 30, 45, 60, 90],
    },
    // A portal link works for 30 days: a STARTING VALUE the owner confirms; how long a patient's access may stand is
    // for a lawyer. THE EMERGENCY NUMBER: 000 ("Triple Zero (000)", police, fire or ambulance; triplezero.gov.au, read
    // for the localisation audit of 2026-10-09, branch audit/au). Written as it is dialled: the kit takes digits only.
    // Not yet confirmed by a person of the country. The national health advice line is NOT named: the patient's page
    // has one place for one number. null here = the patient's page names no number.
    portal: {
      baglantiGecerlilikGun: 30,
      acilNumara: '000',
      bolumler: AU_PORTAL_BOLUMLERI,
      // AU dietetics beta — meal plan, diary, goals and clinic weight on the patient portal (tool keys; shared UI never hard-codes them).
      beslenme: {
        planAraci: 'au-meal-plan',
        gunlukAraci: 'au-food-diary',
        hedefAraci: 'au-nutrition-goals',
        agirlikAraci: 'au-body-size',
        etiket: AU_BESLENME_ETIKET,
      },
      // AU gold depth — per-role care-plan coaching for every offered role except dietetics (which stays on beslenme).
      kocluk: {
        moduller: Object.fromEntries(
          Object.values(AU_KOCLUK_MODULLERI).map((mod) => [mod.rol, {
            planAraci: mod.planAraci,
            gunlukAraci: mod.gunlukAraci,
            hedefAraci: mod.hedefAraci,
            etiket: mod.etiket,
          }]),
        ),
      },
      tarihEtiket: 'Next review',
      durumEtiket: { gecikti: 'Overdue', bugun: 'Today', yaklasiyor: 'Coming up', planli: 'Planned' },
    },
    // AU gold depth — per-role visit engine prompts on Muayene setup (AU-adapted; not TR specialty engines).
    muayeneMotorlari: Object.fromEntries(
      Object.values(AU_MUAYENE_MOTORLARI).map((m) => [m.rol, { baslik: m.baslik, kontrol: m.kontrol, araclar: m.araclar }]),
    ),
    // CONSULTATION BETWEEN DOCTORS: how long one stays open to answer, and how long the consulted colleague may
    // still read it after it is closed. STARTING VALUES, unverified by a lawyer (checklist I9, same as the consent
    // sentence): no Australian source sets either period (docs/araclar-denetim/AU.md names this a question for a
    // lawyer, not a web page). Two weeks to answer is the pattern of a routine written referral reply; one week's
    // grace after closing lets the asking doctor re-open a thread briefly without the colleague losing read access
    // mid-conversation. The owner confirms both before the business relies on this feature.
    konsultasyon: { acikGun: 14, kapanisSonrasiGun: 7 },
    mesaj: enMesajAyarlari('Australia'),
    klinikHesaplari: enKlinikHesaplari(AU_ROL_LISTESI),
    // One language in one script: no account is asked a language question.
    dilGruplari: [{ temel: 'en', bicimler: [{ yazi: null, dil: 'en-AU' }] }],
    // Several time zones: an account chooses its own (settings). One zone for each state's and mainland territory's
    // capital; the Australian Capital Territory keeps Sydney's time. New South Wales, Victoria, South Australia,
    // Tasmania and the Australian Capital Territory observe daylight saving; Queensland, Western Australia and the
    // Northern Territory do not (nsw.gov.au/about-nsw/daylight-saving, read for the localisation audit of 2026-10-09).
    // The offsets come from the platform's time-zone database, never from this file. NOT LISTED, an open item of that
    // audit: Lord Howe Island and the external territories (Norfolk Island, Christmas Island, Cocos (Keeling) Islands).
    // The default is the most populous zone: the owner's choice.
    saatDilimleri: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Perth', 'Australia/Hobart'],
    // The 12-hour clock, as the Australian Government Style Manual writes a time of day ("2:30 pm"). Medication charts
    // are written with the 24-hour clock; the kit has ONE setting for every screen. For a local clinical lead to confirm.
    saatBicimi: 12,
    birimler: AU_BIRIMLER,
    adAlanlari: { ikinciAd: false },
    kimlikNumarasi: { dogrula: true },
    veliYasi: AU_VELI_YASI,
    // SIGN-UP IS CLOSED: invitation code only. Only the owner opens it, after section A of the checklist passes.
    kayitAcik: false,
  },
}
