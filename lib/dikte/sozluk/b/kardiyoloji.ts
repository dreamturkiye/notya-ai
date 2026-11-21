/**
 * DIKTE-TIBBI-01 — Kardiyoloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["elektrokardiyografi", "ekokardiyografi", "efor testi", "holter", "ritim holter", "koroner arter hastalığı", "miyokard enfarktüsü", "STEMI", "NSTEMI", "anjina pektoris", "stabil anjina", "kalp yetmezliği", "ejeksiyon fraksiyonu", "sol ventrikül", "sağ ventrikül", "hipertrofi", "dilatasyon", "atriyal fibrilasyon", "atriyal flutter", "ventriküler taşikardi", "ekstrasistol", "sinüs ritmi", "sinüs taşikardisi", "dal bloğu", "AV blok", "mitral yetmezlik", "mitral darlık", "aort darlığı", "aort yetmezliği", "triküspit yetmezlik", "perikardit", "perikardiyal efüzyon", "koroner anjiyografi", "stent", "bypass", "pacemaker", "ICD", "antikoagülan", "varfarin", "apiksaban", "rivaroksaban", "edoksaban", "dabigatran", "asetilsalisilik asit", "klopidogrel", "tikagrelor", "beta bloker", "metoprolol", "bisoprolol", "karvedilol", "ACE inhibitörü", "ramipril", "perindopril", "sakubitril", "spironolakton", "furosemid", "statin", "atorvastatin", "rosuvastatin", "troponin", "BNP", "dispne", "çarpıntı", "senkop", "presenkop", "üfürüm", "sistolik", "diyastolik"],
  hatalar: [{"duyulan": ["ekokardiyo grafi", "eko kardiyografi"], "dogru": "ekokardiyografi", "ekli": true}, {"duyulan": ["atriyel fibrilasyon"], "dogru": "atriyal fibrilasyon", "ekli": true}, {"duyulan": ["hol ter"], "dogru": "holter", "ekli": true}],
}

export default sozluk
