import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { islemEslemeOku, islemKaynakKur } from './islemKaynagi'

const CSV = 'MBS Item Number,MBS Item Description,ACHI Code,ACHI Description,ACHI Edition\n23,"Professional attendance\nby a general practitioner",,,13\n30071,Skin lesion excision,"31205-00; 31205-01",Licensed text,13\n99999,Unmapped thing,,,13\n'

describe('islemKaynagi — MBS item to ACHI', () => {
  it('reads columns by header name, never the ACHI description', () => {
    const r = islemEslemeOku(CSV)
    assert.equal(r.length, 3)
    assert.deepEqual(r[1].achi, ['31205-00', '31205-01'])
    assert.ok(!JSON.stringify(r).includes('Licensed text'))
  })
  it('finds by item, ACHI code and words; an unmapped item says so', () => {
    const k = islemKaynakKur(CSV)
    assert.equal(k.hazir(), true)
    assert.equal(k.ara('30071')[0].achi[0].kod, '31205-00')
    assert.equal(k.ara('31205-01')[0].item, '30071')
    assert.equal(k.ara('excision')[0].item, '30071')
    assert.equal(k.ara('99999')[0].esleme, 'yok')
  })
  it('no file / no usable header = not ready', () => {
    assert.equal(islemKaynakKur(null).hazir(), false)
    assert.equal(islemKaynakKur('a,b\n1,2').hazir(), false)
  })
  it('the route checks the extension before the session and takes no patient id', () => {
    const r = readFileSync(new URL('../../../app/api/ulke/islem-kodlari/route.ulke.ts', import.meta.url), 'utf8')
    assert.ok(r.indexOf('uzanti?.islemKodlari') < r.indexOf('ulkeOturum(req)'))
    assert.ok(!/patientId|hastaId/.test(r))
  })
})
