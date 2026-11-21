/**
 * DIKTE-TIBBI-01 — Dermatoloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["dermatoskopi", "makül", "papül", "plak", "nodül", "vezikül", "bül", "püstül", "skuam", "krut", "erozyon", "ülser", "likenifikasyon", "eritem", "eritematöz", "hiperpigmentasyon", "hipopigmentasyon", "akne vulgaris", "komedon", "rozasea", "seboreik dermatit", "atopik dermatit", "kontakt dermatit", "psoriazis", "liken planus", "ürtiker", "anjiyoödem", "vitiligo", "alopesi", "alopesi areata", "androgenetik alopesi", "tinea", "tinea pedis", "onikomikoz", "pitiriazis versikolor", "skabiyez", "herpes zoster", "herpes simpleks", "verruka", "molluskum kontagiozum", "nevüs", "displastik nevüs", "melanom", "bazal hücreli karsinom", "skuamöz hücreli karsinom", "aktinik keratoz", "seboreik keratoz", "kriyoterapi", "biyopsi", "punch biyopsi", "izotretinoin", "topikal steroid", "kalsinörin inhibitörü", "takrolimus", "pimekrolimus", "metotreksat", "biyolojik ajan", "fototerapi", "dar bant UVB"],
  hatalar: [{"duyulan": ["dermatos kopi", "dermato skopi"], "dogru": "dermatoskopi", "ekli": true}, {"duyulan": ["pso riazis"], "dogru": "psoriazis", "ekli": true}],
}

export default sozluk
