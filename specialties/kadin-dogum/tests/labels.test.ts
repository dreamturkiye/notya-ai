import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  KD_EPISODE_STATUS,
  KD_GA_LOCK,
  KD_IDC,
  KD_PLURALITY,
  KD_RISK_CLASS,
  KD_USG_KIND,
  KD_WINDOW_STATUS,
  kdLabel,
  looksLikeRecordId,
} from '../ui/labels'
import { oncekiGebelikDurumMetni } from '../../../lib/clinical/gebelikDurum'
import { TEST_WINDOWS } from '../engines/test-windows'

describe('kd clinician labels', () => {
  it('maps internal enums to Turkish clinician copy', () => {
    assert.equal(kdLabel(KD_EPISODE_STATUS, 'gebe'), 'Aktif gebelik')
    assert.equal(kdLabel(KD_RISK_CLASS, 'dusuk'), 'Düşük')
    assert.equal(kdLabel(KD_PLURALITY, 'singleton'), 'Tekil')
    assert.equal(kdLabel(KD_IDC, 'not_tested'), 'Test edilmedi')
    assert.equal(kdLabel(KD_WINDOW_STATUS, 'overdue'), 'Gecikmiş')
    assert.equal(kdLabel(KD_WINDOW_STATUS, 'open'), 'Açık')
    assert.equal(kdLabel(KD_WINDOW_STATUS, 'not_yet'), 'Henüz değil')
    assert.equal(kdLabel(KD_GA_LOCK, 'sat'), 'SAT')
    assert.equal(kdLabel(KD_USG_KIND, 'ayrintili_18_22'), '18–22. hafta ayrıntılı USG')
    assert.equal(oncekiGebelikDurumMetni('gebe'), 'Aktif gebelik')
    assert.notEqual(oncekiGebelikDurumMetni('gebe'), 'Sonlandı')
  })

  it('tarama penceresi titles keep abbreviations but not English fragments', () => {
    for (const w of TEST_WINDOWS) {
      assert.equal(/\bindicated\b/i.test(w.label), false, w.label)
      assert.equal(/\bif protocol\b/i.test(w.label), false, w.label)
      assert.equal(/\bif Rh/i.test(w.label), false, w.label)
    }
  })

  it('does not use raw UUIDs as primary labels', () => {
    const id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    assert.equal(looksLikeRecordId(id), true)
    assert.equal(kdLabel(KD_EPISODE_STATUS, id, 'Gebe kaydı'), 'Gebe kaydı')
  })
})
