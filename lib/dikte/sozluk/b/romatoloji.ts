/**
 * DIKTE-TIBBI-01 — Romatoloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["romatoid artrit", "ankilozan spondilit", "aksiyel spondiloartrit", "psoriatik artrit", "sistemik lupus eritematozus", "sjögren sendromu", "sistemik skleroz", "vaskülit", "behçet hastalığı", "ailesel akdeniz ateşi", "gut", "psödogut", "polimiyalji romatika", "dev hücreli arterit", "fibromiyalji", "osteoartrit", "sinovit", "artrit", "artralji", "sabah tutukluğu", "entesit", "daktilit", "sakroileit", "raynaud fenomeni", "romatoid faktör", "anti-CCP", "ANA", "anti-dsDNA", "HLA-B27", "sedimantasyon", "CRP", "metotreksat", "hidroksiklorokin", "sülfasalazin", "leflunomid", "kolşisin", "prednizolon", "biyolojik tedavi", "adalimumab", "etanersept", "infliksimab", "tosilizumab", "rituksimab", "eklem şişliği", "hassas eklem sayısı", "DAS28"],
  hatalar: [{"duyulan": ["romato id artrit", "romatoit artrit"], "dogru": "romatoid artrit", "ekli": true}, {"duyulan": ["kol şisin", "kolşi sin"], "dogru": "kolşisin", "ekli": true}],
}

export default sozluk
