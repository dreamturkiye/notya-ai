/**
 * DIKTE-TIBBI-01 — Dahiliye dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["hipertansiyon", "diyabetes mellitus", "tip 2 diyabet", "HbA1c", "açlık kan şekeri", "insülin direnci", "metformin", "insülin", "dislipidemi", "LDL", "trigliserid", "hipotiroidi", "levotiroksin", "anemi", "demir eksikliği anemisi", "ferritin", "B12 vitamini", "folat", "kronik böbrek hastalığı", "GFR", "proteinüri", "mikroalbüminüri", "karaciğer fonksiyon testleri", "ALT", "AST", "yağlı karaciğer", "gastrit", "dispepsi", "reflü", "pantoprazol", "esomeprazol", "helikobakter", "koah", "astım", "pnömoni", "idrar yolu enfeksiyonu", "gut", "ürik asit", "osteoporoz", "D vitamini eksikliği", "obezite", "beden kitle indeksi", "metabolik sendrom", "amlodipin", "valsartan", "losartan", "hidroklorotiyazid", "empagliflozin", "dapagliflozin", "sitagliptin", "semaglutid", "kolesterol", "ödem", "halsizlik", "kilo kaybı"],
  hatalar: [{"duyulan": ["hemoglobin a1c", "hba bir c"], "dogru": "HbA1c", "ekli": true}, {"duyulan": ["met formin"], "dogru": "metformin", "ekli": true}],
}

export default sozluk
