/**
 * DIKTE-TIBBI-01 — Radyoloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["bilgisayarlı tomografi", "manyetik rezonans görüntüleme", "ultrasonografi", "doppler ultrasonografi", "direkt grafi", "mamografi", "kontrast madde", "kontrastlı", "kontrastsız", "hipodens", "hiperdens", "izodens", "hipoekoik", "hiperekoik", "anekoik", "heterojen", "homojen", "T1 ağırlıklı", "T2 ağırlıklı", "difüzyon kısıtlılığı", "sinyal artışı", "kitle lezyonu", "nodül", "kist", "kalsifikasyon", "efüzyon", "konsolidasyon", "buzlu cam", "atelektazi", "plevral efüzyon", "pnömotoraks", "lenfadenopati", "hepatosteatoz", "safra taşı", "hidronefroz", "BI-RADS", "TI-RADS", "metastaz", "ödem", "herniasyon", "dejeneratif", "osteofit", "fraktür hattı"],
  hatalar: [{"duyulan": ["hipo ekoik"], "dogru": "hipoekoik", "ekli": true}, {"duyulan": ["hiper ekoik"], "dogru": "hiperekoik", "ekli": true}, {"duyulan": ["hipo dens"], "dogru": "hipodens", "ekli": true}],
}

export default sozluk
