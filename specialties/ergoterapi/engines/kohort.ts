import { vadeDurumu, isoMu } from '@/lib/klinik/isoGun'

export type VadeSatir = { durum: 'gecikti' | 'bugun' | 'yaklasiyor'; ozet: string; vade: string }

const YASAK = /kcal|mL|ünite|doz|tanı|greft|\bdB\b/i

/** GYA izlemi — başka dalın etiketi bu dosyada yok. */
export function vadeKohort(vadeler: Array<{ iso?: string; ad?: string }>, bugun: string): VadeSatir[] {
  const out: VadeSatir[] = []
  for (const v of vadeler) {
    const iso = String(v.iso || '')
    const ad = String(v.ad || '').trim()
    if (!isoMu(iso) || !ad || YASAK.test(ad)) continue
    const durum = vadeDurumu(bugun, iso)
    if (durum !== 'gecikti' && durum !== 'bugun' && durum !== 'yaklasiyor') continue
    out.push({ durum, ozet: `GYA izlemi · ${ad}`, vade: iso })
  }
  return out
}
