/**
 * NOTYA-OKUL-RAPOR-01 — Durum Bildirir Sağlık Raporları / Katılım Belgeleri.
 * Üç alt tür, aynı araç ailesinde, radio/tür seçimiyle:
 *   1. Spor katılım raporu — muayene + "spor yapmasında sakınca yoktur / vardır" sonucu.
 *   2. Kreş/okul öncesi sağlık raporu — bulaşıcı hastalık taraması + aşı takviminin tam olup olmadığı
 *      (aşı modülünden okunur, elle tekrar girilmez — bkz. app/api/doktor/araclar/katilim-raporu/route.ts).
 *   3. Okula başlama erteleme raporu — gelişimsel/bedensel gerekçe + erteleme önerisi. Nihai karar okul
 *      idaresi/RAM'dadır; Notya yalnız hekim raporunu üretir.
 */

export type KatilimRaporuTuru = 'spor' | 'kres' | 'erteleme'

export const KATILIM_RAPORU_TURLERI: ReadonlyArray<{
  id: KatilimRaporuTuru
  etiket: string
  aciklama: string
}> = [
  { id: 'spor', etiket: 'Spor katılım raporu', aciklama: 'Muayene + spor yapmasında sakınca olup olmadığı sonucu' },
  { id: 'kres', etiket: 'Kreş / okul öncesi sağlık raporu', aciklama: 'Bulaşıcı hastalık taraması + aşı takviminin tam olup olmadığı (aşı modülünden okunur)' },
  { id: 'erteleme', etiket: 'Okula başlama erteleme raporu', aciklama: "Gelişimsel/bedensel gerekçe + erteleme önerisi — nihai karar okul idaresi/RAM'da" },
]

export function katilimTuruGecerliMi(v: string): v is KatilimRaporuTuru {
  return KATILIM_RAPORU_TURLERI.some((t) => t.id === v)
}

export type SporSonucu = { sakinca: 'yok' | 'var'; not?: string }
export type KresSonucu = { bulasiciTaramaBulgusu: string; asiTakvimiTamMi: boolean | null; asiNotu?: string }
export type ErtelemeSonucu = { gerekce: string; onerilenErteleme: boolean }
export type KatilimSonucu = SporSonucu | KresSonucu | ErtelemeSonucu

/** Gövdeden gelen sonuç nesnesini türüne göre doğrular/temizler; eksikse null döner (reddedilir). */
export function katilimSonucuDogrula(tur: KatilimRaporuTuru, ham: unknown): KatilimSonucu | null {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  if (tur === 'spor') {
    const sakinca = g.sakinca === 'var' ? 'var' : g.sakinca === 'yok' ? 'yok' : null
    if (!sakinca) return null
    return { sakinca, not: typeof g.not === 'string' ? g.not.trim().slice(0, 500) : undefined }
  }
  if (tur === 'kres') {
    const bulgusu = String(g.bulasiciTaramaBulgusu || '').trim()
    if (!bulgusu) return null
    return {
      bulasiciTaramaBulgusu: bulgusu.slice(0, 500),
      asiTakvimiTamMi: typeof g.asiTakvimiTamMi === 'boolean' ? g.asiTakvimiTamMi : null,
      asiNotu: typeof g.asiNotu === 'string' ? g.asiNotu.trim().slice(0, 300) : undefined,
    }
  }
  // erteleme
  const gerekce = String(g.gerekce || '').trim()
  if (!gerekce) return null
  return { gerekce: gerekce.slice(0, 1000), onerilenErteleme: g.onerilenErteleme === true }
}
