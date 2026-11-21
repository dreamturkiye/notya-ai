/**
 * DIKTE-TIBBI-01 — Beyin ve Sinir Cerrahisi dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["kraniyotomi", "kraniyektomi", "subdural hematom", "epidural hematom", "intraserebral hematom", "subaraknoid kanama", "anevrizma", "arteriyovenöz malformasyon", "hidrosefali", "ventriküloperitoneal şant", "beyin tümörü", "glioma", "menenjiom", "hipofiz adenomu", "lomber disk hernisi", "servikal disk hernisi", "mikrodiskektomi", "laminektomi", "spinal stenoz", "spondilolistezis", "füzyon", "transpedikuler vida", "radikülopati", "miyelopati", "kauda ekina sendromu", "kafa travması", "glasgow koma skalası", "nörolojik defisit", "kas gücü", "parapleji", "kuadripleji", "kraniyal sinirler", "postoperatif"],
  hatalar: [{"duyulan": ["kranyotomi", "kranio tomi"], "dogru": "kraniyotomi", "ekli": true}, {"duyulan": ["mikro diskektomi"], "dogru": "mikrodiskektomi", "ekli": true}, {"duyulan": ["hidro sefali"], "dogru": "hidrosefali", "ekli": true}],
}

export default sozluk
