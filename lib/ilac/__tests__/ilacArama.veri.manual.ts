/**
 * NOTYA-ILAC-07 — runs the real search over the REAL data file, not fixtures.
 *   npx --yes tsx lib/ilac/__tests__/ilacArama.veri.manual.ts
 * The fixture test (ilacArama.manual.ts) proves the algorithm; this one proves the dataset.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ilacAra, type IlacKaydi } from '../ilacArama'

const veri = JSON.parse(readFileSync(path.join(process.cwd(), 'data', 'sgk-ilaclar.json'), 'utf8'))
const kayitlar: IlacKaydi[] = veri.ilaclar
const dolu = kayitlar.filter((k) => k.etkenMadde).length
console.log(`kayıt: ${kayitlar.length} · etkenMadde dolu: ${dolu} (${((100 * dolu) / kayitlar.length).toFixed(1)}%) · TİTCK: ${veri.titck}`)

const goster = (q: string) => {
  const r = ilacAra(kayitlar, q, 5)
  const markalar = [...new Set(r.map((x) => `${x.marka} [${x.eslesenAlan}/${x.skor}]`))]
  console.log(`  "${q}"`.padEnd(24) + '-> ' + (markalar.length ? markalar.join('  ·  ') : 'SONUÇ YOK'))
}

console.log('\n=== ETKEN MADDE — was SONUÇ YOK before NOTYA-ILAC-07 ===')
;['atorvastatin', 'amoksisilin', 'metformin', 'parasetamol', 'amlodipin', 'esomeprazol', 'ibuprofen', 'sertralin'].forEach(goster)
console.log('\n=== ETKEN MADDE with typos ===')
;['atorvastatn', 'metfromin', 'amoksislin'].forEach(goster)
console.log('\n=== BRAND still first when the doctor types the brand ===')
;['lipitor', 'parol', 'augmentin', 'nurofen'].forEach(goster)

const ator = kayitlar.filter((k) => /atorvastatin/i.test(k.etkenMadde || ''))
console.log(`\natorvastatin-containing records: ${ator.length}, brands: ${[...new Set(ator.map((k) => k.marka))].slice(0, 12).join(', ')}…`)
const kaynak = kayitlar.reduce((m, k) => ((m[k.etkenKaynak || 'yok'] = (m[k.etkenKaynak || 'yok'] || 0) + 1), m), {} as Record<string, number>)
console.log('etkenKaynak:', kaynak)

// Brand-level grouping in /api/doktor/ilac-ara takes etkenMadde from the first pack it sees.
// Flag brands whose packs disagree on ingredient, so that assumption is checked rather than hoped.
const markaEtken = new Map<string, Set<string>>()
for (const k of kayitlar) {
  if (!k.etkenMadde) continue
  const m = (k.marka || k.ad).toLocaleUpperCase('tr')
  if (!markaEtken.has(m)) markaEtken.set(m, new Set())
  markaEtken.get(m)!.add(k.etkenMadde.toLocaleLowerCase('tr'))
}
const celisen = [...markaEtken.entries()].filter(([, s]) => s.size > 1)
console.log(`\nbrands whose packs carry different etkenMadde: ${celisen.length} / ${markaEtken.size}`)
for (const [m, s] of celisen.slice(0, 15)) console.log(`  ${m}: ${[...s].join(' | ')}`)
