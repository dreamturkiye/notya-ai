import { ptaKayit } from './odyo'

export function esikEgimi(onceki: number, simdi: number): { ozet: string } | { hata: string } {
  const a = ptaKayit(onceki)
  if ('hata' in a) return a
  const b = ptaKayit(simdi)
  if ('hata' in b) return b
  const yon = simdi > onceki + 5 ? 'eşik yükseldi' : simdi < onceki - 5 ? 'eşik düştü' : 'aynı eşik bandı'
  return { ozet: `${b.ozet} Önceki kayda göre ${yon}. Bu bir tanı değildir.` }
}
