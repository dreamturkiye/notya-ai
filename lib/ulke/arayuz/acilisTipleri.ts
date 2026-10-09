/**
 * NOTYA-ULKE-SABLON-01 — THE SHAPE OF A LANDING PAGE'S CONTENT. Types only: this file holds no country's text.
 *
 * The LAYOUT of the landing page is the country kit's (components/ulke/acilis/): the same sections, in the same
 * order, with the same look, for every country. What the sections SAY is a country's own content, written once per
 * language form against `AcilisIcerigi`; a missing entry in any form is a type error and fails that country's build.
 * Beside the copy a pack states the few facts the layout cannot know (`UlkeAcilisi`): which forms the page is written
 * in, what each form calls itself, the anchors of its sections, the fonts its scripts need, its word mark, and what
 * each plan of the price section costs.
 */
import type { DilKodu } from '../tipler'

export type KartSatiri = { k: string; v?: string; mark?: string }

/** One capability section set in the shared pattern: eyebrow, two-line heading, lede, bullets, typographic card. */
export type OzellikBolumu = {
  ustBaslik: string
  baslik: string
  baslikVurgu: string
  govde: string
  maddeler?: readonly string[]
  kart: { etiket: string; satirlar: readonly KartSatiri[]; not?: string }
}

export type SahneNavbati = { kim: string; rol: 'shifokor' | 'yordamchi' | 'ogohlantirish'; matn: string }
export type Sahne = { id: string; meta: string; yordamchi: string; alan: string; saat: string; navbatlar: readonly SahneNavbati[] }

/** One plan of the price section, as the copy names it. `id` ties it to the pack's price list (`UlkeAcilisi.fiyatlar`). */
export type NarxRejasi = { id: string; ad: string; maddeler: readonly string[] }
/** One group of plans (one position of the switch), with the line under its list. */
export type NarxGuruhi = { id: string; ad: string; rejalar: readonly NarxRejasi[]; izoh: string }

/**
 * THE PRICE LIST of the landing page: plan id → what it costs. DATA, never text: an amount is written once, here,
 * for every form of the page, and the layout writes it with the pack's own number rules (lib/ulke/arayuz/sayi.ts).
 */
export type AcilisFiyatlari = Readonly<Record<string, {
  /** Whole units of the pack's currency for one month. null = no amount is shown: the price is given on request. */
  aylik: number | null
  /** true = the plan carries the badge. */
  oneCikan: boolean
}>>

export type AcilisIcerigi = {
  meta: { baslik: string; aciklama: string }
  nav: {
    bolumler: string
    mobil: string
    dil: string
    havolalar: readonly { capa: string; etiket: string; no: string }[]
    giris: string
    girisUzun: string
    sorov: string
    menyuAc: string
    menyuYop: string
  }
  kahraman: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    giris: string
    birinciDugme: string
    ikinciDugme: string
    gorselAlt: string
    gorselAlti: string
    serit: readonly string[]
  }
  suhbat: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    govde: string
    maddeler: readonly string[]
    sekmeler: string
    yozmoqda: string
    tayyor: string
    izoh: string
    sahneler: readonly Sahne[]
  }
  qabul: OzellikBolumu
  portal: OzellikBolumu
  maslahat: OzellikBolumu
  jadval: OzellikBolumu
  yonalish: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    govde: string
    misollar: readonly { k: string; v: string }[]
    royxatEtiketi: string
    royxat: readonly string[]
  }
  kuzatuv: OzellikBolumu
  organish: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    govde: string
    gorselAlt: string
    gorselAlti: string
    sekmeler: string
    birinchi: { etiket: string; sorov: string; javob: string }
    oninchi: { etiket: string; sorov: string; javob: string }
    izoh: string
  }
  xavfsizlik: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    iqtibos: string
    izoh: string
    gorselAlt: string
    gorselAlti: string
    dalillar: readonly { k: string; v: string }[]
  }
  narx: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    /** What the switch between the groups of plans is called (read by a screen reader). */
    guruhlar: string
    /** The badge on the plan the pack's price list marks (`oneCikan`). */
    tavsiya: string
    /** A monthly amount. '%' is the number as the pack writes numbers; the currency word and the period are this text's. */
    oylik: string
    /** Stands where the amount would, for a plan the pack's price list gives no amount for. */
    sorovNarx: string
    /** Button of a plan with an amount. */
    dugme: string
    /** Button of a plan without an amount. */
    sorovDugme: string
    /** The groups of plans, in the order the switch shows them; the first is shown first. */
    gruplar: readonly NarxGuruhi[]
  }
  sorov: {
    ustBaslik: string
    baslik: string
    baslikVurgu: string
    govde: string
    form: {
      etiket: string
      adSoyad: string
      kurum: string
      telefon: string
      telefonOrnek: string
      uzmanlik: string
      mesaj: string
      gonder: string
      ipucu: string
      eksik: string
      konu: string
      /** Labels of the lines in the message that the visitor's mail app opens with. */
      satir: { adSoyad: string; kurum: string; telefon: string; uzmanlik: string; mesaj: string }
    }
    /** Shown instead of the form when no contact address is configured for the deployment. */
    formYok: string
    davetSorusu: string
    davetBaglantisi: string
  }
  altBilgi: { tanim: string; havolalar: string; giris: string; kayit: string; haklar: string; diller: string }
}

/** The sections of the page that can be linked to. Keys are the layout's; the anchor words are the pack's. */
export const ACILIS_CAPA_ANAHTARLARI = ['ust', 'suhbat', 'qabul', 'portal', 'maslahat', 'jadval', 'yonalish', 'kuzatuv', 'organish', 'xavfsizlik', 'narx', 'sorov'] as const
export type AcilisCapasi = (typeof ACILIS_CAPA_ANAHTARLARI)[number]

/** What a country brings for the landing page: its copy, and the facts the shared layout needs about it. */
export type UlkeAcilisi = {
  /** The forms the page is written in, in the order the footer lists them. May be wider than the pack's public `acikDiller`. */
  diller: readonly DilKodu[]
  /** The copy, once per form. */
  icerik: Readonly<Partial<Record<DilKodu, AcilisIcerigi>>>
  /** What each form calls itself, in itself. `kisa` is what the switch shows on a phone. */
  dilAdlari: Readonly<Partial<Record<DilKodu, { ad: string; kisa: string }>>>
  /** The anchor of each section: lower-case words of the country's own, kept the same in every form so that an address survives a language switch. */
  capalar: Readonly<Record<AcilisCapasi, string>>
  /** The stylesheet address of the fonts the page's scripts need (the layout's two faces, plus companions for scripts they lack). */
  fontHref: string
  /** The word mark as the page writes it. */
  markaYazisi: string
  /** What each plan of the price section costs: one entry per plan id the copy names, and no other. */
  fiyatlar: AcilisFiyatlari
}
