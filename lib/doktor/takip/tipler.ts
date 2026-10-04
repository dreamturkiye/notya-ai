/**
 * NOTYA-TAKIP-01 — shared types for durable practice follow-up cases.
 * Clinical kohorts stay in branş engines; this layer is the ops case file.
 */

export const TAKIP_TURLERI = ['kontrol', 'gelmedi', 'konsultasyon'] as const
export type TakipTuru = (typeof TAKIP_TURLERI)[number]

export const TAKIP_DURUMLARI = ['acik', 'kapandi'] as const
export type TakipDurumu = (typeof TAKIP_DURUMLARI)[number]

export const TAKIP_KAPANIS = ['randevu', 'vizit', 'yanit', 'manuel', 'iptal', 'senkron'] as const
export type TakipKapanis = (typeof TAKIP_KAPANIS)[number]

export interface TakipIsi {
  id: string
  doktorId: string
  patientId: string
  tur: TakipTuru
  durum: TakipDurumu
  vade: string | null
  kosullu: boolean
  kaynakNotId: string | null
  kaynakRandevuId: string | null
  kaynakSevkId: string | null
  ozet: string
  alinti: string | null
  kapandiAt: string | null
  kapandiNeden: TakipKapanis | null
  createdAt: string
  /** Filled by list readers when names are resolved. */
  hastaAdi?: string
}

export interface TakipAcGirdi {
  doktorId: string
  patientId: string
  tur: TakipTuru
  vade?: string | null
  kosullu?: boolean
  kaynakNotId?: string | null
  kaynakRandevuId?: string | null
  kaynakSevkId?: string | null
  ozet: string
  alinti?: string | null
}

export function takipTuruMu(x: unknown): x is TakipTuru {
  return typeof x === 'string' && (TAKIP_TURLERI as readonly string[]).includes(x)
}
