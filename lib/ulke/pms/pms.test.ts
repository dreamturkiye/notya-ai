/**
 * AU-GAP-CLOSE-02 — PMS adapter never fakes Synced; queue helpers refuse bad targets.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pmsAdapterEtkin, pmsDogrula, pmsYaz } from './adapter'
import { pmsSaglayiciMi, PMS_SAGLAYICILAR } from './tipler'

describe('pms adapter honesty', () => {
  it('lists the three AU practice systems and refuses others', () => {
    for (const s of PMS_SAGLAYICILAR) assert.equal(pmsSaglayiciMi(s), true)
    assert.equal(pmsSaglayiciMi('tyro'), false)
    assert.equal(pmsSaglayiciMi('synced'), false)
  })

  it('adapter is off by default and never returns success without the env flag', async () => {
    for (const s of PMS_SAGLAYICILAR) {
      assert.equal(pmsAdapterEtkin(s, {}), false)
      assert.deepEqual(await pmsYaz(s, { anahtar: 'x'.repeat(20) }, {
        surum: 't', ulke: 'au', notId: 'n', onayTarihi: null, sablon: 'genel',
        not: { s: '', o: '', a: '', p: '' }, uyari: 't',
      }, {}), { tamam: false, kod: 'PARTNER_YOK' })
      assert.deepEqual(await pmsDogrula(s, { anahtar: 'x'.repeat(20) }, {}), { tamam: false, kod: 'PARTNER_YOK' })
    }
  })

  it('even with the flag on, stub still returns PARTNER_YOK until a real adapter lands', async () => {
    const ortam = { NOTYA_PMS_BEST_PRACTICE_ETKIN: '1' }
    assert.equal(pmsAdapterEtkin('best-practice', ortam), true)
    assert.deepEqual(await pmsYaz('best-practice', { anahtar: 'x'.repeat(20) }, {
      surum: 't', ulke: 'au', notId: 'n', onayTarihi: null, sablon: 'genel',
      not: { s: '', o: '', a: '', p: '' }, uyari: 't',
    }, ortam), { tamam: false, kod: 'PARTNER_YOK' })
  })
})
