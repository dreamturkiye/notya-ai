/**
 * BELGE-NO-01 (Kaan, 2026-11-05) — DOCUMENT NUMBERS AND REVISIONS for every printable report (CORE: all 40 branches, all
 * seven builds). Pure and client-safe; the same file on main and on every release branch.
 *
 *   document number   NTY-<year>-<8 characters>   e.g. NTY-2026-K7Q3M9XT  (one per document, never reused)
 *   revision          0 for the first printed version; every changed version is the next number and needs a reason
 *   verify code       12 characters, one per VERSION, printed as a QR code: it opens the public verify page, which
 *                     shows only the document number, the revision, its date, the doctor's title and name, whether it
 *                     is the current version, and the integrity hash. NEVER a patient's data.
 *   integrity hash    SHA-256 (hex) of the document's canonical content: the same content always gives the same hash,
 *                     so a print of unchanged content keeps its revision, and any change makes a new one.
 *
 * The alphabet has no 0/O, 1/I/L or U (no two characters that read alike, no accidental words).
 */

export const BELGE_ALFABESI = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
const ALFABE_RE = '[23456789ABCDEFGHJKMNPQRSTVWXYZ]'
export const BELGE_NO_RE = new RegExp(`^NTY-\\d{4}-${ALFABE_RE}{8}$`)
export const DOGRULAMA_KODU_RE = new RegExp(`^${ALFABE_RE}{12}$`)

/** Random characters of the alphabet (crypto, never Math.random). */
export function rastgeleKod(uzunluk: number): string {
  const b = new Uint8Array(uzunluk)
  globalThis.crypto.getRandomValues(b)
  // 30 symbols: 256 is not a multiple of 30, so a byte >= 240 is drawn again (no bias).
  let s = ''
  let i = 0
  while (s.length < uzunluk) {
    if (i >= b.length) { globalThis.crypto.getRandomValues(b); i = 0 }
    const x = b[i++]
    if (x < 240) s += BELGE_ALFABESI[x % 30]
  }
  return s
}

export function yeniBelgeNo(yil = new Date().getUTCFullYear()): string {
  return `NTY-${yil}-${rastgeleKod(8)}`
}
export const yeniDogrulamaKodu = (): string => rastgeleKod(12)

/** Every printable document of every build: its type key (the database holds the same list). */
export const BELGE_TURLERI = [
  'muayene_raporu', 'epikriz', 'ameliyat_notu', 'usg_obstetrik', 'usg_jinekolojik', 'nst', 'dogum_epikrizi', 'gebelik_ozeti',
  'onam', 'asi_onam', 'recete', 'tetkik_istem', 'hasta_raporu', 'konsultasyon', 'arac_kaydi', 'hasta_disa_aktarim', 'not',
] as const
export type BelgeTuru = (typeof BELGE_TURLERI)[number]
export const belgeTuruMu = (x: unknown): x is BelgeTuru => typeof x === 'string' && (BELGE_TURLERI as readonly string[]).includes(x)

/**
 * The canonical form of a document's content before hashing: an object's keys sorted, whitespace of strings trimmed and
 * collapsed, undefined dropped. So the same content, saved twice or read back in another key order, hashes the same.
 */
export function kanonikMetin(deger: unknown): string {
  const yaz = (v: unknown): unknown => {
    if (v === undefined) return undefined
    if (v === null || typeof v === 'number' || typeof v === 'boolean') return v
    if (typeof v === 'string') return v.replace(/\s+/g, ' ').trim()
    if (Array.isArray(v)) return v.map((x) => (x === undefined ? null : yaz(x)))
    if (typeof v === 'object') {
      const o: Record<string, unknown> = {}
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        const y = yaz((v as Record<string, unknown>)[k])
        if (y !== undefined) o[k] = y
      }
      return o
    }
    return String(v)
  }
  return JSON.stringify(yaz(deger) ?? null)
}

/** SHA-256 hex of the canonical content (Web Crypto: the browser and the server give the same value). */
export async function butunlukOzeti(icerik: unknown): Promise<string> {
  const veri = new TextEncoder().encode(kanonikMetin(icerik))
  const ozet = await globalThis.crypto.subtle.digest('SHA-256', veri)
  return Array.from(new Uint8Array(ozet)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** The reason of a revision: required from revision 1, 3 to 500 characters after trimming. */
export function gerekceGecerli(rev: number, gerekce: unknown): boolean {
  if (rev === 0) return true
  return typeof gerekce === 'string' && gerekce.trim().length >= 3 && gerekce.trim().length <= 500
}

/** What a print shows, and what the registration route answers. */
export type BelgeKunyesi = {
  belgeNo: string
  rev: number
  tarih: string
  dogrulamaKodu: string
  ozet: string
}
/** What the public verify page shows — and nothing more. */
export type DogrulamaSonucu = {
  belgeNo: string
  rev: number
  tarih: string
  hekim: string
  guncel: boolean
  guncelRev: number
  ozet: string
}

/** The verify address of a version: `<origin><prefix>/<path>?c=<code>`. No patient value is ever in it. */
export function dogrulamaAdresi(koken: string, yol: string, kod: string): string {
  return `${koken.replace(/\/+$/, '')}${yol}?c=${encodeURIComponent(kod)}`
}
