import { pseudonymize, restore } from '../pseudonymize'

// Turkish given names that are ALSO clinical or common words. If substitution is not
// boundary-aware, redacting the name corrupts the medicine.
const cases: [string, string, string][] = [
  ['Kan Yılmaz',    'Hastanın kan basıncı 140/90. Kan şekeri yüksek. Tam kan sayımı istendi.', 'kan = blood'],
  ['Ali Demir',     'Kalsiyum normal, anormallik yok, kaliteli uyku bildiriyor.',              'ali inside kalsiyum/anormallik/kaliteli'],
  ['Can Öztürk',    'Hasta canlı ve bilinci açık. Kan kaybı yok.',                             'can inside canlı'],
  ['Deniz Ak',      'Akciğer sesleri doğal. Akut batın yok. Ak nokta görülmedi.',              'ak inside Akciğer/Akut'],
  ['Nur Şahin',     'Nurofen kullanıyor. Nüks yok.',                                           'nur inside Nurofen'],
  // NOTYA-PSEUDO-05: 4+ letter names that are ordinary words. None of these were on the old
  // hand list, and each would have had the clinical word itself rewritten to [HASTA_n].
  ['Ayşe Demir',    'Demir eksikliği anemisi. Demir preparatı başlandı.',                     'demir = iron (surname)'],
  ['Sedef Kaya',    'Sedef hastalığı öyküsü var, dizlerde sedef plağı.',                     'sedef = psoriasis'],
  ['Ateş Koç',       'Ateş 38.5, ateş düşürücü verildi.',                                    'ateş = fever'],
  ['Mehmet Uzun',   'Uzun süreli steroid kullanımı. Uzun QT yok.',                            'uzun = long (surname)'],
  ['Fatma Şeker',   'Şeker hastalığı tanısı. Açlık şeker 180.',                                 'şeker = sugar/diabetes'],
  ['Zeynep Küçük',  'Küçük bir lezyon izlendi. Küçük abdest normal.',                         'küçük = small (surname)'],
  ['Hasan Beyaz',   'Beyaz küre 12.000. Beyaz akıntı tarif ediyor.',                           'beyaz = white (surname)'],
  ['Damla Yüksek',  'Yüksek tansiyon. Göz damlası 2 damla.',                                  'yüksek = high, damla = drop'],
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

console.log('\n=== DICTIONARY-WORD NAME, FULL FORM (must still redact the full name) ===')
const d = pseudonymize('Ayşe Demir 52 yaşında. Demir eksikliği mevcut.', ['Ayşe Demir'])
console.log(d.text)
console.log('full name removed:', !/Ayşe Demir/.test(d.text), '| bare Ayşe removed:', !/Ayşe/.test(d.text), '| clinical demir intact:', /Demir eksikliği/.test(d.text))
console.log('\ncorrupted cases:', broken, '/', cases.length)
