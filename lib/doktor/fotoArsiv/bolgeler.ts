/**
 * FOTO-ARSIV-01 — closed body-region vocabulary of the patient photo archive.
 *
 * Universal chrome (every branş): the regions are anatomy, not a specialty chapter. Pediatric-only wording never
 * lives here (brans-alan-sizmasi) — the AI layer owns the pediatric vocabulary, gated by the doctor's branş.
 * Pure + client-safe. The ids are what the database stores (hasta_foto_meta.bolge), so they never change.
 */
export const BOLGE_GRUPLARI = ['bas', 'govde', 'ust-uzuv', 'alt-uzuv', 'diger'] as const
export type BolgeGrubu = (typeof BOLGE_GRUPLARI)[number]

export const BOLGE_GRUP_ETIKETI: Record<BolgeGrubu, string> = {
  bas: 'Baş ve boyun',
  govde: 'Gövde',
  'ust-uzuv': 'Üst uzuv',
  'alt-uzuv': 'Alt uzuv',
  diger: 'Diğer',
}

export interface BolgeTanimi {
  id: string
  etiket: string
  grup: BolgeGrubu
  /** Body-map hit area: which figure shows it and a rounded rectangle in a 100 x 220 box. */
  harita?: { yuz: 'on' | 'arka'; x: number; y: number; w: number; h: number }
}

export const BOLGELER: readonly BolgeTanimi[] = [
  { id: 'yuz', etiket: 'Yüz', grup: 'bas', harita: { yuz: 'on', x: 40, y: 6, w: 20, h: 22 } },
  { id: 'sac-derisi', etiket: 'Saçlı deri', grup: 'bas', harita: { yuz: 'arka', x: 40, y: 4, w: 20, h: 22 } },
  { id: 'goz-cevresi', etiket: 'Göz çevresi', grup: 'bas' },
  { id: 'kulak', etiket: 'Kulak', grup: 'bas' },
  { id: 'agiz-bogaz', etiket: 'Ağız / boğaz', grup: 'bas' },
  { id: 'boyun', etiket: 'Boyun', grup: 'bas', harita: { yuz: 'on', x: 44, y: 28, w: 12, h: 8 } },
  { id: 'gogus', etiket: 'Göğüs', grup: 'govde', harita: { yuz: 'on', x: 34, y: 36, w: 32, h: 26 } },
  { id: 'karin', etiket: 'Karın', grup: 'govde', harita: { yuz: 'on', x: 36, y: 62, w: 28, h: 24 } },
  { id: 'sirt', etiket: 'Sırt', grup: 'govde', harita: { yuz: 'arka', x: 34, y: 36, w: 32, h: 46 } },
  { id: 'kalca-gluteal', etiket: 'Kalça / gluteal', grup: 'govde', harita: { yuz: 'arka', x: 34, y: 82, w: 32, h: 20 } },
  { id: 'genital-perine', etiket: 'Genital / perine', grup: 'govde', harita: { yuz: 'on', x: 42, y: 86, w: 16, h: 14 } },
  { id: 'kol-sag', etiket: 'Kol — sağ', grup: 'ust-uzuv', harita: { yuz: 'on', x: 14, y: 36, w: 18, h: 46 } },
  { id: 'kol-sol', etiket: 'Kol — sol', grup: 'ust-uzuv', harita: { yuz: 'on', x: 68, y: 36, w: 18, h: 46 } },
  { id: 'el-sag', etiket: 'El — sağ', grup: 'ust-uzuv', harita: { yuz: 'on', x: 8, y: 84, w: 18, h: 18 } },
  { id: 'el-sol', etiket: 'El — sol', grup: 'ust-uzuv', harita: { yuz: 'on', x: 74, y: 84, w: 18, h: 18 } },
  { id: 'bacak-sag', etiket: 'Bacak — sağ', grup: 'alt-uzuv', harita: { yuz: 'on', x: 34, y: 102, w: 15, h: 74 } },
  { id: 'bacak-sol', etiket: 'Bacak — sol', grup: 'alt-uzuv', harita: { yuz: 'on', x: 51, y: 102, w: 15, h: 74 } },
  { id: 'ayak-sag', etiket: 'Ayak — sağ', grup: 'alt-uzuv', harita: { yuz: 'on', x: 32, y: 178, w: 18, h: 18 } },
  { id: 'ayak-sol', etiket: 'Ayak — sol', grup: 'alt-uzuv', harita: { yuz: 'on', x: 50, y: 178, w: 18, h: 18 } },
  { id: 'tirnak', etiket: 'Tırnak', grup: 'diger' },
  { id: 'genel', etiket: 'Genel / tüm vücut', grup: 'diger' },
  { id: 'diger', etiket: 'Diğer', grup: 'diger' },
]

export type BolgeId = string

const ID_KUMESI: ReadonlySet<string> = new Set(BOLGELER.map((b) => b.id))

export function bolgeIdMi(x: unknown): x is BolgeId {
  return typeof x === 'string' && ID_KUMESI.has(x)
}

export function bolgeEtiketi(id: string | null | undefined): string {
  if (!id) return 'Bölge yok'
  return BOLGELER.find((b) => b.id === id)?.etiket ?? 'Bölge yok'
}

export function bolgeGrubu(id: string | null | undefined): BolgeGrubu | null {
  return BOLGELER.find((b) => b.id === id)?.grup ?? null
}

/** Same-region test for "previous photo of the same region": exact id; `genel`/`diger`/null never match anything. */
export function ayniBolgeMi(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  if (a === 'genel' || a === 'diger' || b === 'genel' || b === 'diger') return false
  return a === b
}

/** Tags: free text, short, no control chars; matched case-insensitively with Turkish rules, shown as typed. */
export const ETIKET_AZAMI = 24
export const ETIKET_SAYISI_AZAMI = 12

export function etiketTemizle(ham: unknown): string | null {
  if (typeof ham !== 'string') return null
  const t = ham.normalize('NFC').replace(/[\u0000-\u001F\u007F#]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t) return null
  return Array.from(t).slice(0, ETIKET_AZAMI).join('')
}

export function etiketAnahtari(t: string): string {
  return t.toLocaleLowerCase('tr-TR')
}

export function etiketleriTemizle(ham: unknown): string[] {
  if (!Array.isArray(ham)) return []
  const goruldu = new Set<string>()
  const out: string[] = []
  for (const x of ham) {
    const t = etiketTemizle(x)
    if (!t) continue
    const k = etiketAnahtari(t)
    if (goruldu.has(k)) continue
    goruldu.add(k)
    out.push(t)
    if (out.length >= ETIKET_SAYISI_AZAMI) break
  }
  return out
}
