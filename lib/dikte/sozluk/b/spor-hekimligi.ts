/**
 * DIKTE-TIBBI-01 — Spor Hekimliği dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["sportif performans", "sporcu sağlık taraması", "kardiyopulmoner egzersiz testi", "maksimal oksijen tüketimi", "laktat eşiği", "efor testi", "spor yaralanması", "kas yırtığı", "hamstring yaralanması", "ön çapraz bağ", "menisküs", "ayak bileği burkulması", "aşil tendinopatisi", "patellar tendinopati", "stres kırığı", "aşırı kullanım sendromu", "kompartman sendromu", "sarsıntı", "beyin sarsıntısı", "rehabilitasyon", "sporaya dönüş", "kinezyo bant", "PRP", "ekstrakorporeal şok dalga tedavisi", "sporcu beslenmesi", "doping", "dehidratasyon", "ısı çarpması", "elektrokardiyografi", "ekokardiyografi", "beden kompozisyonu"],
  hatalar: [{"duyulan": ["hamst ring", "ham string"], "dogru": "hamstring", "ekli": true}],
}

export default sozluk
