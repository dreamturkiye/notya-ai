/** NOTYA-HASTA-ILETISIMI-01 — shared types for bulk patient communication. Pure, client-safe. */

export type TopluKanal = 'sms' | 'eposta' | 'ikisi'

export type ToplamaFiltre = {
  /** Patient's most recent session's specialty (sessions.specialty). null/omitted = any. */
  brans?: string | null
  /** Last visit (most recent session) within the last N days. */
  sonZiyaretGunIci?: number | null
  /** Last visit older than N days (or never visited) — "uzun süredir gelmeyenler". */
  sonZiyaretGunOnce?: number | null
  yasMin?: number | null
  yasMax?: number | null
  /** Vaccine waiting list (lib/asi/bekleyenler.ts). null = feature off; {} = any vaccine; {asiAdi} = one. */
  asiBekleyenleri?: { asiAdi?: string | null } | null
  /** OR match against patients.etiketler. */
  etiketler?: string[] | null
  /** Explicit manual selection — when present, OVERRIDES every filter above. */
  manuelHastaIdleri?: string[] | null
}

export type AdayHasta = {
  id: string
  ad: string
  dogumTarihi: string | null
  telefon: string | null
  eposta: string | null
  izinWhatsapp: boolean | null
  izinEposta: boolean | null
  izinSms: boolean | null
  etiketler: string[]
  sonZiyaretIso: string | null
  sonBrans: string | null
  veliDili: boolean
}

export type SablonAnahtari = 'asi_stok_geldi' | 'randevu_genel' | 'genel_bilgi' | 'serbest'

export type KampanyaOlusturGirdisi = {
  filtre: ToplamaFiltre
  kanal: TopluKanal
  konu?: string | null
  govde: string
  sablonAnahtari?: SablonAnahtari | null
  tetikleyici?: 'manuel' | 'asi_stok'
  asiStokLotId?: string | null
  /** Idempotency key — the client generates one per compose session and resends it on retry. */
  idempotencyKey: string
}

export type AliciSonucu = { patientId: string; kanal: 'sms' | 'eposta'; durum: 'gonderildi' | 'basarisiz' | 'atlandi'; sebep?: string }

export type KampanyaSonucu = {
  kampanyaId: string
  hedefSayisi: number
  sonuclar: AliciSonucu[]
  durum: 'tamamlandi' | 'basarisiz'
}
