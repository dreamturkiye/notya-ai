/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Görüntü / belge köprüsü. SAF fonksiyon.
 * Tarih + etiket + isteğe bağlı belge id. Tanı / AI rapor yorumu YOK.
 */
import { ISO_GUN, type Dipnot } from './beyin'

export interface GoruntuKart {
  sonraki: string | null
  etiket: string
  belgeId: string | null
}

export interface GoruntuSonuc {
  tamamMi: boolean
  kart: GoruntuKart
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string; due: string }>
  dipnot: Dipnot
}

export function goruntuNormalize(ham: unknown): GoruntuKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = o.sonraki != null && ISO_GUN.test(String(o.sonraki).slice(0, 10))
    ? String(o.sonraki).slice(0, 10)
    : (o.tarih != null && ISO_GUN.test(String(o.tarih).slice(0, 10)) ? String(o.tarih).slice(0, 10) : null)
  return {
    sonraki: tarih,
    etiket: String(o.etiket || 'Görüntü / rapor kontrolü').slice(0, 80),
    belgeId: o.belgeId ? String(o.belgeId).slice(0, 64) : null,
  }
}

export function goruntuSkorla(ham: unknown): GoruntuSonuc {
  const kart = goruntuNormalize(ham)
  const dipnot: Dipnot = { ref: 'TND_NOROS', not: 'Görüntü köprüsü zaman çizelgesidir; tanı yazılmaz' }
  if (!kart.sonraki) {
    return { tamamMi: false, kart, ozet: 'Görüntü / belge tarihi YYYY-AA-GG olmalı.', gorevOnerileri: [], dipnot }
  }
  if (/tanı|tani|ICD|glikom|metastaz|malign/i.test(kart.etiket)) {
    return { tamamMi: false, kart, ozet: 'Etikette tanı dili yazılamaz — yalnız modalite / kontrol etiketi.', gorevOnerileri: [], dipnot }
  }
  return {
    tamamMi: true,
    kart,
    ozet: `Görüntü belge köprüsü: ${kart.etiket} · ${kart.sonraki}${kart.belgeId ? ` · belge bağlandı` : ''} (tanı yazılmaz).`,
    gorevOnerileri: [{ kod: 'goruntu_izlem', ad: kart.etiket, due: kart.sonraki }],
    dipnot,
  }
}
