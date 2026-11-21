/**
 * DIKTE-TIBBI-01 — Psikiyatri dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["ruhsal durum muayenesi", "duygudurum", "afekt", "künt afekt", "öfori", "disfori", "anhedoni", "depresyon", "majör depresif bozukluk", "anksiyete", "yaygın anksiyete bozukluğu", "panik bozukluk", "obsesif kompulsif bozukluk", "travma sonrası stres bozukluğu", "bipolar bozukluk", "mani", "hipomani", "şizofreni", "psikoz", "halüsinasyon", "sanrı", "varsanı", "düşünce içeriği", "düşünce akışı", "içgörü", "yargı", "intihar düşüncesi", "uykusuzluk", "insomni", "dikkat eksikliği hiperaktivite bozukluğu", "otizm spektrum bozukluğu", "yeme bozukluğu", "anoreksiya nervoza", "bulimiya nervoza", "madde kullanım bozukluğu", "sertralin", "essitalopram", "fluoksetin", "paroksetin", "venlafaksin", "duloksetin", "mirtazapin", "bupropion", "ketiapin", "olanzapin", "risperidon", "aripiprazol", "lityum", "valproat", "lamotrijin", "klonazepam", "alprazolam", "metilfenidat", "atomoksetin", "psikoterapi", "bilişsel davranışçı terapi"],
  hatalar: [{"duyulan": ["es sitalopram", "essitalopram"], "dogru": "essitalopram", "ekli": true}, {"duyulan": ["ser tralin"], "dogru": "sertralin", "ekli": true}],
}

export default sozluk
