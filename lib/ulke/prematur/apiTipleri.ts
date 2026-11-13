/** PREMATUR-ULKE-01 — what the two routes answer (machine values only: the screens compose the words). Client-safe. */
import type { ErkenDogumKaydi } from './erkenDogum'
import type { OgeKaydi, PrematurProfil } from './tipler'

export interface BebekYuku {
  hasta: { id: string; ad: string; dogumTarihi: string }
  profil: PrematurProfil
  /** item id → the doctor's own mark */
  durumlar: Record<string, OgeKaydi>
  /** Today in the account's own time zone. */
  bugun: string
  /** false = the tables are not on this database yet: the screen shows its empty state and keeps nothing. */
  depo: boolean
}
export interface BebekKohortSatiri { hastaId: string; ad: string; dogumTarihi: string; profil: PrematurProfil; durumlar: Record<string, OgeKaydi> }
export interface BebekKohortYuku { bugun: string; satirlar: BebekKohortSatiri[]; depo: boolean }

/** The pregnancy as the doctor entered it. */
export interface GebelikGirdisi {
  /** Last menstrual period, 'YYYY-MM-DD', or null. */
  sat: string | null
  /** Ultrasound-corrected due date, or null. */
  tdt: string | null
  /** 'tekil' = single; any other word = a multiple pregnancy; null = not entered (read as single by the engine only when set to 'tekil'). */
  cogulTipi: 'tekil' | 'ikiz' | 'ucuz-ve-ustu' | null
  durum: 'aktif' | 'dogum_yapti'
  kayit: ErkenDogumKaydi
}
export interface GebelikYuku { hasta: { id: string; ad: string }; e: GebelikGirdisi; bugun: string; depo: boolean }
export interface GebelikKohortSatiri { hastaId: string; ad: string; e: GebelikGirdisi }
export interface GebelikKohortYuku { bugun: string; satirlar: GebelikKohortSatiri[]; depo: boolean }

export type PrematurRetKodu = 'NOT_FOUND' | 'GECERSIZ' | 'DEPO_YOK' | 'BASARISIZ'
