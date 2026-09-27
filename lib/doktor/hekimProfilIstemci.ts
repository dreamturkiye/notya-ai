/**
 * Doktor / klinik araçlarının ilk boyası. Yalnız branş, meslek ve ad — hasta listesi yok.
 * sessionStorage, 60 sn. Ağ yine doğrular; bu yalnızca beklemeden çizmeyi sağlar.
 */
const ANAHTAR = 'notya_hekim_profil'
const TTL_MS = 60_000

export interface HekimProfilOzet {
  specialty?: string | null
  profession_type?: string | null
  full_name?: string | null
}

export function hekimProfilOturumOku(): (HekimProfilOzet & { t: number }) | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const ham = sessionStorage.getItem(ANAHTAR)
    if (!ham) return null
    const j = JSON.parse(ham) as HekimProfilOzet & { t?: number }
    if (!j || Date.now() - Number(j.t || 0) > TTL_MS) return null
    return {
      specialty: j.specialty ?? null,
      profession_type: j.profession_type ?? null,
      full_name: j.full_name ?? null,
      t: Number(j.t),
    }
  } catch {
    return null
  }
}

export function hekimProfilOturumYaz(o: HekimProfilOzet): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(ANAHTAR, JSON.stringify({
      specialty: o.specialty ?? null,
      profession_type: o.profession_type ?? null,
      full_name: o.full_name ?? null,
      t: Date.now(),
    }))
  } catch { /* gizli mod */ }
}
