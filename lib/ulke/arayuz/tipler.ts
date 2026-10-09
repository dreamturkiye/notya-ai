/**
 * NOTYA-ULKE-SABLON-01 — WHAT A COUNTRY BRINGS FOR THE SHARED SCREENS: content, never a screen.
 *
 * The country kit owns every screen of the signed-in application (components/ulke/uygulama/) and the layout of the
 * landing page (components/ulke/acilis/). A country's folder holds what those screens SAY and what they must know
 * about the country: the catalogues per language form, the names of its roles and assistants, its note templates,
 * its landing-page content. That is this type. It is reached through one door, countries/active/arayuz, and read
 * through lib/ulke/arayuz (never directly), so shared code can hold no country's text and no country's assumption.
 *
 * Client-safe: plain data and pure functions. Instructions to the model, speech thresholds and consent versions are
 * the SERVER half of a pack (UlkeKlinigi, countries/active/klinik) and are not here.
 */
import type { DilKodu } from '../tipler'
import type { UlkeAcilisi } from './acilisTipleri'
import type { FormMetni, PortalMetni, RandevuMetni, UygulamaMetni } from './metinTipleri'
import type { UlkeAraclari } from '../araclar/tipler'

/** The four sections of a visit note. The keys are the contract with the model; their headings are the pack's text. */
export type NotBolumu = 's' | 'o' | 'a' | 'p'
export const NOT_BOLUMLERI: readonly NotBolumu[] = ['s', 'o', 'a', 'p']

/** Text in every language form of the country's application: form (a code of `uygulama.diller`) → text. */
export type BicimliMetin = Readonly<Record<string, string>>

/** The three kinds of role an account can work as. The kinds are the product's; which roles exist is the pack's. */
export type RolTarafi = 'doktor' | 'klinik-hekim' | 'klinik-muttefik'
export const ROL_TARAFLARI: readonly RolTarafi[] = ['doktor', 'klinik-hekim', 'klinik-muttefik']

export type RolTanimi = {
  /** Internal key, never shown. Also the key of the role's note template. */
  anahtar: string
  taraf: RolTarafi
  /** The role's name in every form. */
  ad: BicimliMetin
}

/** The assistant a role works with, as a screen names it. */
export type AsistanKimligi = {
  /** Full name with its title, in the form asked for. */
  tamAd: string
  /** Given name, in the same form. */
  kisaAd: string
  /** true = this form was derived by rule from another spelling and has not been read by a native reader. */
  makineTuretimi: boolean
}

/** One field a note can have beside the four sections: which section it sits under, and its label in every form. */
export type NotAlani = { bolum: NotBolumu; ad: BicimliMetin }

/**
 * NOTE TEMPLATES of a country, as data. The rules that read them are the kit's (lib/ulke/arayuz/notSablonu.ts):
 * which fields a note of a template may carry for a patient, and what each is called. A field of one role is never
 * stored, returned or drawn for another.
 */
export type NotSablonVerisi = {
  /** The neutral template: the four sections and no role field. Used by an account without a role. */
  genelSablon: string
  /** Every role field of the country: key → definition. Keys are lower-case words joined by underscores. */
  alanlar: Readonly<Record<string, NotAlani>>
  /** Role key → the keys of its fields, in the order they are shown. A role that is not listed has no template of its own. */
  rolAlanlari: Readonly<Record<string, readonly string[]>>
  /**
   * The one field that depends on the patient's AGE: who gave the history. Offered below the pack's guardian age
   * (`uygulama.veliYasi`) in every template, never above it. null = the country has no such field.
   */
  veliAlani: { anahtar: string; tanim: NotAlani } | null
  /** Roles whose patients are children: only there does an UNKNOWN age count as "below the guardian age". */
  cocukRolleri: readonly string[]
  /** Section headings that belong to one kind of role only (an allied professional's "assessment"). Others use the catalogue's. */
  bolumBasliklari: readonly { taraf: RolTarafi; bolum: NotBolumu; ad: BicimliMetin }[]
}

/** Everything a country brings for the shared screens of the signed-in application. */
export type UlkeArayuzu = {
  /** The word mark the screens show, and the name the neutral assistant line uses. */
  marka: string
  /** The application's catalogue, once per language form of `uygulama.diller`. */
  metinler: Readonly<Partial<Record<DilKodu, UygulamaMetni>>>
  /** The appointment catalogue, once per language form. Required where the feature `randevu` is on. */
  randevuMetinleri: Readonly<Partial<Record<DilKodu, RandevuMetni>>>
  /** The patient portal's catalogue, once per language form. Required where the feature `hastaPortali` is on. */
  portalMetinleri?: Readonly<Partial<Record<DilKodu, PortalMetni>>>
  /** The intake form's catalogue (the screens' own words, not the questions), once per language form. Required where the feature `hastaFormu` is on. */
  formMetinleri?: Readonly<Partial<Record<DilKodu, FormMetni>>>
  /**
   * NOTYA-ULKE-ARACLAR-01 — the tools area: its own words per language form, the tools that are switched on with the
   * roles that see each and every word of their screens, unit names, and the slots of what is still missing.
   * Required where the feature `araclar` is on.
   */
  araclar?: UlkeAraclari
  /** The roles of `uygulama.roller`, each with its kind and its name in every form, in the order they are offered. */
  roller: readonly RolTanimi[]
  /** The assistant of a role in a form, or null where the role has none: the screens then show the neutral line. */
  asistan: (rol: string, dil: DilKodu) => AsistanKimligi | null
  notSablonlari: NotSablonVerisi
  /** The landing page's content. null = the country has no landing page of its own (feature `acilisSayfasi` off). */
  acilis: UlkeAcilisi | null
}
