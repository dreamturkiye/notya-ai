/**
 * NOTYA-BUYUME-KISA-01 — "büyümesi yaşına uygun mu?" → 1–2 cümle şablonu.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { BUYUME_KISA_SABLON, buyumeKisaSoruMu } from './kurallar'
import { kanitBlogu } from './kanit'
import { olaylariKur, hastaKur } from '@/lib/doktor/dosyaOlaylari'
import { DENETIM_BUGUN, FIKSTUR_A } from './denetim/fikstur'

describe('NOTYA-BUYUME-KISA-01', () => {
  it('yaşına uygun / normal mi sorularını tanır', () => {
    assert.equal(buyumeKisaSoruMu('Rıdvan Dilmen\'in büyümesi yaşına uygun mu?'), true)
    assert.equal(buyumeKisaSoruMu('Büyümesi yaşına uygun mu'), true)
    assert.equal(buyumeKisaSoruMu('kilosu normal mi'), true)
    assert.equal(buyumeKisaSoruMu('Büyümesi nasıl gidiyor?'), false)
  })

  it('kısa soruda kanıt şablonu 1–2 cümle kuralını taşır', () => {
    const olaylar = olaylariKur(FIKSTUR_A, DENETIM_BUGUN)
    const hasta = hastaKur(FIKSTUR_A, DENETIM_BUGUN)
    const blok = kanitBlogu('buyume', olaylar, hasta, { mesaj: 'Rıdvan Dilmen\'in büyümesi yaşına uygun mu?' })
    assert.ok(blok.includes(BUYUME_KISA_SABLON.slice(0, 40)), blok)
    assert.ok(blok.includes('TAM OLARAK bir veya iki cümle'), blok)
  })

  it('genel büyüme sorusunda uzun şablon kalır', () => {
    const olaylar = olaylariKur(FIKSTUR_A, DENETIM_BUGUN)
    const hasta = hastaKur(FIKSTUR_A, DENETIM_BUGUN)
    const blok = kanitBlogu('buyume', olaylar, hasta, { mesaj: 'Büyümesi nasıl gidiyor?' })
    assert.ok(!blok.includes('TAM OLARAK bir veya iki cümle'), blok)
    assert.ok(blok.includes('BÜYÜME HIZI'), blok)
  })
})
