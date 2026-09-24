/**
 * NOTYA-FISILTI-GIZLE-01 (Kaan + Dr. Gökhan, 2026-09-24) — the doctor can hide one Fısıltı item.
 * Pure: no DB here, so the hide / facts-changed / 7-gün rules are unit-tested directly.
 *
 * A hide is bound to the item's FACTS, not only its key: `icerikOzeti` hashes baslik + detay. When
 * the facts change (a new late dose, a corrected date) the hash no longer matches and the item comes
 * back by itself. "7 gün sonra hatırlat" additionally sets `until`. Hiding never touches clinical data.
 */
import { createHash } from 'node:crypto'
import type { FisiltiItem } from './fisiltiOrtak'

export const GIZLE_HATIRLAT_GUN = 7

export type GizleSure = 'kalici' | '7gun'

export interface FisiltiGizlemeKaydi {
  id: string
  patient_id: string
  tur: string
  icerik_ozeti: string
  until: string | null
  created_at: string
}

export function fisiltiIcerikOzeti(item: Pick<FisiltiItem, 'id' | 'baslik' | 'detay'>): string {
  return createHash('sha256').update(JSON.stringify([item.id, item.baslik, item.detay])).digest('hex')
}

export function gizleUntil(sure: GizleSure, simdi: Date): string | null {
  return sure === '7gun' ? new Date(simdi.getTime() + GIZLE_HATIRLAT_GUN * 86400_000).toISOString() : null
}

/** Only rows not yet restored ("Geri getir") are passed in; this decides which of them still apply. */
export function gizlemeGecerliMi(item: FisiltiItem, k: FisiltiGizlemeKaydi, simdi: Date): boolean {
  if (k.tur !== item.id || k.patient_id !== item.patientId) return false
  if (k.until && new Date(k.until).getTime() <= simdi.getTime()) return false
  return k.icerik_ozeti === fisiltiIcerikOzeti(item)
}

export function fisiltiAyir(ogeler: FisiltiItem[], kayitlar: FisiltiGizlemeKaydi[], simdi: Date): {
  gorunen: FisiltiItem[]
  gizli: Array<{ item: FisiltiItem; kayit: FisiltiGizlemeKaydi }>
} {
  const gorunen: FisiltiItem[] = []
  const gizli: Array<{ item: FisiltiItem; kayit: FisiltiGizlemeKaydi }> = []
  for (const item of ogeler) {
    const kayit = kayitlar.find((k) => gizlemeGecerliMi(item, k, simdi))
    if (kayit) gizli.push({ item, kayit })
    else gorunen.push(item)
  }
  return { gorunen, gizli }
}
