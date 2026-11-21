/**
 * DIKTE-TIBBI-01 — Çocuk Cerrahisi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["inguinal herni", "umbilikal herni", "hidrosel", "inmemiş testis", "orşiopeksi", "fimozis", "sünnet", "hipospadias", "pilor stenozu", "piloromiyotomi", "invajinasyon", "apandisit", "apendektomi", "hirschsprung hastalığı", "anorektal malformasyon", "vezikoüreteral reflü", "üreteropelvik darlık", "hidronefroz", "yabancı cisim aspirasyonu", "özofagus atrezisi", "konjenital diyafragma hernisi", "laparoskopik", "torsiyon", "testis torsiyonu", "over torsiyonu", "yanık", "postoperatif"],
  hatalar: [{"duyulan": ["orşio peksi", "orşiyopeksi"], "dogru": "orşiopeksi", "ekli": true}, {"duyulan": ["inva jinasyon", "invajinasyon"], "dogru": "invajinasyon", "ekli": true}],
}

export default sozluk
