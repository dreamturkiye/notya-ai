/**
 * DIKTE-TIBBI-01 — Odyoloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["saf ses odyometri", "konuşma odyometrisi", "timpanometri", "akustik refleks", "otoakustik emisyon", "işitsel beyin sapı yanıtı", "ABR", "yenidoğan işitme taraması", "işitme kaybı", "iletim tipi işitme kaybı", "sensörinöral işitme kaybı", "mikst tip işitme kaybı", "hafif", "orta", "ileri", "çok ileri", "işitme cihazı", "koklear implant", "kulak kalıbı", "tinnitus", "tinnitus terapisi", "vestibüler değerlendirme", "videonistagmografi", "kalorik test", "denge", "odyogram", "eşik", "desibel", "frekans", "konuşmayı ayırt etme skoru", "timpanik membran", "dış kulak yolu", "serumen"],
  hatalar: [{"duyulan": ["timpano metri"], "dogru": "timpanometri", "ekli": true}, {"duyulan": ["odyo metri"], "dogru": "odyometri", "ekli": true}, {"duyulan": ["tinitus"], "dogru": "tinnitus", "ekli": true}],
}

export default sozluk
