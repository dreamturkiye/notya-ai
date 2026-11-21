/**
 * DIKTE-TIBBI-01 — Plastik Cerrahi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["rinoplasti", "septorinoplasti", "blefaroplasti", "yüz germe", "ritidektomi", "abdominoplasti", "liposuction", "meme büyütme", "meme küçültme", "mastopeksi", "meme rekonstrüksiyonu", "flep", "greft", "deri grefti", "yağ grefti", "skar revizyonu", "keloid", "hipertrofik skar", "yanık", "el cerrahisi", "tendon onarımı", "sinir onarımı", "yarık dudak", "yarık damak", "kulak kepçesi deformitesi", "otoplasti", "ödem", "ekimoz", "seroma", "hematom", "dren", "kompresyon giysisi", "dikiş", "botulinum toksini", "dolgu", "hyaluronik asit"],
  hatalar: [{"duyulan": ["bleforoplasti", "blefaro plasti"], "dogru": "blefaroplasti", "ekli": true}, {"duyulan": ["abdomino plasti"], "dogru": "abdominoplasti", "ekli": true}, {"duyulan": ["rino plasti"], "dogru": "rinoplasti", "ekli": true}],
}

export default sozluk
