export function siklikGun(siklik: string): { gun: number } | { hata: string } {
  if (siklik === 'haftalık') return { gun: 7 }
  if (siklik === 'iki haftada bir') return { gun: 14 }
  if (siklik === 'aylık') return { gun: 30 }
  return { hata: 'Sıklık: haftalık, iki haftada bir veya aylık.' }
}
