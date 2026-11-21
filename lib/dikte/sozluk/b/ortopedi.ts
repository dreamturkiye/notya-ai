/**
 * DIKTE-TIBBI-01 — Ortopedi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["kırık", "deplase", "nondeplase", "fraktür", "redüksiyon", "alçı", "atel", "splint", "eksternal fiksatör", "internal fiksasyon", "plak vida", "intramedüller çivi", "artroskopi", "artroplasti", "total diz protezi", "total kalça protezi", "menisküs", "menisküs yırtığı", "ön çapraz bağ", "arka çapraz bağ", "lateral kollateral bağ", "medial kollateral bağ", "lachman", "ön çekmece", "McMurray", "rotator manşet", "impingement", "subakromiyal", "tendinit", "tendinopati", "epikondilit", "lateral epikondilit", "karpal tünel sendromu", "tetik parmak", "de Quervain", "skolyoz", "kifoz", "lomber disk hernisi", "servikal disk hernisi", "radikülopati", "spondilolistezis", "osteoartrit", "gonartroz", "koksartroz", "osteoporoz", "eklem hareket açıklığı", "efüzyon", "krepitasyon", "ödem", "ekimoz", "skafoid", "distal radius", "femur boyun kırığı", "ayak bileği burkulması", "aşil tendonu", "plantar fasiit", "halluks valgus"],
  hatalar: [{"duyulan": ["menis küs"], "dogru": "menisküs", "ekli": true}, {"duyulan": ["artros kopi"], "dogru": "artroskopi", "ekli": true}, {"duyulan": ["epi kondilit"], "dogru": "epikondilit", "ekli": true}],
}

export default sozluk
