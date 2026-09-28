/**
 * Sesli / yazılı Ayşe system blokları.
 * Önbellek yalnız sabit önekte: global (persona, tüm hekimler paylaşır) ve hekim (hitap).
 * Kararlı blok (hafıza, hasta satırı, branş kilidi, dosya gövdesi) ve kuyruk (gün, kesin cümle,
 * kanıt, eylem) önbelleklenmez. Hafıza seans sayacı ve hasta satırı her tur değişir; onları
 * önbelleğe yazmak her turda yazma cezasıdır — cevap, yazma bitmeden başlayamaz.
 * Soru metni dosya gövdesine girmez. Hasta adı global ve hekim bloklarına girmez.
 */
export function asistanOnbellekBloklari(p: {
  global: string
  hekim: string
  kararli: string
  kuyruk: string
}): { metin: string; onbellek?: boolean }[] {
  const bloklar: { metin: string; onbellek?: boolean }[] = []
  if (p.global.trim()) bloklar.push({ metin: p.global, onbellek: true })
  if (p.hekim.trim()) bloklar.push({ metin: p.hekim, onbellek: true })
  const kuyruk = [p.kararli, p.kuyruk].filter((s) => s && s.trim()).join('')
  if (kuyruk.trim()) bloklar.push({ metin: kuyruk })
  return bloklar
}
