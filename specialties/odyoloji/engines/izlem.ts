import { isoMu } from '@/lib/klinik/isoGun'
import { ptaKayit } from './odyo'

export function altiAyCihaz(rapor: boolean, kontrolIso: string): { gun: number; ad: string } | null | { hata: string } {
  if (!rapor) return null
  if (!isoMu(kontrolIso)) return { hata: 'Kontrol gününü girin.' }
  return { gun: 180, ad: 'Altıncı ay cihaz kontrolü' }
}

export function esikEgimi(onceki: number, simdi: number): { ozet: string } | { hata: string } {
  const a = ptaKayit(onceki)
  if ('hata' in a) return a
  const b = ptaKayit(simdi)
  if ('hata' in b) return b
  const yon = simdi > onceki + 5 ? 'eşik yükseldi' : simdi < onceki - 5 ? 'eşik düştü' : 'aynı eşik bandı'
  return { ozet: `${b.ozet} Önceki kayda göre ${yon}. Bu bir tanı değildir.` }
}
