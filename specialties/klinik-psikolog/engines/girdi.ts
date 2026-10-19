const KACAK = /DSM|reçete|tıbbi tanı/i

export function taniKacagi(metin: string): { hata: string } | null {
  if (KACAK.test(metin)) return { hata: 'Yaklaşım alanına DSM, reçete veya tıbbi tanı yazılmaz.' }
  return null
}
