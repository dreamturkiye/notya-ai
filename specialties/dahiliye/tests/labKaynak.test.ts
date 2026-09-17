import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { labOneriKaynaklari, labRaporKaynaklari, taniKaynagi } from '../engines/labKaynak'
import { REF_ACIKLAMA } from '../engines/dahiliye'

describe('labKaynak — rubric C4 for the shared lab report (dahiliye)', () => {
  it('every tanı gets a golden ref_code by ICD-10 chapter; unknown → HARRISON', () => {
    assert.equal(taniKaynagi({ ad: 'Tip 2 DM ile uyumlu', icd10: 'E11' }).ref, 'TEMD_DM2026')
    assert.equal(taniKaynagi({ ad: 'Prediyabet', icd10: 'R73.09' }).ref, 'TEMD_DM2026')
    assert.equal(taniKaynagi({ ad: 'Hiperkolesterolemi', icd10: 'e78.0' }).ref, 'TEMD_LIPID')
    assert.equal(taniKaynagi({ ad: 'Subklinik hipotiroidi', icd10: 'E03.9' }).ref, 'TEMD_TIROID2025')
    assert.equal(taniKaynagi({ ad: 'KBH', icd10: 'N18.3' }).ref, 'TIHUD2023')
    assert.equal(taniKaynagi({ ad: 'Demir eksikliği anemisi', icd10: 'D50.9' }).ref, 'TIHUD2023')
    assert.equal(taniKaynagi({ ad: 'Belirsiz', icd10: null }).ref, 'HARRISON')
  })
  it('öneri dipnotları abnormal groups only, deduplicated; all-normal panel → HARRISON fallback', () => {
    const d = labOneriKaynaklari([{ canonical_key: 'HbA1c', flag: 'H' }, { canonical_key: 'Glu', flag: 'H' }, { canonical_key: 'LDL', flag: 'normal' }, { canonical_key: 'K', flag: 'critical' }, { canonical_key: null, flag: 'H' }])
    assert.deepEqual(d.map((x) => x.ref), ['TEMD_DM2026', 'TIHUD2023'])
    assert.deepEqual(labOneriKaynaklari([{ canonical_key: 'LDL', flag: 'normal' }]).map((x) => x.ref), ['HARRISON'])
  })
  it('ref codes exist in REF_ACIKLAMA and notes carry no dose / book text', () => {
    const r = labRaporKaynaklari([{ canonical_key: 'TSH', flag: 'H' }, { canonical_key: 'Hb', flag: 'L' }], [{ ad: 'x', icd10: 'E11' }, { ad: 'y', icd10: 'I10' }, { ad: 'z', icd10: 'E66' }])
    for (const x of [...r.tanilar, ...r.oneri]) { assert.ok(x.ref in REF_ACIKLAMA, x.ref); assert.ok(!/\d+\s*(mg|mcg|µg|ünite|IU)\b/i.test(x.not), x.not); assert.ok(x.not.length < 120) }
    assert.equal(r.tanilar.length, 3); assert.deepEqual(r.oneri.map((x) => x.ref), ['TEMD_TIROID2025', 'TIHUD2023'])
  })
})
