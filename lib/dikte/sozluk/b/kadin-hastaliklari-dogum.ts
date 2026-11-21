/**
 * DIKTE-TIBBI-01 — Kadın Hastalıkları ve Doğum dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["son adet tarihi", "gebelik haftası", "tahmini doğum tarihi", "gravida", "parite", "abortus", "obstetrik ultrasonografi", "fetal kalp atımı", "fetal biyometri", "biparietal çap", "femur uzunluğu", "amniyon sıvısı", "plasenta", "servikal uzunluk", "non stres test", "preeklampsi", "gestasyonel diyabet", "oral glukoz tolerans testi", "hiperemezis gravidarum", "plasenta previa", "erken membran rüptürü", "sezaryen", "normal doğum", "epizyotomi", "lohusalık", "spekulum muayenesi", "bimanuel muayene", "serviks", "vajinal akıntı", "vajinit", "kandidiyazis", "bakteriyel vajinozis", "smear", "HPV", "kolposkopi", "endometriyum", "endometriozis", "myom", "over kisti", "polikistik over sendromu", "dismenore", "menoraji", "amenore", "menopoz", "kontrasepsiyon", "rahim içi araç", "infertilite", "folik asit", "progesteron", "östrojen", "transvajinal ultrasonografi", "adneks", "douglas"],
  hatalar: [{"duyulan": ["epiz yotomi"], "dogru": "epizyotomi", "ekli": true}, {"duyulan": ["pre eklampsi"], "dogru": "preeklampsi", "ekli": true}, {"duyulan": ["kolpos kopi"], "dogru": "kolposkopi", "ekli": true}],
}

export default sozluk
