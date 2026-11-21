/**
 * DIKTE-TIBBI-01 — Anestezi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["preoperatif değerlendirme", "ASA skoru", "mallampati", "entübasyon", "zor havayolu", "laringeal maske", "genel anestezi", "spinal anestezi", "epidural anestezi", "periferik sinir bloğu", "sedasyon", "premedikasyon", "indüksiyon", "propofol", "midazolam", "fentanil", "remifentanil", "rokuronyum", "süksinilkolin", "sugammadeks", "sevofluran", "desfluran", "ketamin", "deksmedetomidin", "bupivakain", "lidokain", "ondansetron", "deksametazon", "postoperatif bulantı kusma", "hipotansiyon", "bradikardi", "desatürasyon", "oksijen satürasyonu", "end tidal karbondioksit", "mekanik ventilasyon", "yoğun bakım", "reanimasyon", "ağrı skoru", "hasta kontrollü analjezi", "aspirasyon riski", "açlık süresi"],
  hatalar: [{"duyulan": ["entü basyon", "entubasyon"], "dogru": "entübasyon", "ekli": true}, {"duyulan": ["pro pofol"], "dogru": "propofol", "ekli": true}],
}

export default sozluk
