/**
 * NOTYA-ULKE-01 (Kaan, 2026-10-08) — the shape every country pack exposes, and the keys the core is allowed to ask for.
 *
 * One repository, walled areas, one deployment and one database per country. The core is shared; a build contains
 * the core plus ONE pack. Standard: docs/COUNTRY-PACK-CHECKLIST.md. This file is core: it holds no country's content,
 * only the shape. A pack lives in countries/<kod>/ and is reached only through countries/active/ (scripts/ulke-duvarlari.mjs).
 *
 * Fail closed: anything a pack does not list is OFF. Nothing ever falls back to another country's content.
 */

import type { ComponentType } from 'react'
import type { HastaFormuIcerigi } from './intake/tipler'

/** ISO 3166-1 alpha-2, lower case. Adding a country = a new folder under countries/ + a branch in countries/active/. */
export const ULKE_KODLARI = ['tr', 'uz', 'gb', 'us'] as const
export type UlkeKodu = (typeof ULKE_KODLARI)[number]

/** Accounts created before countries existed carry no stamp; they are Türkiye's (the only country there was). */
export const DAMGASIZ_HESAP_ULKESI: UlkeKodu = 'tr'

/** BCP-47. A script variant is its own language code (checklist E2). */
export type DilKodu = 'tr' | 'uz-Latn' | 'uz-Cyrl' | 'ru' | 'en-GB' | 'en-US' | 'en-CA' | 'en-AU' | 'en-NZ'

/**
 * Feature table keys. A pack lists the ones that are ON; `ozellikAcik` answers false for everything else.
 *
 * Read by code today: bolunmemisUygulama (root shell, error pages, root page), acilisSayfasi (root page),
 * cekirdekGiris (/login), davetliKayit (/signup, /api/ulke/kayit), bekletmeSayfasi (/welcome), doktorAraclari
 * (tool lists, deep-link guard, /doktor-tools layout). The last three are declared so that a country's answer is on
 * record from day one; the screens they will gate are reached today only inside the pre-split application.
 */
export type Ozellik =
  /** The whole pre-split application (every screen and API that exists on main today). Only a pack whose content IS that application may switch it on. */
  | 'bolunmemisUygulama'
  /** The country's own landing page at the domain root, brought by its pack (countries/active/sayfalar). */
  | 'acilisSayfasi'
  /** The core login page at /login, in the country's languages. */
  | 'cekirdekGiris'
  /** Sign-up with an invitation code only, at /signup. */
  | 'davetliKayit'
  /** The single page an account sees while its pilot access is prepared, at /welcome. */
  | 'bekletmeSayfasi'
  /**
   * NOTYA-UZ-MUAYENE-01 — the core loop of the signed-in application, built country-first: first-login language
   * question, settings, home, patients, visit recording to an approved note. Screens and clinical text come from the
   * pack (countries/active/sayfalar, countries/active/klinik). Replaces the holding page where it is on.
   */
  | 'cekirdekMuayene'
  /**
   * NOTYA-UZ-RANDEVU-01 — appointments of the signed-in application: working pattern, calendar, booking, status, the
   * link from an appointment to its visit. Needs `cekirdekMuayene`. Settings come from the pack (`uygulama.randevu`).
   */
  | 'randevu'
  /**
   * NOTYA-ULKE-PORTAL-01 — the patient portal: a link and a PIN the doctor gives a patient, the patient's own page
   * (their name, their doctor, upcoming appointments, what the doctor chose to share), a request for an appointment.
   * Needs `cekirdekMuayene`; its appointment parts need `randevu`. Settings come from the pack (`uygulama.portal`).
   */
  | 'hastaPortali'
  /**
   * NOTYA-ULKE-INTAKE-01 — the intake form: the doctor asks a patient to fill in a form before a visit; the patient
   * fills it in on their own page of the portal; the doctor reads the answers, marked as the patient's own words.
   * Needs `hastaPortali`. The questions are the pack's clinical content (countries/active/klinik → `hastaFormu`).
   */
  | 'hastaFormu'
  /**
   * NOTYA-ULKE-ARACLAR-01 — the tools area of a country build (/tools): a grid of tools, base tools for every role and
   * role tools gated by role, each on its own screen. Needs `cekirdekMuayene`. Which tools exist is the kit's catalogue
   * (lib/ulke/araclar/katalog.ts); which are on, for whom and in which words is the pack's (countries/active/arayuz → `araclar`).
   */
  | 'araclar'
  /** Doktor Araçları of the pre-split application (/doktor-tools). */
  | 'doktorAraclari'
  /** Ayşe: floating panel, voice session, chat. */
  | 'asistan'
  /** Doctor voice profile (biometric; gated by law per country — checklist I7). */
  | 'sesProfili'
  /** Image / document evaluation by the model (may be regulated as a medical device — checklist A4). */
  | 'goruntuDegerlendirme'

