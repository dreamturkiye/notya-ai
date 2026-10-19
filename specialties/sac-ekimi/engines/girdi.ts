import { greftBandi } from './sac'

/** Donör aralığı greft bandıyla aynı kapıdadır. */
export function donorGirdi(cm2: number, yogunluk: number): { cm2: number; yogunluk: number } | { hata: string } {
  const r = greftBandi(cm2, yogunluk)
  if ('hata' in r) return r
  return { cm2, yogunluk }
}
