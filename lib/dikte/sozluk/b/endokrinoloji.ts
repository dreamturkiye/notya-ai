/**
 * DIKTE-TIBBI-01 — Endokrinoloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["diyabetes mellitus", "tip 1 diyabet", "tip 2 diyabet", "HbA1c", "hipoglisemi", "insülin", "bazal insülin", "bolus insülin", "insülin pompası", "sürekli glukoz monitörizasyonu", "metformin", "SGLT2 inhibitörü", "DPP-4 inhibitörü", "GLP-1 agonisti", "semaglutid", "tirzepatid", "hipotiroidi", "hipertiroidi", "hashimoto tiroiditi", "graves hastalığı", "tiroid nodülü", "tiroid ultrasonografisi", "ince iğne aspirasyon biyopsisi", "TSH", "serbest T4", "serbest T3", "anti-TPO", "levotiroksin", "propiltiyourasil", "metimazol", "hiperparatiroidi", "parathormon", "kalsiyum", "D vitamini", "osteoporoz", "kemik mineral yoğunluğu", "adrenal yetmezlik", "kortizol", "cushing sendromu", "feokromositoma", "hiperaldosteronizm", "prolaktinoma", "hipofiz", "akromegali", "polikistik over sendromu", "hirsutizm", "hipogonadizm", "testosteron", "obezite", "dislipidemi"],
  hatalar: [{"duyulan": ["haşimoto", "hashi moto"], "dogru": "hashimoto", "ekli": true}, {"duyulan": ["levo tiroksin"], "dogru": "levotiroksin", "ekli": true}],
}

export default sozluk