export type ParaBirimi = {
  /** ISO 4217. */
  kod: string
  simge: string
  /** Decimal places shown to people. */
  ondalikHane: number
}

export type BicimKurallari = {
  /** Intl locale used for dates and numbers. */
  yerel: string
  /** Human pattern, for forms and documentation — rendering goes through Intl with `yerel`. */
  tarihDeseni: string
  ondalikAyraci: ',' | '.'
  binlikAyraci: '.' | ',' | ' '
  /** 1 = Monday … 7 = Sunday. */
  haftaBasi: 1 | 7
}

export type TelefonKurallari = {
  /** With the plus sign, e.g. "+90". */
  ulkeOnEki: string
  /** Digits of a mobile number without the country prefix and without a trunk zero. */
  ulusalHane: number
  ornek: string
  /** true = an acceptable mobile number for this country, in any common spelling. */
  cepGecerliMi: (ham: string | null | undefined) => boolean
}

/**
 * NOTYA-ULKE-SABLON-01 — the national identity number of a country. `null` on the pack = the country records none:
 * no field is shown and nothing is stored.
 */
export type UlusalKimlikKurallari = {
  /** What people in the country call the number. */
  ad: string
  hane: number
  gecerliMi: (ham: string | null | undefined) => boolean
}

/**
 * Which paths a deployment serves. 'hepsi' is the pre-split application: every route of main. A list is an allow-list:
 * anything not on it does not exist in that country (the middleware answers 404 before any screen renders).
 * Page entries are exact paths; API entries are prefixes ending in '/'.
 */
export type RotaIzni = 'hepsi' | { sayfalar: readonly string[]; apiOnEkleri: readonly string[] }

/**
 * A term that marks content as belonging to one country. Declared by that country (countries/<kod>/sizintiTerimleri.ts),
 * hunted in every other one by the leak harness. Not part of the runtime pack: only tests and scripts read the lists.
 */
export type SizintiTerimi = {
  terim: string
  /** 'kelime' = whole word (letters on either side make it a different word); 'parca' = anywhere. */
  eslesme: 'kelime' | 'parca'
  /** true = compare exactly as written (needed for short all-caps abbreviations). */
  buyukKucukDuyarli?: boolean
}

/** Root shell: what <html> and the document head say before any screen. */
export type KabukBilgisi = {
  /** Site title and description in the pack's default language. */
  baslik: string
  aciklama: string
  /** Background behind every page until it paints. */
  zemin: string
}

export type UlkePaketi = {
  kod: UlkeKodu
  /** Unique marker string; scripts/ulke-derleme-kaniti.mjs looks for it in build output to prove a build holds one pack. */
  iz: string
  /** Every language of the country, declared up front. */
  diller: readonly DilKodu[]
  /** The languages that are switched on now: each needs a complete catalogue for every switched-on surface. */
  acikDiller: readonly DilKodu[]
  varsayilanDil: DilKodu
  paraBirimi: ParaBirimi
  /** IANA time zone. Same value as countries/<kod>/derleme.mjs (one source, read there by next.config). */
  saatDilimi: string
  bicim: BicimKurallari
  telefon: TelefonKurallari
  /** null = this country records no national identity number (NOTYA-ULKE-SABLON-01). */
  ulusalKimlik: UlusalKimlikKurallari | null
  ozellikler: Partial<Record<Ozellik, true>>
  /** /doktor-tools routes valid in this country. A tool must ALSO name the country in its own `ulkeler` field. */
  araclar: readonly string[]
  rotalar: RotaIzni
  /**
   * NOTYA-UZ-MUAYENE-01 — the path of the main site this country is served under ('/uzbek'). Omitted = the domain
   * root. One segment, no trailing slash. Same value as countries/<kod>/derleme.mjs (read there by next.config as
   * `basePath`); addresses are built with lib/ulke/yol.ts. `rotalar` stays relative to it.
   */
  yolOnEki?: string
  /** true = noindex on every response, robots.txt disallows everything, no sitemap. */
  aramaMotorlarinaGizli: boolean
  kabuk: KabukBilgisi
  /** Text of the core surfaces, per switched-on language. Built with `paketMetinleri` so a missing key is a type error. */
  metinler: Partial<Record<DilKodu, PaketMetinKatalogu>>
  /** Core surfaces switched on in this country. */
  yuzeyler: readonly Yuzey[]
  /** What each of the country's languages calls itself (for a language switch). */
  dilAdlari: Partial<Record<DilKodu, string>>
  /** Settings of the signed-in application. Present exactly where the feature `cekirdekMuayene` is on. */
  uygulama?: UygulamaAyarlari
}

