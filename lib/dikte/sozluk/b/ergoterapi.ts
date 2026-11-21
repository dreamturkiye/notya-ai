/**
 * DIKTE-TIBBI-01 — Ergoterapi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["günlük yaşam aktiviteleri", "enstrümantal günlük yaşam aktiviteleri", "duyu bütünleme", "duyusal işlemleme", "ince motor", "kaba motor", "el becerisi", "kavrama", "bilateral koordinasyon", "görsel algı", "motor planlama", "dikkat", "yürütücü işlevler", "oyun", "okul becerileri", "otizm spektrum bozukluğu", "dikkat eksikliği hiperaktivite bozukluğu", "serebral palsi", "inme rehabilitasyonu", "ortez", "adaptif ekipman", "ev düzenlemesi", "aktivite analizi", "ergoterapi seansı", "değerlendirme", "hedef belirleme"],
  hatalar: [],
}

export default sozluk
