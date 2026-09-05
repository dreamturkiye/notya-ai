import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  YASAMSAL_BULGULAR_BASLIK,
  yasamsalBulguOzeti,
  yasamsalBulguSatirlari,
} from './yasamsalBulgular'

describe('yasamsalBulgular', () => {
  it('formats clinic-style Turkish vital lines', () => {
    const lines = yasamsalBulguSatirlari({
      tansiyon: '128/78',
      nabiz: 72,
      spo2: 98,
      kilo: 71.4,
      ates: null,
    })
    assert.deepEqual(
      lines.map((l) => `${l.label}: ${l.value}`),
      ['Tansiyon: 128/78 mmHg', 'Nabız: 72/dk', 'SpO₂: %98', 'Kilo: 71,4 kg']
    )
  })

  it('exports the canonical section title', () => {
    assert.equal(YASAMSAL_BULGULAR_BASLIK, 'Yaşamsal Bulgular')
  })

  it('builds a compact summary string', () => {
    assert.equal(
      yasamsalBulguOzeti({ tansiyon: '128/78', nabiz: 72, spo2: 98, kilo: 71.4 }),
      'Tansiyon: 128/78 mmHg · Nabız: 72/dk · SpO₂: %98 · Kilo: 71,4 kg'
    )
  })
})
