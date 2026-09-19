/**
 * ENFEKSIYON-EXCEPTIONAL-01 — İzolasyon / bildirim hatırlatma. SAF fonksiyon.
 * Tip + başlangıç/bitiş/bildirim tarihleri. Hastane HIS / sürveyans paneli YOK.
 */
import type { Dipnot } from './enfeksiyon'
import { ISO_GUN } from './enfeksiyon'

export type IzolasyonTip = 'temas' | 'damlacik' | 'solunum' | 'standart' | 'diger'

export const IZOLASYON_TIP_AD: Record<IzolasyonTip, string> = {
  temas: 'Temas izolasyonu',
  damlacik: 'Damlacık izolasyonu',
  solunum: 'Solunum (havayolu) izolasyonu',
  standart: 'Standart önlemler',
  diger: 'Diğer / hekim etiketi',
}

export interface IzolasyonKart {
  tip: IzolasyonTip
  baslangic: string | null
  bitis: string | null
  bildirimTarihi: string | null
  not: string | null
}

export interface IzolasyonSonuc {
  tamamMi: boolean
  kart: IzolasyonKart
  ozet: string
  dipnot: Dipnot
}

export function izolasyonNormalize(ham: unknown): IzolasyonKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  const tipHam = String(o.tip || 'standart')
  const tip = (['temas', 'damlacik', 'solunum', 'standart', 'diger'].includes(tipHam) ? tipHam : 'standart') as IzolasyonTip
  return {
    tip,
    baslangic: tarih(o.baslangic),
    bitis: tarih(o.bitis),
    bildirimTarihi: tarih(o.bildirimTarihi ?? o.bildirim_tarihi),
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function izolasyonPlanla(ham: unknown): IzolasyonSonuc {
  const kart = izolasyonNormalize(ham)
  const dipnot: Dipnot = { ref: 'SB_IZOLASYON', not: 'İzolasyon/bildirim hatırlatması ayaktan ürün; full HIS out' }
  if (!kart.baslangic && !kart.bitis && !kart.bildirimTarihi) {
    return { tamamMi: false, kart, ozet: 'En az bir tarih (başlangıç, bitiş veya bildirim) gerekli', dipnot }
  }
  const parcalar = [
    IZOLASYON_TIP_AD[kart.tip],
    kart.baslangic ? `başlangıç ${kart.baslangic}` : null,
    kart.bitis ? `bitiş ${kart.bitis}` : null,
    kart.bildirimTarihi ? `bildirim ${kart.bildirimTarihi}` : null,
  ].filter(Boolean)
  return {
    tamamMi: true,
    kart,
    ozet: `İzolasyon / bildirim: ${parcalar.join(' · ')}. Tanı yazılmaz; hastane HIS bu araçta yoktur.`,
    dipnot,
  }
}

export function izolasyonGorevleri(k: IzolasyonKart): Array<{ kod: string; ad: string; due: string }> {
  const out: Array<{ kod: string; ad: string; due: string }> = []
  if (k.bitis) out.push({ kod: 'izolasyon_bitis', ad: 'İzolasyon bitiş kontrolü', due: k.bitis })
  if (k.bildirimTarihi) out.push({ kod: 'bildirim_hatirlatma', ad: 'Bildirim / sürveyans hatırlatması', due: k.bildirimTarihi })
  return out
}

export const IZOLASYON_KONTROL_LISTESI: readonly string[] = [
  'İzolasyon tipi hekim tarafından seçildi',
  'Başlangıç / bitiş tarihleri kaydedildi',
  'Bildirim yükümlülüğü değerlendirildi (varsa tarih)',
  'Hasta / yakın bilgilendirildi (tanı dili yok)',
  'Hastane enfeksiyon kontrolü full HIS bu üründe yoktur',
]
