/** KLINIK-PSIKOLOG-EXCEPTIONAL-01 — tıbbi tanı / reçete yok. Psikiyatri araçlarına sızmaz. */
export const HEKIM_KILIT = 'Klinik psikolog tıbbi tanı koymaz ve reçete yazmaz. Ölçek tarama kaydıdır, tanı kilidi değildir.'
export const ACIL_METIN = 'Kendine veya başkasına zarar / psikoz şüphesi: 112 veya en yakın acil / psikiyatri. Portal mesajı beklenmez.'

export function seansCercevesi(yaklasim: string, olcek: string | null, kriz: boolean): { ozet: string } | { hata: string } {
  if (kriz) return { ozet: ACIL_METIN }
  if (!yaklasim.trim()) return { hata: 'Seans yaklaşımını (BDT / EMDR / ACT / diğer) yazın — tanı yazmayın.' }
  const olcekSatir = olcek?.trim() ? `Ölçek uygulandı (kayıt): ${olcek.trim()} — yorum/tanı yok.` : 'Ölçek yok.'
  return { ozet: `Seans çerçevesi: ${yaklasim.trim()}. ${olcekSatir} Tıbbi tanı ve ilaç yok.` }
}

export function seansVadesi(sonIso: string, aralikGun: number, bugun: string): { due: string; ozet: string } | { hata: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sonIso) || !(aralikGun >= 3 && aralikGun <= 60)) {
    return { hata: 'Son seans ve 3–60 gün aralık girin. Skor yorumu yok.' }
  }
  const d = new Date(sonIso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + aralikGun)
  const due = d.toISOString().slice(0, 10)
  const fark = Math.round((Date.parse(due + 'T12:00:00Z') - Date.parse(bugun + 'T12:00:00Z')) / 86400000)
  const durum = fark < 0 ? 'gecikti' : fark === 0 ? 'bugün' : `${fark} gün sonra`
  return { due, ozet: `Sonraki seans ${due} (${durum}). Ölçek yorumu / tanı yok.` }
}

export const INTAKE_ACIL = [
  'Kendine zarar verme veya intihar düşüncesi',
  'Başkasına zarar verme düşüncesi',
  'Gerçeği değerlendirmede belirgin bozulma',
  'Yok',
]
