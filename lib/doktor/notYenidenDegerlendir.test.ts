import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  NOT_YENIDEN_DEGERLENDIR_ISTEK,
  klinikNotImzasi,
} from './notYenidenDegerlendir'

describe('notYenidenDegerlendir', () => {
  it('asks Ayşe to rebuild suggestions from the current note', () => {
    assert.match(NOT_YENIDEN_DEGERLENDIR_ISTEK, /yeniden değerlendir/i)
    assert.match(NOT_YENIDEN_DEGERLENDIR_ISTEK, /ICD-10/)
  })

  it('changes clinical signature when SOAP or vitals change', () => {
    const a = klinikNotImzasi({
      basvuru: 'rutin izlem',
      vitaller: { boy: '160' },
      subjektif: 's1',
      objektif: 'o1',
      degerlendirme: 'd1',
      plan: 'p1',
    })
    const b = klinikNotImzasi({
      basvuru: 'rutin izlem',
      vitaller: { boy: '161' },
      subjektif: 's1',
      objektif: 'o1',
      degerlendirme: 'd1',
      plan: 'p1',
    })
    assert.notEqual(a, b)
  })
})
