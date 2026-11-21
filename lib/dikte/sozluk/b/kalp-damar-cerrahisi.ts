/**
 * DIKTE-TIBBI-01 — Kalp ve Damar Cerrahisi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["koroner arter bypass greftleme", "CABG", "safen ven grefti", "internal mammaryan arter", "kapak replasmanı", "mitral kapak onarımı", "aort kapak replasmanı", "TAVI", "aort anevrizması", "aort diseksiyonu", "EVAR", "periferik arter hastalığı", "kladikasyon", "ayak bileği kol indeksi", "karotis stenozu", "karotis endarterektomi", "derin ven trombozu", "venöz yetmezlik", "varis", "skleroterapi", "endovenöz lazer ablasyon", "arteriyovenöz fistül", "ekstrakorporeal dolaşım", "perikardiyal efüzyon", "sternotomi", "dren", "postoperatif atriyal fibrilasyon", "antikoagülasyon", "heparin", "varfarin", "doppler ultrasonografi", "BT anjiyografi"],
  hatalar: [{"duyulan": ["sterno tomi"], "dogru": "sternotomi", "ekli": true}, {"duyulan": ["endarter ektomi", "endarterek tomi"], "dogru": "endarterektomi", "ekli": true}],
}

export default sozluk
