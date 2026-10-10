/**
 * NOTYA-ULKE-SABLON-01 — the questions a SHARED SCREEN may ask about the country it is shown in. Every word a screen
 * shows and every country fact it needs comes through here, from the active pack: its catalogues and content
 * (countries/active/arayuz) and its settings (lib/ulke/ulke.ts → the pack's `uygulama`). Client-safe.
 *
 * NO FALLBACK. A language form the pack offers but has not written a catalogue for THROWS: a screen never shows
 * another form instead, and never another country's text (which is not in the build). A country's build is refused
 * long before that by the pack check (lib/ulke/paketDenetimi.ts), which lists everything that is missing.
 */
import { AKTIF_ARAYUZ } from '@/countries/active/arayuz'
import type { DilGrubu, DilKodu } from '../tipler'
import { ulkePaketi, uygulamaDilleri, uygulamaDiliSec } from '../ulke'
import * as D from './dilSecimi'
import type { AraclarMetni, FormMetni, GirdiMetni, KlinikMetni, KonsultasyonMetni, MesajMetni, PortalMetni, RandevuMetni, SablonMetni, UygulamaMetni } from './metinTipleri'
import * as S from './notSablonu'
import type { AcilisCapasi, UlkeAcilisi } from './acilisTipleri'
import type { AsistanKimligi, NotAlani, NotBolumu, RolTanimi, RolTarafi, UlkeArayuzu } from './tipler'

export type { AraclarMetni, FormMetni, GirdiMetni, KlinikMetni, KonsultasyonMetni, MesajMetni, PortalMetni, RandevuMetni, SablonMetni, UygulamaMetni } from './metinTipleri'
export { NOT_BOLUMLERI, ROL_TARAFLARI, type AsistanKimligi, type NotBolumu, type RolTanimi, type RolTarafi } from './tipler'

/** What the active pack brings for the shared screens. A country that brings none has no shared screens. */
export function arayuz(): UlkeArayuzu {
  if (!AKTIF_ARAYUZ) throw new Error(`[ulke/arayuz] the "${ulkePaketi().kod}" pack brings no content for the shared screens`)
  return AKTIF_ARAYUZ
}

/** The word mark of the product in this country. */
export const marka = (): string => arayuz().marka

// ───────────────────────── language forms and catalogues ─────────────────────────

/** Narrowing for a value that came from the server or the address bar: one of the application's forms, else the pack's default. */
export function uygulamaDili(ham: unknown): DilKodu {
  return uygulamaDiliSec(typeof ham === 'string' ? ham : null)
}

/** Every form of the application with its catalogue, in the pack's order. */
export function tumMetinler(): readonly { dil: DilKodu; m: UygulamaMetni }[] {
  return uygulamaDilleri().map((dil) => ({ dil, m: uygulamaMetni(dil) }))
}

/** The application's catalogue in an account's form. */
export function uygulamaMetni(dil: unknown): UygulamaMetni {
  const d = uygulamaDili(dil)
  const m = arayuz().metinler[d]
  if (!m) throw new Error(`[ulke/arayuz] no application catalogue for ${ulkePaketi().kod}/${d}. No fallback to another language.`)
  return m
}

/**
 * The words of the kit's own entry fields (a day, a time of day, a number) in a form: the account's on the doctor's
 * screens, the patient's on the patient's page. They are a group of the application's catalogue, which every form has.
 */
export const girdiMetni = (dil: unknown): GirdiMetni => uygulamaMetni(dil).girdi

/** The form a catalogue is written in — for the few things a screen shows that are not sentences of the catalogue (a role's name, the assistant's name). */
export function metninDili(m: UygulamaMetni): DilKodu {
  const a = arayuz().metinler
  return uygulamaDilleri().find((d) => a[d] === m) ?? ulkePaketi().varsayilanDil
}

/** The appointment catalogue in an account's form. */
export function randevuMetni(dil: unknown): RandevuMetni {
  const d = uygulamaDili(dil)
  const r = arayuz().randevuMetinleri[d]
  if (!r) throw new Error(`[ulke/arayuz] no appointment catalogue for ${ulkePaketi().kod}/${d}. No fallback to another language.`)
  return r
}

