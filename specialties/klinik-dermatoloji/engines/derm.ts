/**
 * KLINIK-DERM-EXCEPTIONAL-01 — ayaktan lazer / akne bakım kliniği.
 * TUS dermatoloji (Derim, lezyon, morfoloji, skor) DEĞİLDİR. Tanı yok.
 */
export const HEKIM_KILIT = 'Lazer parametresi, fluence ve tanı hekimindir. Notya doz/skor yazmaz.'
export const ACIL_METIN = 'Yaygın kabarcık, görme kaybı, nefes darlığı veya hızla yayılan kızarıklık+ateş: 112.'

export const LAZER_BOLGELER = ['Yüz', 'Boyun', 'Gövde', 'Bacak', 'Diğer'] as const

export function lazerSeansVadesi(
  sonIso: string,
  aralikGun: number,
  bugun: string,
): { due: string; durum: 'gecikti' | 'bugun' | 'planli'; ozet: string } | { hata: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sonIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) {
    return { hata: 'Son seans ve bugün YYYY-MM-DD olmalı.' }
  }
  if (!(aralikGun >= 14 && aralikGun <= 90)) return { hata: 'Aralık 14–90 gün (hekim protokolü). Fluence yok.' }
  const dueMs = Date.parse(sonIso + 'T12:00:00Z') + aralikGun * 86400000
  const due = new Date(dueMs).toISOString().slice(0, 10)
  const gecen = Math.round((Date.parse(bugun + 'T12:00:00Z') - dueMs) / 86400000)
  const durum = gecen > 0 ? 'gecikti' as const : gecen === 0 ? 'bugun' as const : 'planli' as const
  return { due, durum, ozet: `Sonraki seans ${due} · ${durum}. Parametre hekimde.` }
}

export function akneBakimTakvimi(baslangicIso: string, bugun: string): Array<{ hafta: number; ad: string; durum: 'gecikti' | 'bugun' | 'planli' }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(baslangicIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return []
  const gecen = Math.round((Date.parse(bugun + 'T12:00:00Z') - Date.parse(baslangicIso + 'T12:00:00Z')) / 86400000)
  return [
    { hafta: 2, ad: 'Erken tahammül kontrolü (yorum yok)' },
    { hafta: 6, ad: 'Bakım uyum kontrolü (hekim)' },
    { hafta: 12, ad: 'Plan gözden geçirme (hekim)' },
  ].map((x) => {
    const gun = x.hafta * 7
    return { ...x, durum: gecen > gun ? 'gecikti' as const : gecen === gun ? 'bugun' as const : 'planli' as const }
  })
}

export function fotoRizaKayit(onamVar: boolean): { ozet: string } | { hata: string } {
  if (!onamVar) return { hata: 'Klinik foto için ayrı KVKK rızası zorunlu — lezyon atlası / TUS Derim yok.' }
  return { ozet: 'Foto KVKK rızası kayıtlı. Morfoloji, skor ve fluence yazılmaz.' }
}

export const INTAKE_ACIL = [
  'Lazer sonrası yaygın kabarcık veya görme kaybı',
  'Nefes darlığı / yaygın kurdeşen',
  'Hızla yayılan kızarıklık + ateş',
  'Yok',
]
