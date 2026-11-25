/**
 * ESNEK-KBB2 (2026-11-25) — placing a known printed form on a photo by its PRINTED WORDS (pure).
 *
 * The layout fingerprint (sablon.ts) needs a cleanly de-warped page; a WhatsApp photo with the table around the sheet, a
 * keystoned page or another print run of the same form does not correlate (KBB batch 2: 3 of 3 form pages unmatched).
 * The on-device OCR reads the form's printed labels anyway (the privacy gate needs them), so the template is placed by
 * them: each label the template knows (its "anchors", e.g. "ADI-SOYADI", "GSM", "ŞİKAYETİ", "Sağ" / "Sol") found on the
 * page gives a point pair, an affine map template → page is fitted by least squares, the worst pair dropped while it
 * misses by more than 2 % of the page, and the template is accepted only with ≥ 4 agreeing anchors. A word that appears
 * twice on the form ("Sağ" under the ears and under the nose) is assigned to the nearest predicted place after a first
 * fit on the unique ones. Few anchors spanning a short height (the header only) → a similarity map (no shear / stretch
 * extrapolated over the page). Every box of the template is mapped to the page as the bounding box of its four corners.
 */
import type { OcrSatir } from '@/core/belgeler/kimlikMaske'
import type { Capa, CizimBolgesi, Kutu, Sablon } from './tipler'

export type Donusum = { a: number; b: number; c: number; d: number; e: number; f: number } // x' = a·x + b·y + c, y' = d·x + e·y + f
export type KayitSonucu = {
  donusum: Donusum
  /** The map for the drawings and their note areas (from the drawing block's own printed words when the OCR read ≥ 1). */
  cizimDonusumu: Donusum
  capa: number; cizimCapa: number; hata: number; skor: number
}

/** Folded label key: lower case, Turkish letters to ASCII, only letters and digits ("ADI-SOYADI" → "adisoyadi"). */
export const capaAnahtari = (s: string) => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').normalize('NFD').replace(/[^a-z0-9]/g, '')

export const KAYIT_TOLERANS = 0.02
export const KAYIT_EN_AZ = 4

type Cift = { x: number; y: number; X: number; Y: number }

function cozAfin(c: Cift[]): Donusum | null {
  // normal equations for [x y 1] → X and → Y
  let sxx = 0, sxy = 0, sx = 0, syy = 0, sy = 0, n = 0, sxX = 0, syX = 0, sX = 0, sxY = 0, syY = 0, sY = 0
  for (const p of c) { sxx += p.x * p.x; sxy += p.x * p.y; sx += p.x; syy += p.y * p.y; sy += p.y; n++; sxX += p.x * p.X; syX += p.y * p.X; sX += p.X; sxY += p.x * p.Y; syY += p.y * p.Y; sY += p.Y }
  const M = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]]
  const coz = (v: number[]) => {
    const A = M.map((r, i) => [...r, v[i]])
    for (let i = 0; i < 3; i++) {
      let p = i; for (let j = i + 1; j < 3; j++) if (Math.abs(A[j][i]) > Math.abs(A[p][i])) p = j
      if (Math.abs(A[p][i]) < 1e-12) return null
      ;[A[i], A[p]] = [A[p], A[i]]
      for (let j = 0; j < 3; j++) if (j !== i) { const k = A[j][i] / A[i][i]; for (let m = i; m < 4; m++) A[j][m] -= k * A[i][m] }
    }
    return [A[0][3] / A[0][0], A[1][3] / A[1][1], A[2][3] / A[2][2]]
  }
  const u = coz([sxX, syX, sX]), v = coz([sxY, syY, sY])
  return u && v ? { a: u[0], b: u[1], c: u[2], d: v[0], e: v[1], f: v[2] } : null
}

/** Similarity (uniform scale, rotation, shift) by least squares — for anchors that span too little of the page. */
function cozBenzerlik(c: Cift[]): Donusum | null {
  const n = c.length; if (n < 2) return null
  const mx = c.reduce((t, p) => t + p.x, 0) / n, my = c.reduce((t, p) => t + p.y, 0) / n, mX = c.reduce((t, p) => t + p.X, 0) / n, mY = c.reduce((t, p) => t + p.Y, 0) / n
  let sa = 0, sb = 0, ss = 0
  for (const p of c) { const x = p.x - mx, y = p.y - my, X = p.X - mX, Y = p.Y - mY; sa += x * X + y * Y; sb += x * Y - y * X; ss += x * x + y * y }
  if (ss < 1e-9) return null
  const a = sa / ss, b = sb / ss
  return { a, b: -b, c: mX - a * mx + b * my, d: b, e: a, f: mY - b * mx - a * my }
}

