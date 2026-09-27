/**
 * KBB-EXCEPTIONAL-01 — Timpanometri (Jerger A / B / C / Ad) karar desteği. SAF fonksiyon, LLM yok.
 *
 * Hekim tipi seçer; motor tanı koymaz (efüzyon / perforasyon / kemikçik kopukluğu ATANMAZ).
 * SUT işitme checklist'inde adı geçen ölçüm — eşik veya PTA uydurulmaz.
 */
import type { Dipnot, Yan } from './kbb'
import { YAN_AD } from './kbb'

export type TimpTip = 'A' | 'B' | 'C' | 'Ad'
export const TIMP_TIPLERI = ['A', 'B', 'C', 'Ad'] as const

/** Bant adları TİP dilidir, tanı dili değildir. */
export const TIMP_TIP_AD: Record<TimpTip, string> = {
  A: 'Tip A — tepe basıncı normal aralıkta',
  B: 'Tip B — düz eğri (tepe yok)',
  C: 'Tip C — negatif tepe basıncı',
  Ad: 'Tip Ad — yüksek kompliyans',
}

export const TIMP_KARAR: Record<TimpTip, string> = {
  A: 'Orta kulak basıncı normal aralıkta okunur; klinik anlam hekimin.',
  B: 'Düz eğri efüzyon, perforasyon veya teknik hatayı düşündürür — ayrım hekimin (otoskopi ile).',
  C: 'Negatif tepe östaki fonksiyonunu düşündürür; tanı ve izlem hekimin.',
  Ad: 'Yüksek kompliyans kemikçik süreksizliği veya gevşek zarı düşündürür; tanı hekimin.',
}

export function timpTipiGecerliMi(x: unknown): x is TimpTip {
  return typeof x === 'string' && (TIMP_TIPLERI as readonly string[]).includes(x)
}

export interface TimpKulak {
  yan: Yan
  tip: TimpTip | null
}

export interface TimpanometriGirdi {
  kulaklar: TimpKulak[]
  hekimNotu?: string
}

export interface TimpanometriSonuc {
  satirlar: string[]
  metin: string
  eksikler: string[]
  dipnot: Dipnot
}

const KILIT =
  'Timpanogram tipi karar desteğidir; efüzyon / perforasyon / kemikçik tanısı ve tedavi hekimindir. Notya tanı kilitlemez.'

export function timpanometriNotu(g: TimpanometriGirdi): TimpanometriSonuc {
  const satirlar: string[] = []
  const eksikler: string[] = []
  const isaretli = (g.kulaklar || []).filter((k) => timpTipiGecerliMi(k.tip))

  if (!isaretli.length) eksikler.push('En az bir kulak için timpanogram tipi seçilmedi')

  for (const k of isaretli) {
    const tip = k.tip as TimpTip
    satirlar.push(`${YAN_AD[k.yan] || k.yan}: ${TIMP_TIP_AD[tip]}. ${TIMP_KARAR[tip]}`)
  }

  const hekimNotu = String(g.hekimNotu || '').trim()
  if (hekimNotu) satirlar.push(`Hekim notu: ${hekimNotu.slice(0, 1000)}`)

  return {
    satirlar,
    metin: [...satirlar, KILIT].join('\n'),
    eksikler,
    dipnot: {
      ref: 'ODYOLOJI_SINIFLAMA',
      not: 'Jerger timpanogram tipleri (A / B / C / Ad) odyolojik sınıflama dilidir; tanı ve SUT endikasyonu hekimindir.',
    },
  }
}
