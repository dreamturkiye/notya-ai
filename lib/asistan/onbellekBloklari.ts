/**
 * Sesli / yazılı Ayşe system blokları.
 * Kırılma noktaları (en fazla 4): global (persona, tüm hekimler paylaşır), hekim (hitap),
 * kararlı (hafıza + hasta JSON + branş kilidi + dosya gövdesi — turdan tura aynı bayt).
 * Kuyruk önbelleklenmez: gün özeti, kesin cümle, kanıt, eylem istemi. Soru metni dosya önekini bozmaz.
 * Hasta adı global ve hekim bloklarına girmez.
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
  if (p.kararli.trim()) bloklar.push({ metin: p.kararli, onbellek: true })
  if (p.kuyruk.trim()) bloklar.push({ metin: p.kuyruk })
  return bloklar
}
