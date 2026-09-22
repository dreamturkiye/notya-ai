/**
 * SAC-EKIMI-EXCEPTIONAL-01 — ayaktan saç ekimi kliniği. Tanı/greft auto-lock yok.
 * Plastik / derm araç gridine sızmaz.
 */
export const HEKIM_KILIT = 'Greft bandı karar desteğidir. Nihai greft, çizgi ve tanı hekimindir; Notya doz/greft kilitlemez.'
export const ACIL_METIN = 'Yaygın kızarıklık+ateş, kontrolsüz kanama veya anestezi sonrası nefes darlığı: 112 veya kliniği acil arayın.'

export const NORWOOD = ['I', 'II', 'III', 'III-vertex', 'IV', 'V', 'VI', 'VII'] as const
export const LUDWIG = ['I', 'II', 'III'] as const

export function greftBandi(donorCm2: number, yogunlukCm2: number): { band: string; ozet: string } | { hata: string } {
  if (!(donorCm2 > 0) || !(yogunlukCm2 > 0)) return { hata: 'Donör alan ve yoğunluk pozitif olmalı.' }
  if (donorCm2 > 400 || yogunlukCm2 > 120) return { hata: 'Değer klinik aralık dışında — hekim doğrular; Notya uydurmaz.' }
  const tahmini = Math.round(donorCm2 * yogunlukCm2)
  const band = tahmini < 1500 ? 'düşük-orta' : tahmini < 3500 ? 'orta' : 'yüksek (seans bölünmesi düşünülür)'
  return { band, ozet: `Karar desteği: ~${tahmini} greft bandı (${band}). Nihai sayı hekimindir.` }
}

export function yikamaTakvimi(ameliyatIso: string, bugunIso: string): Array<{ gun: number; ad: string; durum: 'gecikti' | 'bugun' | 'planli' }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ameliyatIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugunIso)) return []
  const a = Date.parse(ameliyatIso + 'T12:00:00Z')
  const b = Date.parse(bugunIso + 'T12:00:00Z')
  const gecen = Math.round((b - a) / 86400000)
  return [
    { gun: 1, ad: 'İlk pansuman / yüz yıkama tarifi' },
    { gun: 3, ad: 'Nazik yıkama (hekim protokolü)' },
    { gun: 10, ad: 'Kabuk dökülme kontrolü' },
    { gun: 14, ad: 'Kontrol muayenesi' },
  ].map((x) => ({
    ...x,
    durum: gecen > x.gun ? 'gecikti' as const : gecen === x.gun ? 'bugun' as const : 'planli' as const,
  }))
}

export const INTAKE_ACIL = [
  'Yeni ekim alanında hızla yayılan kızarıklık, ateş veya irin',
  'Ani yüz şişmesi veya nefes darlığı (ilaç / anestezi sonrası)',
  'Kontrolsüz kanama',
  'Yok',
]
