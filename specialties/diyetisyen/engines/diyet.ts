/** DIYETISYEN-EXCEPTIONAL-01 — makro karar desteği; tıbbi tanı hekimde. */
export const HEKIM_KILIT = 'Makro bandı karar desteğidir. Tıbbi tanı, ilaç ve takviye dozu yazılmaz.'
export const ACIL_METIN = 'Kontrolsüz kusma + bilinç değişikliği veya ağır alerji: 112.'

export function makroBand(kiloKg: number, hedef: 'kilo' | 'koruma' | 'spor'): { ozet: string } | { hata: string } {
  if (!(kiloKg >= 30 && kiloKg <= 250)) return { hata: 'Kilo 30–250 kg aralığında olmalı — Notya uydurmaz.' }
  const kcal = Math.round(kiloKg * (hedef === 'kilo' ? 22 : hedef === 'spor' ? 32 : 27))
  const protein = Math.round(kiloKg * (hedef === 'spor' ? 1.6 : 1.2))
  return { ozet: `Karar desteği: ~${kcal} kcal / ~${protein} g protein bandı (${hedef}). Nihai plan diyetisyen + hekim tanısınadır.` }
}

export function taniReferansi(hekimTani: string): { ozet: string } | { hata: string } {
  if (!hekimTani.trim()) return { hata: 'Tıbbi beslenme için hekim tanısı / sevk notu girin. Diyetisyen tanı koymaz.' }
  return { ozet: `Hekim tanısı (referans): ${hekimTani.trim()}. Plan buna bağlı; ICD kilidi yok.` }
}

export function kontrolTakvimi(baslangicIso: string, bugun: string): Array<{ hafta: number; ad: string; durum: 'gecikti' | 'bugun' | 'planli' }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(baslangicIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return []
  const gecen = Math.round((Date.parse(bugun + 'T12:00:00Z') - Date.parse(baslangicIso + 'T12:00:00Z')) / 86400000)
  return [
    { hafta: 2, ad: 'Erken uyum kontrolü (öğün şablonu yok)' },
    { hafta: 4, ad: 'Kilo / semptom kaydı (yorum hekimde)' },
    { hafta: 8, ad: 'Plan gözden geçirme' },
  ].map((x) => {
    const gun = x.hafta * 7
    return { ...x, durum: gecen > gun ? 'gecikti' as const : gecen === gun ? 'bugun' as const : 'planli' as const }
  })
}

export const INTAKE_ACIL = [
  'Kontrolsüz kusma veya bilinç değişikliği (diyabet şüphesi)',
  'Ağır alerjik reaksiyon',
  'Yok',
]
