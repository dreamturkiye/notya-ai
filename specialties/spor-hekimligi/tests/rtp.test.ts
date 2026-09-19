import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rtpDegerlendir, sonrakiRtpGun, RTP_BASAMAKLAR, basamakGecerliMi } from '@/specialties/spor-hekimligi/engines/rtp'

describe('SPOR-HEKIMLIGI-EXCEPTIONAL-01 RTP basamak', () => {
  it('has 6 stages 0–5', () => {
    assert.equal(RTP_BASAMAKLAR.length, 6)
    assert.ok(basamakGecerliMi(0))
    assert.ok(basamakGecerliMi(5))
    assert.equal(basamakGecerliMi(6), false)
  })

  it('summary is decision support and never claims return diagnosis', () => {
    const s = rtpDegerlendir(3)
    assert.ok(!('hata' in s))
    assert.match(s.ozet, /karar desteği/)
    assert.match(s.ozet, /hekimin/)
    assert.doesNotMatch(s.ozet, /tanı kondu|ACL|konküzyon tanısı/i)
  })

  it('rejects out-of-range basamak', () => {
    const s = rtpDegerlendir(9)
    assert.ok('hata' in s)
  })

  it('control calendar tightens at early stages', () => {
    assert.ok(sonrakiRtpGun(0) <= sonrakiRtpGun(5))
  })
})
