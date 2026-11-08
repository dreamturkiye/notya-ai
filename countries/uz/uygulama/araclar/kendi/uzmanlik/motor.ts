/**
 * ULKE-BRANS-DERINLIK-01 (Kaan, 2026-11-08) — Uzbekistan: THE ENGINE of the specialty clinical tools (./olcekler.ts).
 * The same engine as the Australian build's (release/au countries/au/araclar/uzmanlik/motor.ts), with every word in the
 * pack's three forms (Uzbek Latin, Uzbek Cyrillic derived by rule — scripts/uz-kiril.mjs — and Russian).
 * MACHINE-WRITTEN. AWAITS NATIVE AND CLINICAL REVIEW (../../index.ts).
 *
 * One declarative row per tool → the kit's two halves (lib/ulke/araclar/tipler.ts): the definition (`AracTanimi`, pure
 * arithmetic that returns numbers and keys) and the pack's words (`PaketAraci`, three forms). Two shapes:
 *
 *   toplam   a published points score: tick-boxes worth points, choices worth points, and item scores, summed; the band
 *            is read from the total by the source's own cut-offs (`bantlar`, ascending lower limits).
 *   formul   a published equation: numbers in, numbers out, an optional band by the source's cut-offs.
 *
 * Every row carries its published source (`kaynak`, shown under the result) and its WORKED EXAMPLES (`ornekler`) — a set of
 * inputs and the total, band or numbers the source's own arithmetic gives — which ./uzmanlik.test.ts runs. Items of a
 * questionnaire whose wording belongs to its authors are `numarali`: the screen shows the item number only.
 *
 * Nothing here diagnoses, prescribes or decides: a total and a band are prompts for the clinician, who approves every note.
 * CLASSIFIED BEFORE ADDING (.cursor/skills/specialty-doktor-araclari): every row names its roles (at most three, each a
 * role that asks the question every day); no row is base. Uzbekistan has no national adaptation of these scores that was
 * read; each cites its international source and says so (XALQARO).
 */
import type { AracAlani, AracGirdisi, AracSayisi, AracSonucu, AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, sayiMi } from '@/lib/ulke/araclar/yardimci'
import { u, type Uc } from '../../yardimci'
import KIRIL from './kiril.json'

type Sunulan = string
/**
 * The Uzbek Cyrillic form of a text written here with an empty Cyrillic argument: taken from ./kiril.json, which
 * scripts/uz-kiril-uzmanlik.mts writes by the pack's rule (scripts/uz-kiril.mjs → kirill) from the Latin text. Stored
 * static; nothing is converted while the product runs. A Cyrillic text written by hand is kept as it is.
 */
const KIRIL_HARITASI = KIRIL as Readonly<Record<string, string>>
export const kiril = (x: Uc): Uc => (x['uz-Cyrl'] ? x : { ...x, 'uz-Cyrl': KIRIL_HARITASI[x['uz-Latn']] ?? '' })
const m = kiril

export type Bant = { enAz: number; k: string; e: Uc }
export type Uyari = { k: string; e: Uc }

/** A field of a points score. */
export type ToplamAlani =
  | { k: string; e: Uc; p: number }                                                   // tick-box worth p points
  | { k: string; e: Uc; s: readonly { k: string; e: Uc; p: number }[] }               // one of several options
  | { k: string; e?: Uc; enAz: number; enCok: number; numarali?: true; istege?: true } // an item score

export type Ornek = { girdi: AracGirdisi; toplam?: number; bant?: string | null; sayilar?: Readonly<Record<string, number>>; uyarilar?: readonly string[]; tamam?: false }

type Ortak = {
  /** Key without the country code: the tool's key is `uz-<k>`. */
  k: string
  roller: readonly Sunulan[]
  ad: Uc
  aciklama: Uc
  not: Uc
  kaynak: string
  ornekler: readonly Ornek[]
  /** A tool that prints on the doctor's letterhead (a record, a report). */
  yazdirilir?: true
}

