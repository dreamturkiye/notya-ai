/**
 * İzlem telafisi. Branş içeriği taşımaz.
 *
 * Pediatri aşı motoru resmi takvimi bağlar, sonra bırakılan yerden devam eder.
 * Özel Branş gün sayıları resmi takvim değildir: `dogrulandi` hep false,
 * cümle "öneri — hekim kilitler" der. Geçen adım silinmez; sıradaki, geçmemiş
 * ilk gündür.
 */
import { isoEkleGun, isoMu, vadeDurumu } from '@/lib/klinik/isoGun'

export const TELAVI_ROZET = 'öneri — hekim kilitler' as const

export type TelafiDurum = 'gecikti' | 'bugun' | 'yaklasiyor' | 'planli'

export type TelafiAdim = {
  ad: string
  iso: string
  durum: TelafiDurum
}

export type TelafiSonuc = {
  adimlar: TelafiAdim[]
  siradaki: TelafiAdim | null
  cumle: string
  rozet: typeof TELAVI_ROZET
  dogrulandi: false
}

export function durumSozcugu(durum: string): string {
  if (durum === 'gecikti') return 'gecikti'
  if (durum === 'bugun') return 'bugün'
  if (durum === 'yaklasiyor') return 'yaklaşıyor'
  if (durum === 'planli') return 'planlı'
  return ''
}

/** Başlangıç + gün → bugüne göre durum. Tarih bozuksa null. */
export function kontrolDurumu(baslangic: string, gun: number, bugun: string): TelafiDurum | null {
  if (!isoMu(baslangic) || !isoMu(bugun)) return null
  return vadeDurumu(bugun, isoEkleGun(baslangic, gun))
}

export function telafiIzlem(
  bugun: string,
  adimlar: ReadonlyArray<{ iso: string; ad: string }>,
): TelafiSonuc | { hata: string } {
  if (!isoMu(bugun)) return { hata: 'Bugün YYYY-MM-DD olmalı.' }
  const sirali: TelafiAdim[] = []
  for (const adim of adimlar) {
    if (!isoMu(adim.iso) || !adim.ad.trim()) continue
    const durum = vadeDurumu(bugun, adim.iso)
    if (!durum) continue
    sirali.push({ ad: adim.ad.trim(), iso: adim.iso, durum })
  }
  sirali.sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0))
  if (!sirali.length) return { hata: 'İzlem günü yok.' }
  const siradaki = sirali.find((a) => a.durum !== 'gecikti') || null
  const cumle = siradaki
    ? `Sıradaki: ${siradaki.ad} · ${siradaki.iso} · ${durumSozcugu(siradaki.durum)}. ${TELAVI_ROZET}.`
    : `Tüm kontrol günleri geçti. Hekim yeni plan kilitler. ${TELAVI_ROZET}.`
  return { adimlar: sirali, siradaki, cumle, rozet: TELAVI_ROZET, dogrulandi: false }
}
