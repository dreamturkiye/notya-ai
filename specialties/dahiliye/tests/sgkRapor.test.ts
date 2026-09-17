import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sgkRaporTaslagi, chaVascSkoru } from '../engines/sgkRapor'

const hasta = { adSoyad: 'QA Test', yas: 72, kadin: true }
const bugun = '2026-09-16'

test('HT şablonu: etken madde yalnız hasta_ilaclar; T.C. yok; iki yüksek ofis KB → kontrol tamam', () => {
  const r = sgkRaporTaslagi({ sablon: 'ht', hasta, bugun, ilaclar: [{ ad: 'Delix 5', etken: 'Ramipril', aktif: true }, { ad: 'Glifor', etken: 'Metformin', aktif: true }, { ad: 'Norvasc', etken: 'Amlodipin', aktif: false }], labs: { Kre: [{ ad: 'Kre', deger: 0.9, tarih: '2026-09-01' }] }, kbSerisi: [{ sbp: 150, dbp: 92, tarih: '2026-09-16' }, { sbp: 146, dbp: 88, tarih: '2026-08-20' }], htEvreHekim: 'ht_evre1' })
  assert.deepEqual(r.draft.etkenMaddeler, ['Ramipril'])
  assert.equal(r.draft.tcSon4, ''); assert.equal(r.draft.tani.icd10, 'I10'); assert.equal(r.draft.onerilen_sure_ay, 12)
  assert.equal(r.sutKontrol[0].tamam, true); assert.equal(r.eksikler.length, 0)
  assert.ok(r.dipnotlar.some((d) => d.ref === 'SGK'))
})

test('DM şablonu: HbA1c yoksa eksik; süre 24 ay ile sınırlı; reçete yoksa etken eksik', () => {
  const r = sgkRaporTaslagi({ sablon: 'dm', hasta, bugun, ilaclar: [], labs: {}, dmTip: 'T2', sureAy: 60 })
  assert.equal(r.draft.onerilen_sure_ay, 24); assert.equal(r.draft.tani.icd10, 'E11.9')
  assert.ok(r.eksikler.some((e) => /HbA1c/.test(e))); assert.ok(r.eksikler.some((e) => /Etken madde/.test(e)))
})

test('Statin: KVR kilidi yoksa eksik; eski lipid → kontrol false', () => {
  const r = sgkRaporTaslagi({ sablon: 'statin', hasta, bugun, ilaclar: [{ ad: 'Lipitor 20', etken: 'Atorvastatin', aktif: true }], labs: { LDL: [{ ad: 'LDL', deger: 168, tarih: '2025-12-01' }] } })
  assert.ok(r.eksikler.some((e) => /KVR/.test(e))); assert.equal(r.sutKontrol[0].tamam, false)
})

test('DOAK: CHA2DS2-VASc toplamı; mekanik kapak + DOAK engeli', () => {
  assert.equal(chaVascSkoru({ kky: false, ht: true, dm: true, inmeTia: false, vaskuler: false }, 72, true), 4)
  assert.equal(chaVascSkoru({ kky: true, ht: true, dm: true, inmeTia: true, vaskuler: true }, 80, true), 9)
  const r = sgkRaporTaslagi({ sablon: 'doak', hasta, bugun, ilaclar: [{ ad: 'Eliquis', etken: 'Apiksaban', aktif: true }], labs: {}, doakEndikasyon: 'af', mekanikKapak: true, chaVasc: { kky: false, ht: true, dm: false, inmeTia: false, vaskuler: false } })
  assert.equal(r.draft.tani.icd10, 'I48'); assert.equal(r.chaVascSkor, 3)
  assert.ok(r.eksikler.some((e) => /MEKANİK KAPAK/.test(e))); assert.ok(r.eksikler.some((e) => /kreatinin/.test(e)))
  assert.ok(!/mg\b/.test(JSON.stringify(r.draft)))
})
