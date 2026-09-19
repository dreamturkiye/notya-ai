/**
 * NEFROLOJI-DEEPEN-01 — SGK nefro rapor taslağı + SUT kontrol listesi. SAF fonksiyon.
 * T.C. kimlik yok · tanı hekim seçer · ESA/ilaç dozu yok · Medula canlı gönderim yok.
 * Diyaliz / ESA / KBH izlem / mineral-kemik şablonları — ayaktan nefro polikliniği için klinik fayda.
 */
import type { Dipnot } from './nefroloji'

export type NefRaporSablon =
  | 'kbh_izlem'
  | 'diyaliz'
  | 'esa_anemi'
  | 'mineral_kemik'
  | 'transplant_izlem'

export const NEF_RAPOR_SABLONLARI: Array<{ id: NefRaporSablon; ad: string }> = [
  { id: 'kbh_izlem', ad: 'Kronik böbrek hastalığı izlem / ilaç raporu' },
  { id: 'diyaliz', ad: 'Diyaliz tedavi / seans raporu' },
  { id: 'esa_anemi', ad: 'ESA / anemi-CKD ilaç raporu' },
  { id: 'mineral_kemik', ad: 'Mineral-kemik / fosfat bağlayıcı rapor notu' },
  { id: 'transplant_izlem', ad: 'Böbrek nakli izlem bilgi notu' },
]

const KONTROL_LISTESI: Record<NefRaporSablon, readonly string[]> = {
  kbh_izlem: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Güncel eGFR / UACR tarihleri rapora işlendi (sayı hekim notundan)',
    'İlaç sınıfı (RAS / SGLT2 vb.) belirtildi — doz yazılmadı',
    'Kontrol ve lab izlem aralığı hekim tarafından yazıldı',
    'Acil belirtiler (hiperkalemi / aşırı sıvı) anlatıldı',
  ],
  diyaliz: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Modalite (HD / PD / HDF) hekim tarafından belirtildi',
    'Seans / kontrol planı tarihleri yazıldı (makine parametresi yok)',
    'Vasküler erişim / kateter durumu hekim notunda',
    'SUT diyaliz koşulları güncel metinden teyit edildi',
  ],
  esa_anemi: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Güncel Hb (± ferritin) tarihleri rapora işlendi',
    'ESA sınıfı belirtildi — doz / IU Notya yazılmadı (reçetede hekim)',
    'Demir paneli / kanama ayrımı hekim değerlendirmesinde',
    'Kontrol Hb tarihi hasta ile paylaşıldı',
  ],
  mineral_kemik: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Ca / P / PTH izlem planı hekim tarafından yazıldı',
    'Fosfat bağlayıcı / D vitamini sınıfı belirtildi — doz yok',
    'Diyaliz / KBH evresi bağlamı hekim notunda',
    'Kontrol randevusu planlandı',
  ],
  transplant_izlem: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Nakil tarihi / merkez bilgisi hekim notundan alındı',
    'İmmünosupresan sınıfı belirtildi — doz yazılmadı',
    'Lab / enfeksiyon izlem planı yazıldı',
    'Kontrol randevusu planlandı',
  ],
}

export interface NefRaporDraft {
  sablon: NefRaporSablon
  sablonAd: string
  hastaAdi: string
  tcSon4: ''
  tani: { icd10: string; aciklama: string } | null
  sureAy: number
  hekimDegerlendirmesi: string
  izlemPlani: string[]
  duzenlemeTarihi: string
}

export interface NefRaporSonuc {
  draft: NefRaporDraft
  kontrolListesi: Array<{ madde: string; tamam: boolean | null }>
  eksikler: string[]
  dipnotlar: Dipnot[]
}

export interface NefRaporGirdi {
  sablon: NefRaporSablon
  hastaAdi: string
  tani?: { icd10: string; aciklama: string } | null
  sureAy?: number
  hekimDegerlendirmesi?: string
  izlemPlani?: string[]
  isaretli?: Record<number, boolean>
  bugun: string
}

export function nefRaporTaslagi(g: NefRaporGirdi): NefRaporSonuc {
  const sablonAd = NEF_RAPOR_SABLONLARI.find((s) => s.id === g.sablon)?.ad || 'Nefroloji raporu'
  const sureAy = g.sureAy && g.sureAy > 0 ? Math.min(Math.round(g.sureAy), 24) : 12
  const kontrolListesi = KONTROL_LISTESI[g.sablon].map((madde, i) => ({
    madde,
    tamam: g.isaretli && i in g.isaretli ? !!g.isaretli[i] : null,
  }))
  const eksikler: string[] = []
  if (!g.tani) eksikler.push('TANI / ICD-10 hekim tarafından seçilmedi — rapor kilitlenemez')
  if (!String(g.hekimDegerlendirmesi || '').trim()) eksikler.push('Hekim değerlendirmesi boş')
  for (const k of kontrolListesi) if (k.tamam !== true) eksikler.push(`Kontrol maddesi işaretlenmedi: ${k.madde}`)

  return {
    draft: {
      sablon: g.sablon,
      sablonAd,
      hastaAdi: g.hastaAdi || '',
      tcSon4: '',
      tani: g.tani || null,
      sureAy,
      hekimDegerlendirmesi: String(g.hekimDegerlendirmesi || '').slice(0, 3000),
      izlemPlani: (g.izlemPlani || []).map((x) => String(x).slice(0, 300)).slice(0, 10),
      duzenlemeTarihi: g.bugun,
    },
    kontrolListesi,
    eksikler,
    dipnotlar: [
      { ref: 'SGK_SUT', not: 'Rapor koşulları SUT’tan kontrol listesi olarak alınmıştır; güncel madde metnini hekim doğrular.' },
      { ref: 'TITCK', not: 'ESA / ilaç dozu ve reçete içeriği bu taslakta yer almaz.' },
    ],
  }
}

export function kilitlenebilirMi(sonuc: NefRaporSonuc): boolean {
  return sonuc.eksikler.length === 0
}

/** Taslak metninde T.C. / doz sızıntısı yakala. */
export function raporMetniGuvenliMi(metin: string): boolean {
  return !/\b\d{11}\b|\bT\.?C\.?\b|\bmg\b|\bIU\b|\bünite\b|ESA dozu\s*\d/i.test(metin)
}
