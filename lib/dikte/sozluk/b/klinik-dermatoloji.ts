/**
 * DIKTE-TIBBI-01 — Dermatoloji (Notya Klinik) dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["dermatoskopi", "makül", "papül", "plak", "nodül", "vezikül", "püstül", "skuam", "akne vulgaris", "rozasea", "melazma", "seboreik dermatit", "atopik dermatit", "psoriazis", "vitiligo", "alopesi", "nevüs", "aktinik keratoz", "kriyoterapi", "biyopsi", "izotretinoin", "topikal steroid", "kimyasal peeling", "lazer", "fototerapi"],
  hatalar: [{"duyulan": ["dermatos kopi"], "dogru": "dermatoskopi", "ekli": true}],
}

export default sozluk
