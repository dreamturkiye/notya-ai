export function dosyaOncelik(acil: string | null, riza: boolean): '112' | 'riza-eksik' | 'izlem' {
  if (acil && acil.trim()) return '112'
  if (!riza) return 'riza-eksik'
  return 'izlem'
}
