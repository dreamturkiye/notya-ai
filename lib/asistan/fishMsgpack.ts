/**
 * NOTYA-FISH-WS-01 — minimal MessagePack for the Fish TTS live socket.
 * Covers what the protocol uses: nil, bool, int, float, str, bin, array, map.
 * No dependency; the ASR body encoder in fishSes.ts stays as it is.
 */

export type MsgpackDeger =
  | null
  | boolean
  | number
  | string
  | Uint8Array
  | MsgpackDeger[]
  | { [k: string]: MsgpackDeger }

class Yazici {
  private parcalar: Uint8Array[] = []
  private boy = 0
  bayt(...b: number[]): void { this.ekle(Uint8Array.from(b)) }
  ekle(p: Uint8Array): void { this.parcalar.push(p); this.boy += p.length }
  u16(n: number): void { this.bayt((n >>> 8) & 255, n & 255) }
  u32(n: number): void { this.bayt((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255) }
  bitir(): Uint8Array {
    const o = new Uint8Array(this.boy)
    let i = 0
    for (const p of this.parcalar) { o.set(p, i); i += p.length }
    return o
  }
}

function kodlaIcine(y: Yazici, v: MsgpackDeger): void {
  if (v === null || v === undefined) { y.bayt(0xc0); return }
  if (typeof v === 'boolean') { y.bayt(v ? 0xc3 : 0xc2); return }
  if (typeof v === 'number') {
    if (Number.isInteger(v)) {
      if (v >= 0) {
        if (v < 0x80) y.bayt(v)
        else if (v < 0x100) y.bayt(0xcc, v)
        else if (v < 0x10000) { y.bayt(0xcd); y.u16(v) }
        else if (v < 0x100000000) { y.bayt(0xce); y.u32(v) }
        else { y.bayt(0xcb); const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, v); y.ekle(b) }
      } else {
        if (v >= -32) y.bayt(0xe0 | (v + 32))
        else if (v >= -0x80) y.bayt(0xd0, v & 255)
        else if (v >= -0x8000) { y.bayt(0xd1); y.u16(v & 0xffff) }
        else if (v >= -0x80000000) { y.bayt(0xd2); y.u32(v >>> 0) }
        else { y.bayt(0xcb); const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, v); y.ekle(b) }
      }
      return
    }
    y.bayt(0xcb)
    const b = new Uint8Array(8)
    new DataView(b.buffer).setFloat64(0, v)
    y.ekle(b)
    return
  }
  if (typeof v === 'string') {
    const b = new TextEncoder().encode(v)
    const n = b.length
    if (n < 32) y.bayt(0xa0 | n)
    else if (n < 0x100) y.bayt(0xd9, n)
    else if (n < 0x10000) { y.bayt(0xda); y.u16(n) }
    else { y.bayt(0xdb); y.u32(n) }
    y.ekle(b)
    return
  }
  if (v instanceof Uint8Array) {
    const n = v.byteLength
    if (n < 0x100) y.bayt(0xc4, n)
    else if (n < 0x10000) { y.bayt(0xc5); y.u16(n) }
    else { y.bayt(0xc6); y.u32(n) }
    y.ekle(v)
    return
  }
  if (Array.isArray(v)) {
    const n = v.length
    if (n < 16) y.bayt(0x90 | n)
    else if (n < 0x10000) { y.bayt(0xdc); y.u16(n) }
    else { y.bayt(0xdd); y.u32(n) }
    for (const x of v) kodlaIcine(y, x)
    return
  }
  const anahtarlar = Object.keys(v).filter((k) => v[k] !== undefined)
  const n = anahtarlar.length
  if (n < 16) y.bayt(0x80 | n)
  else if (n < 0x10000) { y.bayt(0xde); y.u16(n) }
  else { y.bayt(0xdf); y.u32(n) }
  for (const k of anahtarlar) { kodlaIcine(y, k); kodlaIcine(y, v[k]) }
}

export function msgpackKodla(v: MsgpackDeger): Uint8Array {
  const y = new Yazici()
  kodlaIcine(y, v)
  return y.bitir()
}

class Okuyucu {
  i = 0
  private v: DataView
  private dec = new TextDecoder()
  constructor(private b: Uint8Array) { this.v = new DataView(b.buffer, b.byteOffset, b.byteLength) }
  u8(): number { return this.b[this.i++] }
  u16(): number { const x = this.v.getUint16(this.i); this.i += 2; return x }
  u32(): number { const x = this.v.getUint32(this.i); this.i += 4; return x }
  bin(n: number): Uint8Array { const x = this.b.slice(this.i, this.i + n); this.i += n; return x }
  str(n: number): string { const x = this.dec.decode(this.b.subarray(this.i, this.i + n)); this.i += n; return x }
  deger(): MsgpackDeger {
    const t = this.u8()
    if (t < 0x80) return t
    if (t >= 0xe0) return t - 0x100
    if ((t & 0xf0) === 0x80) return this.harita(t & 15)
    if ((t & 0xf0) === 0x90) return this.dizi(t & 15)
    if ((t & 0xe0) === 0xa0) return this.str(t & 31)
    switch (t) {
      case 0xc0: return null
      case 0xc2: return false
      case 0xc3: return true
      case 0xc4: return this.bin(this.u8())
      case 0xc5: return this.bin(this.u16())
      case 0xc6: return this.bin(this.u32())
      case 0xca: { const x = this.v.getFloat32(this.i); this.i += 4; return x }
      case 0xcb: { const x = this.v.getFloat64(this.i); this.i += 8; return x }
      case 0xcc: return this.u8()
      case 0xcd: return this.u16()
      case 0xce: return this.u32()
      case 0xcf: { const x = this.v.getBigUint64(this.i); this.i += 8; return Number(x) }
      case 0xd0: { const x = this.v.getInt8(this.i); this.i += 1; return x }
      case 0xd1: { const x = this.v.getInt16(this.i); this.i += 2; return x }
      case 0xd2: { const x = this.v.getInt32(this.i); this.i += 4; return x }
      case 0xd3: { const x = this.v.getBigInt64(this.i); this.i += 8; return Number(x) }
      case 0xd9: return this.str(this.u8())
      case 0xda: return this.str(this.u16())
      case 0xdb: return this.str(this.u32())
      case 0xdc: return this.dizi(this.u16())
      case 0xdd: return this.dizi(this.u32())
      case 0xde: return this.harita(this.u16())
      case 0xdf: return this.harita(this.u32())
      default: throw new Error(`msgpack: desteklenmeyen tür 0x${t.toString(16)}`)
    }
  }
  private dizi(n: number): MsgpackDeger[] {
    const o: MsgpackDeger[] = []
    for (let k = 0; k < n; k++) o.push(this.deger())
    return o
  }
  private harita(n: number): { [k: string]: MsgpackDeger } {
    const o: { [k: string]: MsgpackDeger } = {}
    for (let k = 0; k < n; k++) {
      const anahtar = this.deger()
      o[typeof anahtar === 'string' ? anahtar : String(anahtar)] = this.deger()
    }
    return o
  }
}

export function msgpackCoz(b: Uint8Array): MsgpackDeger {
  return new Okuyucu(b).deger()
}
