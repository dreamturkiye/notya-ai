/**
 * DIKTE-TIBBI-01 — Diyetisyen dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["beden kitle indeksi", "bel çevresi", "kalça çevresi", "beden kompozisyonu", "yağ oranı", "kas kütlesi", "bazal metabolizma hızı", "enerji gereksinimi", "makro besin", "mikro besin", "karbonhidrat", "protein", "yağ", "lif", "glisemik indeks", "kalori", "porsiyon", "öğün", "ara öğün", "besin günlüğü", "akdeniz diyeti", "ketojenik diyet", "aralıklı oruç", "insülin direnci", "prediyabet", "diyabet", "hiperlipidemi", "hipertansiyon", "çölyak", "glutensiz", "laktoz intoleransı", "gebelik beslenmesi", "sporcu beslenmesi", "kilo kaybı", "kilo alımı", "su tüketimi", "vitamin", "mineral", "demir", "D vitamini", "B12"],
  hatalar: [{"duyulan": ["keto jenik"], "dogru": "ketojenik", "ekli": true}],
}

export default sozluk
