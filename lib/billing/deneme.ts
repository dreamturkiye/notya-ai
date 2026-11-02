/**
 * STRIPE-NOTYA-AU-05, trial model (Kaan, 2026-11-02) - the IN-APP free trial: pure rules, no I/O, no text.
 *
 *   No card. The trial starts when the account is created (ulke_hesaplari.created_at, or the country's `taban` day for
 *   accounts older than this model) and involves no Stripe at all. Stripe Checkout is used only when the doctor pays.
 *
 *   ucretli   a live subscription (active / past_due, or a Stripe trial started under the old card-first model):
 *             no trial limits.
 *   deneme    inside the trial days: everything works up to the visit cap (and the voice cap, lib/billing/sesDakika.ts).
 *   bitti     the trial days are over without a paid plan: READ-ONLY. Patients and notes stay visible and exportable,
 *             nothing is deleted; new recordings/visits, live voice and AI generation are refused (402 DENEME_BITTI).
 *
 * The prompt choice (`istemSec`) is pure too: which reason, and whether the founding offer leads.
 */
import type { AbonelikOzeti } from './sesDakika'
import type { FiyatGosterimi, UygulamaIciDeneme, YukseltmeMetni } from './ulkeTicari'

const GUN_MS = 24 * 60 * 60 * 1000
const UCRETLI = new Set(['active', 'past_due', 'trialing'])

export type DenemeTuru = 'ucretli' | 'deneme' | 'bitti'
export type DenemeDurumu = {
  tur: DenemeTuru
  /** Day of the trial, 1-based (1 on the day the account was created). */
  gun: number
  /** Whole days left before read-only (0 once it is over). */
  kalanGun: number
  /** When the trial ends (ISO). */
  bitis: string
}

export function denemeBaslangici(ayar: UygulamaIciDeneme, hesapAcilis: string | null | undefined): number {
  const taban = Date.parse(`${ayar.taban}T00:00:00Z`)
  const acilis = hesapAcilis ? Date.parse(hesapAcilis) : NaN
  if (!Number.isFinite(acilis)) return Number.isFinite(taban) ? taban : Date.now()
  return Number.isFinite(taban) ? Math.max(acilis, taban) : acilis
}

export function denemeDurumu(g: { ayar: UygulamaIciDeneme; hesapAcilis: string | null | undefined; abonelik: AbonelikOzeti | null; simdi?: number }): DenemeDurumu {
  const simdi = g.simdi ?? Date.now()
  const bas = denemeBaslangici(g.ayar, g.hesapAcilis)
  const bitisMs = bas + g.ayar.gun * GUN_MS
  const gecen = Math.max(0, simdi - bas)
  const gun = Math.floor(gecen / GUN_MS) + 1
  const kalanGun = Math.max(0, Math.ceil((bitisMs - simdi) / GUN_MS))
  const bitis = new Date(bitisMs).toISOString()
  if (g.abonelik && UCRETLI.has(String(g.abonelik.status))) return { tur: 'ucretli', gun, kalanGun, bitis }
  return { tur: simdi >= bitisMs ? 'bitti' : 'deneme', gun, kalanGun, bitis }
}

/** Refusal code of a gated action, or null = allowed. `muayeneSayisi` only at visit start. */
export type DenemeRetKodu = 'DENEME_BITTI' | 'DENEME_MUAYENE'
export function denemeKarari(d: DenemeDurumu, ayar: UygulamaIciDeneme, muayeneSayisi?: number): DenemeRetKodu | null {
  if (d.tur === 'ucretli') return null
  if (d.tur === 'bitti') return 'DENEME_BITTI'
  if (typeof muayeneSayisi === 'number' && muayeneSayisi >= ayar.muayene) return 'DENEME_MUAYENE'
  return null
}

export type IstemNedeni = 'bitti' | 'muayene' | 'ses' | 'hatirlatma'
export type Istem = {
  neden: IstemNedeni
  teklif: 'kurucu' | 'normal'
  /** For 'hatirlatma': days left, and which reminder day was reached (the screen shows each reminder once). */
  kalanGun?: number
  hatirlatmaGunu?: number
}

