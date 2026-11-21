/**
 * DIKTE-TIBBI-01 — Aile Hekimliği dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["periyodik sağlık muayenesi", "tarama", "kanser taraması", "aşılama", "aşı takvimi", "gebe izlemi", "bebek izlemi", "çocuk izlemi", "hipertansiyon", "diyabetes mellitus", "HbA1c", "dislipidemi", "obezite", "beden kitle indeksi", "sigara bırakma", "üst solunum yolu enfeksiyonu", "tonsillofarenjit", "sinüzit", "otitis media", "akut gastroenterit", "idrar yolu enfeksiyonu", "bel ağrısı", "baş ağrısı", "depresyon", "anksiyete", "uykusuzluk", "demir eksikliği anemisi", "D vitamini", "B12 vitamini", "tiroid fonksiyon testleri", "kolesterol", "hemogram", "evde sağlık", "sevk", "kronik hastalık izlemi", "ilaç uyumu", "parasetamol", "ibuprofen", "amoksisilin", "amoksisilin klavulanat", "sefuroksim", "azitromisin"],
  hatalar: [{"duyulan": ["tonsillo farenjit"], "dogru": "tonsillofarenjit", "ekli": true}],
}

export default sozluk
