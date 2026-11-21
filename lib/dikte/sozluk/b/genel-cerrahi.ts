/**
 * DIKTE-TIBBI-01 — Genel Cerrahi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["akut batın", "apandisit", "apendektomi", "laparoskopik", "laparotomi", "kolesistit", "kolelitiazis", "kolesistektomi", "koledokolitiazis", "pankreatit", "inguinal herni", "umbilikal herni", "insizyonel herni", "herniorafi", "hernioplasti", "meş", "ileus", "bağırsak obstrüksiyonu", "perforasyon", "peritonit", "apse", "drenaj", "debridman", "yara yeri enfeksiyonu", "sütür", "dikiş alınması", "pilonidal sinüs", "hemoroid", "anal fissür", "anal fistül", "perianal apse", "tiroidektomi", "meme kitlesi", "mastektomi", "sentinel lenf nodu", "kolorektal", "kolonoskopi", "endoskopi", "gastrektomi", "obezite cerrahisi", "sleeve gastrektomi", "McBurney", "Murphy bulgusu", "rebound", "defans", "bağırsak sesleri", "nazogastrik", "dren", "postoperatif"],
  hatalar: [{"duyulan": ["kole sistektomi", "kolesis tektomi"], "dogru": "kolesistektomi", "ekli": true}, {"duyulan": ["apen dektomi"], "dogru": "apendektomi", "ekli": true}, {"duyulan": ["laparos kopik"], "dogru": "laparoskopik", "ekli": true}],
}

export default sozluk
