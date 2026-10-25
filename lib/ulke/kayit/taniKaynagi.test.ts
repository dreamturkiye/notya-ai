import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { acikKaynakKur, eslemeOku, lisansliKaynak, whoListesiOku } from './taniKaynagi'
import { taniHazirMi } from '@/components/ulke/uygulama/taniHazir'

// TEST FIXTURES ONLY: made-up rows to exercise the code. None of this is clinical data and none is shipped.
const WHO = ['T01.0\tTEST alpha condition', 'T01.1;TEST beta condition', 'T02\tTEST gamma illness', 'junk line', 'T9.1\tbad code'].join('\n')
const ESL = 'icd10,icd10am,edition,note\nT01.0,TAM01.0,1,x\nT01.0,TAM01.00,13,x\nT02,TAM02,13,x\n'

describe('taniKaynagi (open provider)', () => {
  const k = acikKaynakKur(WHO, ESL)
  it('reads only plausible codes', () => { assert.equal(whoListesiOku(WHO).length, 3) })
  it('mapping needs its header', () => { assert.equal(eslemeOku('a,b\n1,2').length, 0); assert.equal(eslemeOku(ESL).length, 3) })
  it('search by WHO code, with or without dot, any case', () => {
    assert.equal(k.ara('t01.0')[0].kod, 'T01.0')
    assert.equal(k.ara('T010')[0].kod, 'T01.0')
    assert.deepEqual(k.ara('T01').map((x) => x.kod), ['T01.0', 'T01.1'])
  })
  it('search by text (all words, accent-insensitive)', () => { assert.deepEqual(k.ara('beta CONDITION').map((x) => x.kod), ['T01.1']) })
  it('search by mapped ICD-10-AM code', () => { assert.equal(k.ara('TAM02')[0].kod, 'T02') })
  it('mapping labels: var with editions, yok without', () => {
    assert.equal(k.kodu('T01.0')?.esleme, 'var')
    assert.deepEqual(k.kodu('T01.0')?.eslemeler.map((e) => e.surum), ['1', '13'])
    assert.equal(k.kodu('T01.1')?.esleme, 'yok')
    assert.equal(k.kodu('T01.1')?.eslemeler.length, 0)
  })
  it('too short a term returns nothing; unknown code returns null', () => { assert.deepEqual(k.ara('T'), []); assert.equal(k.kodu('Z99'), null) })
  it('no files = not ready (the tile stays hidden)', () => {
    assert.equal(acikKaynakKur(null, null).hazir(), false)
    assert.equal(acikKaynakKur(WHO, null).ara('T02')[0].esleme, 'yok')
    assert.equal(lisansliKaynak.hazir(), false)
  })
  it('no network: the provider reads files only', () => {
    const kaynak = readFileSync(new URL('./taniKaynagi.ts', import.meta.url), 'utf8')
    assert.equal(/\bfetch\(|https?:\/\/[^\s'"]*\/(?!\*)/.test(kaynak.replace(/\/\*[\s\S]*?\*\//g, '')), false)
  })
  it('tile shows only on an explicit hazir:true', () => {
    assert.equal(taniHazirMi({ hazir: true }), true)
    for (const v of [{ hazir: false }, {}, null, 'x', { hazir: 'true' }]) assert.equal(taniHazirMi(v), false)
  })
  it('route is country-gated, session-first, rate-limited and takes no patient id', () => {
    const r = readFileSync(new URL('../../../app/api/ulke/tani-kodlari/route.ulke.ts', import.meta.url), 'utf8')
    assert.ok(r.indexOf('uzanti?.taniKodlari') < r.indexOf('ulkeOturum(req)'))
    assert.ok(r.indexOf('ulkeOturum(req)') < r.indexOf('taniKaynagi('))
    assert.ok(r.includes('kovaKotasiKullan'))
    assert.equal(/hasta|patient/i.test(r.replace(/\/\*[\s\S]*?\*\//g, '')), false)
  })
})