export type ToplamSatiri = Ortak & {
  sekil: 'toplam'
  alanlar: readonly ToplamAlani[]
  bantlar?: readonly Bant[]
  /** Warnings raised by the total or the inputs. */
  uyarilar?: readonly (Uyari & { kosul: (toplam: number, g: AracGirdisi) => boolean })[]
  /** The total shown is this function of the raw sum (e.g. a mean). Default: the sum. */
  donustur?: { f: (toplam: number, g: AracGirdisi) => number; ondalik: number; enCok?: number }
  toplamAdi?: Uc
}

export type FormulSonucu = { sayilar: readonly AracSayisi[]; bant?: string | null; uyarilar?: readonly string[] } | null

export type FormulSatiri = Ortak & {
  sekil: 'formul'
  tur?: 'hesap' | 'olcek'
  alanlar: readonly AracAlani[]
  /** Label of every field, option and result number. */
  etiketler: Readonly<Record<string, Uc>>
  secenekEtiketleri?: Readonly<Record<string, Readonly<Record<string, Uc>>>>
  sayiAdlari: Readonly<Record<string, Uc>>
  bantlar?: readonly Omit<Bant, 'enAz'>[]
  uyarilar?: readonly Uyari[]
  sonucBirimleri?: readonly string[]
  dozYazar?: true
  hesap: (g: AracGirdisi) => FormulSonucu
}

export type UzmanlikSatiri = ToplamSatiri | FormulSatiri

export const anahtarOf = (s: Pick<Ortak, 'k'>): string => `uz-${s.k}`

const isaretMi = (a: ToplamAlani): a is { k: string; e: Uc; p: number } => 'p' in a
const secimMi = (a: ToplamAlani): a is { k: string; e: Uc; s: readonly { k: string; e: Uc; p: number }[] } => 's' in a

function toplamAlani(a: ToplamAlani): AracAlani {
  if (isaretMi(a)) return { anahtar: a.k, tur: 'isaret' }
  if (secimMi(a)) return { anahtar: a.k, tur: 'secim', secenekler: a.s.map((x) => x.k) }
  return { anahtar: a.k, tur: 'puan', enAz: a.enAz, enCok: a.enCok, tam: true, ...(a.numarali ? { numarali: true } : {}), ...(a.istege ? { istege: true } : {}) }
}

export function enCokToplam(alanlar: readonly ToplamAlani[]): number {
  return alanlar.reduce((t, a) => t + (isaretMi(a) ? Math.max(0, a.p) : secimMi(a) ? Math.max(...a.s.map((x) => x.p)) : a.enCok), 0)
}

/** The raw sum, or null when a required choice or item is missing or out of range. */
export function topla(alanlar: readonly ToplamAlani[], g: AracGirdisi): number | null {
  let t = 0
  for (const a of alanlar) {
    const v = g[a.k]
    if (isaretMi(a)) { if (v === true) t += a.p; continue }
    if (secimMi(a)) {
      const s = a.s.find((x) => x.k === v)
      if (!s) return null
      t += s.p
      continue
    }
    if (v === null || v === undefined || v === '') { if (a.istege) continue; return null }
    if (!sayiMi(v) || !Number.isInteger(v) || v < a.enAz || v > a.enCok) return null
    t += v
  }
  return t
}

export function bantOku(bantlar: readonly Bant[] | undefined, deger: number): string | null {
  if (!bantlar?.length) return null
  let b: string | null = null
  for (const x of bantlar) if (deger >= x.enAz) b = x.k
  return b
}

/**
 * A score of tick-boxes only, or a rule of tick-boxes only, has the field `hicbiri` ("none of these") beside its ticks: an
 * empty form is not a result (the screen asks for the fields), and "none of these" with a tick is a contradiction.
 */
