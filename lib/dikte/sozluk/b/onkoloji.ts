/**
 * DIKTE-TIBBI-01 — Onkoloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["malignite", "tümör", "metastaz", "evreleme", "TNM", "biyopsi", "patoloji", "immünohistokimya", "kemoterapi", "adjuvan", "neoadjuvan", "radyoterapi", "immünoterapi", "hedefe yönelik tedavi", "performans skoru", "ECOG", "tümör belirteçleri", "CEA", "CA 125", "CA 19-9", "PSA", "meme kanseri", "akciğer kanseri", "kolorektal kanser", "prostat kanseri", "lenfoma", "lösemi", "nötropeni", "febril nötropeni", "bulantı kusma", "mukozit", "periferik nöropati", "port kateter", "palyatif", "progresyon", "stabil hastalık", "kısmi yanıt", "tam yanıt", "PET-BT", "sisplatin", "karboplatin", "paklitaksel", "dosetaksel", "kapesitabin", "oksaliplatin", "pembrolizumab", "nivolumab", "trastuzumab", "tamoksifen", "letrozol", "anastrozol", "ondansetron", "granisetron"],
  hatalar: [{"duyulan": ["metas taz"], "dogru": "metastaz", "ekli": true}, {"duyulan": ["kemo terapi"], "dogru": "kemoterapi", "ekli": true}, {"duyulan": ["radyo terapi"], "dogru": "radyoterapi", "ekli": true}],
}

export default sozluk
