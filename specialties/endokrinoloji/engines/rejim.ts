/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — İnsülin / tiroid rejim kartı (dates-only). SAF fonksiyon.
 * Yalnız başlangıç ve kontrol TARİHLERİ. Doz, ünite, mcg, şema YOK.
 */
import { ISO_GUN } from './endokrinoloji'

export interface RejimKart {
  insulinBaslangic: string | null
  insulinKontrol: string | null
  tiroidBaslangic: string | null
  tiroidKontrol: string | null
  not: string | null
}

export function rejimNormalize(ham: unknown): RejimKart {
  const o = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const tarih = (x: unknown) => {
    const s = x == null ? null : String(x).slice(0, 10)
    return s && ISO_GUN.test(s) ? s : null
  }
  return {
    insulinBaslangic: tarih(o.insulinBaslangic ?? o.insulin_baslangic),
    insulinKontrol: tarih(o.insulinKontrol ?? o.insulin_kontrol),
    tiroidBaslangic: tarih(o.tiroidBaslangic ?? o.tiroid_baslangic),
    tiroidKontrol: tarih(o.tiroidKontrol ?? o.tiroid_kontrol),
    not: o.not ? String(o.not).slice(0, 500) : null,
  }
}

/** Hasta-güvenli görev listesi — ilaç adı / doz yok. */
export function rejimGorevleri(r: RejimKart): Array<{ kod: string; ad: string; due: string }> {
  const out: Array<{ kod: string; ad: string; due: string }> = []
  if (r.insulinKontrol) out.push({ kod: 'rejim_insulin_kontrol', ad: 'İnsülin rejim kontrol randevusu', due: r.insulinKontrol })
  if (r.tiroidKontrol) out.push({ kod: 'rejim_tiroid_kontrol', ad: 'Tiroid rejim kontrol randevusu', due: r.tiroidKontrol })
  return out
}

export function rejimOzeti(r: RejimKart): string {
  const satirlar: string[] = []
  if (r.insulinBaslangic || r.insulinKontrol) {
    satirlar.push(`İnsülin rejim: başlangıç ${r.insulinBaslangic || '—'} · kontrol ${r.insulinKontrol || '—'} (doz hekimin)`)
  }
  if (r.tiroidBaslangic || r.tiroidKontrol) {
    satirlar.push(`Tiroid rejim: başlangıç ${r.tiroidBaslangic || '—'} · kontrol ${r.tiroidKontrol || '—'} (doz hekimin)`)
  }
  if (r.not) satirlar.push(`Not: ${r.not}`)
  return satirlar.length ? satirlar.join('\n') : 'Rejim tarih kartı boş — doz yazılmaz.'
}

/** Doz / ünite / mcg sızıntısı yakala (araç SSR + API kilidi). */
export function rejimDozIceriyorMu(metin: string): boolean {
  return /\d+\s*(mg|mcg|µg|ug|IU|Ü|U)\b|ünite|unite|doz şeması|sliding.?scale/i.test(metin)
}
