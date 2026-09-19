/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — Patoloji köprü. SAF fonksiyon.
 * Örnek / rapor tarihleri + "hazır" bayrağı. Tanı adı, ICD, evre, doz YOK.
 */
import { ISO_GUN } from './gogus-cerrahisi'
import type { Dipnot } from './gogus-cerrahisi'

export interface PatolojiKart {
  ornekTarihi: string | null
  raporHazirTarihi: string | null
  hazir: boolean
  not: string | null
}

export interface PatolojiSonuc {
  tamamMi: boolean
  kart: PatolojiKart
  ozet: string
  gorevOnerileri: Array<{ kod: string; ad: string; due?: string }>
  dipnot: Dipnot
}

/** Tanı / ICD / doz / CAT sızıntısı. */
export function patolojiYasakIceriyorMu(metin: string): boolean {
  return /tanı|tani|ICD|evre|stage|TNM|kanser|malign|benign|karsinom|adenokarsinom|\d+\s*mg\b|CAT\b|mMRC/i.test(metin)
}

export function patolojiNormalize(ham: unknown): PatolojiKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  return {
    ornekTarihi: tarih(o.ornekTarihi ?? o.ornek_tarihi),
    raporHazirTarihi: tarih(o.raporHazirTarihi ?? o.rapor_hazir_tarihi),
    hazir: o.hazir === true,
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

export function patolojiSkorla(ham: unknown): PatolojiSonuc {
  const kart = patolojiNormalize(ham)
  const dipnot: Dipnot = { ref: 'TTD_CERRAHI', not: 'Patoloji köprü karar desteğidir; tanı hekimde' }
  if (!kart.ornekTarihi && !kart.raporHazirTarihi && !kart.hazir) {
    return { tamamMi: false, kart, ozet: 'Örnek tarihi, rapor tarihi veya "rapor hazır" gerekli.', gorevOnerileri: [], dipnot }
  }
  if (kart.not && patolojiYasakIceriyorMu(kart.not)) {
    return { tamamMi: false, kart, ozet: 'Patoloji notunda tanı / ICD / doz / CAT yazılamaz — yalnız tarih köprüsü.', gorevOnerileri: [], dipnot }
  }
  const gorevOnerileri: PatolojiSonuc['gorevOnerileri'] = []
  if (!kart.hazir && kart.raporHazirTarihi) {
    gorevOnerileri.push({ kod: 'patoloji_rapor', ad: 'Patoloji raporu kontrolü', due: kart.raporHazirTarihi })
  } else if (!kart.hazir) {
    gorevOnerileri.push({ kod: 'patoloji_rapor', ad: 'Patoloji raporu bekleniyor' })
  }
  const parcalar = [
    kart.ornekTarihi ? `Örnek: ${kart.ornekTarihi}` : null,
    kart.hazir ? 'Rapor hazır (hekim değerlendirmesi)' : 'Rapor bekleniyor',
    kart.raporHazirTarihi ? `Rapor tarihi: ${kart.raporHazirTarihi}` : null,
  ].filter(Boolean)
  return {
    tamamMi: true,
    kart,
    ozet: `Patoloji köprü · ${parcalar.join(' · ')}. Tanı yazılmaz; hekim değerlendirir.`,
    gorevOnerileri,
    dipnot,
  }
}
