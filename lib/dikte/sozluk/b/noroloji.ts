/**
 * DIKTE-TIBBI-01 — Nöroloji dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["nörolojik muayene", "bilinç", "oryantasyon", "kraniyal sinirler", "pupil", "ışık refleksi", "nistagmus", "fasiyal paralizi", "periferik fasiyal paralizi", "hemiparezi", "hemipleji", "parapareji", "kas gücü", "tonus", "spastisite", "rijidite", "tremor", "bradikinezi", "ataksi", "dismetri", "romberg", "derin tendon refleksleri", "babinski", "duyu muayenesi", "hipoestezi", "parestezi", "nöropati", "polinöropati", "karpal tünel", "migren", "aura", "gerilim tipi baş ağrısı", "küme baş ağrısı", "epilepsi", "nöbet", "status epileptikus", "elektroensefalografi", "elektromiyografi", "manyetik rezonans", "inme", "iskemik inme", "transient iskemik atak", "serebrovasküler", "demans", "alzheimer", "parkinson", "multipl skleroz", "miyastenia gravis", "vertigo", "levetirasetam", "valproat", "karbamazepin", "lamotrijin", "gabapentin", "pregabalin", "levodopa", "donepezil", "topiramat", "triptan"],
  hatalar: [{"duyulan": ["elektro ensefalografi"], "dogru": "elektroensefalografi", "ekli": true}, {"duyulan": ["hemi parezi"], "dogru": "hemiparezi", "ekli": true}, {"duyulan": ["parkin son"], "dogru": "parkinson", "ekli": true}],
}

export default sozluk
