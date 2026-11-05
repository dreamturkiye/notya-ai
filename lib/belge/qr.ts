/**
 * BELGE-NO-01 (Kaan, 2026-11-05) — a small QR CODE ENCODER for the verify link printed on every report. Byte mode, error
 * correction level M, versions 1 to 10 (up to 213 bytes: a verify address is under 80). No dependency, pure, client- and
 * server-safe; the same file on main and on every release branch.
 *
 * Follows ISO/IEC 18004 as laid out in Project Nayuki's reference implementation (MIT): data encoding, Reed-Solomon over
 * GF(2^8) with the polynomial 0x11D, block interleaving, function patterns, format and version information, the eight
 * masks and the four penalty rules. Proven by lib/belge/belge.test.ts, which decodes the output with an independent decoder
 * (jsQR) in the job that wrote it, and pins the matrix of a fixed input.
 */

// Level M per version 1..10: error-correction codewords per block, and number of blocks.
const EC_BLOK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]
const BLOK_SAYISI = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5]
const EN_COK_SURUM = 10

function hamVeriModulu(v: number): number {
  let r = (16 * v + 128) * v + 64
  if (v >= 2) {
    const n = Math.floor(v / 7) + 2
    r -= (25 * n - 10) * n - 55
    if (v >= 7) r -= 36
  }
  return r
}
const toplamKod = (v: number) => Math.floor(hamVeriModulu(v) / 8)
const veriKodu = (v: number) => toplamKod(v) - EC_BLOK[v] * BLOK_SAYISI[v]

function gfCarp(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}
function rsBolen(derece: number): number[] {
  const r: number[] = new Array(derece).fill(0)
  r[derece - 1] = 1
  let kok = 1
  for (let i = 0; i < derece; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = gfCarp(r[j], kok)
      if (j + 1 < r.length) r[j] ^= r[j + 1]
    }
    kok = gfCarp(kok, 0x02)
  }
  return r
}
function rsKalan(veri: readonly number[], bolen: readonly number[]): number[] {
  const r: number[] = bolen.map(() => 0)
  for (const b of veri) {
    const f = b ^ (r.shift() as number)
    r.push(0)
    bolen.forEach((c, i) => { r[i] ^= gfCarp(c, f) })
  }
  return r
}

function hizalamaKonumlari(v: number, boyut: number): number[] {
  if (v === 1) return []
  const n = Math.floor(v / 7) + 2
  const adim = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2
  const r = [6]
  for (let p = boyut - 7; r.length < n; p -= adim) r.splice(1, 0, p)
  return r
}

export type QrMatrisi = { boyut: number; moduller: boolean[][] }