export const HICBIRI = 'hicbiri'
function bosVeyaCeliskili(isaretler: readonly string[], g: AracGirdisi): boolean {
  const n = isaretler.filter((k) => g[k] === true).length
  return (n === 0 && g[HICBIRI] !== true) || (n > 0 && g[HICBIRI] === true)
}
export const sadeceIsaretToplam = (s: ToplamSatiri): boolean => s.alanlar.every(isaretMi)
export const sadeceIsaretFormul = (s: FormulSatiri): boolean => s.alanlar.every((a) => a.tur === 'isaret')

function toplamTanimi(s: ToplamSatiri): AracTanimi {
  const enCok = s.donustur?.enCok ?? enCokToplam(s.alanlar)
  const yalniz = sadeceIsaretToplam(s)
  return {
    anahtar: anahtarOf(s),
    tur: 'olcek',
    alanlar: [...s.alanlar.map(toplamAlani), ...(yalniz ? [{ anahtar: HICBIRI, tur: 'isaret' as const }] : [])],
    cikti: { sayilar: ['toplam'], bantlar: (s.bantlar ?? []).map((b) => b.k), uyarilar: (s.uyarilar ?? []).map((u) => u.k), tarihler: [] },
    kaynak: s.kaynak,
    ...(s.yazdirilir ? { yazdirilir: true } : {}),
    hesapla: (g): AracSonucu => {
      if (yalniz && bosVeyaCeliskili(s.alanlar.map((x) => x.k), g)) return BOS_SONUC
      const ham = topla(s.alanlar, g)
      if (ham === null) return BOS_SONUC
      const deger = s.donustur ? Math.round(s.donustur.f(ham, g) * 10 ** s.donustur.ondalik) / 10 ** s.donustur.ondalik : ham
      return {
        tamam: true,
        sayilar: [{ anahtar: 'toplam', deger, ondalik: s.donustur?.ondalik ?? 0, enCok }],
        bant: bantOku(s.bantlar, deger),
        uyarilar: (s.uyarilar ?? []).filter((u) => u.kosul(deger, g)).map((u) => u.k),
        tarihler: [],
      }
    },
  }
}

function formulTanimi(s: FormulSatiri): AracTanimi {
  const yalniz = sadeceIsaretFormul(s)
  return {
    anahtar: anahtarOf(s),
    tur: s.tur ?? 'hesap',
    alanlar: [...s.alanlar, ...(yalniz ? [{ anahtar: HICBIRI, tur: 'isaret' as const }] : [])],
    cikti: { sayilar: Object.keys(s.sayiAdlari), bantlar: (s.bantlar ?? []).map((b) => b.k), uyarilar: (s.uyarilar ?? []).map((u) => u.k), tarihler: [] },
    kaynak: s.kaynak,
    ...(s.sonucBirimleri ? { sonucBirimleri: s.sonucBirimleri } : {}),
    ...(s.dozYazar ? { dozYazar: true } : {}),
    ...(s.yazdirilir ? { yazdirilir: true } : {}),
    hesapla: (g): AracSonucu => {
      if (yalniz && bosVeyaCeliskili(s.alanlar.map((a) => a.anahtar), g)) return BOS_SONUC
      for (const a of s.alanlar) {
        const v = g[a.anahtar]
        const bos = v === null || v === undefined || v === ''
        if (bos) { if (a.istege || a.tur === 'isaret') continue; return BOS_SONUC }
        if ((a.tur === 'sayi' || a.tur === 'puan') && (!sayiMi(v) || (a.enAz !== undefined && v < a.enAz) || (a.enCok !== undefined && v > a.enCok))) return BOS_SONUC
        if (a.tur === 'secim' && !(a.secenekler ?? []).includes(v as string)) return BOS_SONUC
      }
      const r = s.hesap(g)
      if (!r || r.sayilar.some((x) => !Number.isFinite(x.deger))) return BOS_SONUC
      return { tamam: true, sayilar: r.sayilar, bant: r.bant ?? null, uyarilar: r.uyarilar ?? [], tarihler: [] }
    },
  }
}