/** What a pack says about the signed-in application (feature `cekirdekMuayene`). */
export type UygulamaAyarlari = {
  /**
   * Languages (and scripts) an account may choose for its interface and for its visit notes. Separate from
   * `acikDiller`, which are the languages of the public core surfaces (login, sign-up, system pages): a script
   * variant can be offered inside the application before the public pages exist in it.
   */
  diller: readonly DilKodu[]
  /** ISO 639 codes of the languages a PATIENT can be recorded with (checklist E7). */
  hastaDilleri: readonly string[]
  /**
   * Folding for finding a name whatever script it was typed in (checklist E10): lower case, apostrophe variants
   * dropped, the country's other script mapped onto one. Pure. Omitted = plain lower case.
   */
  aramaKatla?: (ham: string) => string
  /**
   * NOTYA-UZ-BRANSLAR-01 — ROLES an account may work as in this country (doctor specialties, clinic roles): internal
   * keys, never shown; their names are the pack's text. Asked once at first login, stored per account
   * (lib/ulke/uygulama/rol.ts). Omitted = the country asks for no role, exactly as before roles existed.
   */
  roller?: readonly string[]
  /**
   * NOTYA-UZ-RANDEVU-01 — appointment norms of the country (checklist J4). Present exactly where the feature
   * `randevu` is on. The time zone and the first day of the week are the pack's own (`saatDilimi`, `bicim.haftaBasi`).
   * PUBLIC HOLIDAYS ARE NOT HERE: they are local content a local source must supply; nothing is hard-coded.
   */
  randevu?: RandevuAyarlari
  /** NOTYA-ULKE-PORTAL-01 — the patient portal's settings. Present exactly where the feature `hastaPortali` is on. */
  portal?: PortalAyarlari

  // ── NOTYA-ULKE-SABLON-01 — every assumption the shared screens used to carry for one country, as a setting. ──
  // All REQUIRED: a pack that brings the application says each of them out loud. lib/ulke/paketDenetimi.ts checks
  // them against each other and against the catalogue, and a country's build fails on anything missing.

  /** The languages of `diller`, grouped: which language, in which scripts. Drives the first-login question and settings. */
  dilGruplari: readonly DilGrubu[]
  /**
   * IANA time zones an account of this country may work in. The pack's `saatDilimi` is the default and must be on
   * the list. One entry = the country has one zone and no account is asked. An account's own choice is stored with
   * the account (`ulke_hesaplari.saat_dilimi`) and is always one of this list.
   */
  saatDilimleri: readonly string[]
  /** How a time of day is WRITTEN on the screens and in the reminder: 24 = 14:30, 12 = 2:30 PM. Stored times are instants. */
  saatBicimi: 24 | 12
  /** Units of measure. Read by the pack's own instructions to the model and by any shared screen that shows a measurement. */
  birimler: Birimler
  /** Name fields of a patient beside the name itself. `ikinciAd`: a patronymic / middle name as its own field. */
  adAlanlari: { ikinciAd: boolean }
  /**
   * The national identity number on the patient form: shown exactly where the pack has `ulusalKimlik`.
   * `dogrula` true = a value that fails the pack's rule (`ulusalKimlik.gecerliMi`) is refused; false = stored as typed.
   */
  kimlikNumarasi: { dogrula: boolean }
  /**
   * A patient younger than this many years on the day of the visit gets guardian wording ("who gave the history").
   * null = the country has no such rule. A legal fact of the country (checklist B12), not a default of the kit.
   */
  veliYasi: number | null
  /**
   * false = sign-up is by invitation code only (the default every new country starts with). true = anyone may sign
   * up without a code. Opening it is a decision of the owner after section A of the checklist passes.
   */
  kayitAcik: boolean
}

