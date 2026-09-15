import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cumulativeJ, PHOTO_DEVICES, SOLARIUM_FORBIDDEN } from '../engines/phototherapy-log'

describe('phototherapy-log', () => {
  it('cumulative J/cm2 sums NB-UVB sessions', () => {
    const raw = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'fototerapi-nbuvb.json'), 'utf8'))
    assert.equal(cumulativeJ(raw.sessions, 'nb-uvb-311'), 1.05)
  })

  it('solarium is not a device', () => {
    assert.equal(SOLARIUM_FORBIDDEN, true)
    assert.equal((PHOTO_DEVICES as readonly string[]).includes('solarium'), false)
  })
})
