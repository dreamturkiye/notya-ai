/**
 * Tanı / tedavi numaralı maddelerini satır başına alır.
 *
 * Eski yazdır regex'i yalnız "2. Fizyolojik" gibi BÜYÜK HARF başlangıcını yakalıyordu;
 * "1. 3 günlük sağlam yenidoğan" ve "a) D vitamini" tek paragrafta kalıyordu (gerileme).
 *
 * Dokunulmaz: ICD (Z00.110, P59.9), ondalık (3.18 kg), Neyzi "25. persentil".
 */

function satirOnuneKoy(
  metin: string,
  re: RegExp,
  atla: (sonra: string) => boolean = () => false,
): string {
  return metin.replace(re, (esleme, offset: number, tum: string) => {
    if (offset === 0 || tum[offset - 1] === '\n') return esleme
    if (atla(tum.slice(offset + esleme.length))) return esleme
    return `\n${esleme}`
  })
}

export function satirBasiNumarala(metin: string): string {
  if (!metin) return metin
  let s = String(metin).replace(/\r\n/g, '\n')
  // 1. 3 günlük / 2. Fizyolojik — noktadan sonra boşluk (ondalık ve ICD eşleşmez)
  s = satirOnuneKoy(s, /(?<![A-Za-z0-9.])\d{1,2}\.\s+/g, (sonra) => /^persentil\b/i.test(sonra))
  // 1.TEDAVİ / 2.TAKİP — boşluksuz büyük harf başlık
  s = satirOnuneKoy(s, /(?<![A-Za-z0-9.])\d{1,2}\.(?=[A-ZÇĞİÖŞÜ]{2,})/g)
  // 1) tedavi  ·  a) D vitamini
  s = satirOnuneKoy(s, /(?<![A-Za-z0-9])(?:\d{1,2}|[a-hA-HçğıöşüÇĞİÖŞÜ])\)\s+/g)
  return s
}

const SOAP_NUMARA_ALANLARI = ['degerlendirme', 'plan', 'subjektif', 'objektif'] as const
const NOT_NUMARA_ALANLARI = ['tani', 'tedavi'] as const

/** SOAP gövdesindeki numaralı tanı/tedavi alanları — vitaller ve aiDegerlendirme'ye dokunmaz. */
export function soapNumaraliAlanlariDuzenle<T extends {
  soap?: { subjektif?: string; objektif?: string; degerlendirme?: string; plan?: string } | null
  tani?: string
  tedavi?: string
}>(veri: T): T {
  const soap = veri.soap
  if (soap && typeof soap === 'object') {
    for (const k of SOAP_NUMARA_ALANLARI) {
      const v = soap[k]
      if (typeof v === 'string' && v) soap[k] = satirBasiNumarala(v)
    }
  }
  for (const k of NOT_NUMARA_ALANLARI) {
    const v = veri[k]
    if (typeof v === 'string' && v) (veri as Record<string, string>)[k] = satirBasiNumarala(v)
  }
  return veri
}
