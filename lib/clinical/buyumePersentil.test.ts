import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buyumePersentilleriniHesapla, persentilHesapla, persentilMetni } from './buyumeEgrisi'
import { kiloCoz, cmCoz, vitalOlcumleriniNormallestir } from './olcumCoz'

describe('yenidoğan ölçüm birimleri — Neyzi persentili', () => {
  const dogum = '2026-09-18'
  const olcum = '2026-09-21T10:00:00.000Z'

  it('3180 gr kg’a çevrilir; 3 günlük erkekte 100. persentil / obez çıkmaz', () => {
    const p = buyumePersentilleriniHesapla(
      { kilo: '3180 gr', boy: '50.50 cm', basCevresi: '34.7 cm' },
      dogum,
      'male',
      olcum,
    )
    assert.ok(p)
    assert.equal(kiloCoz('3180 gr'), 3.18)
    assert.equal(cmCoz('50.50 cm'), 50.5)
    assert.equal(cmCoz('34.7 cm'), 34.7)
    const kiloP = Number(p!.kilo?.replace(/\D/g, ''))
    const boyP = Number(p!.boy?.replace(/\D/g, ''))
    const basP = Number(p!.basCevresi?.replace(/\D/g, ''))
    assert.ok(kiloP >= 15 && kiloP <= 70, `kilo ${p!.kilo}`)
    assert.ok(boyP >= 30 && boyP <= 80, `boy ${p!.boy}`)
    assert.ok(basP >= 20 && basP <= 80, `baş ${p!.basCevresi}`)
    assert.equal(p!.vki, undefined)
    assert.equal(p!.vkiSinif, undefined)
  })

  it('birim silinip 3180 kg sanılırsa 100. persentil olur — bu yüzden gram çevrilir', () => {
    const ham = parseFloat(String('3180 gr').replace(',', '.').replace(/[^0-9.]/g, ''))
    assert.equal(ham, 3180)
    const kirik = persentilHesapla('kilo', 'male', 0, ham)
    assert.equal(kirik && persentilMetni(kirik.persentil), '100. persentil')
  })

  it('form alanına birim yazılmaz: 3180 gr → 3.18, 50.50 cm → 50.5', () => {
    const n = vitalOlcumleriniNormallestir({ kilo: '3180 gr', boy: '50.50 cm', basCevresi: '34.7 cm', ates: '36.5' })
    assert.deepEqual(n, { kilo: '3.18', boy: '50.5', basCevresi: '34.7', ates: '36.5' })
  })

  it('erişkin 70 kg / 170 cm değişmez', () => {
    assert.equal(kiloCoz('70 kg'), 70)
    assert.equal(cmCoz('170'), 170)
    const n = vitalOlcumleriniNormallestir({ kilo: '70', boy: '170' })
    assert.deepEqual(n, { kilo: '70', boy: '170' })
  })
})
