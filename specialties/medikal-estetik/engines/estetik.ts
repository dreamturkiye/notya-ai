/** MEDIKAL-ESTETIK-EXCEPTIONAL-01 — botoks/dolgu/PRP. Doz hekimde. Plastik/derm gridine sızmaz. Gün sayıları ürün kararıdır. */
import { kontrolDurumu } from '@/lib/klinik/telafi'
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

export function islemTakvimi(islemIso: string, bugun: string): Array<{ gun: number; ad: string; durum: 'gecikti' | 'bugun' | 'yaklasiyor' | 'planli' }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(islemIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return []
  return [
    { gun: 1, ad: 'Erken kontrol (şişlik / asimetri — yorum yok)' },
    { gun: 14, ad: 'Botoks etki kontrolü (hekim)' },
    { gun: 28, ad: 'Dolgu oturma kontrolü (hekim)' },
  ].map((x) => ({
    ...x,
    durum: kontrolDurumu(islemIso, x.gun, bugun) || 'planli',
  }))
}

export function vaskulerBayrak(belirti: boolean): { ozet: string } {
  return {
    ozet: belirti
      ? 'Görme kaybı / livedo / ani ağrı işaretli — 112. Hyaluronidaz dozu yazılmaz.'
      : 'Vasküler bayrak yok. Ünite/mL yine hekimde.',
  }
}

export function vaskulerAyrinti(gorme: boolean, livedo: boolean, agri: boolean, nefes: boolean): { ozet: string; acil: boolean } {
  const n = [gorme, livedo, agri, nefes].filter(Boolean).length
  return {
    acil: n > 0,
    ozet: n > 0
      ? `${n} vasküler belirti işaretli — 112. Hyaluronidaz dozu yazılmaz.`
      : 'Vasküler belirti yok. Ünite ve mL hekimde.',
  }
}

export function lotKaydi(lot: string, bolge: string): { ozet: string } | { hata: string } {
  if (!lot.trim() || !bolge.trim()) return { hata: 'Lot ve bölge yazın. Ünite ve mL yazılmaz.' }
  if (/\d+\s*(ml|mL|ünite|unite)/i.test(lot)) return { hata: 'Lot alanına ünite veya mL yazılmaz.' }
  return { ozet: `Lot kaydı: ${lot.trim()} · bölge ${bolge.trim()}. Doz yok.` }
}

export const INTAKE_ACIL = [
  'İşlem sonrası görme kaybı veya ani şiddetli ağrı (dolgu)',
  'Yüzde solukluk / livedo (vasküler oklüzyon şüphesi)',
  'Nefes darlığı, yaygın kurdeşen, dil-dudak şişmesi',
  'Yok',
]
