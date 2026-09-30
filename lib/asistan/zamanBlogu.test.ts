import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isoGun, zamanBlogu, zamanMetni } from './zamanBlogu'

describe('zamanBlogu — the model clock in the doctor timezone', () => {
  // 2026-09-30T00:30Z = 29 Eylül 20:30 in New York, 30 Eylül 03:30 in Istanbul
  const t = new Date('2026-09-30T00:30:00Z')
  it('US doctor: 29 Eylül, TRT doctor: 30 Eylül', () => {
    assert.equal(zamanMetni('America/New_York', t), '29 Eylül 2026 Salı, 20:30')
    assert.equal(zamanMetni('Europe/Istanbul', t), '30 Eylül 2026 Çarşamba, 03:30')
    assert.equal(isoGun('America/New_York', t), '2026-09-29')
    assert.equal(isoGun('Europe/Istanbul', t), '2026-09-30')
  })
  it('block names the date, the ISO day and the rule; unknown tz falls back to TRT', () => {
    const b = zamanBlogu('America/New_York', t)
    assert.match(b, /ŞU AN: 29 Eylül 2026 Salı, 20:30 \(America\/New_York; ISO 2026-09-29\)/)
    assert.match(b, /başka bir "bugün" varsayma/)
    assert.equal(isoGun('Mars/Olympus', t), '2026-09-30')
  })
})
