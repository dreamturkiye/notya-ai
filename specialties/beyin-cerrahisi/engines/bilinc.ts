/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Nöbet / bilinç izlem. SAF fonksiyon.
 * Yalnız bayraklar + tarihler. Tanı adı ve AED dozu YOK.
 */
import { aedDozIceriyorMu, ISO_GUN, type Dipnot } from './beyin'

export type BilincBayrak =
  | 'nobet_gozlemi'
  | 'bilinc_degisikligi'
  | 'glasgow_kaydi'
  | 'pupil_asimetri'
  | 'yeni_fokal_bulgu'
  | 'ilac_uyumu_hatirlat'

export const BILINC_BAYRAKLAR: Array<{ kod: BilincBayrak; ad: string }> = [
  { kod: 'nobet_gozlemi', ad: 'Nöbet gözlemi kaydı (tanı değil)' },
  { kod: 'bilinc_degisikligi', ad: 'Bilinç düzeyi değişikliği izlemi' },
  { kod: 'glasgow_kaydi', ad: 'Glasgow / bilinç skoru kaydı (yorum hekimde)' },
  { kod: 'pupil_asimetri', ad: 'Pupil asimetri / ışık refleksi notu' },
  { kod: 'yeni_fokal_bulgu', ad: 'Yeni fokal bulgu izlemi' },
  { kod: 'ilac_uyumu_hatirlat', ad: 'İlaç uyumu hatırlatması (doz yazılmaz)' },
]

export interface BilincKart {
  bayraklar: BilincBayrak[]
  tarih: string | null
  not: string | null
}

export interface BilincSonuc {
  tamamMi: boolean
  kart: BilincKart
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string; due?: string | null }>
  dipnot: Dipnot
}

export function bilincNormalize(ham: unknown): BilincKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const izinli = new Set(BILINC_BAYRAKLAR.map((b) => b.kod))
  const bayraklar = (Array.isArray(o.bayraklar) ? o.bayraklar.map(String) : []).filter((k): k is BilincBayrak => izinli.has(k as BilincBayrak))
  const tarih = o.tarih != null && ISO_GUN.test(String(o.tarih).slice(0, 10)) ? String(o.tarih).slice(0, 10) : null
  return {
    bayraklar,
    tarih,
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function bilincSkorla(ham: unknown): BilincSonuc {
  const kart = bilincNormalize(ham)
  const dipnot: Dipnot = { ref: 'TND_NOROS', not: 'Nöbet/bilinç bayrağı karar desteğidir; tanı ve AED dozu hekimin' }
  if (!kart.bayraklar.length) {
    return { tamamMi: false, kart, ozet: 'En az bir nöbet/bilinç bayrağı seçin.', gorevOnerileri: [], dipnot }
  }
  if (kart.not && aedDozIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Notta AED / mg doz yazılamaz.', gorevOnerileri: [], dipnot }
  }
  const adlar = BILINC_BAYRAKLAR.filter((b) => kart.bayraklar.includes(b.kod)).map((b) => b.ad)
  return {
    tamamMi: true,
    kart,
    ozet: `Nöbet/bilinç izlem: ${adlar.join('; ')}${kart.tarih ? ` · ${kart.tarih}` : ''}. Tanı ve AED dozu hekimin.`,
    gorevOnerileri: [{ kod: 'bilinc_izlem', ad: 'Nöbet / bilinç izlem kontrolü', due: kart.tarih }],
    dipnot,
  }
}
