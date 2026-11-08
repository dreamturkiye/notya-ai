/**
 * ULKE-BRANS-DERINLIK-01 (Kaan, 2026-11-08) — Australia: THE ENGINE of the specialty clinical tools (./olcekler*.ts).
 *
 * One declarative row per tool → the kit's two halves (lib/ulke/araclar/tipler.ts): the definition (`AracTanimi`, pure
 * arithmetic that returns numbers and keys) and the pack's words (`PaketAraci`, en-AU). Two shapes:
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
 * role that asks the question every day); no row is base.
 */
import type { AracAlani, AracGirdisi, AracSayisi, AracSonucu, AracTanimi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import { BOS_SONUC, sayiMi } from '@/lib/ulke/araclar/yardimci'
import type { Sunulan } from '../../klinik/asistanAdlari'

const D = 'en-AU'
const m = (metin: string) => ({ [D]: metin })

export type Bant = { enAz: number; k: string; e: string }
export type Uyari = { k: string; e: string }

/** A field of a points score. */
export type ToplamAlani =
  | { k: string; e: string; p: number }                                                   // tick-box worth p points
  | { k: string; e: string; s: readonly { k: string; e: string; p: number }[] }           // one of several options
  | { k: string; e?: string; enAz: number; enCok: number; numarali?: true; istege?: true } // an item score

export type Ornek = { girdi: AracGirdisi; toplam?: number; bant?: string | null; sayilar?: Readonly<Record<string, number>>; uyarilar?: readonly string[]; tamam?: false }

type Ortak = {
  /** Key without the country code: the tool's key is `au-<k>`. */
  k: string
  roller: readonly Sunulan[]
  ad: string
  aciklama: string
  not: string
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
  toplamAdi?: string
}

export type FormulSonucu = { sayilar: readonly AracSayisi[]; bant?: string | null; uyarilar?: readonly string[] } | null

export type FormulSatiri = Ortak & {
  sekil: 'formul'
  tur?: 'hesap' | 'olcek'
  alanlar: readonly AracAlani[]
  /** Label of every field, option and result number. */
  etiketler: Readonly<Record<string, string>>
  secenekEtiketleri?: Readonly<Record<string, Readonly<Record<string, string>>>>
  sayiAdlari: Readonly<Record<string, string>>
  bantlar?: readonly Omit<Bant, 'enAz'>[]
  uyarilar?: readonly Uyari[]
  sonucBirimleri?: readonly string[]
  dozYazar?: true
  hesap: (g: AracGirdisi) => FormulSonucu
}

export type UzmanlikSatiri = ToplamSatiri | FormulSatiri

export const anahtarOf = (s: Pick<Ortak, 'k'>): string => `au-${s.k}`

const isaretMi = (a: ToplamAlani): a is { k: string; e: string; p: number } => 'p' in a
const secimMi = (a: ToplamAlani): a is { k: string; e: string; s: readonly { k: string; e: string; p: number }[] } => 's' in a

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

function toplamTanimi(s: ToplamSatiri): AracTanimi {
  const enCok = s.donustur?.enCok ?? enCokToplam(s.alanlar)
  return {
    anahtar: anahtarOf(s),
    tur: 'olcek',
    alanlar: s.alanlar.map(toplamAlani),
    cikti: { sayilar: ['toplam'], bantlar: (s.bantlar ?? []).map((b) => b.k), uyarilar: (s.uyarilar ?? []).map((u) => u.k), tarihler: [] },
    kaynak: s.kaynak,
    ...(s.yazdirilir ? { yazdirilir: true } : {}),
    hesapla: (g): AracSonucu => {
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
  return {
    anahtar: anahtarOf(s),
    tur: s.tur ?? 'hesap',
    alanlar: s.alanlar,
    cikti: { sayilar: Object.keys(s.sayiAdlari), bantlar: (s.bantlar ?? []).map((b) => b.k), uyarilar: (s.uyarilar ?? []).map((u) => u.k), tarihler: [] },
    kaynak: s.kaynak,
    ...(s.sonucBirimleri ? { sonucBirimleri: s.sonucBirimleri } : {}),
    ...(s.dozYazar ? { dozYazar: true } : {}),
    ...(s.yazdirilir ? { yazdirilir: true } : {}),
    hesapla: (g): AracSonucu => {
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

const BILDIRIM = 'A total and a band from the inputs you entered, by the published method shown. Not a diagnosis and not a treatment decision: the clinician decides and approves the note.'

export function paketOf(s: UzmanlikSatiri): PaketAraci {
  const alanlar: Record<string, ReturnType<typeof m>> = {}
  const secenekler: Record<string, Record<string, ReturnType<typeof m>>> = {}
  let sayilar: Record<string, ReturnType<typeof m>>
  let bantlar: Record<string, ReturnType<typeof m>> = {}
  let uyarilar: Record<string, ReturnType<typeof m>> = {}
  if (s.sekil === 'toplam') {
    for (const a of s.alanlar) {
      if (a.e) alanlar[a.k] = m(a.e)
      else if (!('numarali' in a && a.numarali)) alanlar[a.k] = m(a.k)
      if (secimMi(a)) secenekler[a.k] = Object.fromEntries(a.s.map((x) => [x.k, m(x.e)]))
    }
    sayilar = { toplam: m(s.toplamAdi ?? 'Total score') }
    bantlar = Object.fromEntries((s.bantlar ?? []).map((b) => [b.k, m(b.e)]))
    uyarilar = Object.fromEntries((s.uyarilar ?? []).map((u) => [u.k, m(u.e)]))
  } else {
    for (const a of s.alanlar) {
      alanlar[a.anahtar] = m(s.etiketler[a.anahtar] ?? a.anahtar)
      if (a.tur === 'secim') secenekler[a.anahtar] = Object.fromEntries((a.secenekler ?? []).map((k) => [k, m(s.secenekEtiketleri?.[a.anahtar]?.[k] ?? k)]))
    }
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
export const t = (k: string, e: string, p = 1): ToplamAlani => ({ k, e, p })
export const c = (k: string, e: string, s: readonly [string, string, number][]): ToplamAlani => ({ k, e, s: s.map(([kk, ee, p]) => ({ k: kk, e: ee, p })) })
export const i = (k: string, enAz: number, enCok: number, e?: string): ToplamAlani => (e ? { k, e, enAz, enCok } : { k, enAz, enCok, numarali: true })
export const b = (enAz: number, k: string, e: string): Bant => ({ enAz, k, e })
export const yuvarla = (x: number, n: number): number => Math.round(x * 10 ** n) / 10 ** n
