/**
 * The patient's specialty chapter. The pack names every chapter. This file only picks the doctor's role
 * and marks a kept follow-up day. Seven days is the same "coming up" window the specialty portals use.
 * No note, no dose, no diagnosis is read here.
 */
import { gunEkle, gunMu } from '../araclar/yardimci'
import { ulkePaketi } from '../ulke'
import type { PortalIcerigi } from './tipler'

export const BOLUM_YAKLASIYOR_GUN = 7
export type BolumDurum = 'gecikti' | 'bugun' | 'yaklasiyor' | 'planli'

export function bolumDurumu(gun: string, bugun: string): BolumDurum {
  if (!gunMu(gun) || !gunMu(bugun)) return 'planli'
  if (gun < bugun) return 'gecikti'
  if (gun === bugun) return 'bugun'
  return gun <= gunEkle(bugun, BOLUM_YAKLASIYOR_GUN) ? 'yaklasiyor' : 'planli'
}

/** The chapter for `rol`, plus the follow-up days kept for this patient. undefined = this role has no chapter. */
export function portalBolumu(rol: string | null, bugun: string, takipler: readonly string[]): PortalIcerigi['bolum'] | undefined {
  if (!rol) return undefined
  const portal = ulkePaketi().uygulama?.portal
  const tanim = portal?.bolumler?.[rol]
  const tarihEtiket = portal?.tarihEtiket
  const durumEtiket = portal?.durumEtiket
  if (!tanim || !tarihEtiket || !durumEtiket) return undefined
  const gorulen = new Set<string>()
  const tarihler = takipler.filter((g) => gunMu(g) && !gorulen.has(g) && gorulen.add(g)).sort().slice(0, 8).map((gun) => ({ gun, durum: bolumDurumu(gun, bugun) }))
  return { anahtar: rol, baslik: tanim.baslik, satirlar: tanim.satirlar, tarihEtiket, durumEtiket, tarihler }
}
