/**
 * SAC-EKIMI-EXCEPTIONAL-01 — ayaktan saç ekimi kliniği. Tanı/greft auto-lock yok.
 * Plastik / derm araç gridine sızmaz. Yıkama günleri ürün kararıdır; resmi takvim değildir.
 * Saç Ekimi Birimleri Hakkında Yönetmelik (40176) oda ve 72 saat kayıt görevini bağlar.
 * Ulusal yıkama veya greft takvimi yoktur.
 */
import { isoEkleGun, isoMu } from '@/lib/klinik/isoGun'
import { kontrolDurumu } from '@/lib/klinik/telafi'
export const HEKIM_KILIT = 'Greft bandı karar desteğidir. Nihai greft, çizgi ve tanı hekimindir; Notya doz/greft kilitlemez.'
/** md.6/5-c. Tesis standardıdır. Greft kilidi değildir. */
export const UYGULAMA_ODASI_M2 = 16
/** md.10/3. Takvim günü olarak 72 saat = 3 gün. Saat kliniğin kaydındadır. */
export const FOTO_72_GUN = 3
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

export function yikamaTakvimi(ameliyatIso: string, bugunIso: string): Array<{ gun: number; ad: string; durum: 'gecikti' | 'bugun' | 'yaklasiyor' | 'planli' }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ameliyatIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugunIso)) return []
  return [
    { gun: 1, ad: 'İlk pansuman / yüz yıkama tarifi' },
    { gun: 3, ad: 'Nazik yıkama (hekim protokolü)' },
    { gun: 10, ad: 'Kabuk dökülme kontrolü' },
    { gun: 14, ad: 'Kontrol muayenesi' },
  ].map((x) => ({
    ...x,
    durum: kontrolDurumu(ameliyatIso, x.gun, bugunIso) || 'planli',
  }))
}

export function uygulamaOdasi(m2: number): { ozet: string; dogrulandi: true } | { hata: string } {
  if (!(m2 > 0)) return { hata: 'Oda ölçüsünü girin.' }
  if (m2 < UYGULAMA_ODASI_M2) return { hata: `md.6/5-c: uygulama odası en az ${UYGULAMA_ODASI_M2} m². Bu ölçü standardın altında.` }
  return { ozet: `md.6/5-c: uygulama odası ${m2} m² — en az ${UYGULAMA_ODASI_M2} m². Tesis standardıdır, greft kilidi değildir.`, dogrulandi: true }
}

/** Kayıt görevi. Görüntü baytı saklanmaz. Bakanlık Ek-4 yazımı iddia edilmez. */
export function foto72Kaydi(islemIso: string): { ozet: string; bitis: string; dogrulandi: true } | { hata: string } {
  if (!isoMu(islemIso)) return { hata: 'İşlem gününü girin.' }
  const bitis = isoEkleGun(islemIso, FOTO_72_GUN)
  return {
    bitis,
    dogrulandi: true,
    ozet: `md.10/3: donör ve alıcı fotoğrafı işlemden önce ve ${bitis} tarihine kadar (ilk 72 saat) kaydedilir. Görüntü dosyası saklanmaz. Bakanlık Ek-4 yazımı iddia edilmez.`,
  }
}

export function fotoKvkkRiza(onamVar: boolean, ameliyatIso: string): { ozet: string } | { hata: string } {
  if (!onamVar) return { hata: 'Saç fotoğrafı için ayrı KVKK rızası işaretleyin — işlem onamı yetmez.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ameliyatIso)) return { hata: 'Foto tarihini girin.' }
  return { ozet: `Foto KVKK rızası kayıtlı (${ameliyatIso}). Yayın / sosyal medya izni bu kutudan doğmaz.` }
}

/** Ön çizgi / temporal / verteks — hekim notu. Norwood skoru kilitlemez. */
export function cizgiCercevesi(on: string, temporal: string, verteks: string): { ozet: string } | { hata: string } {
  if (!on.trim() || !temporal.trim()) return { hata: 'Ön çizgi ve temporal sınır hekim notu ister. Tanı yazılmaz.' }
  return { ozet: `Çizgi çerçevesi (hekim notu): ön ${on.trim()}; temporal ${temporal.trim()}; verteks ${verteks.trim() || 'belirtilmedi'}. Norwood kilidi değildir.` }
}

export const FOTO_SERI = [
  { gun: 0, ad: 'İşlem günü foto' },
  { gun: 10, ad: 'Kabuk günü foto' },
  { gun: 30, ad: 'Birinci ay foto' },
  { gun: 90, ad: 'Üçüncü ay foto' },
] as const

export const INTAKE_ACIL = [
  'Yeni ekim alanında hızla yayılan kızarıklık, ateş veya irin',
  'Ani yüz şişmesi veya nefes darlığı (ilaç / anestezi sonrası)',
  'Kontrolsüz kanama',
  'Yok',
]
