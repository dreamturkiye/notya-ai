/**
 * GOGUS-EXCEPTIONAL-01 — İnhaler teknik kontrol listesi + izlem takvimi. SAF fonksiyon.
 * Doz / mcg / puff üretilmez. Cihaz sınıfı (ÖDİ / KTİ / soft mist) hekim seçer.
 */
import { ayEkle, type Dipnot } from './gogus'

export type InhalerCihaz = 'odi' | 'kti' | 'soft_mist' | 'nebul' | 'diger'

export const INHALER_CIHAZ_AD: Record<InhalerCihaz, string> = {
  odi: 'Ölçülü doz inhaler (ÖDİ)',
  kti: 'Kuru toz inhaler (KTİ)',
  soft_mist: 'Soft mist inhaler',
  nebul: 'Nebulizatör',
  diger: 'Diğer / hekim belirtti',
}

export const INHALER_CIHAZLARI: InhalerCihaz[] = ['odi', 'kti', 'soft_mist', 'nebul', 'diger']

/** Ortak teknik maddeler — cihazdan bağımsız çekirdek. */
export const INHALER_TEKNIK_ORTAK: readonly string[] = [
  'Doğru cihaz hazırlığı (kapak, sallama / kapsül yükleme)',
  'İnhalasyon öncesi tam ekspirasyon (cihaza değil)',
  'Dudakların ağızlığı tam kapatması',
  '5–10 sn nefes tutma',
  'ICS sonrası ağız çalkalama (uygunsa)',
  'Doz sayacı / boş cihaz kontrolü',
]

export const INHALER_TEKNIK_CIHAZ: Record<InhalerCihaz, readonly string[]> = {
  odi: ['Cihaza uygun inspirasyon: yavaş ve derin', 'Spacer / ara parça kullanımı (hekim önerdiyse)'],
  kti: ['Cihaza uygun inspirasyon: hızlı ve güçlü', 'Kapsül / blister doğru yüklendi'],
  soft_mist: ['Cihaz hazırlığı (kartuş / doz) tamam', 'Yavaş-derin inspirasyon'],
  nebul: ['Maske / ağızlık oturumu doğru', 'Tedavi süresi hekim tarifine uygun'],
  diger: ['Hekimin tarif ettiği cihaz adımları uygulandı'],
}

export interface InhalerIzlemGirdi {
  cihaz: InhalerCihaz
  /** Hekimin işaretlediği tamamlanan teknik maddeler (index veya metin) */
  tamamlanan: string[]
  /** İdame sınıfı metni — doz yok */
  sinifMetni?: string | null
  bugun: string
  /** Teknik kontrol tekrarı (ay) — varsayılan 3 */
  kontrolAy?: number
}

export interface InhalerIzlemSonuc {
  cihazAd: string
  liste: string[]
  tamamSayi: number
  toplam: number
  eksikler: string[]
  ozet: string
  sonrakiKontrolIso: string
  gorev: { kod: string; ad: string; due: string }
  dipnotlar: Dipnot[]
}

export function inhalerIzlem(g: InhalerIzlemGirdi): InhalerIzlemSonuc {
  const liste = [...INHALER_TEKNIK_ORTAK, ...INHALER_TEKNIK_CIHAZ[g.cihaz]]
  const set = new Set(g.tamamlanan.map((x) => x.trim()).filter(Boolean))
  const eksikler = liste.filter((m) => !set.has(m))
  const ay = g.kontrolAy && g.kontrolAy > 0 ? g.kontrolAy : 3
  const due = ayEkle(g.bugun, ay)
  const sinif = (g.sinifMetni || '').trim()
  const ozet = [
    `İnhaler teknik kontrolü (${INHALER_CIHAZ_AD[g.cihaz]}): ${set.size}/${liste.length} madde tamam.`,
    sinif ? `Sınıf (hekim): ${sinif}.` : null,
    eksikler.length ? `Eksik teknik adımlar not edildi (${eksikler.length}).` : 'Teknik maddeler tamamlandı.',
    `Tekrar teknik kontrol taslağı: ${due} (hekim değiştirebilir).`,
    'Doz ve puff sayısı yazılmaz — hekim reçetesine bakılır.',
  ].filter(Boolean).join(' ')

  return {
    cihazAd: INHALER_CIHAZ_AD[g.cihaz],
    liste: [...liste],
    tamamSayi: set.size,
    toplam: liste.length,
    eksikler,
    ozet,
    sonrakiKontrolIso: due,
    gorev: { kod: 'inhaler_teknik', ad: 'İnhaler teknik kontrolü', due },
    dipnotlar: [
      { ref: 'TTD', not: 'İnhaler teknik eğitimi her vizitte gözden geçirilir; cihaz sınıfı hekim seçer' },
      { ref: 'TITCK', not: 'mcg / puff / gün sayısı KÜB ve reçetede; Notya doz üretmez' },
    ],
  }
}

export function inhalerCihazGecerliMi(x: unknown): x is InhalerCihaz {
  return typeof x === 'string' && x in INHALER_CIHAZ_AD
}
