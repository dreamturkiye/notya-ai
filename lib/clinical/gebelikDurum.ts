/**
 * Gebelik episode status — doctor-facing labels and list filters.
 * DB rows use aktif | tamamlandi | sonlandi; specialty payload uses gebe | lohusa | kapandi.
 * An active `gebe` episode must never appear as "Sonlandı" under previous pregnancies.
 */

export const AKTIF_GEBELIK_DURUMLARI = ['aktif', 'gebe'] as const
export const BITMIS_GEBELIK_DURUMLARI = ['tamamlandi', 'sonlandi', 'kapandi'] as const

function norm(durum: string | null | undefined): string {
  return String(durum || '').trim().toLowerCase()
}

export function aktifGebelikDurumu(durum: string | null | undefined): boolean {
  const d = norm(durum)
  return d === 'aktif' || d === 'gebe'
}

/** Current chart episode: ongoing pregnancy or the lohusa window of that same episode. */
export function guncelGebelikDurumu(durum: string | null | undefined): boolean {
  const d = norm(durum)
  return aktifGebelikDurumu(d) || d === 'lohusa'
}

export function bitmisGebelikDurumu(durum: string | null | undefined): boolean {
  const d = norm(durum)
  return d === 'tamamlandi' || d === 'sonlandi' || d === 'kapandi'
}

export function oncekiGebelikleriFiltrele<T extends { id: string; durum: string }>(
  rows: T[],
  guncelId: string | null | undefined,
): T[] {
  return rows.filter((r) => {
    if (guncelId && r.id === guncelId) return false
    if (guncelGebelikDurumu(r.durum)) return false
    return bitmisGebelikDurumu(r.durum)
  })
}

export type OncekiGebelikEtiketTuru = 'dogum' | 'sonlandi' | 'aktif' | 'lohusa' | 'diger'

export function oncekiGebelikEtiketTuru(durum: string | null | undefined): OncekiGebelikEtiketTuru {
  const d = norm(durum)
  if (d === 'tamamlandi') return 'dogum'
  if (d === 'sonlandi' || d === 'kapandi') return 'sonlandi'
  if (aktifGebelikDurumu(d)) return 'aktif'
  if (d === 'lohusa') return 'lohusa'
  return 'diger'
}

export function oncekiGebelikDurumMetni(durum: string | null | undefined): string {
  switch (oncekiGebelikEtiketTuru(durum)) {
    case 'dogum':
      return 'Doğum'
    case 'sonlandi':
      return 'Sonlandı'
    case 'aktif':
      return 'Aktif gebelik'
    case 'lohusa':
      return 'Lohusa'
    default:
      return 'Kayıt'
  }
}
