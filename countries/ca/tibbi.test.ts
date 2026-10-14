/**
 * CANADA — records that were opened on 14 October 2026 and not copied onto a screen.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CA_NARKOTIK, CA_NARKOTIK_ANAHTARLARI } from './araclar/tanimlar'
import { CA_ETKILESIM } from './kayit/etkilesim'
import { CA_LABORATUVAR } from './kayit/laboratuvar'
import { CA_KAYIT_SISTEMLERI } from './kayit/sistemler'
import { CA_TANI } from './kayit/tani'

describe('ca codes, interactions, laboratory units, and prescribing link', () => {
  it('no interaction pair, no diagnosis code, and no laboratory range was added', () => {
    assert.equal(CA_ETKILESIM.bagli, false)
    assert.equal(CA_ETKILESIM.sozlesmeGerekli, true)
    assert.deepEqual([...CA_ETKILESIM.juftlar], [])
    assert.deepEqual([...CA_TANI.satirlar], [])
    assert.equal(CA_TANI.ekranda, false)
    assert.equal(CA_LABORATUVAR.birimler.kreatinin, 'umol/L')
    assert.equal(CA_LABORATUVAR.birimler.hemoglobin, 'g/L')
    assert.deepEqual([...CA_LABORATUVAR.paneller], [])
    assert.deepEqual([...CA_LABORATUVAR.araliklar], [])
  })

  it('the narcotic record has the five points the regulation names and nothing else', () => {
    assert.equal(CA_NARKOTIK.anahtar, 'ca-narcotic-note')
    assert.deepEqual(CA_NARKOTIK.alanlar.map((a) => a.anahtar), [...CA_NARKOTIK_ANAHTARLARI])
    const bos = CA_NARKOTIK.hesapla({})
    assert.equal(bos.tamam, false)
    const dolu = CA_NARKOTIK.hesapla({ yazili: true, imza: true, tarihli: true, miktar: true, ad: true })
    assert.equal(dolu.tamam, true)
    assert.equal(dolu.sayilar.find((s) => s.anahtar === 'isaretli')?.deger, 5)
  })

  it('PrescribeIT stays unconnected', () => {
    assert.equal(CA_KAYIT_SISTEMLERI.length, 1)
    assert.equal(CA_KAYIT_SISTEMLERI[0].bagli, false)
    assert.equal(CA_KAYIT_SISTEMLERI[0].anahtar, 'prescribeit')
  })
})