export const uygula = (t: Donusum, x: number, y: number) => ({ x: t.a * x + t.b * y + t.c, y: t.d * x + t.e * y + t.f })

function uydur(c: Cift[]): { t: Donusum; kalan: Cift[] } | null {
  let kalan = [...c]
  while (kalan.length >= 3) {
    const yayilim = Math.max(...kalan.map((p) => p.y)) - Math.min(...kalan.map((p) => p.y))
    const t = kalan.length >= 4 && yayilim >= 0.25 ? cozAfin(kalan) : cozBenzerlik(kalan)
    if (!t) return null
    const hatalar = kalan.map((p) => { const q = uygula(t, p.x, p.y); return Math.hypot(q.x - p.X, q.y - p.Y) })
    const en = hatalar.indexOf(Math.max(...hatalar))
    if (hatalar[en] <= KAYIT_TOLERANS) return { t, kalan }
    kalan = kalan.filter((_, i) => i !== en)
  }
  return null
}

/**
 * Place `sablon` on a page from the page's OCR (pixel coordinates, page size w × h). Null when fewer than KAYIT_EN_AZ
 * anchors agree, or the map is implausible (scale outside 0.5–2, mirrored, strongly sheared).
 */
export function sablonKaydi(sablon: Sablon, ocr: OcrSatir[] | null, w: number, h: number): KayitSonucu | null {
  if (!sablon.capalar?.length || !ocr?.length) return null
  const sayfa: { k: string; x: number; y: number }[] = []
  for (const l of ocr) for (const k of l.kelimeler) {
    if (k.conf < 60) continue
    const a = capaAnahtari(k.text)
    if (a.length < 2) continue
    sayfa.push({ k: a, x: (k.x0 + k.x1) / 2 / w, y: (k.y0 + k.y1) / 2 / h })
  }
  const say = new Map<string, number>()
  for (const c of sablon.capalar) say.set(c.anahtar, (say.get(c.anahtar) || 0) + 1)
  // unique labels first: each template anchor whose key occurs once on the form, paired with its single occurrence on the page
  const tekil: Cift[] = []
  for (const c of sablon.capalar) {
    if (say.get(c.anahtar) !== 1) continue
    const bul = sayfa.filter((s) => s.k === c.anahtar)
    if (bul.length === 1) tekil.push({ x: c.x, y: c.y, X: bul[0].x, Y: bul[0].y })
  }
  let sonuc = uydur(tekil)
  // repeated labels ("Sağ", "Sol"): the occurrence nearest to where the first fit puts each of them (a header-only fit
  // extrapolates the drawing block a few % off, hence the wide radius; a wrong pick is dropped as an outlier below)
  const tekrar = sablon.capalar.filter((c) => (say.get(c.anahtar) || 0) > 1)
  const cizimCiftleri: Cift[] = []
  if (tekrar.length && sonuc) {
    const ilk = sonuc.t
    const ciftler = [...sonuc.kalan]
    const adaylar = tekrar.flatMap((c) => {
      const q = uygula(ilk, c.x, c.y)
      return sayfa.map((s, i) => ({ c, i, d: s.k === c.anahtar ? Math.hypot(s.x - q.x, s.y - q.y) : Infinity })).filter((x) => x.d < 0.12)
    }).sort((a, b) => a.d - b.d)
    const kullanildi = new Set<number>(), eslesti = new Set<Capa>()
    for (const a of adaylar) {
      if (kullanildi.has(a.i) || eslesti.has(a.c)) continue
      kullanildi.add(a.i); eslesti.add(a.c)
      const cift = { x: a.c.x, y: a.c.y, X: sayfa[a.i].x, Y: sayfa[a.i].y }
      ciftler.push(cift)
      if (a.c.grup === 'cizim') cizimCiftleri.push(cift)
    }
    sonuc = uydur(ciftler) || sonuc
  }
  for (const c of sablon.capalar) if (c.grup === 'cizim' && (say.get(c.anahtar) || 0) === 1) {
    const bul = sayfa.filter((s) => s.k === c.anahtar)
    if (bul.length === 1) cizimCiftleri.push({ x: c.x, y: c.y, X: bul[0].x, Y: bul[0].y })
  }
  if (!sonuc || sonuc.kalan.length < KAYIT_EN_AZ) return null
  const { t } = sonuc
  const sx = Math.hypot(t.a, t.d), sy = Math.hypot(t.b, t.e), det = t.a * t.e - t.b * t.d
  // an upright page (the device already de-skewed it): no mirror, no rotation beyond ~17°, no strong stretch
  if (det <= 0 || t.a <= 0 || t.e <= 0 || Math.abs(t.d) > 0.3 * sx || Math.abs(t.b) > 0.3 * sy || sx < 0.5 || sx > 2 || sy < 0.5 || sy > 2 || Math.max(sx, sy) / Math.min(sx, sy) > 1.35) return null
  const hata = Math.max(...sonuc.kalan.map((p) => { const q = uygula(t, p.x, p.y); return Math.hypot(q.x - p.X, q.y - p.Y) }))
  // the drawing block: its own words when they agree with each other — two or more give its own similarity map (kept
  // only when its scale is close to the page map's), one shifts the page map onto it; none → the page map
  let cizimDonusumu = t, cizimCapa = 0
  const yakinda = cizimCiftleri.filter((p) => { const q = uygula(t, p.x, p.y); return Math.hypot(q.x - p.X, q.y - p.Y) < 0.08 })
  if (yakinda.length >= 2) {
    const b = cozBenzerlik(yakinda)
    if (b && Math.abs(Math.hypot(b.a, b.d) / sx - 1) < 0.15 && yakinda.every((p) => { const q = uygula(b, p.x, p.y); return Math.hypot(q.x - p.X, q.y - p.Y) <= KAYIT_TOLERANS })) { cizimDonusumu = b; cizimCapa = yakinda.length }
  }
  if (!cizimCapa && yakinda.length >= 1) {
    const dx = yakinda.reduce((a, p) => a + p.X - uygula(t, p.x, p.y).x, 0) / yakinda.length
    const dy = yakinda.reduce((a, p) => a + p.Y - uygula(t, p.x, p.y).y, 0) / yakinda.length
    cizimDonusumu = { ...t, c: t.c + dx, f: t.f + dy }; cizimCapa = yakinda.length
  }
  // 4 anchors → 0.78, every further agreeing anchor raises it (a header-only match stays below a full-page one)
  const skor = Math.min(1, 0.62 + 0.04 * sonuc.kalan.length)
  return { donusum: t, cizimDonusumu, capa: sonuc.kalan.length, cizimCapa, hata: Math.round(hata * 1000) / 1000, skor: Math.round(skor * 100) / 100 }
}

