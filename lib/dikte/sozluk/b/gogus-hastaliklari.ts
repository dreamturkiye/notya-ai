/**
 * DIKTE-TIBBI-01 — Göğüs Hastalıkları dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["solunum fonksiyon testi", "spirometri", "FEV1", "FVC", "FEV1/FVC", "reversibilite", "difüzyon kapasitesi", "astım", "kronik obstrüktif akciğer hastalığı", "koah alevlenmesi", "bronşektazi", "pnömoni", "interstisyel akciğer hastalığı", "idiyopatik pulmoner fibrozis", "sarkoidoz", "pulmoner emboli", "plevral efüzyon", "pnömotoraks", "akciğer nodülü", "akciğer kanseri", "tüberküloz", "obstrüktif uyku apnesi", "polisomnografi", "CPAP", "oksijen satürasyonu", "arter kan gazı", "oksijen tedavisi", "inhaler", "nebülizatör", "salbutamol", "formoterol", "salmeterol", "tiotropyum", "budesonid", "flutikazon", "montelukast", "teofilin", "roflumilast", "ral", "ronküs", "wheezing", "solunum sesleri azalmış", "bronkoskopi", "toraks tomografisi"],
  hatalar: [{"duyulan": ["spiro metri"], "dogru": "spirometri", "ekli": true}, {"duyulan": ["bronko skopi", "bronkos kopi"], "dogru": "bronkoskopi", "ekli": true}, {"duyulan": ["bronşi ektazi", "bronş ektazi"], "dogru": "bronşektazi", "ekli": true}],
}

export default sozluk
