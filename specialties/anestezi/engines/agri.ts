/**
 * ANESTEZI-EXCEPTIONAL-01 — Post-op ağrı izlem. SAF fonksiyon.
 * Skor + bayrak + tarih. Analjezik / mg doz YOK.
 */
import { dozIceriyorMu, ISO_GUN, type Dipnot } from './anestezi'

export type AgriBayrak =
  | 'agri_skala_kaydi'
  | 'bolgesel_agri'
  | 'bulanti_kusma'
  | 'sedasyon_izlem'
  | 'analjezi_plan_hatirlat'
  | 'kontrol_agri_randevu'

export const AGRI_BAYRAKLAR: Array<{ kod: AgriBayrak; ad: string }> = [
  { kod: 'agri_skala_kaydi', ad: 'Ağrı skoru kaydı (0–10; ilaç dozu yazılmaz)' },
  { kod: 'bolgesel_agri', ad: 'Bölgesel ağrı izlemi' },
  { kod: 'bulanti_kusma', ad: 'Bulantı / kusma izlemi' },
  { kod: 'sedasyon_izlem', ad: 'Sedasyon / bilinç izlemi (doz yok)' },
  { kod: 'analjezi_plan_hatirlat', ad: 'Analjezi planı hatırlatması (doz hekimde)' },
  { kod: 'kontrol_agri_randevu', ad: 'Ağrı kontrol randevusu' },
]

export interface AgriKart {
  bayraklar: AgriBayrak[]
  agriSkor: number | null
  tarih: string | null
  not: string | null
}

export interface AgriSonuc {
  tamamMi: boolean
  kart: AgriKart
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string; due?: string | null }>
  dipnot: Dipnot
}

export function agriNormalize(ham: unknown): AgriKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const izinli = new Set(AGRI_BAYRAKLAR.map((b) => b.kod))
  const bayraklar = (Array.isArray(o.bayraklar) ? o.bayraklar.map(String) : []).filter((k): k is AgriBayrak => izinli.has(k as AgriBayrak))
  const skorHam = o.agriSkor ?? o.skor
  const skor = skorHam != null && Number.isFinite(Number(skorHam)) ? Math.max(0, Math.min(10, Math.round(Number(skorHam)))) : null
  const tarih = o.tarih != null && ISO_GUN.test(String(o.tarih).slice(0, 10)) ? String(o.tarih).slice(0, 10) : null
  return {
    bayraklar,
    agriSkor: skor,
    tarih,
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function agriSkorla(ham: unknown): AgriSonuc {
  const kart = agriNormalize(ham)
  const dipnot: Dipnot = { ref: 'TARD', not: 'Post-op ağrı izlemi karar desteğidir; doz hekimin' }
  if (!kart.bayraklar.length) {
    return { tamamMi: false, kart, ozet: 'En az bir ağrı izlem bayrağı seçin.', gorevOnerileri: [], dipnot }
  }
  if (kart.not && dozIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Notta mg / analjezik doz yazılamaz.', gorevOnerileri: [], dipnot }
  }
  const adlar = AGRI_BAYRAKLAR.filter((b) => kart.bayraklar.includes(b.kod)).map((b) => b.ad)
  const skorMetin = kart.agriSkor != null ? ` · skor ${kart.agriSkor}/10` : ''
  return {
    tamamMi: true,
    kart,
    ozet: `Post-op ağrı izlem: ${adlar.join('; ')}${skorMetin}${kart.tarih ? ` · ${kart.tarih}` : ''}. Analjezik dozu hekimin.`,
    gorevOnerileri: [{ kod: 'agri_izlem', ad: 'Post-op ağrı kontrolü', due: kart.tarih }],
    dipnot,
  }
}