/** A template box mapped onto the page (bounding box of its mapped corners, clipped to the page). */
export function kutuyuTasi(t: Donusum, k: Kutu): Kutu {
  const n = [uygula(t, k.x0, k.y0), uygula(t, k.x1, k.y0), uygula(t, k.x0, k.y1), uygula(t, k.x1, k.y1)]
  const s = (v: number) => Math.max(0, Math.min(1, v))
  return { x0: s(Math.min(...n.map((p) => p.x))), y0: s(Math.min(...n.map((p) => p.y))), x1: s(Math.max(...n.map((p) => p.x))), y1: s(Math.max(...n.map((p) => p.y))) }
}

/** The template in page coordinates (header bands, drawing regions and their note areas moved by `t`). */
export function sablonuYerlestir(s: Sablon, t: Donusum, cizim: Donusum = t): Sablon {
  const bolge = (b: CizimBolgesi): CizimBolgesi => ({ ...b, kutu: kutuyuTasi(cizim, b.kutu), ...(b.notKutusu ? { notKutusu: kutuyuTasi(cizim, b.notKutusu) } : {}) })
  return { ...s, baslikBolgeleri: s.baslikBolgeleri.map((k) => kutuyuTasi(t, k)), cizimBolgeleri: s.cizimBolgeleri.map(bolge) }
}
