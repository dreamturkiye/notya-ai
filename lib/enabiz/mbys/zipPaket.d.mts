export function crc32(buf: Uint8Array): number
export function zipOlustur(dosyalar: { ad: string; veri: Buffer }[]): Buffer
export function klasorDosyalari(dizin: string, kokAd?: string): { ad: string; veri: Buffer }[]
export function klasoruPaketle(dizin: string, kokAd?: string): Buffer
export const PAKET_YOLU: string
export const UZANTI_DIZINI: string
