/**
 * DIKTE-TIBBI-01 — Saç Ekimi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["androgenetik alopesi", "norwood sınıflaması", "ludwig sınıflaması", "FUE", "FUT", "DHI", "safir FUE", "greft", "folikül", "folliküler ünite", "donör bölge", "alıcı bölge", "saç çizgisi", "yoğunluk", "kanal açma", "implanter", "trikoskopi", "minoksidil", "finasterid", "dutasterid", "PRP", "mezoterapi", "kabuklanma", "şok dökülme", "ödem", "follikülit", "ekim seansı", "sakal ekimi", "kaş ekimi"],
  hatalar: [{"duyulan": ["trikos kopi"], "dogru": "trikoskopi", "ekli": true}, {"duyulan": ["norvud"], "dogru": "norwood", "ekli": true}],
}

export default sozluk
