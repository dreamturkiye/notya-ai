/**
 * ESNEK-KBB2 (2026-11-25) — the build's template REGISTRY: printed examination forms Notya knows without the doctor marking
 * them (data). A registry form is never matched by its layout fingerprint (it has none): it is placed on a photo by its
 * printed labels (core/elNotu/kayit.ts) and only when ≥ 4 of them agree, so another clinic's different sheet is never
 * taken for it. Coordinates: the template frame = the de-warped sheet (0..1, width / height = enBoy).
 *
 * KBB anatomi formu: the common Turkish ENT registration + examination sheet — identity rows (T.C. Kimlik No, Adı-Soyadı,
 * Mesleği, Tavsiye eden, Güvencesi, Ev adresi, GSM, Doğum tarihi), "ŞİKAYETİ", then printed drawings: both ears with
 * their eardrums (Sağ / Sol), a sagittal head (nasopharynx), a coronal nose (Sağ half on the viewer's LEFT, Sol on the
 * right — the patient's sides), the open mouth, the larynx, the neck (patient's right on the viewer's left). Each drawing
 * has the area where the physician writes about it ("notKutusu"): under the eardrums, right of the head, left of the nose
 * (leader lines into a half decide its side), right of the mouth / larynx. Measured on four prints of the form (KBB beta
 * doctor, 2026-11-23 / 25 batches; printed words only, no patient data).
 */
import type { Sablon } from '../tipler'

export const KBB_ANATOMI_FORMU: Sablon = {
  id: 'kayit-kbb-anatomi-formu',
  ad: 'KBB anatomi formu',
  tur: 'formlu',
  brans: 'kulak-burun-bogaz',
  enBoy: 0.7071,
  kayitli: true,
  parmakIzi: null,
  // from the file number / date rows down to the complaint row (the gate cuts it at "ŞİKAYETİ" when that is read)
  baslikBolgeleri: [{ x0: 0, y0: 0.085, x1: 1, y1: 0.31 }],
  cizimBolgeleri: [
    { id: 'kz-sag', anatomi: 'kulak_zari', etiket: 'Kulak zarı', taraf: 'sag', kutu: { x0: 0.29, y0: 0.35, x1: 0.47, y1: 0.5 }, notKutusu: { x0: 0.26, y0: 0.47, x1: 0.5, y1: 0.56 } },
    { id: 'kz-sol', anatomi: 'kulak_zari', etiket: 'Kulak zarı', taraf: 'sol', kutu: { x0: 0.52, y0: 0.35, x1: 0.69, y1: 0.5 }, notKutusu: { x0: 0.5, y0: 0.47, x1: 0.76, y1: 0.56 } },
    { id: 'nazofarenks', anatomi: 'nazofarenks', etiket: 'Nazofarenks', taraf: null, kutu: { x0: 0.05, y0: 0.51, x1: 0.29, y1: 0.72 }, notKutusu: { x0: 0.29, y0: 0.5, x1: 0.47, y1: 0.7 } },
    { id: 'burun-sag', anatomi: 'burun', etiket: 'Burun', taraf: 'sag', kutu: { x0: 0.64, y0: 0.5, x1: 0.79, y1: 0.71 }, notKutusu: { x0: 0.46, y0: 0.5, x1: 0.64, y1: 0.74 } },
    { id: 'burun-sol', anatomi: 'burun', etiket: 'Burun', taraf: 'sol', kutu: { x0: 0.79, y0: 0.5, x1: 0.94, y1: 0.71 }, notKutusu: { x0: 0.8, y0: 0.44, x1: 1, y1: 0.76 } },
    { id: 'agiz', anatomi: 'agiz_ici', etiket: 'Ağız içi', taraf: null, kutu: { x0: 0.07, y0: 0.75, x1: 0.26, y1: 0.96 }, notKutusu: { x0: 0.24, y0: 0.72, x1: 0.4, y1: 0.99 } },
    { id: 'larenks', anatomi: 'larenks', etiket: 'Larenks', taraf: null, kutu: { x0: 0.37, y0: 0.76, x1: 0.57, y1: 0.93 }, notKutusu: { x0: 0.55, y0: 0.76, x1: 0.66, y1: 0.94 } },
    { id: 'boyun-sag', anatomi: 'boyun', etiket: 'Boyun', taraf: 'sag', kutu: { x0: 0.66, y0: 0.75, x1: 0.79, y1: 0.97 } },
    { id: 'boyun-sol', anatomi: 'boyun', etiket: 'Boyun', taraf: 'sol', kutu: { x0: 0.79, y0: 0.75, x1: 0.91, y1: 0.97 } },
  ],
  // printed words (folded keys) at their centres; "no" and "ev" are left out (short, and "No" also labels the file number)
  capalar: [
    { anahtar: 'tarih', x: 0.782, y: 0.12 }, { anahtar: 'tc', x: 0.07, y: 0.16 }, { anahtar: 'kimlik', x: 0.12, y: 0.159 },
    { anahtar: 'adisoyadi', x: 0.103, y: 0.179 }, { anahtar: 'dogum', x: 0.609, y: 0.173 }, { anahtar: 'meslegi', x: 0.092, y: 0.199 },
    { anahtar: 'gsm', x: 0.601, y: 0.193 }, { anahtar: 'tavsiye', x: 0.088, y: 0.219 }, { anahtar: 'eden', x: 0.152, y: 0.22 },
    { anahtar: 'guvencesi', x: 0.17, y: 0.238 }, { anahtar: 'adresi', x: 0.113, y: 0.262 }, { anahtar: 'sikayeti', x: 0.093, y: 0.323 },
    { anahtar: 'sag', x: 0.308, y: 0.484, grup: 'cizim' }, { anahtar: 'sol', x: 0.661, y: 0.478, grup: 'cizim' },
    { anahtar: 'sag', x: 0.652, y: 0.726, grup: 'cizim' }, { anahtar: 'sol', x: 0.786, y: 0.722, grup: 'cizim' },
  ],
}

const KAYIT_TR: Record<string, Sablon[]> = {
  'kulak-burun-bogaz': [KBB_ANATOMI_FORMU],
  kbb: [KBB_ANATOMI_FORMU],
}

/** Registry templates offered for a branş (none for the others yet — a branch without forms simply has none). */
export function kayitliSablonlarTr(brans: string | null | undefined): Sablon[] {
  return (brans && KAYIT_TR[brans]) || []
}
