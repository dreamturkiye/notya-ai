/**
 * DIKTE-TIBBI-01 — Gastroenteroloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["endoskopi", "gastroskopi", "kolonoskopi", "ERCP", "endoskopik ultrasonografi", "biyopsi", "polipektomi", "gastroözofageal reflü", "özofajit", "barrett özofagusu", "gastrit", "peptik ülser", "helikobakter pilori", "dispepsi", "irritabl bağırsak sendromu", "inflamatuvar bağırsak hastalığı", "crohn hastalığı", "ülseratif kolit", "çölyak hastalığı", "divertikülit", "hemoroid", "gastrointestinal kanama", "melena", "hematokezi", "hepatit", "siroz", "asit", "varis", "hepatik ensefalopati", "yağlı karaciğer hastalığı", "kolestaz", "sarılık", "pankreatit", "safra taşı", "disfaji", "bulantı", "kusma", "diyare", "konstipasyon", "karın ağrısı", "şişkinlik", "pantoprazol", "lansoprazol", "esomeprazol", "mesalazin", "budesonid", "azatiyoprin", "infliksimab", "adalimumab", "ursodeoksikolik asit", "laktüloz", "rifaksimin"],
  hatalar: [{"duyulan": ["kolonos kopi", "kolono skopi"], "dogru": "kolonoskopi", "ekli": true}, {"duyulan": ["gastros kopi"], "dogru": "gastroskopi", "ekli": true}, {"duyulan": ["heliko bakter"], "dogru": "helikobakter pilori", "ekli": true}],
}

export default sozluk
