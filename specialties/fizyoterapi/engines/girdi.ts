export function hekimGirdi(tani: string): { tani: string } | { hata: string } {
  if (!tani.trim()) return { hata: 'Hekim tanısı referansı zorunlu — seans notu açılamaz.' }
  return { tani: tani.trim() }
}
