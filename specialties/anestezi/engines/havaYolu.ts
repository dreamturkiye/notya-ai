/**
 * ANESTEZI-EXCEPTIONAL-01 — Hava yolu notu. SAF fonksiyon.
 * Yalnız bayraklar + tarihler. Entübasyon tekniği detayı / doz YOK.
 */
import { dozIceriyorMu, ISO_GUN, type Dipnot } from './anestezi'

export type HavaYoluBayrak =
  | 'mallampati_kaydi'
  | 'zor_hava_yolu_bayrak'
  | 'boyun_hareket_kisit'
  | 'dis_protez_notu'
  | 'obezite_osahs'
  | 'onceki_zor_entubasyon'

export const HAVA_YOLU_BAYRAKLAR: Array<{ kod: HavaYoluBayrak; ad: string }> = [
  { kod: 'mallampati_kaydi', ad: 'Mallampati / ağız açıklığı kaydı (yorum hekimde)' },
  { kod: 'zor_hava_yolu_bayrak', ad: 'Zor hava yolu bayrağı (tanı değil)' },
  { kod: 'boyun_hareket_kisit', ad: 'Boyun hareket kısıtlılığı notu' },
  { kod: 'dis_protez_notu', ad: 'Diş / protez / hareketli parça notu' },
  { kod: 'obezite_osahs', ad: 'Obezite / OSAHS risk bayrağı' },
  { kod: 'onceki_zor_entubasyon', ad: 'Önceki zor entübasyon öyküsü (detay hekimde)' },
]

export interface HavaYoluKart {
  bayraklar: HavaYoluBayrak[]
  tarih: string | null
  not: string | null
}

export interface HavaYoluSonuc {
  tamamMi: boolean
  kart: HavaYoluKart
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string; due?: string | null }>
  dipnot: Dipnot
}

export function havaYoluNormalize(ham: unknown): HavaYoluKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const izinli = new Set(HAVA_YOLU_BAYRAKLAR.map((b) => b.kod))
  const bayraklar = (Array.isArray(o.bayraklar) ? o.bayraklar.map(String) : []).filter((k): k is HavaYoluBayrak => izinli.has(k as HavaYoluBayrak))
  const tarih = o.tarih != null && ISO_GUN.test(String(o.tarih).slice(0, 10)) ? String(o.tarih).slice(0, 10) : null
  return {
    bayraklar,
    tarih,
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function havaYoluSkorla(ham: unknown): HavaYoluSonuc {
  const kart = havaYoluNormalize(ham)
  const dipnot: Dipnot = { ref: 'TARD', not: 'Hava yolu notu karar desteğidir; tanı ve doz hekimin' }
  if (!kart.bayraklar.length) {
    return { tamamMi: false, kart, ozet: 'En az bir hava yolu bayrağı seçin.', gorevOnerileri: [], dipnot }
  }
  if (kart.not && dozIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Notta mg / anestezik doz yazılamaz.', gorevOnerileri: [], dipnot }
  }
  const adlar = HAVA_YOLU_BAYRAKLAR.filter((b) => kart.bayraklar.includes(b.kod)).map((b) => b.ad)
  return {
    tamamMi: true,
    kart,
    ozet: `Hava yolu notu: ${adlar.join('; ')}${kart.tarih ? ` · ${kart.tarih}` : ''}. Tanı ve doz hekimin.`,
    gorevOnerileri: [{ kod: 'hava_yolu_izlem', ad: 'Hava yolu notu kontrolü', due: kart.tarih }],
    dipnot,
  }
}
