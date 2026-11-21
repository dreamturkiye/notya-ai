/**
 * DIKTE-TIBBI-01 — Nefroloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["kronik böbrek hastalığı", "akut böbrek hasarı", "glomerüler filtrasyon hızı", "eGFR", "kreatinin", "üre", "proteinüri", "albüminüri", "idrar albümin kreatinin oranı", "hematüri", "glomerülonefrit", "nefrotik sendrom", "nefritik sendrom", "diyabetik nefropati", "hipertansif nefropati", "polikistik böbrek hastalığı", "böbrek biyopsisi", "hemodiyaliz", "periton diyalizi", "arteriyovenöz fistül", "böbrek nakli", "immünosüpresif", "takrolimus", "mikofenolat", "hiperkalemi", "hiponatremi", "metabolik asidoz", "renal anemi", "eritropoetin", "sekonder hiperparatiroidi", "fosfor", "kalsiyum", "D vitamini", "ödem", "sıvı kısıtlaması", "diüretik", "furosemid", "ACE inhibitörü", "anjiyotensin reseptör blokeri", "SGLT2 inhibitörü", "böbrek ultrasonografisi"],
  hatalar: [{"duyulan": ["glomerülo nefrit"], "dogru": "glomerülonefrit", "ekli": true}, {"duyulan": ["hemo diyaliz"], "dogru": "hemodiyaliz", "ekli": true}],
}

export default sozluk
