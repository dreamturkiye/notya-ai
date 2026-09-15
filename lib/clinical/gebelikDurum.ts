/**
 * Gebelik episode status — doctor-facing labels and list filters.
 * DB rows use aktif | tamamlandi | sonlandi; specialty payload uses gebe | lohusa | kapandi.
 * The live card (aktif / gebe / equivalent) is the source of truth for the current pregnancy.
 * Önceki Gebelikler must list only truly ended episodes — never the live SAT/TDT as "Sonlandı".
 */

export const AKTIF_GEBELIK_DURUMLARI = ['aktif', 'gebe'] as const
export const BITMIS_GEBELIK_DURUMLARI = ['tamamlandi', 'sonlandi', 'kapandi'] as const

const AKTIF_ESDEGER = new Set([
  'aktif',
  'gebe',
  'active',
  'ongoing',
  'devam',
  'devam_ediyor',
  'devamediyor',
])

const BITMIS_ESDEGER = new Set([
  'tamamlandi',
  'sonlandi',
  'kapandi',
  'ended',
  'closed',
  'completed',
])

export type OncekiGebelikSatiri = {
  id: string
  durum: string
  tdt?: string | null
  sat?: string | null
}

export type GuncelGebelikRef =
  | string
  | null
  | undefined
  | {
      id?: string | null
      tdt?: string | null
      sat?: string | null
    }

function asciiDurum(value: string): string {
  return value
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
}

function norm(durum: string | null | undefined): string {
  return asciiDurum(String(durum || '').trim().toLowerCase())
}

/** Calendar date only — `2027-02-02` and `2027-02-02T00:00:00.000Z` are the same episode day. */
export function gebelikTarihAnahtari(value: string | null | undefined): string | null {
  if (value == null) return null
  const s = String(value).trim()
  if (!s) return null
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return iso ? iso[1] : null
}

export function aktifGebelikDurumu(durum: string | null | undefined): boolean {
  return AKTIF_ESDEGER.has(norm(durum))
}

/** Current chart episode: ongoing pregnancy or the lohusa window of that same episode. */
export function guncelGebelikDurumu(durum: string | null | undefined): boolean {
  const d = norm(durum)
  return AKTIF_ESDEGER.has(d) || d === 'lohusa'
}

export function bitmisGebelikDurumu(durum: string | null | undefined): boolean {
  return BITMIS_ESDEGER.has(norm(durum))
}

export function ayniGebelikBolumu(
  a: { tdt?: string | null; sat?: string | null },
  b: { tdt?: string | null; sat?: string | null },
): boolean {
  const aTdt = gebelikTarihAnahtari(a.tdt)
  const bTdt = gebelikTarihAnahtari(b.tdt)
  if (aTdt && bTdt && aTdt === bTdt) return true
  const aSat = gebelikTarihAnahtari(a.sat)
  const bSat = gebelikTarihAnahtari(b.sat)
  if (aSat && bSat && aSat === bSat) return true
  return false
}

function guncelRef(guncel: GuncelGebelikRef): { id: string | null; tdt: string | null; sat: string | null } {
  if (guncel == null || guncel === '') return { id: null, tdt: null, sat: null }
  if (typeof guncel === 'string') return { id: guncel, tdt: null, sat: null }
  return {
    id: guncel.id ? String(guncel.id) : null,
    tdt: gebelikTarihAnahtari(guncel.tdt),
    sat: gebelikTarihAnahtari(guncel.sat),
  }
}

/**
 * Previous-pregnancy list for Önceki Gebelikler.
 * Drops the live episode by id, by aktif/gebe status, and by the live card's SAT/TDT
 * so a ghost `sonlandi` clone of the same pregnancy cannot appear as "Sonlandı".
 */
export function oncekiGebelikleriFiltrele<T extends OncekiGebelikSatiri>(
  rows: T[],
  guncel: GuncelGebelikRef,
): T[] {
  const ref = guncelRef(guncel)
  const listed = rows.find((r) => (ref.id && r.id === ref.id) || guncelGebelikDurumu(r.durum))
  const current = {
    id: ref.id || listed?.id || null,
    tdt: ref.tdt || gebelikTarihAnahtari(listed?.tdt),
    sat: ref.sat || gebelikTarihAnahtari(listed?.sat),
  }

  return rows.filter((r) => {
    if (current.id && r.id === current.id) return false
    if (ayniGebelikBolumu(r, current)) return false
    if (guncelGebelikDurumu(r.durum)) return false
    return bitmisGebelikDurumu(r.durum)
  })
}

export type OncekiGebelikEtiketTuru = 'dogum' | 'sonlandi' | 'aktif' | 'lohusa' | 'diger'

export function oncekiGebelikEtiketTuru(durum: string | null | undefined): OncekiGebelikEtiketTuru {
  const d = norm(durum)
  if (d === 'tamamlandi' || d === 'completed') return 'dogum'
  if (d === 'sonlandi' || d === 'kapandi' || d === 'ended' || d === 'closed') return 'sonlandi'
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
