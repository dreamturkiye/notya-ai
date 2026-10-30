/**
 * Resolve which portal coaching block (dietetics meal plan OR per-role care plan) applies
 * for the doctor's role. Shared UI never hard-codes country tool keys (wall D7).
 */
import { hesabinAraci } from '../araclar/paket'
import type { UlkeAraclari } from '../araclar/tipler'
import type { PortalAyarlari, UlkePaketi } from '../tipler'

export type PortalKoclukAyari = NonNullable<PortalAyarlari['beslenme']>

/**
 * Dietetics keeps `portal.beslenme`. Every other AU role that declares a `kocluk` module
 * gets the same payload shape with role-specific tool keys and labels.
 */
export function portalKoclukAyari(
  paket: UlkePaketi,
  rol: string | null,
  aracIcerik: UlkeAraclari | null,
): PortalKoclukAyari | null {
  if (!rol || !aracIcerik) return null
  const portal = paket.uygulama?.portal
  if (!portal) return null

  const beslenme = portal.beslenme
  if (beslenme && hesabinAraci(aracIcerik, rol, beslenme.planAraci)) return beslenme

  const mod = portal.kocluk?.moduller?.[rol]
  if (!mod) return null
  if (!hesabinAraci(aracIcerik, rol, mod.planAraci)) return null
  return {
    planAraci: mod.planAraci,
    gunlukAraci: mod.gunlukAraci,
    hedefAraci: mod.hedefAraci,
    ...(mod.agirlikAraci ? { agirlikAraci: mod.agirlikAraci } : {}),
    etiket: mod.etiket,
  }
}
