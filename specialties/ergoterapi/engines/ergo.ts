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

export function seansVadesi(sonIso: string, aralikGun: number, bugun: string): { due: string; ozet: string } | { hata: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sonIso) || !(aralikGun >= 3 && aralikGun <= 42)) {
    return { hata: 'Son seans ve 3–42 gün aralık girin. Motor skor yok.' }
  }
  const d = new Date(sonIso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + aralikGun)
  const due = d.toISOString().slice(0, 10)
  const fark = Math.round((Date.parse(due + 'T12:00:00Z') - Date.parse(bugun + 'T12:00:00Z')) / 86400000)
  const durum = fark < 0 ? 'gecikti' : fark === 0 ? 'bugün' : `${fark} gün sonra`
  return { due, ozet: `Sonraki GYA seansı ${due} (${durum}). Bağımsızlık skoru yok.` }
}

export const INTAKE_ACIL = ['Ani güç kaybı veya konuşma bozukluğu', 'Kontrolsüz nöbet', 'Yok']
