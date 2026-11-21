/**
 * DIKTE-TIBBI-01 — Longevity dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["biyolojik yaş", "metabolik sağlık", "insülin direnci", "HOMA-IR", "HbA1c", "lipid profili", "apolipoprotein B", "lipoprotein a", "homosistein", "hs-CRP", "D vitamini", "omega-3 indeksi", "beden kompozisyonu", "visseral yağ", "kas kütlesi", "sarkopeni", "VO2max", "kalp hızı değişkenliği", "uyku kalitesi", "sirkadiyen ritim", "aralıklı oruç", "kalori kısıtlaması", "direnç egzersizi", "zone 2", "kemik mineral yoğunluğu", "DEXA", "oksidatif stres", "telomer", "metformin", "NAD", "koenzim Q10", "magnezyum", "kreatin"],
  hatalar: [{"duyulan": ["homa ir"], "dogru": "HOMA-IR", "ekli": true}],
}

export default sozluk
