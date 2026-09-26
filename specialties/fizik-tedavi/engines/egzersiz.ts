/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — Ev egzersiz reçetesi (genel). SAF fonksiyon.
 * Egzersiz adı + set/tekrar hekim girdisidir. İlaç adı, mg, ml YOK.
 */
import type { Dipnot } from './fizik-tedavi'

export const EGZERSIZ_ORNEKLERI: readonly string[] = [
  'Pelvik tilt',
  'Köprü (bridge)',
  'Diz ekstansiyonu (oturarak)',
  'Kalça abduksiyonu (yan yatış)',
  'Omuz sarkaç (Codman)',
  'Boyun izometrik tutuş',
  'Duvarda kaydırma (wall slide)',
  'Yürüyüş programı (süreyi hekim yazar)',
  'Gerdirme / germe (hekim bölgesi)',
  'Denge / propriosepsiyon (hekim seçimi)',
]

export interface EgzersizMadde {
  ad: string
  set: number | null
  tekrar: number | null
  not?: string | null
}

export interface EgzersizSonuc {
  tamamMi: boolean
  ozet: string
  satirlar: string[]
  dipnot: Dipnot
}

export function egzersizRecetesi(maddeler: EgzersizMadde[]): EgzersizSonuc {
  const dipnot: Dipnot = { ref: 'TFTRD', not: 'Ev egzersiz reçetesi hekim onaylıdır; ilaç dozu değildir' }
  const temiz = (maddeler || [])
    .map((m) => ({
      ad: String(m.ad || '').trim(),
      set: m.set == null || Number.isNaN(Number(m.set)) ? null : Number(m.set),
      tekrar: m.tekrar == null || Number.isNaN(Number(m.tekrar)) ? null : Number(m.tekrar),
      not: m.not ? String(m.not).slice(0, 200) : null,
    }))
    .filter((m) => m.ad)
  if (!temiz.length) {
    return { tamamMi: false, ozet: 'En az bir egzersiz adı gerekli', satirlar: [], dipnot }
  }
  for (const m of temiz) {
    if (m.set != null && (m.set < 1 || m.set > 10)) {
      return { tamamMi: false, ozet: `Set 1–10 olmalı (${m.ad})`, satirlar: [], dipnot }
    }
    if (m.tekrar != null && (m.tekrar < 1 || m.tekrar > 50)) {
      return { tamamMi: false, ozet: `Tekrar 1–50 olmalı (${m.ad})`, satirlar: [], dipnot }
    }
  }
  const satirlar = temiz.map((m) => {
    const doz = [m.set != null ? `${m.set} set` : null, m.tekrar != null ? `${m.tekrar} tekrar` : null].filter(Boolean).join(' × ')
    return `${m.ad}${doz ? ` — ${doz}` : ''}${m.not ? ` (${m.not})` : ''}`
  })
  const ozet = `Ev egzersiz reçetesi (taslak, ilaç yok): ${satirlar.join('; ')}. Ağrı artarsa durun; acil durumda 112.`
  return { tamamMi: true, ozet, satirlar, dipnot }
}
