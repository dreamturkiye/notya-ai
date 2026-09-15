import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DERM_MORPHOLOGY,
  DERM_PATCH_STATUS,
  DERM_PHOTO_KIND,
  DERM_VISION_STATUS,
  bolgeEtiketi,
  dermLabel,
  looksLikeRecordId,
} from '../ui/labels'
import { GOP_BLOCK, GOP_NA_PREGNANCY, gopIsotretinoin } from '../engines/gop-isotretinoin'

describe('derm clinician labels', () => {
  it('maps internal enums to Turkish clinician copy', () => {
    assert.equal(dermLabel(DERM_PHOTO_KIND, 'klinik_genel'), 'Klinik genel fotoğraf')
    assert.equal(dermLabel(DERM_VISION_STATUS, 'draft'), 'Taslak')
    assert.equal(dermLabel(DERM_PATCH_STATUS, 'open_d2'), 'D2 okuma zamanı')
    assert.equal(dermLabel(DERM_MORPHOLOGY, 'unspecified'), 'Belirtilmedi')
    assert.equal(bolgeEtiketi('unspecified'), 'Bölge belirtilmedi')
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    assert.equal(looksLikeRecordId(id), true)
    assert.equal(dermLabel(DERM_PHOTO_KIND, id, 'Görüntü'), 'Görüntü')
  })

  it('keeps GÖP pregnancy blocks female-only', () => {
    const incomplete = {
      two_contraception: false,
      hcg_iso: null,
      hcg_negative: false,
      cycle_day: null,
      rx_days: 30,
      start_iso: '2026-04-10',
      today_iso: '2026-04-10',
    }
    const female = gopIsotretinoin({ ...incomplete, sex: 'female' })
    assert.equal(female.allowed, false)
    if (!female.allowed) {
      assert.ok(female.blocks.includes(GOP_BLOCK.twoContraception))
      assert.ok(female.blocks.includes(GOP_BLOCK.negativeHcg))
      assert.ok(female.blocks.includes(GOP_BLOCK.cycleDay))
      assert.equal(female.blocks.some((b) => /two contraception|beta-hCG|cycle day/i.test(b)), false)
    }

    const male = gopIsotretinoin({ ...incomplete, sex: 'male' })
    assert.equal(male.allowed, true)
    assert.deepEqual(male.notApplicable, [...GOP_NA_PREGNANCY])
    assert.equal('blocks' in male, false)
  })
})
