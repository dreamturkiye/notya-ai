/** LONGEVITY-EXCEPTIONAL-01 — IV / biyobelirteç. Karışım ve doz uydurulmaz. */
export const HEKIM_KILIT = 'Protokol SINIF düzeyindedir. IV içerik, mL ve hormon dozu hekimindir; Notya karışım yazmaz.'
export const ACIL_METIN = 'IV sırasında nefes darlığı, yaygın kaşıntı veya tansiyon düşmesi: infüzyonu durdur, 112.'

export const SINIFLAR = ['IV destek (sınıf)', 'Biyobelirteç izlem', 'Hormon değerlendirme (doz yok)', 'Uyku / enerji görüşmesi'] as const

export function sonrakiInfuzon(sonIso: string, aralikGun: number, bugun: string): { due: string; durum: 'gecikti' | 'yaklasiyor' | 'planli' } | { hata: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sonIso) || !(aralikGun > 0 && aralikGun < 365)) {
    return { hata: 'Son tarih ve 1–364 gün aralık girin.' }
  }
  const d = new Date(sonIso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + aralikGun)
  const due = d.toISOString().slice(0, 10)
  const fark = Math.round((Date.parse(due + 'T12:00:00Z') - Date.parse(bugun + 'T12:00:00Z')) / 86400000)
  return { due, durum: fark < 0 ? 'gecikti' : fark <= 7 ? 'yaklasiyor' : 'planli' }
}

export const INTAKE_ACIL = [
  'IV sırasında nefes darlığı, yaygın kaşıntı veya tansiyon düşmesi',
  'Göğüs ağrısı',
  'Bayılma',
  'Yok',
]