/** The QR matrix of a text (UTF-8, byte mode, level M). Throws for text longer than version 10 holds. */
export function qrUret(metin: string): QrMatrisi {
  const bayt = Array.from(new TextEncoder().encode(metin))
  let surum = 1
  for (; surum <= EN_COK_SURUM; surum++) {
    const bit = 4 + (surum < 10 ? 8 : 16) + bayt.length * 8
    if (bit <= veriKodu(surum) * 8) break
  }
  if (surum > EN_COK_SURUM) throw new Error('QR: text too long')

  // bit stream
  const bitler: number[] = []
  const ekle = (deger: number, uzunluk: number) => { for (let i = uzunluk - 1; i >= 0; i--) bitler.push((deger >>> i) & 1) }
  ekle(0b0100, 4)
  ekle(bayt.length, surum < 10 ? 8 : 16)
  for (const b of bayt) ekle(b, 8)
  const kapasite = veriKodu(surum) * 8
  ekle(0, Math.min(4, kapasite - bitler.length))
  ekle(0, (8 - (bitler.length % 8)) % 8)
  for (let p = 0xec; bitler.length < kapasite; p ^= 0xec ^ 0x11) ekle(p, 8)
  const veri: number[] = []
  for (let i = 0; i < bitler.length; i += 8) veri.push(bitler.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0))

  // blocks + error correction, interleaved
  const nb = BLOK_SAYISI[surum], ecl = EC_BLOK[surum], ham = toplamKod(surum)
  const kisaSayi = nb - (ham % nb), kisaUzunluk = Math.floor(ham / nb)
  const bolen = rsBolen(ecl)
  const bloklar: number[][] = []
  for (let i = 0, k = 0; i < nb; i++) {
    const d = veri.slice(k, k + kisaUzunluk - ecl + (i < kisaSayi ? 0 : 1))
    k += d.length
    const ec = rsKalan(d, bolen)
    if (i < kisaSayi) d.push(0)
    bloklar.push(d.concat(ec))
  }
  const kodlar: number[] = []
  for (let i = 0; i < bloklar[0].length; i++) bloklar.forEach((b, j) => { if (i !== kisaUzunluk - ecl || j >= kisaSayi) kodlar.push(b[i]) })

  // matrix
  const boyut = surum * 4 + 17
  const m: boolean[][] = Array.from({ length: boyut }, () => new Array(boyut).fill(false))
  const islev: boolean[][] = Array.from({ length: boyut }, () => new Array(boyut).fill(false))
  const koy = (x: number, y: number, karanlik: boolean) => { m[y][x] = karanlik; islev[y][x] = true }

  for (let i = 0; i < boyut; i++) { koy(6, i, i % 2 === 0); koy(i, 6, i % 2 === 0) }
  const bulucu = (x: number, y: number) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const xx = x + dx, yy = y + dy
      if (xx < 0 || xx >= boyut || yy < 0 || yy >= boyut) continue
      const d = Math.max(Math.abs(dx), Math.abs(dy))
      koy(xx, yy, d !== 2 && d !== 4)
    }
  }
  bulucu(3, 3); bulucu(boyut - 4, 3); bulucu(3, boyut - 4)
  const hiz = hizalamaKonumlari(surum, boyut)
  for (let i = 0; i < hiz.length; i++) for (let j = 0; j < hiz.length; j++) {
    if ((i === 0 && j === 0) || (i === 0 && j === hiz.length - 1) || (i === hiz.length - 1 && j === 0)) continue
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) koy(hiz[i] + dx, hiz[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }
  const bicimCiz = (maske: number) => {
    const d = (0 << 3) | maske // level M = 0b00
    let r = d
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537)
    const b = ((d << 10) | r) ^ 0x5412
    const bit = (i: number) => ((b >>> i) & 1) !== 0
    for (let i = 0; i <= 5; i++) koy(8, i, bit(i))
    koy(8, 7, bit(6)); koy(8, 8, bit(7)); koy(7, 8, bit(8))
    for (let i = 9; i < 15; i++) koy(14 - i, 8, bit(i))
    for (let i = 0; i < 8; i++) koy(boyut - 1 - i, 8, bit(i))
    for (let i = 8; i < 15; i++) koy(8, boyut - 15 + i, bit(i))
    koy(8, boyut - 8, true)
  }
  bicimCiz(0)
  if (surum >= 7) {
    let r = surum
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25)
    const b = (surum << 12) | r
    for (let i = 0; i < 18; i++) {
      const bit = ((b >>> i) & 1) !== 0
      const a = boyut - 11 + (i % 3), c = Math.floor(i / 3)
      koy(a, c, bit); koy(c, a, bit)
    }
  }

  let i = 0
  for (let sag = boyut - 1; sag >= 1; sag -= 2) {
    if (sag === 6) sag = 5
    for (let dikey = 0; dikey < boyut; dikey++) for (let j = 0; j < 2; j++) {
      const x = sag - j
      const yukari = ((sag + 1) & 2) === 0
      const y = yukari ? boyut - 1 - dikey : dikey
      if (!islev[y][x] && i < kodlar.length * 8) { m[y][x] = ((kodlar[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++ }
    }
  }

  const maskele = (k: number) => {
    for (let y = 0; y < boyut; y++) for (let x = 0; x < boyut; x++) {
      if (islev[y][x]) continue
      const t = [(x + y) % 2 === 0, y % 2 === 0, x % 3 === 0, (x + y) % 3 === 0, (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, ((x * y) % 2) + ((x * y) % 3) === 0, (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (((x + y) % 2) + ((x * y) % 3)) % 2 === 0][k]
      if (t) m[y][x] = !m[y][x]
    }
  }
  let enIyi = 0, enAz = Infinity
  for (let k = 0; k < 8; k++) {
    maskele(k); bicimCiz(k)
    const c = ceza(m, boyut)
    if (c < enAz) { enAz = c; enIyi = k }
    maskele(k)
  }
  maskele(enIyi); bicimCiz(enIyi)
  return { boyut, moduller: m }
}

function ceza(m: boolean[][], n: number): number {
  let c = 0
  const sira = (al: (a: number, b: number) => boolean) => {
    for (let a = 0; a < n; a++) {
      let uz = 1
      for (let b = 1; b <= n; b++) {
        if (b < n && al(a, b) === al(a, b - 1)) uz++
        else { if (uz >= 5) c += 3 + (uz - 5); uz = 1 }
      }
      for (let b = 0; b + 10 < n; b++) {
        const p = Array.from({ length: 11 }, (_, k) => al(a, b + k))
        const desen = [true, false, true, true, true, false, true]
        const bas = desen.every((d, k) => p[k] === d) && !p[7] && !p[8] && !p[9] && !p[10]
        const son = !p[0] && !p[1] && !p[2] && !p[3] && desen.every((d, k) => p[k + 4] === d)
        if (bas || son) c += 40
      }
    }
  }
  sira((y, x) => m[y][x])
  sira((x, y) => m[y][x])
  for (let y = 0; y + 1 < n; y++) for (let x = 0; x + 1 < n; x++) {
    const v = m[y][x]
    if (v === m[y][x + 1] && v === m[y + 1][x] && v === m[y + 1][x + 1]) c += 3
  }
  let koyu = 0
  for (const s of m) for (const v of s) if (v) koyu++
  const top = n * n
  c += Math.floor(Math.abs(koyu * 20 - top * 10) / top) * 10
  return c
}

/** An SVG path of the dark modules (one unit per module, with a 4-module quiet zone): `<path d=…>` in a viewBox of `kenar`. */
export function qrSvgYolu(metin: string): { kenar: number; d: string } {
  const { boyut, moduller } = qrUret(metin)
  const parcalar: string[] = []
  for (let y = 0; y < boyut; y++) for (let x = 0; x < boyut; x++) if (moduller[y][x]) parcalar.push(`M${x + 4} ${y + 4}h1v1h-1z`)
  return { kenar: boyut + 8, d: parcalar.join('') }
}