/** The form an appointment catalogue is written in. */
export function randevuMetninDili(r: RandevuMetni): DilKodu {
  const a = arayuz().randevuMetinleri
  return uygulamaDilleri().find((d) => a[d] === r) ?? ulkePaketi().varsayilanDil
}

/** The patient portal's catalogue in a form: the account's for the doctor's controls, the patient's for the patient's page. */
export function portalMetni(dil: unknown): PortalMetni {
  const d = uygulamaDili(dil)
  const p = arayuz().portalMetinleri?.[d]
  if (!p) throw new Error(`[ulke/arayuz] no patient-portal catalogue for ${ulkePaketi().kod}/${d}. No fallback to another language.`)
  return p
}

/** The intake form's catalogue in a form: the account's for the doctor's controls, the patient's for the form itself and for the invitation. */
export function formMetni(dil: unknown): FormMetni {
  const d = uygulamaDili(dil)
  const f = arayuz().formMetinleri?.[d]
  if (!f) throw new Error(`[ulke/arayuz] no intake-form catalogue for ${ulkePaketi().kod}/${d}. No fallback to another language.`)
  return f
}

/** The messages' catalogue in a form: the account's for the doctor's card, the patient's for the patient's page. */
export function mesajMetni(dil: unknown): MesajMetni {
  const d = uygulamaDili(dil)
  const x = arayuz().mesajMetinleri?.[d]
  if (!x) throw new Error(`[ulke/arayuz] no messages catalogue for ${ulkePaketi().kod}/${d}. No fallback to another language.`)
  return x
}

/** The catalogue of "my templates" in an account's form. */
export function sablonMetni(dil: unknown): SablonMetni {
  const d = uygulamaDili(dil)
  const x = arayuz().sablonMetinleri?.[d]
  if (!x) throw new Error(`[ulke/arayuz] no templates catalogue for ${ulkePaketi().kod}/${d}. No fallback to another language.`)
  return x
}

/** The catalogue of the consultation between doctors in an account's form. */
export function konsultasyonMetni(dil: unknown): KonsultasyonMetni {
  const d = uygulamaDili(dil)
  const x = arayuz().konsultasyonMetinleri?.[d]
  if (!x) throw new Error(`[ulke/arayuz] no consultation catalogue for ${ulkePaketi().kod}/${d}. No fallback to another language.`)
  return x
}

/** The tools area's catalogue in an account's form. */
export function araclarMetni(dil: unknown): AraclarMetni {
  const d = uygulamaDili(dil)
  const a = arayuz().araclar?.metinler[d]
  if (!a) throw new Error(`[ulke/arayuz] no tools catalogue for ${ulkePaketi().kod}/${d}. No fallback to another language.`)
  return a
}

/** The clinic accounts catalogue in an account's form. */
export function klinikMetni(dil: unknown): KlinikMetni {
  const d = uygulamaDili(dil)
  const k = arayuz().klinikMetinleri?.[d]
  if (!k) throw new Error(`[ulke/arayuz] no clinic-accounts catalogue for ${ulkePaketi().kod}/${d}. No fallback to another language.`)
  return k
}

/** The name of an ISO weekday (1 = Monday … 7 = Sunday). '' for anything else. */
export function gunAdi(r: RandevuMetni, haftaGunu: number, uzun = false): string {
  const t = (uzun ? r.gunUzun : r.gunKisa) as Readonly<Record<number, string>>
  return t[haftaGunu] ?? ''
}

// ───────────────────────── language and script, as two questions ─────────────────────────

/** The pack's languages and their scripts. */
export const dilGruplari = (): readonly DilGrubu[] => ulkePaketi().uygulama?.dilGruplari ?? []
export const temelDil = (dil: string): string => D.temelDil(dilGruplari(), dil)
export const yaziSec = (dil: string): string | null => D.yaziSec(dilGruplari(), dil)
export const varsayilanYazi = (): string | null => D.varsayilanYazi(dilGruplari())
export const yaziSorulurMu = (temel: string): boolean => D.yaziSorulurMu(dilGruplari(), temel)
/** Language + script → the form; the pack's default form for a language the country does not have. */
export const dilBirlestir = (temel: string, yazi: string | null): DilKodu => D.dilBirlestir(dilGruplari(), temel, yazi) ?? ulkePaketi().varsayilanDil
export const hastaIcinBicim = (hastaDili: string, hekim: { dil: DilKodu; notDili: DilKodu }): DilKodu => D.hastaIcinBicim(dilGruplari(), hastaDili, hekim)
/** true = the country has more than one language: the language question is asked. */
export const dilSorulurMu = (): boolean => dilGruplari().length > 1
/** true = an account has anything to choose at all (a language, or a script). */
export const dilSecimiVarMi = (): boolean => uygulamaDilleri().length > 1

