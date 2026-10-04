import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  metindenTetkikleriCikar,
  notTetkikleriniTemizle,
  tetkikMetniniCoz,
  tetkikleriMetindenTamamla,
} from './notTetkikler'

describe('NOTYA-TETKIK-NOT-01 — metindenTetkikleriCikar', () => {
  it('24 ay sağlam çocuk planındaki panel kalemlerini çıkarır', () => {
    const plan = `1. TEDAVİ: Hepatit A 2. doz uygulandı.
2. TETKİK: Tam kan sayımı, demir, demir bağlama kapasitesi, ferritin, 25-OH Vitamin D, tam idrar tahlili ve idrar kültürü istendi.
3. KONTROL: 2,5 yaş muayenesi.`
    const liste = metindenTetkikleriCikar(plan)
    const adlar = liste.map((t) => t.ad)
    assert.ok(adlar.includes('Tam kan sayımı (Hemogram)'), adlar.join(' | '))
    assert.ok(adlar.includes('Demir'), adlar.join(' | '))
    assert.ok(adlar.includes('Total demir bağlama kapasitesi (TDBK)'), adlar.join(' | '))
    assert.ok(adlar.includes('Ferritin'), adlar.join(' | '))
    assert.ok(adlar.includes('25-OH Vitamin D'), adlar.join(' | '))
    assert.ok(adlar.includes('Tam idrar tetkiki (TİT)'), adlar.join(' | '))
    assert.ok(adlar.includes('İdrar kültürü + antibiyogram'), adlar.join(' | '))
  })

  it('özgeçmişte geçen ferritin sonucunu istem saymaz (fiil yok)', () => {
    assert.deepEqual(metindenTetkikleriCikar('Bir yaşında ferritin normaldi.'), [])
  })

  it('katalog numune / açlık bilgisini doldurur', () => {
    const liste = metindenTetkikleriCikar('Demir ve 25-OH Vitamin D istendi.')
    const demir = liste.find((t) => t.ad === 'Demir')
    assert.ok(demir)
    assert.equal(demir!.numune, 'S')
    assert.equal(demir!.aclik, true)
  })

  it('tetkikleriMetindenTamamla dolu listeyi ezmez', () => {
    const mevcut = notTetkikleriniTemizle([{ ad: 'CRP' }])
    const sonraki = tetkikleriMetindenTamamla(mevcut, ['Ferritin istendi.'])
    assert.deepEqual(sonraki.map((t) => t.ad), ['CRP'])
  })

  it('tetkikMetniniCoz satırları parse eder', () => {
    const liste = tetkikMetniniCoz('Tam kan sayımı (Hemogram)\nFerritin — kontrol')
    assert.equal(liste.length, 2)
    assert.equal(liste[0].ad, 'Tam kan sayımı (Hemogram)')
    assert.equal(liste[1].not, 'kontrol')
  })
})
