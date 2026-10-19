export function aralikGirdi(gun: number): { gun: number } | { hata: string } {
  if (!(gun > 0 && gun < 365)) return { hata: 'Son tarih ve 1–364 gün aralık girin.' }
  return { gun }
}