/** The name of a language of the country, as the catalogue `m` writes it. '' for a language the country does not have. */
export const dilAdi = (m: UygulamaMetni, temel: string): string => (Object.prototype.hasOwnProperty.call(m.diller, temel) ? m.diller[temel] : '')

// ───────────────────────── roles and assistants ─────────────────────────

export const roller = (): readonly RolTanimi[] => arayuz().roller

/** true = one of this country's roles. Anything else — another country's key, a made-up one, an empty value — is not a role. */
export function rolMu(ham: unknown): ham is string {
  return typeof ham === 'string' && roller().some((r) => r.anahtar === ham)
}

/** The name of a role in a form. null for anything that is not a role: there is no name to fall back to. */
export function rolAdi(rol: unknown, dil: unknown): string | null {
  const r = typeof rol === 'string' ? roller().find((x) => x.anahtar === rol) : undefined
  if (!r) return null
  const d = uygulamaDili(dil)
  return Object.prototype.hasOwnProperty.call(r.ad, d) ? r.ad[d] : null
}

/** The roles as the picker shows them: by kind, the pack's order inside each. Kinds without a role are left out. */
export function rolGruplari(): readonly { taraf: RolTarafi; roller: readonly RolTanimi[] }[] {
  return (['doktor', 'klinik-hekim', 'klinik-muttefik'] as const).map((taraf) => ({ taraf, roller: roller().filter((r) => r.taraf === taraf) })).filter((g) => g.roller.length > 0)
}

/** The assistant of a role in a form, or null: no such role, or a role without an assistant of its own. */
export function asistanKimligi(rol: unknown, dil: unknown): AsistanKimligi | null {
  return rolMu(rol) ? arayuz().asistan(rol, uygulamaDili(dil)) : null
}

// ───────────────────────── note templates ─────────────────────────

const veliYasi = (): number | null => ulkePaketi().uygulama?.veliYasi ?? null
export const genelSablon = (): string => arayuz().notSablonlari.genelSablon
export const sablonMu = (ham: unknown): ham is string => S.sablonMu(arayuz().notSablonlari, roller(), ham)
export const sablonAlanlari = (sablon: string, hasta?: S.SablonHastasi): readonly string[] => S.sablonAlanlari(arayuz().notSablonlari, roller(), veliYasi(), sablon, hasta)
export const alanTanimi = (anahtar: string): NotAlani | null => S.alanTanimi(arayuz().notSablonlari, anahtar)
export const alanAdi = (anahtar: string, dil: unknown): string | null => S.alanAdi(arayuz().notSablonlari, anahtar, uygulamaDili(dil))
/**
 * NOTYA-ULKE-INTAKE-01 — the kit's ONE age rule, for a form as for a note: true = the patient is below the country's
 * guardian age on `gun`. An unknown age counts as below it only in a role whose patients are children.
 */
export const veliYasindaMi = (rol: string | null, dogumTarihi: string | null | undefined, gun: string): boolean => S.veliYasindaMi(arayuz().notSablonlari, veliYasi(), rol ?? arayuz().notSablonlari.genelSablon, dogumTarihi, gun)
export const bolumAdi = (sablon: string, bolum: NotBolumu, dil: unknown): string | null => S.bolumAdi(arayuz().notSablonlari, roller(), sablon, bolum, uygulamaDili(dil))

// ───────────────────────── landing page ─────────────────────────

/** The landing page's content, or null where the pack brings none. */
export const acilis = (): UlkeAcilisi | null => AKTIF_ARAYUZ?.acilis ?? null

/** The anchor of a landing-page section in this country ('#…' is added by the caller). '' where there is no landing page. */
export const acilisCapasi = (bolum: AcilisCapasi): string => acilis()?.capalar[bolum] ?? ''
