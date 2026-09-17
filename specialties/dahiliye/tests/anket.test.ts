import { test } from 'node:test'
import assert from 'node:assert/strict'
import { anketSablonu, anketDogrula, anketiSoapa } from '../engines/anket'

test('şablon karta göre semptom; DM → glukoz ölçümü', () => {
  const s = anketSablonu(['ht', 'dm'])
  assert.ok(s.semptomlar.some((x) => x.kod === 'hipo')); assert.ok(s.olcumler.includes('glukoz'))
  assert.equal(anketSablonu(['ht']).olcumler.includes('glukoz'), false)
})

test('doğrulama: aralık dışı ölçümler atılır, bilinmeyen semptom yok sayılır, alarmlar', () => {
  const s = anketSablonu(['ht', 'dm'])
  const r = anketDogrula({ kb: [{ sbp: 150, dbp: 90 }, { sbp: 400, dbp: 90 }, { sbp: 185, dbp: 100 }], glukoz: [{ deger: 62 }], kilo: '82', kacirilanDoz: '1-2', semptomlar: ['gogus_agrisi', 'xss<script>'], sorular: 'a'.repeat(2000) }, s)
  assert.equal(r.girdi.kb!.length, 2); assert.equal(r.hatalar.length, 1); assert.equal(r.girdi.kilo, 82)
  assert.deepEqual(r.girdi.semptomlar, ['gogus_agrisi']); assert.equal(r.girdi.sorular!.length, 1000)
  assert.equal(r.alarmlar.length, 3)
  const soap = anketiSoapa(r.girdi, s, '2026-09-16', r.alarmlar)
  assert.match(soap, /Ev KB: 2 ölçüm, ortalama 168\/95/); assert.match(soap, /⚑ Alarm/); assert.match(soap, /kaçırılan doz 1-2/)
})
