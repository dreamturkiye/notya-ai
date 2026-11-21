/**
 * DIKTE-TIBBI-01 — Fizyoterapi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["eklem hareket açıklığı", "kas gücü", "manuel kas testi", "postür analizi", "yürüme analizi", "denge", "propriosepsiyon", "manuel terapi", "mobilizasyon", "manipülasyon", "germe", "güçlendirme", "stabilizasyon egzersizleri", "kor stabilizasyonu", "TENS", "ultrason", "sıcak paket", "kinezyo bantlama", "kuru iğneleme", "fasya", "tetik nokta", "skolyoz", "bel ağrısı", "boyun ağrısı", "omuz ağrısı", "diz ağrısı", "postoperatif rehabilitasyon", "ön çapraz bağ rehabilitasyonu", "ödem", "ağrı skoru", "ev egzersiz programı"],
  hatalar: [{"duyulan": ["proprio sepsiyon"], "dogru": "propriosepsiyon", "ekli": true}],
}

export default sozluk
