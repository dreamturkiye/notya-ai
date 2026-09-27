/**
 * NOTYA-MESLEKTAS-V2 — GÜN-01 ek satırlar. Yalnız kayıtlı gerçeklerden.
 */

import { asamaBul, type IliskiAsamasi } from '@/lib/doktor/hafiza'

export function ogrenmeSelamSatiri(opts: {
  asama: IliskiAsamasi
  yeniKurallar: { deger: string }[]
}): string | null {
  if (opts.asama === 'tanisma') return null
  const adlar = opts.yeniKurallar.map((k) => k.deger.replace(/\.$/, '')).filter(Boolean).slice(0, 2)
  if (!adlar.length) return null
  return `Dünkü düzeltmelerinizden öğrendim: ${adlar.join('; ')}.`
}

export function meslektasSelamSatiri(opts: {
  seans: number
  dahaOnceGosterildi: boolean
  kuralSayisi: number
  rutinBaslangic?: string | null
}): string | null {
  if (opts.dahaOnceGosterildi) return null
  const asama = asamaBul(opts.seans)
  if (asama !== 'meslektas' && asama !== 'ortak') return null
  if (opts.seans < 10) return null
  if (opts.kuralSayisi < 1) return null
  const rutin = opts.rutinBaslangic ? `; sabahları genelde ${opts.rutinBaslangic} ile başlıyorsunuz` : ''
  return `10. seansımız Hocam — artık notlarınızı ${opts.kuralSayisi} kuralınızla yazıyorum${rutin}.`
}

export function tarzCipiMetni(n: number): string {
  const sayi = Math.max(0, Math.floor(n))
  return `Sizin tarzınızla yazıldı · ${sayi} kural`
}
