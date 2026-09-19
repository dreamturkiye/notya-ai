/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — Patoloji belge köprüsü. SAF fonksiyon.
 * Yalnız "rapor geldi / bekleniyor" + tarih. Patoloji tanısı / evre / ICD YOK.
 */
import { ISO_GUN } from './genel-cerrahi'
import type { Dipnot } from './genel-cerrahi'

export type PatolojiDurum = 'bekleniyor' | 'geldi' | 'hekim_gordü'

export const PATOLOJI_DURUM_AD: Record<PatolojiDurum, string> = {
  bekleniyor: 'Rapor bekleniyor',
  geldi: 'Rapor geldi',
  hekim_gordü: 'Hekim gördü',
}

export interface PatolojiKart {
  etiket: string | null
  durum: PatolojiDurum
  ornekTarihi: string | null
  raporTarihi: string | null
  not: string | null
}

export interface PatolojiSonuc {
  tamamMi: boolean
  kart: PatolojiKart
  ozet: string
  dipnot: Dipnot
}

export function patolojiYasakIceriyorMu(metin: string): boolean {
  return /malign|benign kesin|evre|stage|TNM|ICD-?\d|tanı kilit|kanser tanısı|metastaz/i.test(metin)
    || /\d+\s*(mg|mcg)\b/i.test(metin)
}

export function patolojiNormalize(ham: unknown): PatolojiKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const d = String(o.durum || 'bekleniyor')
  const durum: PatolojiDurum = (['bekleniyor', 'geldi', 'hekim_gordü'] as PatolojiDurum[]).includes(d as PatolojiDurum)
    ? (d as PatolojiDurum)
    : 'bekleniyor'
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  return {
    etiket: o.etiket ? String(o.etiket).slice(0, 80) : null,
    durum,
    ornekTarihi: tarih(o.ornekTarihi ?? o.ornek_tarihi),
    raporTarihi: tarih(o.raporTarihi ?? o.rapor_tarihi),
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function patolojiSkorla(ham: unknown): PatolojiSonuc {
  const kart = patolojiNormalize(ham)
  const dipnot: Dipnot = { ref: 'TCD', not: 'Patoloji köprüsü belge takibidir; tanı hekimde' }
  if (kart.not && patolojiYasakIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Patoloji notunda tanı/evre/doz yazılamaz — yalnız takip etiketi.', dipnot }
  }
  if (kart.etiket && patolojiYasakIceriyorMu(kart.etiket)) {
    return { tamamMi: false, kart, ozet: 'Etikette tanı/evre yazılamaz — örn. "Ameliyat materyali".', dipnot }
  }
  if (kart.durum !== 'bekleniyor' && !kart.raporTarihi) {
    return { tamamMi: false, kart, ozet: 'Rapor geldi / hekim gördü için rapor tarihi gerekli.', dipnot }
  }
  const parcalar = [
    kart.etiket ? `Etiket: ${kart.etiket}` : 'Patoloji takip',
    PATOLOJI_DURUM_AD[kart.durum],
    kart.ornekTarihi ? `Örnek: ${kart.ornekTarihi}` : null,
    kart.raporTarihi ? `Rapor: ${kart.raporTarihi}` : null,
  ].filter(Boolean)
  return {
    tamamMi: true,
    kart,
    ozet: `${parcalar.join(' · ')}. Belge köprüsü; patoloji tanısı hekim kilidinde.`,
    dipnot,
  }
}

export function patolojiGorevleri(k: PatolojiKart): Array<{ kod: string; ad: string; due: string | null }> {
  if (k.durum === 'bekleniyor') {
    return [{ kod: 'patoloji_bekliyor', ad: 'Patoloji raporu takibi', due: k.raporTarihi || k.ornekTarihi }]
  }
  if (k.durum === 'geldi') {
    return [{ kod: 'patoloji_hekim', ad: 'Patoloji raporu hekim incelemesi', due: k.raporTarihi }]
  }
  return []
}
