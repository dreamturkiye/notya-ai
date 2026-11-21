/**
 * DIKTE-TIBBI-01 — Medikal Estetik dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["botulinum toksini", "dolgu", "hyaluronik asit", "mezoterapi", "PRP", "kimyasal peeling", "lazer epilasyon", "fraksiyonel lazer", "radyofrekans", "HIFU", "ip askı", "cilt gençleştirme", "leke tedavisi", "melazma", "akne skarı", "rozasea", "gözaltı dolgusu", "dudak dolgusu", "elmacık dolgusu", "kaz ayağı", "kaş arası", "alın çizgileri", "nazolabial", "marionette", "ödem", "morarma", "nodül", "skin booster", "polinükleotid", "eksozom"],
  hatalar: [{"duyulan": ["hiyaluronik asit", "hyalüronik asit"], "dogru": "hyaluronik asit", "ekli": true}],
}

export default sozluk
