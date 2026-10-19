/** LONGEVITY-EXCEPTIONAL-01 — IV / biyobelirteç. Karışım ve doz uydurulmaz. Aralık ürün kararıdır. */
import { vadeDurumu } from '@/lib/klinik/isoGun'
export const HEKIM_KILIT = 'Protokol SINIF düzeyindedir. IV içerik, mL ve hormon dozu hekimindir; Notya karışım yazmaz.'
export const ACIL_METIN = 'IV sırasında nefes darlığı, yaygın kaşıntı veya tansiyon düşmesi: infüzyonu durdur, 112.'

export const SINIFLAR = ['IV destek (sınıf)', 'Biyobelirteç izlem', 'Hormon değerlendirme (doz yok)', 'Uyku / enerji görüşmesi'] as const

export function sonrakiInfuzon(sonIso: string, aralikGun: number, bugun: string): { due: string; durum: 'gecikti' | 'bugun' | 'yaklasiyor' | 'planli' } | { hata: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sonIso) || !(aralikGun > 0 && aralikGun < 365)) {
    return { hata: 'Son tarih ve 1–364 gün aralık girin.' }
  }
  const d = new Date(sonIso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + aralikGun)
  const due = d.toISOString().slice(0, 10)
  return { due, durum: vadeDurumu(bugun, due) || 'planli' }
}

export const GUVENLIK_MADDELERI = [
  'IV set ve ürün lotu kaydı (karışım yazılmaz)',
  'Alerji / önceki reaksiyon soruldu',
  'Acil set / 112 yolu görünür',
  'Hasta işlem sırasında yalnız bırakılmadı',
] as const

export function ivGuvenlik(isaret: string[]): { ozet: string } | { hata: string } {
  const s = GUVENLIK_MADDELERI.filter((m) => isaret.includes(m))
  if (s.length < 3) return { hata: 'En az 3 güvenlik maddesi işaretleyin — doz/karışım yazılmaz.' }
  return { ozet: `IV güvenlik kaydı: ${s.join(' · ')}. Karışım ve mL hekimde.` }
}

export function reaksiyonBand(nefes: boolean, kasinti: boolean, tansiyon: boolean): { ozet: string; acil: boolean } {
  const acil = nefes || kasinti || tansiyon
  return {
    acil,
    ozet: acil ? 'IV reaksiyon işaretli — infüzyonu durdur, 112. Karışım yazılmaz.' : 'IV reaksiyon bandı boş.',
  }
}

export function sinifUygun(sinif: string): { ozet: string } | { hata: string } {
  if (!SINIFLAR.includes(sinif as (typeof SINIFLAR)[number])) return { hata: 'Sınıf listeden seçilir. Karışım ve doz yazılmaz.' }
  return { ozet: `İzlem sınıfı: ${sinif}. İçerik ve mL hekimde.` }
}

export const INTAKE_ACIL = [
  'IV sırasında nefes darlığı, yaygın kaşıntı veya tansiyon düşmesi',
  'Göğüs ağrısı',
  'Bayılma',
  'Yok',
]
