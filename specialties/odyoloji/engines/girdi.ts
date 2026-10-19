export function dbGirdi(db: number): { db: number } | { hata: string } {
  if (!(db >= -10 && db <= 120)) return { hata: 'Eşik −10 ile 120 dB arasında olmalı.' }
  return { db }
}
