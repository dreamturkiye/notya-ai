import type { PortalYonlendirme } from '@/lib/doktor/konsultasyon'
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
  /**
   * KONSULTASYON-01 — ÇEKİRDEK omurga (her branş): doktorun bu hastayı yönlendirdiği konsültasyonlar.
   * Yalnız branş + tarih + durum (KVKK m.10 aydınlatma). Klinik soru, tanı, yanıt özeti, rapor ve konsültan adı YOK.
   */
  yonlendirmeler: PortalYonlendirme[]
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
  /** KBB-EXCEPTIONAL-01 — "Kulaklarım": MD-set kontrol + işitme testi / işlem hatırlatma. No tanı, dB, doz. */
  kulak: PortalKulak | null
  /** KARDIO-EXCEPTIONAL-01 — "Kalbim": MD-set kontrol + tansiyon/test hatırlatma. No tanı, SCORE2 %, doz. */
  kalp: PortalKalp | null
  /** GOGUS-EXCEPTIONAL-01 — "Akciğerlerim": MD-set kontrol + solunum testi / inhaler hatırlatma. No tanı, CAT, doz. */
  akciger: PortalAkciger | null
  /** NOROLOJI-EXCEPTIONAL-01 — "Nörolojimm": MD-set kontrol + form / ilaç güvenlik hatırlatma. No tanı, skor, doz. */
  noro: PortalNoro | null
  /** UROLOJI-EXCEPTIONAL-01 — "Ürolojimm": MD-set kontrol + hatırlatma. No tanı, PSA sayı, IPSS skor, doz. */
  uro: PortalUro | null
  /** SPOR-HEKIMLIGI-EXCEPTIONAL-01 — "Sporum": MD-set kontrol + antrenmana dönüş planı hatırlatma. No tanı, doz, doping. */
  spor: PortalSpor | null
  /** ORTOPEDI-EXCEPTIONAL-01 — "Eklemlerim": MD-set kontrol + hatırlatma. No tanı, VAS sayı, skor, doz. */
  eklem: PortalEklem | null
  /** FIZIK-TEDAVI-EXCEPTIONAL-01 — "FTR'm": MD-set kontrol + seans / egzersiz hatırlatma. No tanı, VAS/ODI skor, doz. */
  ftr: PortalFtr | null
  /** AILE-HEKIMLIGI-EXCEPTIONAL-01 — "Sağlık Paketim": MD-set kontrol + aşı/tarama / kronik hatırlatma. No tanı, skor, doz. */
  aile: PortalAile | null
  /** ENDOKRINOLOJI-EXCEPTIONAL-01 — "Hormonlarım": MD-set kontrol + lab/DXA/rejim hatırlatma. No tanı, lab sayı, doz. */
  endo: PortalEndo | null
  /** ENFEKSIYON-EXCEPTIONAL-01 */
  enfeksiyon: PortalEnfeksiyon | null
  /** GASTROENTEROLOJI-EXCEPTIONAL-01 — "Sindirimim": MD-set kontrol + skor/hepatit/endoskopi/rejim hatırlatma. No tanı, skor, doz. */
  gastro: PortalGastro | null
  /** NEFROLOJI-EXCEPTIONAL-01 — "Böbreklerim": MD-set kontrol + lab/anemi/diyaliz hatırlatma. No tanı, eGFR sayı, ESA doz. */
  nef: PortalNef | null
  /** ROMATOLOJI-EXCEPTIONAL-01 — "Romatizmam": MD-set kontrol + lab/eklem/belge hatırlatma. No tanı, skor, doz. */
  roma: PortalRoma | null
  /** ONKOLOJI-EXCEPTIONAL-01 — "Tedavim": MD-set kontrol + kür/toksisite hatırlatma. No tanı, doz. */
  onko: PortalOnko | null
  /** GENEL-CERRAHI-EXCEPTIONAL-01 — "Ameliyatım": MD-set kontrol + ameliyat/yara/rapor hatırlatma. No tanı, doz. */
  gc: PortalGc | null
  /** PLASTIK-CERRAHI-EXCEPTIONAL-01 — "Yaram": MD-set pansuman/dikiş/foto/kontrol. No tanı, skor, doz. */
  plastik: PortalPlastik | null
  /** GOGUS-CERRAHISI-EXCEPTIONAL-01 — "Göğüs Cerrahisi takibi". No CAT/mMRC, tanı, doz. */
  gogusCerrahi: PortalGogusCerrahi | null
  /** BEYIN-CERRAHISI-EXCEPTIONAL-01 — "Beyin Cerrahisi takibi": MD-set kontrol + post-op/görüntü/izlem. No tanı, AED doz. */
  beyin: PortalBeyin | null
  /** COCUK-CERRAHISI-EXCEPTIONAL-01 — "Çocuğumun Cerrahisi". No Neyzi/büyüme chapter, tanı, doz. */
  cc: PortalCc | null
  /** ANESTEZI-EXCEPTIONAL-01 — "Anestezi Öncesi": MD-set kontrol + pre-op/hava yolu/ağrı. No tanı, doz, OR HIS. */
  anestezi: PortalAnestezi | null
  /** ACIL-TIP-EXCEPTIONAL-01 — "Acil sonrası takip": MD-set kısa takip. No tanı, doz, ESI sayı, bed board. */
  acilSonrasi: PortalAcilSonrasi | null
  /** KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — "Damar Cerrahisi takibi". No SCORE2/Kalbim, tanı, doz. */
  damarCerrahisi: PortalDamarCerrahisi | null
  /** RADYOLOJI-EXCEPTIONAL-01 — "Tetkiklerim": durum/tarih. No tanı, BI-RADS sayı, AI bulgu. */
  radyo: PortalRadyo | null
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

