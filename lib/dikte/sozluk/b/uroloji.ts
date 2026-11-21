/**
 * DIKTE-TIBBI-01 — Üroloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["benign prostat hiperplazisi", "prostat", "PSA", "rektal tuşe", "alt üriner sistem semptomları", "pollaküri", "noktüri", "disüri", "hematüri", "üriner retansiyon", "rezidüel idrar", "üroflowmetri", "üriner inkontinans", "stres inkontinans", "sistit", "piyelonefrit", "prostatit", "epididimit", "orşit", "böbrek taşı", "nefrolitiazis", "üreter taşı", "renal kolik", "hidronefroz", "sistoskopi", "üreteroskopi", "ESWL", "perkütan nefrolitotomi", "TUR-P", "varikosel", "hidrosel", "inmemiş testis", "fimozis", "sünnet", "erektil disfonksiyon", "prematür ejakülasyon", "infertilite", "spermiyogram", "tamsulosin", "silodosin", "alfuzosin", "finasterid", "dutasterid", "solifenasin", "mirabegron", "tadalafil", "sildenafil", "böbrek ultrasonografisi"],
  hatalar: [{"duyulan": ["sistos kopi"], "dogru": "sistoskopi", "ekli": true}, {"duyulan": ["hidro nefroz"], "dogru": "hidronefroz", "ekli": true}, {"duyulan": ["tam sulosin"], "dogru": "tamsulosin", "ekli": true}],
}

export default sozluk
