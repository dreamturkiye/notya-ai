/**
 * NOTYA-ULKE-EN-01 — United Kingdom (`gb`, served at /uk): WHAT THIS COUNTRY STATES. Everything else the pack shows is
 * the English language set (countries/_dil/en/), taken in British spelling (en-GB). One source: both halves of the
 * pack (./arayuz.ts for the screens, ./klinik/index.ts on the server) and the pack's settings (./index.ts) read this.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN AND UNVERIFIED, EVERY LINE. Nobody in the United Kingdom — no clinician, no lawyer, no native
 * editor — has read any text of this pack or confirmed any setting below. Each is a starting value from general
 * knowledge. What each waits on is listed in docs/COUNTRY-PACK-UNITED-KINGDOM.md.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * In four files: this one (the country's sentences and settings), ./temel.ts (the few values the light file reads),
 * ./roller.ts (the role list) and ./araclar.ts with ./kendiAraclari.ts (the tools).
 */
import type { EnUlkeGirdisi } from '../_dil/en/girdi'
import { GB_ARACLAR } from './araclar'
import { GB_ROL_ADLARI, GB_ROLLER } from './roller'
import { GB_BIRIMLER, GB_KIMLIK_ETIKETI, GB_VELI_YASI } from './temel'

// The guardian age, the units and the identifier label are in ./temel.ts (the pack's light file reads them too).
export { GB_BIRIMLER, GB_KIMLIK_ETIKETI, GB_VELI_YASI } from './temel'

export const GB_GIRDI: EnUlkeGirdisi = {
  sozler: {
    bicim: 'en-GB',
    marka: 'Notya',
    // NOT READ BY A LAWYER — recording-consent wording (checklist A3, I1). Shown beside the box that unlocks recording.
    // The version stamped on every visit is `surum` below: change both together when a reviewed wording arrives.
    kayitRizasi: 'The patient, or the person who can consent for them, has agreed to this visit being recorded.',
    // UNVERIFIED WORDING. An optional free-text field, stored encrypted, never validated and never required.
    // The wording and its source: GB_KIMLIK_ETIKETI (./temel.ts). Same wording as `ulusalKimlik.ad` (./index.ts).
    kimlikEtiketi: GB_KIMLIK_ETIKETI,
    cokSaatDilimi: false,
    saatDilimiCumlesi: 'All times are UK time.',
    tarihOrnegi: 'DD/MM/YYYY',
  },
  ulkeAdi: 'the United Kingdom',
  // UNVERIFIED: the word a senior hospital doctor goes by here. (A consultant surgeon is addressed as Mr, Ms, Miss or
  // Mrs rather than Dr: that matters when an assistant is given a name and a title, which this pack does not do.)
  // LOCALISATION AUDIT 2026-10-09: a general practitioner is not a consultant, yet the set has one word for every
  // doctor role, so the general-practice instruction also opens "You are an experienced consultant" (reported: a
  // matter of the shared English set).
  kidemliHekim: 'consultant',
  // THE NAMES OF THE SPECIALTIES, in the regulator's wording, and WHERE THE ROLE LIST DIFFERS FROM THE SHARED FORTY
  // (twelve specialties and two professions added, one clinic role taken out): ./roller.ts, with its sources.
  rolAdlari: GB_ROL_ADLARI,
  roller: GB_ROLLER,
  veliYasi: GB_VELI_YASI,
  birimler: GB_BIRIMLER,
  surum: 'gb-draft-2026-10-09',
  konusma: {
    saglayici: 'elevenlabs-scribe',
    model: 'scribe_v2',
    // The one second pass (only on low confidence) repeats the same recording with the language set to English.
    zorlamaDilKodlari: { 'en-GB': 'eng' },
    beklenenDiller: { eng: 'en', en: 'en' },
    // STARTING VALUES, not measured on any clinic audio from the United Kingdom (checklist A5, L1).
    dilOlasiligiEsigi: 0.8,
    ortalamaLogOlasilikEsigi: -0.36,
    asgariKarakter: 40,
  },
  gunlukMuayeneLimiti: 200,
  // THE TOOLS: who sees which, the country's own numbers with their sources, what stays off, licence states and the
  // tools only this country has: ./araclar.ts and ./kendiAraclari.ts.
  araclar: GB_ARACLAR,
  acilis: {
    // THE EXAMPLE PHONE NUMBER — UNVERIFIED BY A PERSON. From the range the communications regulator sets aside for
    // television and radio drama (mobile numbers 07700 900000 to 900999): it is not issued to anybody. LOCALISATION
    // AUDIT 2026-10-09: the range was read on the regulator's own page
    // (https://www.ofcom.org.uk/phones-and-broadband/phone-numbers/numbers-for-drama); nobody of the country has checked it.
    telefonOrnegi: '+44 7700 900123',
    // NOT SHOWN: every plan is by quote. How an amount would be written here when the owner sets prices.
    aylikTutarKalibi: '£% a month',
    // PRICES: EMPTY, SWITCHED OFF. WAITING ON KAAN. No amount exists for the United Kingdom; every plan shows "by quote".
    fiyatlar: { doctor: { aylik: null, oneCikan: false }, clinic: { aylik: null, oneCikan: false } },
  },
}
