/** Sağlığım — shared TypeScript contracts for patient portal UI + API. */

export type PortalNavKey =
  | 'ozet'
  | 'mesajlar'
  | 'ziyaretler'
  | 'sonuclar'
  | 'ilaclar'
  | 'gecmis'
  | 'takip'

export type MessageFolder = 'gelen' | 'gonderilen' | 'arsiv'

export type ResultKind = 'laboratuvar' | 'goruntuleme' | 'ekg' | 'diger'

export interface PortalSummary {
  aktifIlac: number
  bekleyenMesaj: number
  sonLabOzet: string
  yaklasanKontrol: string | null
  sonAktivite: Array<{
    id: string
    tur: 'ziyaret' | 'sonuc' | 'mesaj' | 'ilac'
    baslik: string
    tarih: string
    href?: string
  }>
}

export interface PortalMessage {
  id: string
  klasor: MessageFolder
  konu: string
  gonderen: string
  ozet: string
  tarih: string
  okundu: boolean
  mesajlar: Array<{
    id: string
    kimden: string
    metin: string
    tarih: string
    taraf: 'doktor' | 'hasta' | 'klinik'
  }>
}

export interface PortalVisit {
  id: string
  tarih: string
  brans: string
  basvuruNedeni: string
  hekim: string
  ozetKisa: string
  subjektif?: string
  objektif?: string
  degerlendirme?: string
  plan?: string
  vitaller?: Record<string, string | number | null>
  ilacDegisiklikleri?: string[]
  takip?: string
}

export interface PortalResult {
  id: string
  tur: ResultKind
  baslik: string
  tarih: string
  ozet: string
  durum: 'normal' | 'anormal' | 'beklemede' | 'raporlandi'
  labSatirlari?: Array<{
    test: string
    deger: string
    birim: string
    referans: string
    anormal: boolean
  }>
  raporMetni?: string
  modalite?: string
  gorselUrl?: string | null
}

export interface PortalMedication {
  id: string
  ad: string
  doz: string
  siklik: string
  baslangic: string
  bitis?: string | null
  aktif: boolean
  not?: string
  yazan?: string
}

export interface PortalMedChange {
  id: string
  tarih: string
  tip: 'baslandi' | 'durduruldu' | 'doz_degisti'
  ilacAdi: string
  aciklama: string
}

export interface PortalHistory {
  kronikHastaliklar: string[]
  alerjiler: string[]
  ameliyatlar: Array<{ yil: string; aciklama: string }>
  aileOykusu: Array<{ yakinlik: string; durum: string }>
  asilar: Array<{ ad: string; tarih: string }>
}

export interface PortalTrackingPoint {
  tarih: string
  deger: number
}

export interface PortalTracking {
  tansiyon: Array<{ tarih: string; sistolik: number; diastolik: number }>
  kilo: PortalTrackingPoint[]
  nabiz: PortalTrackingPoint[]
  spo2: PortalTrackingPoint[]
  sonVitalOzet?: string
}

export interface PortalBundle {
  summary: PortalSummary
  messages: PortalMessage[]
  visits: PortalVisit[]
  results: PortalResult[]
  medications: PortalMedication[]
  medicationHistory: PortalMedChange[]
  history: PortalHistory
  tracking: PortalTracking
}
