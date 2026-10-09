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
import type { RandevuMetni, UygulamaMetni } from './metinTipleri'
import * as S from './notSablonu'
import type { AsistanKimligi, NotAlani, NotBolumu, RolTanimi, RolTarafi, UlkeArayuzu } from './tipler'

export type { RandevuMetni, UygulamaMetni } from './metinTipleri'
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
export const bolumAdi = (sablon: string, bolum: NotBolumu, dil: unknown): string | null => S.bolumAdi(arayuz().notSablonlari, roller(), sablon, bolum, uygulamaDili(dil))
