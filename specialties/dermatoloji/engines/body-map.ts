/**
 * Body-map pins. Node ids are specialty metadata; pixels stay in core görüntüleme.
 */
import type { Lesion, PhotoAsset, TotalBodyMap } from '../schema'
import { pinNode } from '../imaging/total-body-map'

export type BodyPin = {
  nodeId: string
  lesionId: string
  region: string
  photoIds: string[]
}

export function pinLesion(map: TotalBodyMap, lesion: Lesion): { map: TotalBodyMap; pin: BodyPin } {
  const nodeId = lesion.body_map_node ?? `node-${lesion.id}`
  return {
    map: pinNode(map, nodeId),
    pin: { nodeId, lesionId: lesion.id, region: lesion.region, photoIds: [] },
  }
}

export function attachPhotosToPin(pin: BodyPin, photos: PhotoAsset[]): BodyPin {
  return {
    ...pin,
    photoIds: photos.filter((p) => p.lesionId === pin.lesionId).map((p) => p.id),
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// DERM-EXCEPTIONAL-01 — tıklanabilir bölge şeması. Bölge kataloğu burada (pure);
// UI yalnız çizer. nodeId modelde kalır (`total_body_map.nodeIds`) — şema değişmez.
// ──────────────────────────────────────────────────────────────────────────────

export type BodyYuz = 'on' | 'arka'
/** PASI / EASI bölge katsayısına eşlenen üst bölge */
export type PasiBolgesi = 'head' | 'upper' | 'trunk' | 'lower'

export type BodyBolge = {
  /** nodeId olarak saklanan kod */
  kod: string
  ad: string
  yuz: BodyYuz
  pasi: PasiBolgesi
  /** yüzde (%) kutu düzeni — UI div/SVG yerleşimi: sol, üst, genişlik, yükseklik */
  kutu: { x: number; y: number; w: number; h: number }
}

/**
 * Poliklinikte kullanılan kaba bölge şeması (ön / arka). Wallace "dokuzlar kuralı" yüzdesi
 * değildir — yalnız işaretleme ızgarasıdır; alan yüzdesini hekim PASI/EASI alan skorunda girer.
 */
export const BODY_BOLGELERI: BodyBolge[] = [
  // ── Ön yüz ──
  { kod: 'on-sacli-deri', ad: 'Saçlı deri', yuz: 'on', pasi: 'head', kutu: { x: 40, y: 1, w: 20, h: 6 } },
  { kod: 'on-yuz', ad: 'Yüz', yuz: 'on', pasi: 'head', kutu: { x: 40, y: 7, w: 20, h: 7 } },
  { kod: 'on-boyun', ad: 'Boyun (ön)', yuz: 'on', pasi: 'head', kutu: { x: 42, y: 14, w: 16, h: 4 } },
  { kod: 'on-gogus', ad: 'Göğüs', yuz: 'on', pasi: 'trunk', kutu: { x: 34, y: 18, w: 32, h: 12 } },
  { kod: 'on-karin', ad: 'Karın', yuz: 'on', pasi: 'trunk', kutu: { x: 34, y: 30, w: 32, h: 12 } },
  { kod: 'on-kasik', ad: 'Kasık / genital', yuz: 'on', pasi: 'trunk', kutu: { x: 40, y: 42, w: 20, h: 7 } },
  { kod: 'on-sag-kol', ad: 'Sağ kol (ön)', yuz: 'on', pasi: 'upper', kutu: { x: 18, y: 19, w: 15, h: 18 } },
  { kod: 'on-sol-kol', ad: 'Sol kol (ön)', yuz: 'on', pasi: 'upper', kutu: { x: 67, y: 19, w: 15, h: 18 } },
  { kod: 'on-sag-el', ad: 'Sağ el (avuç / sırt)', yuz: 'on', pasi: 'upper', kutu: { x: 16, y: 37, w: 15, h: 8 } },
  { kod: 'on-sol-el', ad: 'Sol el (avuç / sırt)', yuz: 'on', pasi: 'upper', kutu: { x: 69, y: 37, w: 15, h: 8 } },
  { kod: 'on-sag-bacak', ad: 'Sağ bacak (ön)', yuz: 'on', pasi: 'lower', kutu: { x: 34, y: 49, w: 15, h: 32 } },
  { kod: 'on-sol-bacak', ad: 'Sol bacak (ön)', yuz: 'on', pasi: 'lower', kutu: { x: 51, y: 49, w: 15, h: 32 } },
  { kod: 'on-sag-ayak', ad: 'Sağ ayak', yuz: 'on', pasi: 'lower', kutu: { x: 34, y: 81, w: 15, h: 8 } },
  { kod: 'on-sol-ayak', ad: 'Sol ayak', yuz: 'on', pasi: 'lower', kutu: { x: 51, y: 81, w: 15, h: 8 } },
  // ── Arka yüz ──
  { kod: 'arka-sacli-deri', ad: 'Saçlı deri (arka)', yuz: 'arka', pasi: 'head', kutu: { x: 40, y: 1, w: 20, h: 6 } },
  { kod: 'arka-ense', ad: 'Ense', yuz: 'arka', pasi: 'head', kutu: { x: 42, y: 7, w: 16, h: 6 } },
  { kod: 'arka-ust-sirt', ad: 'Üst sırt', yuz: 'arka', pasi: 'trunk', kutu: { x: 34, y: 13, w: 32, h: 14 } },
  { kod: 'arka-alt-sirt', ad: 'Alt sırt / bel', yuz: 'arka', pasi: 'trunk', kutu: { x: 34, y: 27, w: 32, h: 12 } },
  { kod: 'arka-kalca', ad: 'Kalça / gluteal', yuz: 'arka', pasi: 'lower', kutu: { x: 36, y: 39, w: 28, h: 10 } },
  { kod: 'arka-sag-kol', ad: 'Sağ kol (arka)', yuz: 'arka', pasi: 'upper', kutu: { x: 18, y: 15, w: 15, h: 18 } },
  { kod: 'arka-sol-kol', ad: 'Sol kol (arka)', yuz: 'arka', pasi: 'upper', kutu: { x: 67, y: 15, w: 15, h: 18 } },
  { kod: 'arka-sag-dirsek', ad: 'Sağ dirsek (ekstansör)', yuz: 'arka', pasi: 'upper', kutu: { x: 16, y: 33, w: 15, h: 7 } },
  { kod: 'arka-sol-dirsek', ad: 'Sol dirsek (ekstansör)', yuz: 'arka', pasi: 'upper', kutu: { x: 69, y: 33, w: 15, h: 7 } },
  { kod: 'arka-sag-bacak', ad: 'Sağ bacak (arka)', yuz: 'arka', pasi: 'lower', kutu: { x: 34, y: 49, w: 15, h: 32 } },
  { kod: 'arka-sol-bacak', ad: 'Sol bacak (arka)', yuz: 'arka', pasi: 'lower', kutu: { x: 51, y: 49, w: 15, h: 32 } },
  { kod: 'arka-sag-topuk', ad: 'Sağ topuk / taban', yuz: 'arka', pasi: 'lower', kutu: { x: 34, y: 81, w: 15, h: 8 } },
  { kod: 'arka-sol-topuk', ad: 'Sol topuk / taban', yuz: 'arka', pasi: 'lower', kutu: { x: 51, y: 81, w: 15, h: 8 } },
]

export function bolgeAdi(kod: string): string {
  return BODY_BOLGELERI.find((b) => b.kod === kod)?.ad ?? kod
}

export function yuzBolgeleri(yuz: BodyYuz): BodyBolge[] {
  return BODY_BOLGELERI.filter((b) => b.yuz === yuz)
}

/** Genital / kasık bölgesi — ek onam gerektiren fotoğraf alanı (consent-kvkk ile aynı ilke). */
export function ekOnamGerekliBolge(kod: string): boolean {
  return /kasik|genital/.test(kod)
}

/** İşaretli nodeId listesini PASI/EASI bölgelerine göre sayar — skor sayfasına ipucu. */
export function pasiBolgeDagilimi(nodeIds: string[]): Record<PasiBolgesi, number> {
  const out: Record<PasiBolgesi, number> = { head: 0, upper: 0, trunk: 0, lower: 0 }
  for (const id of nodeIds) {
    const b = BODY_BOLGELERI.find((x) => x.kod === id)
    if (b) out[b.pasi] += 1
  }
  return out
}

/** nodeId ekle / çıkar (tekilleştirilmiş, sırası korunur). */
export function nodeToggle(nodeIds: string[], kod: string): string[] {
  return nodeIds.includes(kod) ? nodeIds.filter((n) => n !== kod) : [...nodeIds, kod]
}

/** Lezyon bölge metnini bilinen bir şema koduna eşlemeyi dener (serbest metin desteği). */
export function bolgeKoduTahmin(region: string | null | undefined): string | null {
  const r = String(region || '').toLocaleLowerCase('tr-TR')
  if (!r) return null
  const tam = BODY_BOLGELERI.find((b) => b.kod === r)
  if (tam) return tam.kod
  const ad = BODY_BOLGELERI.find((b) => b.ad.toLocaleLowerCase('tr-TR') === r)
  if (ad) return ad.kod
  if (/dirsek/.test(r)) return /sol/.test(r) ? 'arka-sol-dirsek' : 'arka-sag-dirsek'
  if (/saçlı|sacli|skalp/.test(r)) return 'on-sacli-deri'
  if (/sırt|sirt/.test(r)) return 'arka-ust-sirt'
  if (/karın|karin/.test(r)) return 'on-karin'
  if (/yüz|yuz/.test(r)) return 'on-yuz'
  return null
}
