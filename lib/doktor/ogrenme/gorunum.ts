import type { HafizaKayit } from '@/lib/doktor/hafiza'
import { tarzCipiMetni } from './selam'

export { tarzCipiMetni }

export interface TarzKurali {
  slug: string
  deger: string
}

export function tarzPopoverSatirlari(kurallar: TarzKurali[]): { slug: string; metin: string }[] {
  return kurallar.filter((k) => k.slug && k.deger).map((k) => ({ slug: k.slug, metin: k.deger }))
}

export function hafizaGrupla(kayitlar: HafizaKayit[]): { kategori: string; kayitlar: HafizaKayit[] }[] {
  const sira = ['uslup', 'klinik', 'uygulama', 'rutin', 'iletisim', 'kisisel']
  const map = new Map<string, HafizaKayit[]>()
  for (const k of kayitlar) {
    if (!map.has(k.kategori)) map.set(k.kategori, [])
    map.get(k.kategori)!.push(k)
  }
  return sira.filter((k) => map.has(k)).map((k) => ({ kategori: k, kayitlar: map.get(k)! }))
}
