/** ERGOTERAPI-EXCEPTIONAL-01 — GYA; tanı hekimde. Pediatri Neyzi sızmaz. */
export const HEKIM_KILIT = 'GYA bandı karar desteğidir. Tanı ve ortez raporu hekimindir.'
export const ACIL_METIN = 'Ani güç kaybı veya konuşma bozukluğu: 112.'

export const GYA = ['Giyinme', 'Yemek', 'Banyo', 'Yazı / okul', 'İş', 'Oyun'] as const

export function gyaOzet(hekimTani: string, zorluklar: string[]): { ozet: string } | { hata: string } {
  if (!hekimTani.trim()) return { hata: 'Hekim tanısı referansı zorunlu.' }
  const z = zorluklar.filter(Boolean)
  if (!z.length) return { hata: 'En az bir GYA alanı işaretleyin.' }
  return { ozet: `Hekim tanısı (referans): ${hekimTani.trim()}. GYA odak: ${z.join(', ')}. Bağımsızlık yorumu / tanı yok.` }
}

export const INTAKE_ACIL = ['Ani güç kaybı veya konuşma bozukluğu', 'Kontrolsüz nöbet', 'Yok']
