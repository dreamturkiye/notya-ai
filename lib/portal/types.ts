/** Sağlığım — shared TypeScript contracts for patient portal UI + API. */
import type { PortalModulId, PortalNavOge } from '@/lib/specialties/profile'
export type { PortalModulId, PortalNavOge }

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

export interface PortalBuyumeNoktasi { ay: number; deger: number; tarih: string }
export interface PortalBuyumeSerisi { persentil: number; noktalar: { ay: number; deger: number }[] }
export interface PortalBuyumeParametre { birim: string; egriler: PortalBuyumeSerisi[]; noktalar: PortalBuyumeNoktasi[] }
export interface PortalBuyume {
  dogumBilinmiyor: boolean
  mevcutYasAy: number | null
  cinsiyet: 'male' | 'female' | null
  parametreler: { kilo?: PortalBuyumeParametre; boy?: PortalBuyumeParametre; basCevresi?: PortalBuyumeParametre; vki?: PortalBuyumeParametre | null }
}

export interface PortalHedefBoy {
  anneCm: number
  babaCm: number
  cocukCm: number
  altCm: number
  ustCm: number
  cinsiyet: 'erkek' | 'kiz'
  formul?: string
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
  /** SAGLIGIM-PORTAL-REGISTRY — attached specialty modules + their extra nav (lib/portal/moduller.ts). */
  portal: { moduller: PortalModulId[]; nav: PortalNavOge[] }
  // Specialty slices — each is null unless its module attached (never "just in case").
  buyume: PortalBuyume | null
  gebelik: PortalGebelik | null
  jinekoloji: PortalJinekoloji | null
  hedefBoy: PortalHedefBoy | null
  goz: PortalGoz | null
  /** DERM-PORTAL — "Derim": photo notices, MD reminders, phototherapy session dates. No tanı. */
  deri: PortalDeri | null
  /** DAH-EXCEPTIONAL-01 — "Takibim": MD hedefler, hatırlatmalar, ev ölçüm. No tanı/doz. */
  kronik: PortalKronik | null
  /** PSIK-EXCEPTIONAL-01 — "Ruh Sağlığım": MD-set kontrol + ölçek/ilaç hatırlatma. No tanı, skor, doz. */
  psik: PortalPsik | null
}

/** NOTYA-KHD-05 — anne için "Gebeliğim" görünümü (hesaplar sunucuda, tanı/yorum yok). */
export interface PortalGebelik {
  hafta: number; gun: number; trimester: number; metin: string; toplamGun: number
  tdt: string
  takvim: Array<{ no: number; etiket: string; haftaBas: number; haftaSon: number; durum: string; maddeler: string[] }>
  sonIzlem: { tarih: string; hafta: number; kilo: number | null; fetalKalpAtimi: number | null } | null
  buHafta: string[]
}

/** NOTYA-JINE-04 — hasta portalı jinekoloji hatırlatmaları (tanı/yorum yok). */
export interface PortalJinekoloji {
  hatirlatmalar: Array<{ ad: string; due: string | null; durum: 'gecikti' | 'yaklasiyor' | 'planli' }>
  riaIpKontrol: string | null
  not: string
}

/** GOZ-PORTAL — "Gözlerim": clinic-recorded numbers, MD-set dates/regimen, image-ready notices. No tanı, no interpretation. */
export interface PortalGoz {
  /** next kontrol the doctor set (and whether dilatasyon damlası is planned) */
  sonrakiKontrol: { tarih: string; neden: string; dilatasyon: boolean } | null
  /** MD-set drop regimen only; `goz` is patient-readable (Sağ göz / Sol göz / İki göz) */
  damlalar: Array<{ id: string; ad: string; goz: string; siklik: string; baslangic: string | null }>
  /** planned intravitreal injection / procedure dates the MD set */
  islemler: Array<{ id: string; tarih: string; ad: string; goz: string; durum: 'planli' | 'yapildi' }>
  /** clinic-recorded visual acuity (as written, e.g. "0,8") and IOP (mmHg) per visit */
  olcumler: Array<{ tarih: string; vaSag: string | null; vaSol: string | null; gibSag: number | null; gibSol: number | null }>
  /** OCT / fundus / ön segment images uploaded to the file — notice only */
  goruntuler: Array<{ id: string; tarih: string; tur: string; goz: string }>
  not: string
}

/** DERM-PORTAL — "Derim": patient-safe derm surface. No morfoloji, tanı, skor, or dose. */
export interface PortalDeri {
  sonrakiKontrol: { tarih: string; neden: string } | null
  /** DERM-EXCEPTIONAL-01: titles come from specialties/dermatoloji/engines/portal-derim (kod → sabit başlık). */
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  fotograflar: Array<{ id: string; tarih: string; tur: string }>
  islemler: Array<{ tarih: string; ad: string }>
  fototerapi: Array<{ tarih: string; cihaz: string | null }>
  labHatirlatma: Array<{ ad: string; due: string | null }>
  not: string
}

/**
 * PSIK-EXCEPTIONAL-01 — "Ruh Sağlığım": ayaktan psikiyatri hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı adı, ölçek skoru, şiddet bandı,
 * ilaç adı ve doz portala GEÇMEZ (specialties/psikiyatri/engines/portal-ruhsagligim.ts kilidi).
 */
export interface PortalPsik {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Kontrolden önce doldurmanız istenen form" — hangi ölçek olduğu yazılmaz */
  olcekHatirlatma: Array<{ ad: string; due: string | null }>
  /** "İlaç güvenlik kan testi" gibi sınıf düzeyi hatırlatma — etken madde / doz yok */
  ilacHatirlatma: Array<{ ad: string; due: string | null }>
  not: string
}

/** DAH-EXCEPTIONAL-01 — "Takibim": chronic-care surface. No ICD, tanı, or dose. */
export interface PortalKronik {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  hedefler: Array<{ ad: string; ozet: string }>
  evKbOzet: string | null
  evGlukozOzet: string | null
  not: string
}
