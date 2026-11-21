/**
 * DIKTE-TIBBI-01 — Pediatri dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["fontanel", "ön fontanel", "persentil", "büyüme eğrisi", "baş çevresi", "gelişim basamakları", "bronşiolit", "krup", "otitis media", "gastroenterit", "dehidratasyon", "febril konvülziyon", "pnömoni", "tonsillofarenjit", "anne sütü", "formül mama", "ek gıda", "aşı takvimi", "hepatit B", "rotavirüs", "pnömokok", "kızamık", "suçiçeği", "D vitamini", "demir profilaksisi", "neonatal sarılık", "fototerapi", "kolik", "reflü", "pişik", "atopik dermatit", "inmemiş testis", "fimozis", "hipospadias", "kalça displazisi", "enürezis", "adenoid hipertrofisi", "wheezing", "nebülizasyon", "salbutamol", "parasetamol", "ibuprofen", "amoksisilin", "oral rehidratasyon", "prematüre", "düzeltilmiş yaş", "retinopati", "RSV", "hipotoni", "makrosefali", "mikrosefali"],
  hatalar: [{"duyulan": ["bronş iolit", "bronşi olit"], "dogru": "bronşiolit", "ekli": true}, {"duyulan": ["fonta nel"], "dogru": "fontanel", "ekli": true}, {"duyulan": ["per sentil", "persantil"], "dogru": "persentil", "ekli": true}],
}

export default sozluk
