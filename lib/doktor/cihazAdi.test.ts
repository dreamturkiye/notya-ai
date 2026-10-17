import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cihazAdi } from './cihazAdi'

describe('cihazAdi', () => {
  const vaka: Array<[string, string]> = [
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', 'Safari · iPhone'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1', 'Chrome · iPhone'],
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36', 'Chrome · Android telefon'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0', 'Edge · Windows'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15', 'Safari · Mac'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0', 'Firefox · Windows'],
  ]
  for (const [ua, beklenen] of vaka) it(beklenen, () => assert.equal(cihazAdi(ua), beklenen))
  it('boş / tanınmayan', () => {
    assert.equal(cihazAdi(''), 'Bilinmeyen cihaz')
    assert.equal(cihazAdi(null), 'Bilinmeyen cihaz')
    assert.equal(cihazAdi('curl/8'), 'Tarayıcı · Bilinmeyen sistem')
  })
})
