'use client'
import { klinikKayitAnahtar, klinikKayitCoz, type KlinikHastaKayit } from './klinikKayit'

export function klinikDefterOku(userId: string): Record<string, KlinikHastaKayit> {
  if (typeof window === 'undefined' || !userId) return {}
  return klinikKayitCoz(window.localStorage.getItem(klinikKayitAnahtar(userId)))
}

export function klinikDefterYaz(userId: string, defter: Record<string, KlinikHastaKayit>): void {
  if (typeof window === 'undefined' || !userId) return
  window.localStorage.setItem(klinikKayitAnahtar(userId), JSON.stringify(defter))
}
