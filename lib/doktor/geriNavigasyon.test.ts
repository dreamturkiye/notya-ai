import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hastaBelgelerHref, hastaDosyaHref, hastaGoruntulemeHref } from './geriNavigasyon'

describe('geriNavigasyon', () => {
  it('hastaBelgelerHref opens Belgeler tab', () => {
    assert.equal(hastaBelgelerHref('p1'), '/dashboard/doktor/hastalar/p1?tab=belgeler')
  })
  it('ozet omits tab query', () => {
    assert.equal(hastaDosyaHref('p1'), '/dashboard/doktor/hastalar/p1')
    assert.equal(hastaDosyaHref('p1', 'ozet'), '/dashboard/doktor/hastalar/p1')
  })
  it('goruntuleme tab', () => {
    assert.equal(hastaGoruntulemeHref('p1'), '/dashboard/doktor/hastalar/p1?tab=goruntuleme')
  })
})
