/** KLINIK-PSIKOLOG-EXCEPTIONAL-01 — tıbbi tanı / reçete yok. Psikiyatri araçlarına sızmaz. */
export const HEKIM_KILIT = 'Klinik psikolog tıbbi tanı koymaz ve reçete yazmaz. Ölçek tarama kaydıdır, tanı kilidi değildir.'
export const ACIL_METIN = 'Kendine veya başkasına zarar / psikoz şüphesi: 112 veya en yakın acil / psikiyatri. Portal mesajı beklenmez.'

export function seansCercevesi(yaklasim: string, olcek: string | null, kriz: boolean): { ozet: string } | { hata: string } {
  if (kriz) return { ozet: ACIL_METIN }
  if (!yaklasim.trim()) return { hata: 'Seans yaklaşımını (BDT / EMDR / ACT / diğer) yazın — tanı yazmayın.' }
  const olcekSatir = olcek?.trim() ? `Ölçek uygulandı (kayıt): ${olcek.trim()} — yorum/tanı yok.` : 'Ölçek yok.'
  return { ozet: `Seans çerçevesi: ${yaklasim.trim()}. ${olcekSatir} Tıbbi tanı ve ilaç yok.` }
}

export const INTAKE_ACIL = [
  'Kendine zarar verme veya intihar düşüncesi',
  'Başkasına zarar verme düşüncesi',
  'Gerçeği değerlendirmede belirgin bozulma',
  'Yok',
]