export const tanimOf = (s: UzmanlikSatiri): AracTanimi => (s.sekil === 'toplam' ? toplamTanimi(s) : formulTanimi(s))

const BILDIRIM = u('Kiritilgan maʼlumotlardan koʻrsatilgan nashr qilingan usul boʻyicha hisoblangan natija. Tashxis ham, davolash qarori ham emas: qarorni shifokor qabul qiladi.', '', 'Результат по введённым данным, рассчитанный опубликованным методом. Не диагноз и не решение о лечении: решение принимает врач.')

export function paketOf(s: UzmanlikSatiri): PaketAraci {
  const alanlar: Record<string, Uc> = {}
  const secenekler: Record<string, Record<string, Uc>> = {}
  let sayilar: Record<string, Uc>
  let bantlar: Record<string, Uc> = {}
  let uyarilar: Record<string, Uc> = {}
  if (s.sekil === 'toplam') {
    for (const a of s.alanlar) {
      if (a.e) alanlar[a.k] = m(a.e)
      if (secimMi(a)) secenekler[a.k] = Object.fromEntries(a.s.map((x) => [x.k, m(x.e)]))
    }
    if (sadeceIsaretToplam(s)) alanlar[HICBIRI] = m(u('Hech biri yoʻq', '', 'Ничего из перечисленного'))
    sayilar = { toplam: m(s.toplamAdi ?? u('Umumiy ball', '', 'Общий балл')) }
    bantlar = Object.fromEntries((s.bantlar ?? []).map((b) => [b.k, m(b.e)]))
    uyarilar = Object.fromEntries((s.uyarilar ?? []).map((u) => [u.k, m(u.e)]))
  } else {
    for (const a of s.alanlar) {
      const e = s.etiketler[a.anahtar]
      if (e) alanlar[a.anahtar] = m(e)
      if (a.tur === 'secim') secenekler[a.anahtar] = Object.fromEntries((a.secenekler ?? []).map((k) => [k, m(s.secenekEtiketleri?.[a.anahtar]?.[k] ?? u(k, '', k))]))
    }
    if (sadeceIsaretFormul(s)) alanlar[HICBIRI] = m(u('Hech biri yoʻq', '', 'Ничего из перечисленного'))
    sayilar = Object.fromEntries(Object.entries(s.sayiAdlari).map(([k, v]) => [k, m(v)]))
    bantlar = Object.fromEntries((s.bantlar ?? []).map((b) => [b.k, m(b.e)]))
    uyarilar = Object.fromEntries((s.uyarilar ?? []).map((u) => [u.k, m(u.e)]))
  }
  return {
    anahtar: anahtarOf(s),
    roller: s.roller,
    metin: {
      ad: m(s.ad),
      aciklama: m(s.aciklama),
      alanlar,
      ...(Object.keys(secenekler).length ? { secenekler } : {}),
      sayilar,
      ...(Object.keys(bantlar).length ? { bantlar } : {}),
      ...(Object.keys(uyarilar).length ? { uyarilar } : {}),
      not: m(s.not),
    },
    lisans: { durum: 'serbest', hakSahibi: 'Notya', kaynak: s.kaynak, bildirim: m(BILDIRIM) },
  }
}

/** Helpers for the rows: a tick, a choice, an item. */
export const t = (k: string, e: Uc, p = 1): ToplamAlani => ({ k, e, p })
export const c = (k: string, e: Uc, s: readonly [string, Uc, number][]): ToplamAlani => ({ k, e, s: s.map(([kk, ee, p]) => ({ k: kk, e: ee, p })) })
export const i = (k: string, enAz: number, enCok: number, e?: Uc): ToplamAlani => (e ? { k, e, enAz, enCok } : { k, enAz, enCok, numarali: true })
export const b = (enAz: number, k: string, e: Uc): Bant => ({ enAz, k, e })
export const yuvarla = (x: number, n: number): number => Math.round(x * 10 ** n) / 10 ** n
