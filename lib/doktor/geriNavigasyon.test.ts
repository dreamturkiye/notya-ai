import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  hastaBelgelerHref,
  hastaDosyaHref,
  hastaGoruntulemeHref,
  hastaMuayeneHref,
  seansGeriHref,
  notDuzenleGeriHref,
  onamGeriHref,
  ayarlarGeriHref,
  DOKTOR_ANA,
  HASTA_LISTESI,
  AYARLAR,
} from './geriNavigasyon'

describe('geriNavigasyon', () => {
  it('hastaBelgelerHref opens Belgeler tab', () => {
    assert.equal(hastaBelgelerHref('p1'), '/dashboard/doktor/hastalar/p1?tab=belgeler')
  })
  it('ozet omits tab query', () => {
    assert.equal(hastaDosyaHref('p1'), '/dashboard/doktor/hastalar/p1')
    assert.equal(hastaDosyaHref('p1', 'ozet'), '/dashboard/doktor/hastalar/p1')
  })
  it('goruntuleme + muayene tabs', () => {
    assert.equal(hastaGoruntulemeHref('p1'), '/dashboard/doktor/hastalar/p1?tab=goruntuleme')
    assert.equal(hastaMuayeneHref('p1'), '/dashboard/doktor/hastalar/p1?tab=muayene')
  })
  it('seansGeriHref prefers patient chart', () => {
    assert.equal(seansGeriHref('p1'), '/dashboard/doktor/hastalar/p1')
    assert.equal(seansGeriHref(null), DOKTOR_ANA)
  })
  it('notDuzenleGeriHref goes to Muayene Geçmişi not yazdir', () => {
    assert.equal(notDuzenleGeriHref('p1'), '/dashboard/doktor/hastalar/p1?tab=muayene')
    assert.equal(notDuzenleGeriHref(null), HASTA_LISTESI)
  })
  it('onam + ayarlar parents', () => {
    assert.equal(onamGeriHref('p1'), '/dashboard/doktor/hastalar/p1?tab=gebelik')
    assert.equal(ayarlarGeriHref(), AYARLAR)
  })
})
