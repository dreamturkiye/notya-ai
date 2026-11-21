/**
 * DIKTE-TIBBI-01 — Acil Tıp dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["triaj", "glasgow koma skalası", "vital bulgular", "kardiyopulmoner resüsitasyon", "defibrilasyon", "asistoli", "ventriküler fibrilasyon", "nabızsız elektriksel aktivite", "akut koroner sendrom", "göğüs ağrısı", "dispne", "senkop", "inme", "travma", "politravma", "kafa travması", "servikal immobilizasyon", "FAST ultrasonografi", "pnömotoraks", "hemotoraks", "şok", "hipovolemik şok", "anafilaksi", "adrenalin", "sepsis", "laktat", "zehirlenme", "aktif kömür", "nalokson", "hipoglisemi", "diyabetik ketoasidoz", "status epileptikus", "yanık", "laserasyon", "sütür", "tetanoz profilaksisi", "kırık", "redüksiyon", "gözlem", "yatış", "sevk", "arter kan gazı", "elektrokardiyografi"],
  hatalar: [{"duyulan": ["re süsitasyon", "resüsi tasyon"], "dogru": "resüsitasyon", "ekli": true}, {"duyulan": ["tri aj"], "dogru": "triaj", "ekli": true}],
}

export default sozluk
