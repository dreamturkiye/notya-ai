import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kohortSatirlari, kohortFiltre, recallMesaji } from '../engines/kohort'
import { frailSkoru, dusmeRiski, phq2Skoru, nudgeListesi } from '../engines/nudge'
import { vizitSeridi } from '../engines/serit'

const bugun = '2026-09-16'
const h = (x: Partial<Parameters<typeof kohortSatirlari>[0][0]>) => ({ patientId: 'p', ad: 'A', hba1c: null, kbHedefteMi: null, ldl: null, ldlHedef: null, egfr: null, gorevler: [], sonVizit: '2026-09-01', portalVar: true, ...x })

test('kohort bayrakları ve öncelik; bayraksız hasta listelenmez', () => {
  const r = kohortSatirlari([h({ patientId: '1', ad: 'Bora', hba1c: 9.4, egfr: 40 }), h({ patientId: '2', ad: 'Ada', ldl: 120, ldlHedef: 70, gorevler: [{ kaynak: 'asi', kod: 'asi_grip', due: '2026-09-01' }, { kaynak: 'ilac_izlem', kod: 'izlem_metformin', due: '2026-08-01' }] }), h({ patientId: '3', ad: 'Cem' }), h({ patientId: '4', ad: 'Deniz', sonVizit: '2026-01-01' })], bugun)
  assert.deepEqual(r.map((x) => x.patientId), ['1', '2', '4'])
  assert.deepEqual(r[0].bayraklar.sort(), ['egfr_45', 'hba1c_9']); assert.deepEqual(r[1].bayraklar.sort(), ['gecikmis_asi', 'gecikmis_izlem', 'ldl_hedef_disi'])
  assert.equal(kohortFiltre(r, ['vizit_6ay']).length, 1)
})

test('recall mesajı klinik değer içermez', () => {
  const m = recallMesaji(['hba1c_9', 'gecikmis_asi', 'vizit_6ay'])
  assert.match(m.metin, /kontrol muayenesi, takip tahlilleri, aşı/); assert.ok(!/HbA1c|\d/.test(m.metin))
})

test('FRAIL, düşme, PHQ-2', () => {
  assert.equal(frailSkoru({ yorgunluk: true, direnc: true, kilo: true }).sinif, 'kirilgan'); assert.equal(frailSkoru({ yorgunluk: true }).sinif, 'on_kirilgan'); assert.equal(frailSkoru({}).sinif, 'saglam')
  assert.equal(dusmeRiski({ endise: true }).pozitif, true)
  assert.equal(phq2Skoru({ ilgi: 2, cokkunluk: 1 }).pozitif, true); assert.equal(phq2Skoru({ ilgi: 1, cokkunluk: 1 }).pozitif, false); assert.equal(phq2Skoru({ ilgi: 9, cokkunluk: 9 }).skor, 6)
})

test('nudge listesi: ≥65 frail+düşme, kronik PHQ-2, KB teknik; yıllık tekrar', () => {
  assert.deepEqual(nudgeListesi({ yas: 70, kronikKart: true, sonFrail: null, sonDusme: '2026-03-01', sonPhq2: null, kbHedefDisi: true, kbTeknikOnay: false, bugun }).map((n) => n.kod), ['kb_teknik', 'frail', 'phq2'])
  assert.equal(nudgeListesi({ yas: 50, kronikKart: false, sonFrail: null, sonDusme: null, sonPhq2: null, kbHedefDisi: true, kbTeknikOnay: true, bugun }).length, 0)
})

test('şerit: teknik doğrulanmadan hedef dışı KB "kötü" gösterilmez', () => {
  const temel = { bugun, hba1c: null, ldl: null, egfr: null, gorevler: [], planlar: [], kirmizi: [] }
  const a = vizitSeridi({ ...temel, kb: { sbp: 150, dbp: 95, tarih: bugun, hedefteMi: false, teknikOnay: false } })
  assert.equal(a.chips[0].durum, 'dikkat'); assert.match(a.chips[0].alt!, /tekniğini/)
  assert.equal(vizitSeridi({ ...temel, kb: { sbp: 150, dbp: 95, tarih: bugun, hedefteMi: false, teknikOnay: true } }).chips[0].durum, 'kotu')
  assert.equal(vizitSeridi({ ...temel, kb: { sbp: 150, dbp: 95, tarih: bugun, hedefteMi: false } }).chips[0].durum, 'kotu')
})
