export function neyziRed(metin: string): { hata: string } | null {
  if (/neyzi/i.test(metin)) return { hata: 'Neyzi bu dalda yok.' }
  return null
}
