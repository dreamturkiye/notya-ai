/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — PPI / biyolojik rejim kartı (dates-only). SAF fonksiyon.
 * Yalnız başlangıç ve kontrol TARİHLERİ. Doz, mg, şema YOK.
 */
import { ISO_GUN } from './gastroenteroloji'

export interface RejimKart {
  ppiBaslangic: string | null
  ppiKontrol: string | null
  biyolojikBaslangic: string | null
  biyolojikKontrol: string | null
  not: string | null
}

export function rejimNormalize(ham: unknown): RejimKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  return {
    ppiBaslangic: tarih(o.ppiBaslangic ?? o.ppi_baslangic),
    ppiKontrol: tarih(o.ppiKontrol ?? o.ppi_kontrol),
    biyolojikBaslangic: tarih(o.biyolojikBaslangic ?? o.biyolojik_baslangic),
    biyolojikKontrol: tarih(o.biyolojikKontrol ?? o.biyolojik_kontrol),
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

/** Hasta-güvenli görev listesi — ilaç adı / doz yok. */
export function rejimGorevleri(r: RejimKart): Array<{ kod: string; ad: string; due: string }> {
  const out: Array<{ kod: string; ad: string; due: string }> = []
  if (r.ppiKontrol) out.push({ kod: 'rejim_ppi_kontrol', ad: 'Mide koruyucu rejim kontrol randevusu', due: r.ppiKontrol })
  if (r.biyolojikKontrol) out.push({ kod: 'rejim_biyolojik_kontrol', ad: 'Biyolojik tedavi kontrol randevusu', due: r.biyolojikKontrol })
  return out
}

export function rejimOzeti(r: RejimKart): string {
  const satirlar: string[] = []
  if (r.ppiBaslangic || r.ppiKontrol) {
    satirlar.push(`PPI rejim: başlangıç ${r.ppiBaslangic || '—'} · kontrol ${r.ppiKontrol || '—'} (doz hekimin)`)
  }
  if (r.biyolojikBaslangic || r.biyolojikKontrol) {
    satirlar.push(`Biyolojik rejim: başlangıç ${r.biyolojikBaslangic || '—'} · kontrol ${r.biyolojikKontrol || '—'} (doz hekimin)`)
  }
  if (r.not) satirlar.push(`Not: ${r.not}`)
  return satirlar.length ? satirlar.join('\n') : 'Rejim tarih kartı boş — doz yazılmaz.'
}

/** Doz / mg sızıntısı yakala (araç SSR + API kilidi). */
export function rejimDozIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|IU|Ü|U)\b|doz şeması|mg\/gün|mg\/kg/i.test(metin)
}
