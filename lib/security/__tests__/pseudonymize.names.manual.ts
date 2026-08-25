import { pseudonymize, restore } from '../pseudonymize'

// Turkish given names that are ALSO clinical or common words. If substitution is not
// boundary-aware, redacting the name corrupts the medicine.
const cases: [string, string, string][] = [
  ['Kan Yılmaz',    'Hastanın kan basıncı 140/90. Kan şekeri yüksek. Tam kan sayımı istendi.', 'kan = blood'],
  ['Ali Demir',     'Kalsiyum normal, anormallik yok, kaliteli uyku bildiriyor.',              'ali inside kalsiyum/anormallik/kaliteli'],
  ['Can Öztürk',    'Hasta canlı ve bilinci açık. Kan kaybı yok.',                             'can inside canlı'],
  ['Deniz Ak',      'Akciğer sesleri doğal. Akut batın yok. Ak nokta görülmedi.',              'ak inside Akciğer/Akut'],
  ['Nur Şahin',     'Nurofen kullanıyor. Nüks yok.',                                           'nur inside Nurofen'],
]

let broken = 0
for (const [name, clinical, why] of cases) {
  const { text, map } = pseudonymize(clinical, [name])
  const corrupted = text !== clinical && !/\[HASTA_\d+\]/.test(clinical)
  const clinicalWordsLost = /\[HASTA_\d+\]/.test(text)
  console.log('\n--- ' + name + '  (' + why + ')')
  console.log('  in : ' + clinical)
  console.log('  out: ' + text)
  if (clinicalWordsLost) { console.log('  ** CLINICAL TEXT CORRUPTED **'); broken++ }
  else console.log('  ok: clinical text intact')
  // round-trip must return the original
  const back = restore(text, map)
  if (back !== clinical) console.log('  ** ROUND TRIP FAILED **')
}

console.log('\n\n=== REAL NAME, NORMAL NOTE (must still redact) ===')
const { text, map } = pseudonymize(
  'Ahmet Yılmaz 47 yaşında. Ahmet bey bel ağrısı tarif ediyor. TC 12345678901.',
  ['Ahmet Yılmaz'])
console.log(text)
console.log('name removed:', !/Ahmet|Yılmaz/.test(text), '| tckn removed:', !/12345678901/.test(text))
console.log('\ncorrupted cases:', broken, '/', cases.length)
