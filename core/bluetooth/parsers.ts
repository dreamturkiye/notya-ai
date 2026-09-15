/**
 * IEEE 11073-20601 numeric decoders used by Bluetooth SIG medical profiles.
 * SFLOAT: 16-bit — 4-bit signed exponent (high nibble) + 12-bit signed mantissa.
 * FLOAT:  32-bit — 8-bit signed exponent (high byte)  + 24-bit signed mantissa.
 * Special values (mantissa codes) → null: NaN 0x07FF, NRes 0x0800, +INF 0x07FE, -INF 0x0802
 * (FLOAT: 0x7FFFFF, 0x800000, 0x7FFFFE, 0x800002). Little-endian on the wire.
 */

function ikiyeTumle(deger: number, bit: number): number {
  const isaretBiti = 1 << (bit - 1)
  return deger & isaretBiti ? deger - (1 << bit) : deger
}

export function sfloatOku(dv: DataView, offset: number): number | null {
  const ham = dv.getUint16(offset, true)
  const mantissaHam = ham & 0x0fff
  if (mantissaHam === 0x07ff || mantissaHam === 0x0800 || mantissaHam === 0x07fe || mantissaHam === 0x0802) return null
  const exponent = ikiyeTumle(ham >> 12, 4)
  const mantissa = ikiyeTumle(mantissaHam, 12)
  return mantissa * Math.pow(10, exponent)
}

export function floatOku(dv: DataView, offset: number): number | null {
  const ham = dv.getUint32(offset, true)
  const mantissaHam = ham & 0x00ffffff
  if (mantissaHam === 0x7fffff || mantissaHam === 0x800000 || mantissaHam === 0x7ffffe || mantissaHam === 0x800002) return null
  const exponent = ikiyeTumle(ham >>> 24, 8)
  const mantissa = ikiyeTumle(mantissaHam, 24)
  return mantissa * Math.pow(10, exponent)
}

/** GATT Date Time (7 bayt): yıl u16, ay u8, gün u8, saat u8, dk u8, sn u8 → ISO (yerel saat) */
export function tarihZamanOku(dv: DataView, offset: number): string | null {
  if (offset + 7 > dv.byteLength) return null
  const yil = dv.getUint16(offset, true), ay = dv.getUint8(offset + 2), gun = dv.getUint8(offset + 3)
  const sa = dv.getUint8(offset + 4), dk = dv.getUint8(offset + 5), sn = dv.getUint8(offset + 6)
  if (!yil || !ay || !gun) return null
  const d = new Date(yil, ay - 1, gun, sa, dk, sn)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export function hex(dv: DataView): string {
  let s = ''
  for (let i = 0; i < dv.byteLength; i++) s += dv.getUint8(i).toString(16).padStart(2, '0')
  return s
}

export function yuvarla(v: number, basamak: number): number {
  const k = Math.pow(10, basamak)
  return Math.round(v * k) / k
}
