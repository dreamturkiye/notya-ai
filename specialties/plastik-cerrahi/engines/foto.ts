/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — Foto zaman çizgisi köprü. SAF fonksiyon.
 * Yalnız tarih + etiket. AI tanı, morfoloji, skor YOK. Dermatoloji Derim'e sızmaz.
 */
import { ISO_GUN, dozVeyaTaniKilidiIceriyorMu } from './plastik'
import type { Dipnot } from './plastik'

export interface FotoKart {
  tarih: string | null
  etiket: string | null
  sonrakiKontrol: string | null
  not: string | null
}

export interface FotoSonuc {
  tamamMi: boolean
  kart: FotoKart
  ozet: string
  dipnot: Dipnot
}

export const FOTO_ETIKET_ONERILERI = [
  'Preop referans foto',
  'Erken postop foto',
  'Pansuman değişimi foto',
  'Kontrol foto',
  'Geç dönem izlem foto',
] as const

export function fotoNormalize(ham: unknown): FotoKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  return {
    tarih: tarih(o.tarih),
    etiket: o.etiket ? String(o.etiket).slice(0, 80) : null,
    sonrakiKontrol: tarih(o.sonrakiKontrol ?? o.sonraki_kontrol),
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function fotoSkorla(ham: unknown): FotoSonuc {
  const kart = fotoNormalize(ham)
  const dipnot: Dipnot = { ref: 'TPRECD', not: 'Foto zaman çizgisi köprüdür; AI tanı / morfoloji yazılmaz' }
  if (!kart.tarih) {
    return { tamamMi: false, kart, ozet: 'Foto tarihi YYYY-AA-GG gerekli.', dipnot }
  }
  if (!kart.etiket) {
    return { tamamMi: false, kart, ozet: 'Foto etiketi gerekli — tanı yazılmaz.', dipnot }
  }
  if (dozVeyaTaniKilidiIceriyorMu(kart.etiket) || (kart.not && dozVeyaTaniKilidiIceriyorMu(kart.not))) {
    return { tamamMi: false, kart, ozet: 'Etiket/notta doz, tanı kilidi veya OR planı yazılamaz.', dipnot }
  }
  if (/PASI|EASI|Fitzpatrick|melanom|basal|skuam[öo]z/i.test(kart.etiket + (kart.not || ''))) {
    return { tamamMi: false, kart, ozet: 'Dermatoloji skor / tanı dili bu köprüye yazılmaz — yalnız tarih+etiket.', dipnot }
  }
  const parcalar = [
    `Foto: ${kart.etiket}`,
    kart.tarih,
    kart.sonrakiKontrol ? `Sonraki foto/kontrol: ${kart.sonrakiKontrol}` : null,
  ].filter(Boolean)
  return {
    tamamMi: true,
    kart,
    ozet: `${parcalar.join(' · ')}. Foto zaman çizgisi karar desteğidir; AI tanı yok.`,
    dipnot,
  }
}

export function fotoGorevleri(k: FotoKart): Array<{ kod: string; ad: string; due: string }> {
  if (k.sonrakiKontrol) {
    return [{ kod: 'foto_kontrol', ad: k.etiket ? `Foto kontrol: ${k.etiket}` : 'Foto / kontrol zaman çizgisi', due: k.sonrakiKontrol }]
  }
  return []
}