/**
 * NOTYA-ULKE-SABLON-01 — one LANGUAGE of the signed-in application and the forms it can be written in. A form is a
 * language code of `uygulama.diller`; a language with one script has one form (`yazi: null`). The kit supports at most
 * one language with more than one script per country (lib/ulke/arayuz/dilSecimi.ts; the pack check says so).
 *
 *   Uzbekistan   [{ temel: 'uz', bicimler: [{ yazi: 'Latn', dil: 'uz-Latn' }, { yazi: 'Cyrl', dil: 'uz-Cyrl' }] },
 *                 { temel: 'ru', bicimler: [{ yazi: null, dil: 'ru' }] }]
 *   one language [{ temel: 'en', bicimler: [{ yazi: null, dil: 'en' }] }]      → no language question is asked at all
 */
export type DilGrubu = {
  /** ISO 639 code of the language. Also the key of its name in the catalogue (`diller`) and a patient language. */
  temel: string
  bicimler: readonly { /** ISO 15924 script code, or null where the language has one script. */ yazi: string | null; dil: DilKodu }[]
}

/** Units of measure a country reads and writes (checklist E3, F4). */
export type Birimler = { agirlik: 'kg' | 'lb'; boy: 'cm' | 'in'; sicaklik: 'C' | 'F' }

/** What a pack says about the patient portal (feature `hastaPortali`). */
export type PortalAyarlari = {
  /** How many days a portal link stays valid from the moment the doctor creates it. Afterwards the doctor gives a new one. */
  baglantiGecerlilikGun: number
  /**
   * The number a patient dials for an ambulance, as it is written in the country — LOCAL CONTENT, confirmed by a local
   * source before any patient sees the portal. There is no default: null (or absent) = the patient's page says that it
   * is not for emergencies and names NO number. The catalogue holds the sentence, never the number.
   */
  acilNumara?: string | null
}

export type RandevuAyarlari = {
  /** The working pattern an account has until it saves its own. Weekdays are ISO: 1 = Monday … 7 = Sunday. Times are 'HH:MM'. */
  varsayilan: {
    gunler: readonly number[]
    baslangic: string
    bitis: string
    sureDk: number
    molalar: readonly { baslangic: string; bitis: string }[]
  }
  /** Appointment lengths (minutes) an account may choose from. */
  sureSecenekleri: readonly number[]
}

// ───────────────────────── pages a pack brings itself (countries/active/sayfalar) ─────────────────────────

export type AcilisSayfasiProps = {
  /** A switched-on language of the country, already narrowed by dilSec. */
  dil: DilKodu
  /**
   * The language the address asked for (?dil=…), exactly as written, before any narrowing. For a pack whose landing
   * page is written in more forms than its switched-on public languages (Uzbekistan: Cyrillic script): the pack
   * checks the value against its own list and ignores anything else. Never a reason to show another country's text.
   */
  istenenDil?: string | null
  /** Where "request a price" messages go. null = not configured: the pack must hide the request form. */
  iletisimEposta: string | null
}

/**
 * Screens of the signed-in application (feature `cekirdekMuayene`). Each is one address, served by a one-line
 * *.ulke.* route file (components/ulke/UlkeUygulamaSayfasi.tsx); the screen itself, with its text, is the pack's.
 */
export const UYGULAMA_EKRANLARI = {
  baslangic: '/start',
  bugun: '/today',
  ayarlar: '/settings',
  hastalar: '/patients',
  yeniHasta: '/patients/new',
  hasta: '/patient',
  /** One address, three views: ?hasta=<id> records a visit, ?seans=<id> shows a recorded visit, ?not=<id> is its note. */
  muayene: '/visit',
  /**
   * NOTYA-UZ-RANDEVU-01 — one address, several views: ?gun=<YYYY-MM-DD>&gorunum=gun|hafta is the calendar,
   * ?yeni=1 the booking form, ?randevu=<id> one appointment, ?duzen=1 the working pattern.
   */
  takvim: '/calendar',
  /** NOTYA-ULKE-ARACLAR-01 — one address, two views: the grid, and ?arac=<key> one tool. */
  araclar: '/tools',
} as const
export type UygulamaEkrani = keyof typeof UYGULAMA_EKRANLARI

/** UI a pack brings itself. null = the country has no page of its own there. */
export type UlkeSayfalari = {
  acilis: ComponentType<AcilisSayfasiProps> | null
  /** Signed-in application screens. null = none; a screen the pack does not bring answers "not found". */
  uygulama: Partial<Record<UygulamaEkrani, ComponentType>> | null
}

