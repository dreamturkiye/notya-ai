import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sakatlikDegerlendir, yuklenmeUyariHesapla } from '@/specialties/spor-hekimligi/engines/sakatlik'

describe('SPOR-HEKIMLIGI-EXCEPTIONAL-01 sakatlık günlüğü', () => {
  it('requires region and never invents diagnosis', () => {
    const s = sakatlikDegerlendir({ bolge: 'Diz', mekanizma: 'Temas / darbe', siddet: 'orta' })
    assert.ok(!('hata' in s))
    assert.match(s.ozet, /karar desteği/)
    assert.doesNotMatch(s.ozet, /ACL|kırık tanısı|ICD/i)
  })

  it('rejects empty region', () => {
    const s = sakatlikDegerlendir({ bolge: '' })
    assert.ok('hata' in s)
  })

  it('flags high acute:chronic load ratio as uyarısı', () => {
    const y = yuklenmeUyariHesapla(600, 300)
    assert.equal(y.uyari, true)
    assert.match(y.not || '', /Yüklenme/)
    const ok = yuklenmeUyariHesapla(200, 300)
    assert.equal(ok.uyari, false)
  })
})
