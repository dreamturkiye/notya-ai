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

/** ISO 3166-1 alpha-2, lower case. Adding a country = a new folder under countries/ + a branch in countries/active/. */
export const ULKE_KODLARI = ['tr', 'uz'] as const
export type UlkeKodu = (typeof ULKE_KODLARI)[number]

/** Accounts created before countries existed carry no stamp; they are Türkiye's (the only country there was). */
export const DAMGASIZ_HESAP_ULKESI: UlkeKodu = 'tr'

/** BCP-47. A script variant is its own language code (checklist E2). */
export type DilKodu = 'tr' | 'uz-Latn' | 'uz-Cyrl' | 'ru'

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
  /** Doktor Araçları (/doktor-tools). */
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
  ulusalKimlik: UlusalKimlikKurallari
  ozellikler: Partial<Record<Ozellik, true>>
  /** /doktor-tools routes valid in this country. A tool must ALSO name the country in its own `ulkeler` field. */
  araclar: readonly string[]
  rotalar: RotaIzni
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
}

// ───────────────────────── pages a pack brings itself (countries/active/sayfalar) ─────────────────────────

export type AcilisSayfasiProps = {
  /** A switched-on language of the country, already narrowed by dilSec. */
  dil: DilKodu
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
  muayene: '/visit',
} as const
export type UygulamaEkrani = keyof typeof UYGULAMA_EKRANLARI

/** UI a pack brings itself. null = the country has no page of its own there. */
export type UlkeSayfalari = {
  acilis: ComponentType<AcilisSayfasiProps> | null
  /** Signed-in application screens. null = none; a screen the pack does not bring answers "not found". */
  uygulama: Partial<Record<UygulamaEkrani, ComponentType>> | null
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
