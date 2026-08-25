import { ilacAra, normalize, editDistance, type IlacKaydi } from '../ilacArama'

// Shaped exactly like the importer's output, with ingredients attached.
const kayitlar: IlacKaydi[] = [
  { ad: 'AMOKSISILIN 500 MG 16 KAPSUL', marka: 'LARGOPEN', etkenMadde: 'Amoksisilin', sgk: true },
  { ad: 'AUGMENTIN BID 1000 MG 14 FTB', marka: 'AUGMENTIN', etkenMadde: 'Amoksisilin + Klavulanik asit', sgk: true },
  { ad: 'NORVASC 5 MG 30 TABLET', marka: 'NORVASC', etkenMadde: 'Amlodipin', sgk: true },
  { ad: 'PAROL 500 MG 20 TABLET', marka: 'PAROL', etkenMadde: 'Parasetamol', sgk: true },
  { ad: 'GLUCOPHAGE 1000 MG 100 FTB', marka: 'GLUCOPHAGE', etkenMadde: 'Metformin', sgk: true },
  { ad: 'LIPITOR 20 MG 30 FTB', marka: 'LIPITOR', etkenMadde: 'Atorvastatin', sgk: true },
  { ad: 'NEXIUM 40 MG 28 TABLET', marka: 'NEXIUM', etkenMadde: 'Esomeprazol', sgk: true },
  { ad: 'İBUFEN 400 MG 30 FTB', marka: 'İBUFEN', etkenMadde: 'İbuprofen', sgk: true },
]

const show = (q: string) => {
  const r = ilacAra(kayitlar, q, 3)
  const line = r.length
    ? r.map((x) => `${x.marka} [${x.eslesenAlan}/${x.skor}]`).join('  ·  ')
    : 'SONUÇ YOK'
  console.log(`  "${q}"`.padEnd(22) + '-> ' + line)
}

console.log('=== EXACT / BRAND ===')
;['largopen', 'Norvasc', 'PAROL'].forEach(show)

console.log('\n=== ETKEN MADDE (the new requirement) ===')
;['amoksisilin', 'amlodipin', 'metformin', 'parasetamol', 'atorvastatin'].forEach(show)

console.log('\n=== TYPOS / MISSPELLINGS ===')
;['amoksislin', 'amoxisilin', 'largopn', 'norvask', 'metfromin', 'atorvastatn', 'ibufen'].forEach(show)

console.log('\n=== TURKISH CASE + DIACRITICS ===')
;['İBUFEN', 'ibufen', 'IBUFEN', 'ibuprofen'].forEach(show)

console.log('\n=== SANITY: nonsense must not match ===')
;['zzzzzz', 'qwerty'].forEach(show)

console.log('\n=== normalize() ===')
for (const s of ['İBUFEN', 'Amoksisilin', 'ŞURUP', 'AMOXİSİLİN']) {
  console.log(`  ${s.padEnd(14)} -> ${normalize(s)}`)
}
console.log('\n  editDistance(amoksislin, amoksisilin) =', editDistance('amoksislin', 'amoksisilin'))