/**
 * KBB-EXCEPTIONAL-01 — "Kulaklarım": ayaktan KBB hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı adı, dB / PTA değeri, kayıp
 * bandı, ilaç adı ve doz portala GEÇMEZ (specialties/kulak-burun-bogaz/engines/portal-kulaklarim.ts kilidi).
 */
export interface PortalKulak {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "İşitme testi randevusu" / "Uyku tetkiki randevusu" — sonuç ve sayı yazılmaz */
  testHatirlatma: Array<{ ad: string; due: string | null }>
  /** pansuman, cihaz kontrolü, denge muayenesi gibi işlem randevuları */
  islemHatirlatma: Array<{ ad: string; due: string | null }>
  /** hasta-güvenli, tanı içermeyen genel kulak bakımı önerileri */
  bakimIpuclari: string[]
  not: string
}

/**
 * KARDIO-EXCEPTIONAL-01 — "Kalbim": ayaktan kardiyoloji hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı adı, SCORE2 %, risk bandı,
 * ilaç adı ve doz portala GEÇMEZ (specialties/kardiyoloji/engines/portal-kalbim.ts kilidi).
 */
export interface PortalKalp {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** tansiyon / kan tahlili / kalp testi randevuları — skor ve sonuç yazılmaz */
  olcumHatirlatma: Array<{ ad: string; due: string | null }>
  bakimIpuclari: string[]
  not: string
}

/**
 * GOGUS-EXCEPTIONAL-01 — "Akciğerlerim": ayaktan göğüs hastalıkları hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, CAT/mMRC, GOLD, FEV1,
 * ilaç adı ve doz portala GEÇMEZ (specialties/gogus-hastaliklari/engines/portal-akcigerlerim.ts).
 */
export interface PortalAkciger {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Solunum testi randevusu" — sonuç ve sayı yazılmaz */
  testHatirlatma: Array<{ ad: string; due: string | null }>
  /** inhaler teknik, aksiyon planı, oksijen, tütün bırakma */
  bakimHatirlatma: Array<{ ad: string; due: string | null }>
  bakimIpuclari: string[]
  not: string
}

/**
 * NOROLOJI-EXCEPTIONAL-01 — "Nörolojimm": ayaktan nöroloji hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, MIDAS skoru/bandı,
 * ilaç adı ve doz portala GEÇMEZ (specialties/noroloji/engines/portal-norolojim.ts kilidi).
 */
