/**
 * KARDIO-EXCEPTIONAL-01 — SGK kardiyo rapor taslağı + SUT kontrol listesi. SAF fonksiyon.
 * T.C. kimlik yok · tanı hekim seçer · doz yok · Medula canlı gönderim yok.
 */
import type { Dipnot } from './kardiyoloji'

export type KardioRaporSablon =
  | 'hipertansiyon'
  | 'kalp_yetersizligi'
  | 'antikoagulan'
  | 'koroner_izlem'
  | 'ritim'

export const KARDIO_RAPOR_SABLONLARI: Array<{ id: KardioRaporSablon; ad: string }> = [
  { id: 'hipertansiyon', ad: 'Hipertansiyon takip / ilaç raporu' },
  { id: 'kalp_yetersizligi', ad: 'Kalp yetersizliği takip raporu' },
  { id: 'antikoagulan', ad: 'Antikoagülan / antithrombotik rapor notu' },
  { id: 'koroner_izlem', ad: 'Koroner arter hastalığı / stent izlem notu' },
  { id: 'ritim', ad: 'Ritim / AF takip bilgi notu' },
]

const KONTROL_LISTESI: Record<KardioRaporSablon, readonly string[]> = {
  hipertansiyon: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Güncel kan basıncı kayıtları ve tarihleri rapora işlendi',
    'Hedef KB ve izlem aralığı hekim tarafından yazıldı',
    'İlaç sınıfı belirtildi — doz yazılmadı (doz hekim reçetesinde)',
    'Kontrol randevusu planlandı',
  ],
  kalp_yetersizligi: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'NYHA sınıfı hekim değerlendirmesi olarak yazıldı',
    'Güncel kilo / ödem durumu kaydedildi',
    'İlaç sınıfı belirtildi — doz yazılmadı',
    'Kontrol ve acil başvuru planı yazıldı',
  ],
  antikoagulan: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Antikoagülan sınıfı hekim tarafından belirtildi (doz yok)',
    'Lab izlem planı (INR / böbrek) yazıldı',
    'Kanama riski ve hasta bilgilendirmesi kaydedildi',
    'Kontrol randevusu planlandı',
  ],
  koroner_izlem: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Geçirilmiş girişim / stent öyküsü hekim notundan alındı',
    'Antiagregan sınıfı belirtildi — doz yazılmadı',
    'Kontrol ve semptom izlem planı yazıldı',
    'EKG / belge ihtiyacı hekim tarafından işaretlendi',
  ],
  ritim: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Ritim izlem yöntemi hekim tarafından belirtildi',
    'Antikoagülan / hız kontrol sınıfı (doz yok) yazıldı',
    'Kontrol randevusu planlandı',
    'Acil belirtiler anlatıldı',
  ],
}

export interface KardioRaporDraft {
  sablon: KardioRaporSablon
  sablonAd: string
  hastaAdi: string
  tcSon4: ''
  tani: { icd10: string; aciklama: string } | null
  sureAy: number
  hekimDegerlendirmesi: string
  izlemPlani: string[]
  duzenlemeTarihi: string
}

export interface KardioRaporSonuc {
  draft: KardioRaporDraft
  kontrolListesi: Array<{ madde: string; tamam: boolean | null }>
  eksikler: string[]
  dipnotlar: Dipnot[]
}

export interface KardioRaporGirdi {
  sablon: KardioRaporSablon
  hastaAdi: string
  tani?: { icd10: string; aciklama: string } | null
  sureAy?: number
  hekimDegerlendirmesi?: string
  izlemPlani?: string[]
  isaretli?: Record<number, boolean>
  bugun: string
}

export function kardioRaporTaslagi(g: KardioRaporGirdi): KardioRaporSonuc {
  const sablonAd = KARDIO_RAPOR_SABLONLARI.find((s) => s.id === g.sablon)?.ad || 'Kardiyoloji raporu'
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
      { ref: 'TITCK', not: 'Doz ve reçete içeriği bu taslakta yer almaz.' },
    ],
  }
}

export function kilitlenebilirMi(sonuc: KardioRaporSonuc): boolean {
  return sonuc.eksikler.length === 0
}
