/**
 * The patient's specialty chapter. The pack names every chapter. This file only picks the doctor's role
 * and marks a kept follow-up day. Seven days is the same "coming up" window the specialty portals use.
 * No note, no dose, no diagnosis is read here.
 *
 * ULKE-BRANS-DERINLIK-02 (2026-11-08): the same file in every country build. A pack with one form of the page states its
 * chapters once (`bolumler`, `tarihEtiket`, `durumEtiket`); a pack with several forms states one set per form
 * (`bolumlerDil`, …): the chapter is then shown in the form the page is shown in, and in no other.
 */
import { gunEkle, gunMu } from '../araclar/yardimci'
import type { DilKodu, PortalAyarlari } from '../tipler'
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

/** The pack's chapter words for `rol` in the form `dil` (or its one form), or null. */
export function bolumTanimi(portal: PortalAyarlari | undefined, rol: string, dil?: DilKodu | null) {
  if (!portal) return null
  const dilli = dil ? portal.bolumlerDil?.[dil] : undefined
  const tanim = dilli ? dilli[rol] : portal.bolumler?.[rol]
  const tarihEtiket = (dil ? portal.tarihEtiketDil?.[dil] : undefined) ?? portal.tarihEtiket
  const durumEtiket = (dil ? portal.durumEtiketDil?.[dil] : undefined) ?? portal.durumEtiket
  if (!tanim || !tarihEtiket || !durumEtiket) return null
  return { tanim, tarihEtiket, durumEtiket }
}

/** true = the pack has a chapter for `rol` in some form (the server then reads the kept follow-up days). */
export function bolumVarMi(portal: PortalAyarlari | undefined, rol: string | null): boolean {
  if (!portal || !rol) return false
  if (portal.bolumler?.[rol]) return true
  return Object.values(portal.bolumlerDil ?? {}).some((x) => Boolean(x?.[rol]))
}

/** The chapter for `rol`, plus the follow-up days kept for this patient. undefined = this role has no chapter. */
export function portalBolumu(rol: string | null, bugun: string, takipler: readonly string[], dil?: DilKodu | null): PortalIcerigi['bolum'] | undefined {
  if (!rol) return undefined
  const b = bolumTanimi(ulkePaketi().uygulama?.portal, rol, dil)
  if (!b) return undefined
  const gorulen = new Set<string>()
  const tarihler = takipler.filter((g) => gunMu(g) && !gorulen.has(g) && gorulen.add(g)).sort().slice(0, 8).map((gun) => ({ gun, durum: bolumDurumu(gun, bugun) }))
  return { anahtar: rol, baslik: b.tanim.baslik, satirlar: b.tanim.satirlar, tarihEtiket: b.tarihEtiket, durumEtiket: b.durumEtiket, tarihler }
}
