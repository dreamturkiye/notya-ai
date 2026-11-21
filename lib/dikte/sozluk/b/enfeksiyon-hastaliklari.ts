/**
 * DIKTE-TIBBI-01 — Enfeksiyon Hastalıkları dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["ateş", "febril nötropeni", "sepsis", "bakteriyemi", "kan kültürü", "idrar kültürü", "antibiyogram", "prokalsitonin", "CRP", "lökositoz", "pnömoni", "toplum kökenli pnömoni", "idrar yolu enfeksiyonu", "piyelonefrit", "selülit", "apse", "osteomiyelit", "menenjit", "ensefalit", "endokardit", "tüberküloz", "PPD", "interferon gama", "HIV", "hepatit B", "hepatit C", "HBsAg", "anti-HBs", "brusella", "kırım kongo kanamalı ateşi", "sıtma", "COVID-19", "influenza", "zona", "suçiçeği", "kızamık", "aşılama", "profilaksi", "seftriakson", "sefazolin", "piperasilin tazobaktam", "meropenem", "vankomisin", "teikoplanin", "linezolid", "kolistin", "siprofloksasin", "levofloksasin", "doksisiklin", "azitromisin", "klindamisin", "metronidazol", "flukonazol", "vorikonazol", "asiklovir", "valasiklovir", "oseltamivir"],
  hatalar: [{"duyulan": ["proklalsitonin", "prokal sitonin"], "dogru": "prokalsitonin", "ekli": true}, {"duyulan": ["vanko misin"], "dogru": "vankomisin", "ekli": true}],
}

export default sozluk
