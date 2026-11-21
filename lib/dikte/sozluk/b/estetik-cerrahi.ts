/**
 * DIKTE-TIBBI-01 — Estetik Cerrahi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["rinoplasti", "septorinoplasti", "blefaroplasti", "yüz germe", "boyun germe", "alın germe", "abdominoplasti", "liposuction", "vaser liposuction", "meme büyütme", "meme küçültme", "mastopeksi", "silikon implant", "kol germe", "uyluk germe", "gluteal yağ transferi", "yağ grefti", "otoplasti", "ödem", "ekimoz", "seroma", "hematom", "kapsüler kontraktür", "dren", "kompresyon korsesi", "skar"],
  hatalar: [{"duyulan": ["blefaro plasti", "bleforoplasti"], "dogru": "blefaroplasti", "ekli": true}, {"duyulan": ["lipo saksın", "liposaksın"], "dogru": "liposuction", "ekli": true}],
}

export default sozluk
