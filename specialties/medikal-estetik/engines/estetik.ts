/** MEDIKAL-ESTETIK-EXCEPTIONAL-01 — botoks/dolgu/PRP. Doz hekimde. Plastik/derm gridine sızmaz. */
export const HEKIM_KILIT = 'Ünite ve mL karar desteği bandıdır. Doz, ürün ve tanı hekimindir.'
export const ACIL_METIN = 'Dolgu sonrası görme kaybı, livedo veya ani şiddetli ağrı = vasküler oklüzyon şüphesi: 112. Hyaluronidaz kararı hekimindir; Notya doz yazmaz.'

export const BOLGELER = ['Alın', 'Glabella', 'Kaz ayağı', 'Dudak', 'Nazolabial', 'Çene', 'Diğer'] as const

export function sogumaUygun(onamIso: string, islemIso: string): { uygun: boolean; ozet: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(onamIso) || !/^\d{4}-\d{2}-\d{2}$/.test(islemIso)) {
    return { uygun: false, ozet: 'Onam ve işlem tarihini girin (Ayakta Teşhis soğuma çerçevesi — hekim doğrular).' }
  }
  const gun = Math.round((Date.parse(islemIso + 'T12:00:00Z') - Date.parse(onamIso + 'T12:00:00Z')) / 86400000)
  if (gun < 0) return { uygun: false, ozet: 'İşlem tarihi onamdan önce olamaz.' }
  return {
    uygun: gun >= 1,
    ozet: gun >= 1
      ? `Onam ile işlem arası ${gun} gün — soğuma kaydı var (hekim mevzuatı teyit eder).`
      : 'Aynı gün işlem: soğuma kaydı zayıf. Hekim onamı ve istisnayı belgeler.',
  }
}

export function islemTakvimi(islemIso: string, bugun: string): Array<{ gun: number; ad: string; durum: 'gecikti' | 'bugun' | 'planli' }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(islemIso)) return []
  const gecen = Math.round((Date.parse(bugun + 'T12:00:00Z') - Date.parse(islemIso + 'T12:00:00Z')) / 86400000)
  return [
    { gun: 1, ad: 'Erken kontrol (şişlik / asimetri — yorum yok)' },
    { gun: 14, ad: 'Botoks etki kontrolü (hekim)' },
    { gun: 28, ad: 'Dolgu oturma kontrolü (hekim)' },
  ].map((x) => ({
    ...x,
    durum: gecen > x.gun ? 'gecikti' as const : gecen === x.gun ? 'bugun' as const : 'planli' as const,
  }))
}

export function vaskulerBayrak(belirti: boolean): { ozet: string } {
  return {
    ozet: belirti
      ? 'Görme kaybı / livedo / ani ağrı işaretli — 112. Hyaluronidaz dozu yazılmaz.'
      : 'Vasküler bayrak yok. Ünite/mL yine hekimde.',
  }
}

export const INTAKE_ACIL = [
  'İşlem sonrası görme kaybı veya ani şiddetli ağrı (dolgu)',
  'Yüzde solukluk / livedo (vasküler oklüzyon şüphesi)',
  'Nefes darlığı, yaygın kurdeşen, dil-dudak şişmesi',
  'Yok',
]
