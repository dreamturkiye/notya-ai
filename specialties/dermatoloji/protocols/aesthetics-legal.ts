import type { EvalResult } from './eval'

export const SALON_IPL = { nm_lo: 600, nm_hi: 1200, diode_max_j: 20 }

export function evaluateAesthetics(input: {
  modality: 'physician_laser' | 'filler' | 'botox' | 'deep_peel' | 'salon_ipl'
  fitzpatrick: string
  test_spot?: boolean
}): EvalResult {
  const physicianOnly = input.modality !== 'salon_ipl'
  return {
    triage: 'routine',
    next: [
      physicianOnly ? 'medical laser/filler/botox/deep peel physician-only' : `salon IPL ${SALON_IPL.nm_lo}–${SALON_IPL.nm_hi}nm diode ≤${SALON_IPL.diode_max_j} J/cm²`,
      'complication intake',
      'lot numbers',
      `Fitzpatrick ${input.fitzpatrick}`,
      input.test_spot ? 'test spot done' : 'test spot',
    ],
    citations: ['ayakta-teshis'],
    photoPlan: ['islem_oncesi', 'islem_sonrasi'],
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// DERM-EXCEPTIONAL-01 — kozmetik işlem izlenebilirliği: ürün / lot numarası ve komplikasyon
// alanları. Yalnız **kozmetik ünitesinde** gösterilir (sekme kapısı: `unit === 'kozmetik'`).
// Doz, birim (ünite/ml) ve enjeksiyon planı yazılmaz — hekim kendi kaydına yazar.
// ──────────────────────────────────────────────────────────────────────────────

export type KozmetikIslemTuru = 'botoks' | 'dolgu' | 'lazer' | 'ipl' | 'peeling' | 'mezoterapi' | 'prp' | 'diger'

export const KOZMETIK_ISLEM_ADI: Record<KozmetikIslemTuru, string> = {
  botoks: 'Botulinum toksin',
  dolgu: 'Dolgu (hyalüronik asit vb.)',
  lazer: 'Tıbbi lazer',
  ipl: 'IPL',
  peeling: 'Kimyasal peeling',
  mezoterapi: 'Mezoterapi',
  prp: 'PRP',
  diger: 'Diğer (hekim yazar)',
}

/** Lot numarası hangi işlemlerde zorunlu — enjekte edilen / uygulanan ürün izlenebilirliği. */
export const LOT_ZORUNLU: Record<KozmetikIslemTuru, boolean> = {
  botoks: true,
  dolgu: true,
  lazer: false,
  ipl: false,
  peeling: true,
  mezoterapi: true,
  prp: false,
  diger: false,
}

export const KOZMETIK_KOMPLIKASYONLARI: Array<{ kod: string; ad: string; acil: boolean }> = [
  { kod: 'vaskuler_okluzyon', ad: 'Vasküler oklüzyon şüphesi (ağrı, beyazlaşma, görme değişikliği)', acil: true },
  { kod: 'gorme_degisikligi', ad: 'Görme değişikliği / göz ağrısı', acil: true },
  { kod: 'nekroz', ad: 'Deri nekrozu', acil: true },
  { kod: 'enfeksiyon', ad: 'Enfeksiyon / abse', acil: false },
  { kod: 'nodul', ad: 'Nodül / granülom', acil: false },
  { kod: 'asimetri', ad: 'Asimetri', acil: false },
  { kod: 'pitozis', ad: 'Pitozis / kaş düşüklüğü (geçici)', acil: false },
  { kod: 'yanik', ad: 'Yanık / bül', acil: false },
  { kod: 'pigment', ad: 'Hipo / hiperpigmentasyon', acil: false },
  { kod: 'odem_ekimoz', ad: 'Ödem / ekimoz', acil: false },
]

export type KozmetikIslemKaydi = {
  tur: KozmetikIslemTuru
  tarih: string
  bolge: string
  /** ürün ticari adı — hekim yazar */
  urun?: string | null
  lotNo?: string | null
  /** son kullanma tarihi (izlenebilirlik) */
  sonKullanma?: string | null
  testSpot?: boolean
  fitzpatrick?: string | null
  komplikasyonlar?: string[]
  komplikasyonNotu?: string | null
  onamKodu?: string | null
}

export type KozmetikKontrol = {
  eksikler: string[]
  acilKomplikasyon: boolean
  acilMetni: string | null
  izlenebilirlikTam: boolean
  uyarilar: string[]
}

export function kozmetikKontrol(k: KozmetikIslemKaydi): KozmetikKontrol {
  const eksikler: string[] = []
  const uyarilar: string[] = []
  if (!k.bolge?.trim()) eksikler.push('Uygulama bölgesi')
  if (LOT_ZORUNLU[k.tur]) {
    if (!k.urun?.trim()) eksikler.push('Ürün adı (izlenebilirlik)')
    if (!k.lotNo?.trim()) eksikler.push('Lot numarası (izlenebilirlik)')
    if (!k.sonKullanma?.trim()) uyarilar.push('Son kullanma tarihi girilmedi')
  }
  if ((k.tur === 'lazer' || k.tur === 'ipl' || k.tur === 'peeling') && !k.fitzpatrick) {
    eksikler.push('Fitzpatrick deri tipi')
  }
  if ((k.tur === 'lazer' || k.tur === 'ipl') && !k.testSpot) {
    uyarilar.push('Test spot işaretlenmedi — karar hekimin')
  }
  if (!k.onamKodu) eksikler.push('Kozmetik işlem onamı')
  const acil = (k.komplikasyonlar || []).some((c) => KOZMETIK_KOMPLIKASYONLARI.find((x) => x.kod === c)?.acil)
  return {
    eksikler,
    acilKomplikasyon: acil,
    acilMetni: acil
      ? 'Acil komplikasyon işaretli — hekim protokolüne göre ivedi müdahale; görme değişikliğinde aynı gün göz değerlendirmesi. Notya tedavi veya doz önermez.'
      : null,
    izlenebilirlikTam: !LOT_ZORUNLU[k.tur] || !!(k.urun?.trim() && k.lotNo?.trim()),
    uyarilar,
  }
}

export const AYAKTA_TESHIS_NOTU =
  'Tıbbi lazer, dolgu, botulinum toksin ve derin peeling hekim tarafından, sağlık tesisi şartlarında uygulanır (Ayakta Teşhis mevzuatı). Güzellik salonu kapsamı ayrıdır.'
