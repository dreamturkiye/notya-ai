/**
 * DIKTE-TIBBI-01 — Göğüs Cerrahisi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["torakotomi", "VATS", "video yardımlı torakoskopik cerrahi", "lobektomi", "segmentektomi", "wedge rezeksiyon", "pnömonektomi", "mediastinoskopi", "göğüs tüpü", "tüp torakostomi", "pnömotoraks", "spontan pnömotoraks", "hemotoraks", "ampiyem", "plevral efüzyon", "plörodezis", "dekortikasyon", "akciğer nodülü", "akciğer kanseri", "mediastinal kitle", "timoma", "pektus ekskavatum", "pektus karinatum", "kot kırığı", "yelken göğüs", "hava kaçağı", "trakeal stenoz", "postoperatif"],
  hatalar: [{"duyulan": ["torako tomi"], "dogru": "torakotomi", "ekli": true}, {"duyulan": ["lob ektomi"], "dogru": "lobektomi", "ekli": true}],
}

export default sozluk
