/**
 * ESTETIK-CERRAHI-EXCEPTIONAL-01 — ayaktan estetik cerrahi kliniği.
 * TUS plastik-cerrahi (Yaram, OR HIS, rekonstrüksiyon) DEĞİLDİR.
 */
export const HEKIM_KILIT = 'Ameliyat endikasyonu, teknik ve tanı hekimindir. Notya kesi / implant seçmez.'
export const ACIL_METIN = 'Ani nefes darlığı, tek taraflı bacak şişliği, kontrolsüz kanama veya yüksek ateş: 112.'

export const ISLEMLER = ['Rinoplasti', 'Liposuction', 'Meme estetiği', 'Blefaroplasti', 'Diğer'] as const

export function cerrahiSoguma(onamIso: string, ameliyatIso: string): { uygun: boolean; ozet: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(onamIso) || !/^\d{4}-\d{2}-\d{2}$/.test(ameliyatIso)) {
    return { uygun: false, ozet: 'Onam ve ameliyat tarihini girin (elektif soğuma — hekim doğrular).' }
  }
  const gun = Math.round((Date.parse(ameliyatIso + 'T12:00:00Z') - Date.parse(onamIso + 'T12:00:00Z')) / 86400000)
  if (gun < 0) return { uygun: false, ozet: 'Ameliyat tarihi onamdan önce olamaz.' }
  return {
    uygun: gun >= 1,
    ozet: gun >= 1
      ? `Onam ile ameliyat arası ${gun} gün — soğuma kaydı var (hekim mevzuatı teyit eder).`
      : 'Aynı gün işlem: elektif soğuma zayıf. Hekim istisnayı belgeler.',
  }
}

export function postOpTakvim(ameliyatIso: string, bugun: string): Array<{ gun: number; ad: string; durum: 'gecikti' | 'bugun' | 'planli' }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ameliyatIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return []
  const gecen = Math.round((Date.parse(bugun + 'T12:00:00Z') - Date.parse(ameliyatIso + 'T12:00:00Z')) / 86400000)
  return [
    { gun: 1, ad: 'Erken pansuman / dren kontrolü' },
    { gun: 7, ad: 'Dikiş / şişlik kontrolü (hekim)' },
    { gun: 14, ad: 'Yara bakımı kontrolü' },
    { gun: 42, ad: 'Geç dönem izlem (hekim)' },
  ].map((x) => ({
    ...x,
    durum: gecen > x.gun ? 'gecikti' as const : gecen === x.gun ? 'bugun' as const : 'planli' as const,
  }))
}

export function rizaIkiNusha(onamVar: boolean, hastaNusha: boolean): { ozet: string } | { hata: string } {
  if (!onamVar || !hastaNusha) return { hata: 'Hasta Hakları m.26: iki nüsha — dosya + hasta. Eksik nüsha belgelenmeden işlem yok.' }
  return { ozet: 'İki nüsha rıza kaydı var (dosya + hasta). E-imza iddia edilmez.' }
}

export const INTAKE_ACIL = [
  'Kontrolsüz kanama veya yara açılması',
  'Ani nefes darlığı / göğüs ağrısı (emboli şüphesi)',
  'Tek taraflı bacak şişliği',
  'Yok',
]
