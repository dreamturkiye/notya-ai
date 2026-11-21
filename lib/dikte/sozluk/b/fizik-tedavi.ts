/**
 * DIKTE-TIBBI-01 — Fizik Tedavi ve Rehabilitasyon dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["eklem hareket açıklığı", "kas gücü", "manuel kas testi", "spastisite", "modifiye ashworth", "lomber disk hernisi", "servikal disk hernisi", "bel ağrısı", "boyun ağrısı", "miyofasiyal ağrı sendromu", "tetik nokta", "fibromiyalji", "osteoartrit", "gonartroz", "omuz sıkışma sendromu", "donuk omuz", "adeziv kapsülit", "rotator manşet", "lateral epikondilit", "karpal tünel sendromu", "plantar fasiit", "skolyoz", "postür", "TENS", "ultrason tedavisi", "sıcak paket", "soğuk uygulama", "kinezyo bant", "egzersiz programı", "germe egzersizleri", "güçlendirme egzersizleri", "denge eğitimi", "yürüme analizi", "ortez", "rehabilitasyon", "hemipleji rehabilitasyonu", "fizik tedavi seansı", "ekstrakorporeal şok dalga tedavisi", "proloterapi", "kuru iğneleme", "nöral terapi"],
  hatalar: [{"duyulan": ["miyo fasiyal"], "dogru": "miyofasiyal", "ekli": true}, {"duyulan": ["fibro miyalji"], "dogru": "fibromiyalji", "ekli": true}],
}

export default sozluk
