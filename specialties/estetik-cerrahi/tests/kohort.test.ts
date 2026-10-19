import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { vadeKohort } from '../engines/kohort'

describe('estetik-cerrahi kohort', () => {
  it('geciken vade bu dalın etiketini taşır; greft ve dB düşer', () => {
    const s = vadeKohort([
      { iso: '2026-10-01', ad: 'Kontrol' },
      { iso: '2026-10-19', ad: 'Bugün' },
      { iso: '2026-10-22', ad: 'Yakın' },
      { iso: '2026-12-01', ad: 'Uzak' },
      { iso: '2026-10-02', ad: '3200 greft' },
      { iso: '2026-10-03', ad: '40 dB' },
    ], '2026-10-19')
    assert.equal(s.find((x) => x.vade === '2026-10-01')?.durum, 'gecikti')
    assert.equal(s.find((x) => x.vade === '2026-10-19')?.durum, 'bugun')
    assert.equal(s.find((x) => x.vade === '2026-10-22')?.durum, 'yaklasiyor')
    assert.equal(s.some((x) => x.vade === '2026-12-01'), false)
    assert.equal(s.some((x) => /greft|dB/i.test(x.ozet)), false)
    assert.match(s[0].ozet, /Ameliyat/)
  })
})