/**
 * The prompt to show, most pressing first: day 15 (read-only), the visit cap, the voice cap, then the reminder of
 * the latest reminder day reached. null = nothing to show (paid, or nothing reached yet).
 */
export function istemNedeni(g: { durum: DenemeDurumu; ayar: UygulamaIciDeneme; muayeneSayisi: number; sesDakika: number | null; sesSiniri: number | null }): Omit<Istem, 'teklif'> | null {
  const { durum, ayar } = g
  if (durum.tur === 'ucretli') return null
  if (durum.tur === 'bitti') return { neden: 'bitti' }
  if (g.muayeneSayisi >= ayar.muayene) return { neden: 'muayene' }
  if (g.sesSiniri !== null && g.sesDakika !== null && g.sesDakika >= g.sesSiniri) return { neden: 'ses' }
  const ulasilan = [...ayar.hatirlatmaGunleri].filter((h) => durum.gun >= h).sort((a, b) => b - a)[0]
  if (ulasilan !== undefined) return { neden: 'hatirlatma', kalanGun: durum.kalanGun, hatirlatmaGunu: ulasilan }
  return null
}

/** Founding leads while the country has a founding offer and a seat is left; otherwise the regular prices. */
export function teklifSec(kurucuVar: boolean, koltukKaldi: boolean | null): 'kurucu' | 'normal' {
  // An unknown seat count (Stripe unreachable) still leads with the founding offer: Checkout enforces the cap and
  // falls back to the regular price with a message when it is full.
  return kurucuVar && koltukKaldi !== false ? 'kurucu' : 'normal'
}

/** What the upgrade prompt says and offers. Pure: the words and prices are the country's (lib/billing/ulkeTicari.ts). */
export type IstemIcerigi = {
  baslik: string
  govde: string
  teklif: string
  /** The plan key Checkout is opened with (the founding offer, or regular Sesli Pro). */
  planKey: 'sesli_pro_founding' | 'sesli_pro'
  aylik: string
  yillik: string
}

const yerlestir = (s: string, n: number | string) => s.replace('{n}', String(n)).replace('{p}', String(n))

export function istemIcerigi(
  ticari: { yukseltme?: YukseltmeMetni; fiyatlar?: { normal: FiyatGosterimi; kurucu?: FiyatGosterimi } } | null,
  istem: Pick<Istem, 'neden' | 'teklif' | 'kalanGun'>,
  sinirlar: { muayene: number; ses: number | null },
): IstemIcerigi | null {
  const m = ticari?.yukseltme
  const f = ticari?.fiyatlar
  if (!m || !f) return null
  const kurucu = istem.teklif === 'kurucu' && f.kurucu ? f.kurucu : null
  const fiyat = kurucu ?? f.normal
  const [baslik, govde] =
    istem.neden === 'bitti' ? [m.bittiBaslik, m.bittiGovde]
    : istem.neden === 'muayene' ? [yerlestir(m.muayeneBaslik, sinirlar.muayene), m.muayeneGovde]
    : istem.neden === 'ses' ? [yerlestir(m.sesBaslik, sinirlar.ses ?? ''), m.sesGovde]
    : [istem.kalanGun === 1 ? m.hatirlatmaBaslikBir : yerlestir(m.hatirlatmaBaslik, istem.kalanGun ?? ''), m.hatirlatmaGovde]
  return {
    baslik,
    govde,
    teklif: kurucu ? m.kurucuTeklif : m.normalTeklif,
    planKey: kurucu ? 'sesli_pro_founding' : 'sesli_pro',
    aylik: yerlestir(m.aylikDugme, fiyat.month),
    yillik: yerlestir(m.yillikDugme, fiyat.year),
  }
}

/** Which prompt a refused API answer calls for (the screen's API helper reports it). null = none. */
export function yanittanIstem(status: number, j: { code?: unknown; tur?: unknown } | null | undefined): IstemNedeni | null {
  if (status === 402 && j?.code === 'DENEME_BITTI') return 'bitti'
  if (status === 402 && j?.code === 'DENEME_MUAYENE') return 'muayene'
  // A paid plan's monthly voice minutes are not an upgrade moment; the trial's (or no plan's) are.
  if (status === 429 && j?.code === 'SES_DAKIKA' && j?.tur !== 'ucretli') return 'ses'
  return null
}