// ───────────────────────── the clinical half of a pack (countries/active/klinik) ─────────────────────────

/**
 * Storage bucket a visit recording is uploaded to — one bucket for every country, and inside it a folder per country
 * and, below that, per account: `<country>/<account id>/<file>` (migration 132; lib/ulke/uygulama/tablolar.ts).
 */
export const MUAYENE_SES_KOVASI = 'muayene-sesleri'

/**
 * Speech recognition for a visit (checklist E5). The ENGINE is core (lib/ulke/uygulama/konusmaTanima.ts); every
 * choice in it is the pack's: which model, which languages, and when a recording counts as "low confidence".
 */
export type KonusmaTanimaAyarlari = {
  /** The only engine there is today. A pack names it, so that a second one is a decision and not a default. */
  saglayici: 'elevenlabs-scribe'
  /** Model id sent to the provider. */
  model: string
  /** Note language → the provider's code for that language, used ONLY to force the language of a second pass. */
  zorlamaDilKodlari: Partial<Record<DilKodu, string>>
  /** Provider language codes this country expects to hear → the short name the screens know ('uz', 'ru'). */
  beklenenDiller: Readonly<Record<string, string>>
  /** Below this probability of the predicted language (0–1) the first pass is "low confidence". */
  dilOlasiligiEsigi: number
  /** Below this average word log-probability (≤ 0) a pass is "low confidence". */
  ortalamaLogOlasilikEsigi: number
  /** A transcript shorter than this many characters is "not enough speech". */
  asgariKarakter: number
}

/**
 * The four sections of a visit note. The keys are the contract with the model; their headings are the pack's text.
 *
 * NOTYA-UZ-BRANSLAR-01 — `alanlar`: fields a note has BESIDE the four sections because of the template it was written
 * with (a role's own fields). Key → text. Which keys a template owns is the pack's business (`notAlanlari`); core
 * drops every other key before it stores or shows a note. Absent = the note has none, exactly as before fields existed.
 */
export type NotIcerigi = { s: string; o: string; a: string; p: string; alanlar?: Record<string, string> }

/** The key under which the model returns a note's `alanlar`, beside s, o, a, p. One word, shared by packs and core. */
export const NOT_ALANLARI_ANAHTARI = 'fields'

/** What the note is written from, besides the transcript: no name, no identity number, no phone. */
export type NotGirdisi = {
  dogumTarihi: string; cinsiyet: string; muayeneTarihi: string; metin: string
  /** NOTYA-UZ-BRANSLAR-01: the template the note is written with — for wording that depends on template and age together. */
  sablon?: string
}

/** What a pack brings for the visit: recording → transcript → note. Server-side only. null = the country has none. */
export type UlkeKlinigi = {
  konusma: KonusmaTanimaAyarlari
  /** Recording consent shown as a tick-box before recording. The wording is in the pack's catalogue. */
  riza: { surum: string; hukukcuInceledi: boolean }
  /** Note templates that are switched on, first = default. */
  sablonlar: readonly string[]
  /** Visits (recordings turned into notes) one account may make per day of the country. */
  gunlukMuayeneLimiti: number
  /**
   * INSTRUCTIONS TO THE MODEL — the pack's own, in the language the note is written in. Core holds no instruction
   * text at all. null = the pack has none for that language or template: the note is not written.
   */
  notTalimati: (dil: DilKodu, sablon: string) => string | null
  /** The message that carries the transcript, in the note's language. */
  notGirdisi: (dil: DilKodu, g: NotGirdisi) => string
  /**
   * NOTYA-UZ-BRANSLAR-01 — the field keys a note written with `sablon` may carry for this patient, in the order they
   * are shown. THE filter between the model's answer (or a request) and the record: a key that is not on this list
   * is dropped. Omitted, or an empty list = notes have the four sections only, exactly as before fields existed.
   */
  notAlanlari?: (sablon: string, hasta: { dogumTarihi: string; muayeneTarihi: string }) => readonly string[]
  /** Instructions for rewriting an existing note in `hedefDil`, written in that language. null = not offered. */
  yenidenYazimTalimati: (hedefDil: DilKodu) => string | null
  yenidenYazimGirdisi: (hedefDil: DilKodu, icerik: NotIcerigi) => string
  /**
   * "The other language" for a note written in `dil` — what one click rewrites it in. `hesapDilleri` are the
   * account's own languages (interface, notes), so that a script it already uses is chosen. null = there is none.
   */
  digerDil: (dil: DilKodu, hesapDilleri: readonly DilKodu[]) => DilKodu | null
  /**
   * NOTYA-ULKE-PORTAL-01 — INSTRUCTIONS TO THE MODEL for a plain-language summary of an APPROVED note, for the
   * patient, written in `dil` (the patient's own language form). The pack's own text; core holds none.
   * null = the pack has none for that form: no summary is written there. Required where `hastaPortali` is on.
   */
  hastaOzetiTalimati?: (dil: DilKodu) => string | null
  /** The message that carries the approved note to the model, in the summary's language. The note and nothing else. */
  hastaOzetiGirdisi?: (dil: DilKodu, icerik: NotIcerigi) => string
  /**
   * NOTYA-ULKE-INTAKE-01 — THE QUESTIONS of the intake form: a core set and one set per role, the consent sentence,
   * and who wrote and who reviewed each set (lib/ulke/intake/tipler.ts). The pack's own clinical content; core holds
   * no question. Required where `hastaFormu` is on. Answers are NOT given to the model that writes a note.
   */
  hastaFormu?: HastaFormuIcerigi
}

