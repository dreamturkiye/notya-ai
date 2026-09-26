import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pinKilitliMi, PIN_KILIT_MS } from './pinAuth'

describe('portal PIN kilidi', () => {
  it('bitiş anı gelmeden kilitli, sonra açık', () => {
    const simdi = Date.parse('2026-09-26T12:00:00Z')
    assert.equal(pinKilitliMi(null, simdi), false)
    assert.equal(pinKilitliMi(new Date(simdi + PIN_KILIT_MS).toISOString(), simdi), true)
    assert.equal(pinKilitliMi(new Date(simdi - 1).toISOString(), simdi), false)
  })

  it('sayaç veritabanında beş deneme ve 15 dakika', () => {
    const sql = readFileSync(join(__dirname, '../db/migrations/102_portal_pin_kilit.sql'), 'utf8')
    assert.match(sql, /yeni >= 5/)
    assert.match(sql, /interval '15 minutes'/)
    assert.match(sql, /REVOKE ALL ON FUNCTION portal_pin_hata\(text\) FROM PUBLIC/)
    assert.match(sql, /GRANT EXECUTE ON FUNCTION portal_pin_hata\(text\) TO service_role/)
  })
})
