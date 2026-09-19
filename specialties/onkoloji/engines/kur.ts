/**
 * ONKOLOJI-EXCEPTIONAL-01 — Tedavi döngü / kür sayacı. SAF fonksiyon.
 * Yalnız kür numarası + tarihler. Protokol dozu, mg/m², AUC, BSA hesap YOK.
 */
import { ISO_GUN, gunEkle } from './onkoloji'
import type { Dipnot } from './onkoloji'

export interface KurKart {
  protokolEtiket: string | null
  mevcutKur: number | null
  toplamKur: number | null
  sonKurTarihi: string | null
  sonrakiKurTarihi: string | null
  not: string | null
}

export interface KurSonuc {
  tamamMi: boolean
  kart: KurKart
  ozet: string
  dipnot: Dipnot
}

export function kurNormalize(ham: unknown): KurKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  const sayi = (x: unknown) => {
    if (x == null || x === '') return null
    const n = Number(x)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null
  }
  return {
    protokolEtiket: o.protokolEtiket || o.protokol_etiket ? String(o.protokolEtiket ?? o.protokol_etiket).slice(0, 80) : null,
    mevcutKur: sayi(o.mevcutKur ?? o.mevcut_kur),
    toplamKur: sayi(o.toplamKur ?? o.toplam_kur),
    sonKurTarihi: tarih(o.sonKurTarihi ?? o.son_kur_tarihi),
    sonrakiKurTarihi: tarih(o.sonrakiKurTarihi ?? o.sonraki_kur_tarihi),
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

/** Doz / BSA / AUC / mg/m² sızıntısı (araç + API kilidi). */
export function kurDozIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|mg\/m|mg\/m2|mg\/m²|AUC|BSA|kg)\b|doz şeması|pharmacy.?dose|inf[üu]zyon h[ıi]z[ıi]/i.test(metin)
}

export function kurSkorla(ham: unknown): KurSonuc {
  const kart = kurNormalize(ham)
  const dipnot: Dipnot = { ref: 'TTOD', not: 'Kür sayacı karar desteğidir; doz ve protokol hekimin' }
  if (kart.mevcutKur == null) {
    return { tamamMi: false, kart, ozet: 'Mevcut kür numarası gerekli — doz yazılmaz.', dipnot }
  }
  if (kart.toplamKur != null && kart.mevcutKur > kart.toplamKur) {
    return { tamamMi: false, kart, ozet: 'Mevcut kür, planlanan toplam kürden büyük olamaz.', dipnot }
  }
  if (kart.not && kurDozIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Kür notunda doz / mg/m² / AUC yazılamaz.', dipnot }
  }
  if (kart.protokolEtiket && kurDozIceriyorMu(kart.protokolEtiket)) {
    return { tamamMi: false, kart, ozet: 'Protokol etiketinde doz birimi yazılamaz — yalnız hekim etiketi.', dipnot }
  }
  const parcalar = [
    kart.protokolEtiket ? `Protokol etiketi: ${kart.protokolEtiket}` : null,
    `Kür ${kart.mevcutKur}${kart.toplamKur != null ? ` / ${kart.toplamKur}` : ''}`,
    kart.sonKurTarihi ? `Son kür: ${kart.sonKurTarihi}` : null,
    kart.sonrakiKurTarihi ? `Sonraki kür: ${kart.sonrakiKurTarihi}` : null,
  ].filter(Boolean)
  return {
    tamamMi: true,
    kart,
    ozet: `${parcalar.join(' · ')}. Kür sayacı karar desteğidir; doz/protokol hekimin.`,
    dipnot,
  }
}

export function kurGorevleri(k: KurKart): Array<{ kod: string; ad: string; due: string }> {
  const out: Array<{ kod: string; ad: string; due: string }> = []
  if (k.sonrakiKurTarihi) out.push({ kod: 'kur_sonraki', ad: 'Tedavi / kür günü', due: k.sonrakiKurTarihi })
  return out
}

/** Önerilen sonraki kür tarihi (hekim aralığı girer; varsayılan 21 gün — karar desteği). */
export function sonrakiKurOneri(sonKur: string | null, aralikGun = 21): string | null {
  if (!sonKur || !ISO_GUN.test(sonKur)) return null
  return gunEkle(sonKur, aralikGun)
}
