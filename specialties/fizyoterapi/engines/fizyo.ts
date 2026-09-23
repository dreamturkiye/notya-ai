/** FIZYOTERAPI-EXCEPTIONAL-01 — 29.03.2025; tanı hekimde. FTR hekim araçlarına sızmaz. */
export const HEKIM_KILIT = 'Fizyoterapist tanı koymaz. ICF ve seans sayacı karar desteğidir. Hekim tanı referansı zorunlu.'
export const ACIL_METIN = 'Eyer uyuşukluğu / idrar-gaita kaçırma, efor göğüs ağrısı veya ilerleyici güç kaybı: 112 veya hekime acil iade.'

export function icfOzet(aktivite: string, katilim: string, hekimTani: string): { ozet: string } | { hata: string } {
  if (!hekimTani.trim()) return { hata: 'Hekim tanısı referansı zorunlu — seans notu açılamaz.' }
  const a = aktivite.trim() || 'belirtilmedi'
  const k = katilim.trim() || 'belirtilmedi'
  return { ozet: `Hekim tanısı (referans): ${hekimTani.trim()}. ICF aktivite: ${a}. Katılım: ${k}. Tanı fizyoterapiste ait değil.` }
}

export function seansVadesi(sonIso: string, periyotGun: number, tavan: number, yapilan: number, bugun: string): { ozet: string } | { hata: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sonIso) || !(periyotGun > 0)) return { hata: 'Son seans tarihi ve aralık girin.' }
  if (tavan > 0 && yapilan >= tavan) return { ozet: `Kayıtlı seans ${yapilan}/${tavan}. Tavan doldu — yeni seans hekim/rapor kararıdır; Notya hak iddia etmez.` }
  const d = new Date(sonIso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + periyotGun)
  const due = d.toISOString().slice(0, 10)
  const fark = Math.round((Date.parse(due + 'T12:00:00Z') - Date.parse(bugun + 'T12:00:00Z')) / 86400000)
  const durum = fark < 0 ? 'gecikti' : fark === 0 ? 'bugün' : `${fark} gün sonra`
  return { ozet: `Önerilen sonraki seans ${due} (${durum}). ${tavan > 0 ? `Kayıt ${yapilan}/${tavan}.` : ''} Tanı yok.` }
}

export function hekimPlaniKayit(tani: string, planTarih: string): { ozet: string } | { hata: string } {
  if (!tani.trim()) return { hata: '29.03.2025 md.16: hekim tanısı + tedavi planı olmadan seans yok.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(planTarih)) return { hata: 'Hekim planı tarihini girin.' }
  return { ozet: `Hekim planı referansı ${planTarih}: ${tani.trim()}. Tanı fizyoterapiste ait değil.` }
}

export const INTAKE_ACIL = [
  'Eyer tarzı uyuşukluk veya idrar / gaita kaçırma (cauda şüphesi)',
  'Egzersiz sırasında göğüs ağrısı veya bayılma',
  'İlerleyici güç kaybı veya ani düşme',
  'Yok',
]
