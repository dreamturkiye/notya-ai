export function lazerAralik(gun: number): { gun: number } | { hata: string } {
  if (!(gun >= 14 && gun <= 90)) return { hata: 'Aralık 14–90 gün (hekim protokolü). Fluence yok.' }
  return { gun }
}