export interface PortalNoro {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Baş ağrısı takip formu" — skor / bant yazılmaz */
  formHatirlatma: Array<{ ad: string; due: string | null }>
  /** "İlaç güvenlik kontrolü" — etken madde / doz yok */
  ilacHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * UROLOJI-EXCEPTIONAL-01 — "Ürolojimm": ayaktan üroloji hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, PSA ng/mL, IPSS skor,
 * ilaç adı ve doz portala GEÇMEZ (specialties/uroloji/engines/portal-urolojim.ts kilidi).
 */
export interface PortalUro {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Kan testi randevusu" / "Semptom formu kontrolü" — sayı ve skor yazılmaz */
  testHatirlatma: Array<{ ad: string; due: string | null }>
  /** taş takibi, belge / rapor */
  islemHatirlatma: Array<{ ad: string; due: string | null }>
  bakimIpuclari: string[]
  not: string
}

/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — "Sporum": ayaktan spor hekimliği hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, doz, doping
 * portala GEÇMEZ (specialties/spor-hekimligi/engines/portal-sporum.ts kilidi).
 */
export interface PortalSpor {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** Antrenmana dönüş / sakatlık izlem / yük değerlendirmesi — klinik skor yorumu yok */
  planHatirlatma: Array<{ ad: string; due: string | null }>
  /** Hasta-güvenli RTP özeti ("aşama N") — tanı yok */
  rtpOzet: string | null
  bakimIpuclari: string[]
  not: string
}

/**
 * ORTOPEDI-EXCEPTIONAL-01 — "Eklemlerim": ayaktan ortopedi hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, VAS sayı, skor,
 * ilaç adı ve doz portala GEÇMEZ (specialties/ortopedi/engines/portal-eklemlerim.ts kilidi).
 */
export interface PortalEklem {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** alçı / hareket / ağrı formu — sayı ve skor yazılmaz */
  izlemHatirlatma: Array<{ ad: string; due: string | null }>
  /** görüntüleme, op-sonrası kontrol, belge */
  islemHatirlatma: Array<{ ad: string; due: string | null }>
  bakimIpuclari: string[]
  not: string
}

/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — "FTR'm": ayaktan FTR hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, VAS/ODI skoru/bandı,
 * ilaç adı ve doz portala GEÇMEZ (specialties/fizik-tedavi/engines/portal-ftrm.ts kilidi).
 */
export interface PortalFtr {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Tedavi seansı" — modalite / sayı yazılmaz */
  seansHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Ev egzersiz kontrolü" / "Ağrı / fonksiyon formu" — skor yok */
  egzersizHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — "Sağlık Paketim": birinci basamak hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, skor, ilaç adı,
 * doz ve aşı lot portala GEÇMEZ (specialties/aile-hekimligi/engines/portal-saglik-paketim.ts).
 */
export interface PortalAile {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Aşı veya tarama randevusu" — ürün / lot yazılmaz */
  asiTaramaHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Kronik takip kontrolü" — tanı / doz yok */
  kronikHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — "Hormonlarım": ayaktan endokrinoloji hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, HbA1c/TSH sayı/bandı,
 * ilaç adı ve doz portala GEÇMEZ (specialties/endokrinoloji/engines/portal-hormonlarim.ts kilidi).
 */
export interface PortalEndo {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Kan tahlili kontrolü" — değer / bant yazılmaz */
  labHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Kemik yoğunluğu testi" — T-skor yazılmaz */
  dxaHatirlatma: Array<{ ad: string; due: string | null }>
  /** İnsülin / tiroid rejim kontrol tarihleri — doz yok */
  rejimHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * ROMATOLOJI-EXCEPTIONAL-01 — "Romatizmam": ayaktan romatoloji hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, DAS28/BASDAI sayı/bandı,
 * ilaç adı ve doz portala GEÇMEZ (specialties/romatoloji/engines/portal-romatizmam.ts kilidi).
 */
export interface PortalRoma {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Kan tahlili kontrolü" — değer / bant yazılmaz */
  labHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Eklem takip kontrolü" — skor yazılmaz */
  skorHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Belge / rapor işlemi" */
  belgeHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * ENFEKSIYON-EXCEPTIONAL-01 — "Enfeksiyon Takibim": ayaktan enfeksiyon hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, CD4/viral sayı,
 * ilaç adı ve doz portala GEÇMEZ (specialties/enfeksiyon-hastaliklari/engines/portal-enfeksiyon-takibim.ts kilidi).
 */
export interface PortalEnfeksiyon {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Kan tahlili kontrolü" — CD4/viral sayı yazılmaz */
  viralHatirlatma: Array<{ ad: string; due: string | null }>
  /** "İlaç süre kontrolü" — doz yok */
  atbHatirlatma: Array<{ ad: string; due: string | null }>
  /** İzolasyon / takip bitiş — tanı yok */
  izolasyonHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — "Sindirimim": ayaktan gastroenteroloji hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, skor/band,
 * ilaç adı ve doz portala GEÇMEZ (specialties/gastroenteroloji/engines/portal-sindirimim.ts kilidi).
 */
export interface PortalGastro {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Takip formu kontrolü" — skor / bant yazılmaz */
  skorHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Kan tahlili kontrolü" — viral yük yazılmaz */
  hepatitHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Endoskopi kontrolü" — tanı yazılmaz */
  endoskopiHatirlatma: Array<{ ad: string; due: string | null }>
  /** PPI / biyolojik rejim kontrol tarihleri — doz yok */
  rejimHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * NEFROLOJI-EXCEPTIONAL-01 — "Böbreklerim": ayaktan nefroloji hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, eGFR/KDIGO,
 * ilaç adı ve ESA dozu portala GEÇMEZ (specialties/nefroloji/engines/portal-bobreklerim.ts kilidi).
 */
export interface PortalNef {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Kan tahlili kontrolü" — eGFR / KDIGO yazılmaz */
  labHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Kan sayımı kontrolü" — Hb / ESA doz yok */
  anemiHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Diyaliz seans / takip" — makine parametresi yok */
  diyalizHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
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


/**
 * ONKOLOJI-EXCEPTIONAL-01 — "Tedavim": ayaktan tıbbi onkoloji hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, evre/stage/TNM,
 * ilaç adı ve doz portala GEÇMEZ (specialties/onkoloji/engines/portal-tedavim.ts kilidi).
 */
export interface PortalOnko {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Tedavi / kür günü" — doz / protokol yazılmaz */
  kurHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Kan tahlili kontrolü" — değer yazılmaz */
  labHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Yan etki kontrolü" — grade/tanı yok */
  yanEtkiHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — "Ameliyatım": ayaktan genel cerrahi hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, patoloji sonucu,
 * doz portala GEÇMEZ (specialties/genel-cerrahi/engines/portal-ameliyatim.ts kilidi).
 */
export interface PortalGc {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Ameliyat / işlem günü" — tanı yok */
  ameliyatHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Yara / dren kontrolü" — enfeksiyon tanısı yok */
  yaraHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Rapor takibi" / görüntüleme — sonuç yorumu yok */
  raporHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * GOGUS-CERRAHISI-EXCEPTIONAL-01 — "Göğüs Cerrahisi takibi": ayaktan toraks cerrahisi hasta yüzü.
 * Yalnız hekimin belirlediği tarihler. Tanı, CAT/mMRC, GOLD, doz portala GEÇMEZ
 * (specialties/gogus-cerrahisi/engines/portal-takibim.ts kilidi). gogus-hastaliklari Akciğerlerim ayrı.
 */
export interface PortalGogusCerrahi {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Tüp / yara kontrolü" — tanı yok */
  tupYaraHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Patoloji raporu kontrolü" — tanı/ICD yok */
  patolojiHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Ameliyat öncesi hazırlık" — OR planı yok */
  preopHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * PLASTIK-CERRAHI-EXCEPTIONAL-01 — "Yaram": ayaktan plastik cerrahi hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, PASI/skor,
 * doz portala GEÇMEZ (specialties/plastik-cerrahi/engines/portal-yaram.ts kilidi).
 */
export interface PortalPlastik {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  pansumanHatirlatma: Array<{ ad: string; due: string | null }>
  fotoHatirlatma: Array<{ ad: string; due: string | null }>
  dikisHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — "Beyin Cerrahisi takibi": ayaktan nöroşirürji hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, AED doz,
 * migren/inme skoru portala GEÇMEZ (specialties/beyin-cerrahisi/engines/portal-beyin-takibi.ts kilidi).
 */
export interface PortalBeyin {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Ameliyat sonrası kontrol" — teknik/tanı yok */
  postopHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Görüntü / belge kontrolü" — tanı yorumu yok */
  goruntuHatirlatma: Array<{ ad: string; due: string | null }>
  /** "İzlem kontrolü" — AED doz yok */
  izlemHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * COCUK-CERRAHISI-EXCEPTIONAL-01 — "Çocuğumun Cerrahisi": ayaktan çocuk cerrahisi hasta yüzü.
 * Tanı, doz, Neyzi/büyüme chapter portala GEÇMEZ.
 */
export interface PortalCc {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  yaraHatirlatma: Array<{ ad: string; due: string | null }>
  islemHatirlatma: Array<{ ad: string; due: string | null }>
  bakimIpuclari: string[]
  not: string
}

/**
 * RADYOLOJI-EXCEPTIONAL-01 — "Tetkiklerim": ayaktan görüntüleme hasta yüzü.
 * Yalnız durum / tarihler. Tanı, BI-RADS kategori sayısı, AI bulgu portala GEÇMEZ.
 */
export interface PortalRadyo {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** Hasta-güvenli durum satırları — yorum/tanı yok */
  tetkikler: Array<{ durum: 'Bekliyor' | 'Çekildi' | 'Rapor hazır' | 'Arşiv'; tarih: string | null; modaliteEtiket: string }>
  tetkikHatirlatma: Array<{ ad: string; due: string | null }>
  raporHatirlatma: Array<{ ad: string; due: string | null }>
  belgeHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * ANESTEZI-EXCEPTIONAL-01 — "Anestezi Öncesi": ayaktan / poliklinik anestezi hasta yüzü.
 * Yalnız hekimin belirlediği tarihler ve hasta-güvenli başlıklar. Tanı, ASA skor yorumu,
 * ilaç dozu portala GEÇMEZ (specialties/anestezi/engines/portal-anestezi-oncesi.ts kilidi).
 */
export interface PortalAnestezi {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Anestezi öncesi değerlendirme" — tanı/doz yok */
  preopHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Hava yolu kontrolü" — teknik/doz yok */
  havaYoluHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Ağrı izlem kontrolü" — mg doz yok */
  agriHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}

/**
 * ACIL-TIP-EXCEPTIONAL-01 — "Acil sonrası takip": ED sonrası kısa hasta yüzü.
 * Yalnız hekimin belirlediği tarihler. Tanı, doz, ESI sayı, STEMI/inme skoru,
 * bed board portala GEÇMEZ (specialties/acil-tip/engines/portal-acil-sonrasi.ts kilidi).
 */
export interface PortalAcilSonrasi {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  /** "Acil sonrası kontrol" — tanı/doz yok */
  taburcuHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Takip kontrolü" — ESI/skor yok */
  takipHatirlatma: Array<{ ad: string; due: string | null }>
  /** "Sevk / yatış takibi" — boarding HIS yok */
  sevkHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}


/**
 * KALP-DAMAR-CERRAHISI-EXCEPTIONAL-01 — "Damar Cerrahisi takibi": ayaktan kalp-damar cerrahisi hasta yüzü.
 * Yalnız hekimin belirlediği tarihler. Tanı, SCORE2, Kalbim, doz portala GEÇMEZ
 * (specialties/kalp-damar-cerrahisi/engines/portal-damar.ts kilidi). kardiyoloji Kalbim ayrı.
 */
export interface PortalDamarCerrahisi {
  sonrakiKontrol: { tarih: string; neden: string } | null
  hatirlatmalar: Array<{ ad: string; due: string | null; durum?: 'gecikti' | 'yaklasiyor' | 'planli' }>
  greftYaraHatirlatma: Array<{ ad: string; due: string | null }>
  antikoagHatirlatma: Array<{ ad: string; due: string | null }>
  preopHatirlatma: Array<{ ad: string; due: string | null }>
  ipuclari: string[]
  not: string
}
