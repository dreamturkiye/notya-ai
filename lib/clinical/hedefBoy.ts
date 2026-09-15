/**
 * Anne-baba boylarına göre hedef boy (mid-parental height).
 *
 * TR çocuk endokrinolojisi pratiğinde Tanner formülü kullanılır
 * (Tanner JM, Goldstein H, Whitehouse RH, 1970; ÇEDD / pediatri ders kitabı anlatımı):
 *   Erkek: (baba + anne + 13) / 2   ≡  ortalama + 6.5 cm
 *   Kız:   (baba + anne − 13) / 2   ≡  ortalama − 6.5 cm
 * Hedef aralık ≈ ±8.5 cm (%95 genetik bant).
 *
 * Bu bir tahmindir, tanı değildir. Erişkin boyu garanti etmez.
 */

export type HedefBoyCinsiyet = 'erkek' | 'kiz'

export type HedefBoySonuc = {
  anneCm: number
  babaCm: number
  cocukCm: number
  altCm: number
  ustCm: number
  cinsiyet: HedefBoyCinsiyet
  formul: string
}

export const HEDEF_BOY_ARALIK_CM = 8.5
export const HEDEF_BOY_CINSIYET_FARK_CM = 13
export const BOY_CM_MIN = 130
export const BOY_CM_MAX = 230

export function cinsiyetHedefBoy(v: string | null | undefined): HedefBoyCinsiyet | null {
  const t = String(v || '').trim().toLowerCase()
  if (!t) return null
  if (t === 'female' || t === 'f' || t === 'kadın' || t === 'kadin' || t === 'kız' || t === 'kiz') return 'kiz'
  if (t === 'male' || t === 'm' || t === 'erkek') return 'erkek'
  return null
}

/** Accepts TR clinic input: 182, 182.5, 1.82, 1,82, 1.82 m, 182cm. */
export function parseBoyGirdi(raw: string | number | null | undefined): { ok: true; cm: number } | { ok: false; hata: string } {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return cmVeyaMetre(raw)
  }
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(',', '.')
    .replace(/\s+/g, '')
    .replace(/cm$/i, '')
    .replace(/metre$|meters?$|m$/i, '')
  if (!s) return { ok: false, hata: 'Boy girilmedi' }
  const n = Number(s)
  if (!Number.isFinite(n)) return { ok: false, hata: 'Boy sayı olmalıdır (örn. 165 veya 1.65)' }
  return cmVeyaMetre(n)
}

function cmVeyaMetre(n: number): { ok: true; cm: number } | { ok: false; hata: string } {
  const cm = n > 0 && n < 3 ? n * 100 : n
  const yuvarla = Math.round(cm * 10) / 10
  if (yuvarla < BOY_CM_MIN || yuvarla > BOY_CM_MAX) {
    return { ok: false, hata: `Ebeveyn boyu ${BOY_CM_MIN}–${BOY_CM_MAX} cm aralığında olmalı` }
  }
  return { ok: true, cm: yuvarla }
}

export function formatBoyCm(cm: number): string {
  const m = cm / 100
  const cmTr = cm.toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: Number.isInteger(cm) ? 0 : 1 })
  const mTr = m.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${cmTr} cm (${mTr} m)`
}

export function hesaplaHedefBoy(input: {
  anneBoy: string | number
  babaBoy: string | number
  cinsiyet: string | null | undefined
}): { ok: true; sonuc: HedefBoySonuc } | { ok: false; hata: string } {
  const cinsiyet = cinsiyetHedefBoy(input.cinsiyet)
  if (!cinsiyet) return { ok: false, hata: 'Çocuğun cinsiyeti gerekli (kız / erkek)' }
  const anne = parseBoyGirdi(input.anneBoy)
  if (!anne.ok) return { ok: false, hata: `Anne: ${anne.hata}` }
  const baba = parseBoyGirdi(input.babaBoy)
  if (!baba.ok) return { ok: false, hata: `Baba: ${baba.hata}` }

  const ham = cinsiyet === 'erkek'
    ? (baba.cm + anne.cm + HEDEF_BOY_CINSIYET_FARK_CM) / 2
    : (baba.cm + anne.cm - HEDEF_BOY_CINSIYET_FARK_CM) / 2
  const cocukCm = Math.round(ham * 10) / 10
  const altCm = Math.round((cocukCm - HEDEF_BOY_ARALIK_CM) * 10) / 10
  const ustCm = Math.round((cocukCm + HEDEF_BOY_ARALIK_CM) * 10) / 10
  const formul = cinsiyet === 'erkek'
    ? '(baba + anne + 13) / 2'
    : '(baba + anne − 13) / 2'
  return {
    ok: true,
    sonuc: {
      anneCm: anne.cm,
      babaCm: baba.cm,
      cocukCm,
      altCm,
      ustCm,
      cinsiyet,
      formul,
    },
  }
}
