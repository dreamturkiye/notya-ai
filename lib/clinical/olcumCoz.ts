/**
 * Klinik ölçüm birimlerini Türkçe yazımdan kanonik sayıya çevirir.
 * Pediatri araçlarındaki girdi.ts ile aynı kurallar — Neyzi persentili ve SOAP
 * vitalleri de bunu kullanır (3180 gr → 3.18 kg; "50.50 cm" → 50.5).
 */

/** "3,5" · "3.5" · " 12 " · "1.250,5" → sayı. Tek nokta + tam 3 hane ("3.500") binlik ayırıcı sayılır. */
export function sayiCoz(ham: string | number | null | undefined): number | null {
  if (typeof ham === 'number') return Number.isFinite(ham) ? ham : null
  let s = String(ham ?? '').trim().replace(/\s+/g, '')
  if (!s) return null
  s = s.replace(/[^0-9.,-]/g, '')
  if (!s || s === '-') return null
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Kilo → kg. "3,5" · "3,5 kg" · "3500" · "3500 gr" · "3.500 g" · "850 g" hepsi kabul. */
export function kiloCoz(ham: string | number | null | undefined): number | null {
  if (typeof ham === 'number') {
    if (!Number.isFinite(ham) || ham <= 0) return null
    const kg = ham > 250 ? ham / 1000 : ham
    return Math.round(kg * 10000) / 10000
  }
  const s = String(ham ?? '').toLocaleLowerCase('tr-TR')
  const gramBirim = /\d\s*(gr|g|gram)\b/.test(s)
  const n = sayiCoz(s)
  if (n == null || n <= 0) return null
  const kg = gramBirim || (!/kg/.test(s) && n > 250) ? n / 1000 : n
  return Math.round(kg * 10000) / 10000
}

/** Boy / baş çevresi → cm. "112" · "112,5 cm" · "1,12 m" · "1.12" (3'ten küçük birimsiz değer metre sayılır). */
export function cmCoz(ham: string | number | null | undefined): number | null {
  if (typeof ham === 'number') {
    if (!Number.isFinite(ham) || ham <= 0) return null
    const cm = ham < 3 ? ham * 100 : ham
    return Math.round(cm * 100) / 100
  }
  const s = String(ham ?? '').toLocaleLowerCase('tr-TR')
  const n = sayiCoz(s)
  if (n == null || n <= 0) return null
  const cm = /\d\s*m\b/.test(s) && !/cm/.test(s) ? n * 100 : /mm/.test(s) ? n / 10 : n < 3 ? n * 100 : n
  return Math.round(cm * 100) / 100
}

/** Doğum ağırlığı gram olarak ("1850" · "1,85 kg" · "1.850 g"). */
export function gramCoz(ham: string | number | null | undefined): number | null {
  const kg = kiloCoz(ham)
  return kg == null ? null : Math.round(kg * 1000)
}

function olcumYaz(n: number, maxFrac: number): string {
  const k = 10 ** maxFrac
  return String(Math.round(n * k) / k)
}

/**
 * Form birimi zaten kg/cm — değere "gr"/"cm" yazılmaz.
 * Model veya belge "3180 gr" / "50.50 cm" verdiyse kanonik sayıya indirger.
 */
export function vitalOlcumleriniNormallestir<T>(vitaller: T): T {
  if (!vitaller || typeof vitaller !== 'object' || Array.isArray(vitaller)) return vitaller
  const v = vitaller as Record<string, unknown>
  const out: Record<string, unknown> = { ...v }
  if (v.kilo != null && v.kilo !== '') {
    const kg = kiloCoz(v.kilo as string | number)
    if (kg != null) out.kilo = olcumYaz(kg, kg < 10 ? 3 : 1)
  }
  if (v.boy != null && v.boy !== '') {
    const cm = cmCoz(v.boy as string | number)
    if (cm != null) out.boy = olcumYaz(cm, 1)
  }
  if (v.basCevresi != null && v.basCevresi !== '') {
    const cm = cmCoz(v.basCevresi as string | number)
    if (cm != null) out.basCevresi = olcumYaz(cm, 1)
  }
  return out as T
}
