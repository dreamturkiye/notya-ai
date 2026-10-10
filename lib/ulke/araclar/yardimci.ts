/**
 * NOTYA-ULKE-ARACLAR-01 — small builders the kit's tool definitions are written with. Pure; no text of any country.
 */
import type { AracAlani, AracGirdisi, AracSonucu, AracTanimi } from './tipler'

export const BOS_SONUC: AracSonucu = { tamam: false, sayilar: [], bant: null, uyarilar: [], tarihler: [] }

export const isaret = (anahtar: string): AracAlani => ({ anahtar, tur: 'isaret' })
export const secim = (anahtar: string, secenekler: readonly string[], istege = false): AracAlani => ({ anahtar, tur: 'secim', secenekler, ...(istege ? { istege } : {}) })
export const tarih = (anahtar: string, istege = false): AracAlani => ({ anahtar, tur: 'tarih', ...(istege ? { istege } : {}) })
export const puan = (anahtar: string, enAz: number, enCok: number, ek: Partial<AracAlani> = {}): AracAlani => ({ anahtar, tur: 'puan', enAz, enCok, tam: true, ...ek })
export const metin = (anahtar: string, ek: Partial<AracAlani> = {}): AracAlani => ({ anahtar, tur: 'metin', istege: true, ...ek })
export const sayi = (anahtar: string, enAz: number, enCok: number, ek: Partial<AracAlani> = {}): AracAlani => ({ anahtar, tur: 'sayi', enAz, enCok, ...ek })

/**
 * true = the field is there for this input (its condition, if it has one, holds). A choice whose options are the
 * country's (`tablodan`) and that has none — the pack supplied no table — is not there at all.
 */
export const alanVarMi = (a: AracAlani, g: AracGirdisi): boolean => !(a.tablodan && !(a.secenekler ?? []).length) && (!a.kosul || (typeof g[a.kosul.alan] === 'string' && a.kosul.degerler.includes(g[a.kosul.alan] as string)))
/** An input with every field that is not there emptied: what a tool's arithmetic is always handed. */
export function kosullariUygula(alanlar: readonly AracAlani[], g: AracGirdisi): AracGirdisi {
  const c: Record<string, number | string | boolean | null> = { ...g }
  for (const a of alanlar) if (!alanVarMi(a, g)) c[a.anahtar] = a.tur === 'isaret' ? false : null
  return c
}
/** The length a free-text field keeps. */
export const METIN_UZUNLUGU = 80

/** The ticked keys of a list of tick-boxes, in the list's order. */
export const isaretliler = (g: AracGirdisi, maddeler: readonly string[]): string[] => maddeler.filter((k) => g[k] === true)
export const sayiMi = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
export const gunMu = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(`${x}T12:00:00Z`))

/** A day `gun` days after `iso` (calendar days, no time zone involved). */
export function gunEkle(iso: string, gun: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}
/** A day `ay` calendar months after `iso` (the 31st plus one month runs into the next month, as a calendar does). */
export function ayEkle(iso: string, ay: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10)
}
/** Whole days from `a` to `b`. */
export const gunFarki = (a: string, b: string): number => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000)

/**
 * A CHECKLIST or structured note: tick-boxes, and at most a few fields beside them. It is complete when at least
 * one box is ticked (and `kural`, where a list has one of its own, agrees). The result counts the ticked boxes;
 * `uyari` turns the ticked set into the follow-ups the list suggests.
 */
export function kontrolListesi(t: {
  anahtar: string
  maddeler: readonly string[]
  /** Fields beside the boxes (a class, a score, a day). */
  ek?: readonly AracAlani[]
  /** Extra rule: false = not complete yet. */
  kural?: (secili: readonly string[], g: AracGirdisi) => boolean
  /** Every warning key the list can raise, and which of them apply. */
  uyarilar?: readonly string[]
  uyari?: (secili: readonly string[], g: AracGirdisi) => readonly string[]
  /** Keys of `ek` fields whose value is repeated as a number in the result (a score out of its maximum). */
  sayilar?: readonly string[]
  tarihler?: readonly string[]
  bantlar?: readonly string[]
  bant?: (secili: readonly string[], g: AracGirdisi) => string | null
  kaynak?: string | null
}): AracTanimi {
  const ek = t.ek ?? []
  return {
    anahtar: t.anahtar,
    tur: 'liste',
    alanlar: [...ek.filter((a) => a.tur === 'secim'), ...t.maddeler.map(isaret), ...ek.filter((a) => a.tur !== 'secim')],
    cikti: { sayilar: ['isaretli', ...(t.sayilar ?? [])], bantlar: t.bantlar ?? [], uyarilar: t.uyarilar ?? [], tarihler: t.tarihler ?? [] },
    kaynak: t.kaynak ?? null,
    hesapla: (g) => {
      const secili = isaretliler(g, t.maddeler)
      if (!secili.length || (t.kural && !t.kural(secili, g))) return BOS_SONUC
      return {
        tamam: true,
        sayilar: [
          { anahtar: 'isaretli', deger: secili.length, ondalik: 0, enCok: t.maddeler.length },
          ...(t.sayilar ?? []).flatMap((k) => { const a = ek.find((x) => x.anahtar === k); const v = g[k]; return a && sayiMi(v) ? [{ anahtar: k, deger: v, ondalik: 0, enCok: a.enCok }] : [] }),
        ],
        bant: t.bant ? t.bant(secili, g) : null,
        uyarilar: t.uyari ? t.uyari(secili, g) : [],
        tarihler: (t.tarihler ?? []).flatMap((k) => { const v = g[k]; return gunMu(v) ? [{ anahtar: k, tarih: v }] : [] }),
      }
    },
  }
}