// ───────────────────────── text surfaces (translation mechanism — lib/ulke/metin.ts) ─────────────────────────

/**
 * Keys of every core surface. Turkish is the source: countries/tr/metinler.ts holds the reference text for every key
 * here, and every other language is written against the same keys. A pack-own surface (a landing page) is typed
 * inside its pack instead.
 */
export type YuzeyAnahtarlari = {
  /** Account messages returned by the server. */
  hesap: 'girisReddi'
  /** Login form (components/ulke/GirisFormu.tsx). */
  giris:
    | 'altBaslik' | 'eposta' | 'epostaOrnek' | 'sifre' | 'sifreOrnek' | 'gonder' | 'gonderiliyor'
    | 'bosAlan' | 'hata' | 'baglantiHatasi' | 'cokDeneme' | 'hazirDegil' | 'davetSorusu' | 'kayitBaglantisi' | 'anaSayfa'
  /** Sign-up with an invitation code (components/ulke/DavetliKayitFormu.tsx). */
  davetliKayit:
    | 'baslik' | 'aciklama' | 'adSoyad' | 'eposta' | 'sifre' | 'sifreTekrar' | 'davetKodu' | 'dil' | 'gonder' | 'gonderiliyor'
    | 'eksikAlan' | 'epostaGecersiz' | 'sifreKisa' | 'sifreUyusmuyor' | 'kodGecersiz' | 'olusturulamadi' | 'baglantiHatasi'
    | 'basarili' | 'girisSorusu' | 'girisBaglantisi' | 'kodYokSorusu' | 'fiyatBaglantisi'
  /** The one page an account sees while its pilot access is prepared (components/ulke/BekletmeEkrani.tsx). */
  bekletme: 'baslik' | 'govde' | 'cikis' | 'yukleniyor'
  /** Not-found and error pages of the root shell. */
  sistem: 'bulunamadiBaslik' | 'bulunamadiGovde' | 'anaSayfa' | 'hataBaslik' | 'hataGovde' | 'tekrarDene'
}
export type Yuzey = keyof YuzeyAnahtarlari
export type YuzeyMetinleri<Y extends Yuzey> = Readonly<Record<YuzeyAnahtarlari[Y], string>>
export type PaketMetinKatalogu = { readonly [Y in Yuzey]?: YuzeyMetinleri<Y> }

/**
 * Type gate of the translation mechanism: every switched-on language D must carry every key of every switched-on
 * surface Y. A missing key or a missing language does not compile, and `next build` type-checks
 * (typescript.ignoreBuildErrors is false) — so it fails the build instead of showing another language.
 */
export function paketMetinleri<const D extends DilKodu, const Y extends Yuzey>(girdi: {
  acikDiller: readonly D[]
  yuzeyler: readonly Y[]
  metinler: { readonly [K in D]: { readonly [S in Y]: YuzeyMetinleri<S> } }
}): { acikDiller: readonly D[]; yuzeyler: readonly Y[]; metinler: Partial<Record<DilKodu, PaketMetinKatalogu>> } {
  return girdi as unknown as { acikDiller: readonly D[]; yuzeyler: readonly Y[]; metinler: Partial<Record<DilKodu, PaketMetinKatalogu>> }
}
