/**
 * DIKTE-TIBBI-01 — Klinik Psikoloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["psikoterapi", "bilişsel davranışçı terapi", "şema terapi", "EMDR", "kabul ve kararlılık terapisi", "psikodinamik", "danışan", "seans", "vaka formülasyonu", "otomatik düşünceler", "bilişsel çarpıtmalar", "duygudurum", "anksiyete", "depresyon", "panik atak", "sosyal kaygı", "obsesif kompulsif", "travma", "yas", "öfke kontrolü", "uyku hijyeni", "gevşeme egzersizleri", "nefes egzersizi", "maruz bırakma", "ödev", "ölçek", "Beck depresyon envanteri", "Beck anksiyete envanteri", "intihar riski", "koruyucu faktörler"],
  hatalar: [{"duyulan": ["e em di ar", "emdr"], "dogru": "EMDR", "ekli": true}],
}

export default sozluk
