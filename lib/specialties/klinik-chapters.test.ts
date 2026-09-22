import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { KLINIK_YENI_SLUGS } from './klinikDikey'
import { bransAnahtari } from './bransAnahtari'
import { doktorAraclariListesi } from '@/lib/doktor/doktorAraclari'
import { klinikAraclariListesi } from '@/lib/klinik/klinikAraclari'
import { greftBandi } from '@/specialties/sac-ekimi/engines/sac'
import { sogumaUygun } from '@/specialties/medikal-estetik/engines/estetik'
import { icfOzet } from '@/specialties/fizyoterapi/engines/fizyo'
import { seansCercevesi } from '@/specialties/klinik-psikolog/engines/psikolog'
import { makroBand } from '@/specialties/diyetisyen/engines/diyet'
import { gyaOzet } from '@/specialties/ergoterapi/engines/ergo'
import { ptaKayit } from '@/specialties/odyoloji/engines/odyo'

describe('KLINIK-EXCEPTIONAL-01 — Klinik kategorisi (Doktor değil)', () => {
  it('8 dal Klinik Araçlar’da; Doktor Araçlar’a sızmaz', () => {
    for (const k of KLINIK_YENI_SLUGS) {
      const arac = klinikAraclariListesi(k)
      assert.ok(arac.some((a) => a.dallar.includes(k)), k)
      assert.ok(arac.some((a) => a.route.startsWith('/klinik-tools/')), k)
      assert.ok(arac.some((a) => a.route.endsWith('-kohort')), `${k} kohort`)
      assert.equal(doktorAraclariListesi(k).some((a) => a.route.startsWith('/klinik-tools/')), false, k)
    }
    for (const tus of ['kardiyoloji', 'fizik-tedavi', 'psikiyatri', 'kulak-burun-bogaz'] as const) {
      assert.equal(doktorAraclariListesi(tus).some((a) => a.route.startsWith('/klinik-tools/')), false, tus)
    }
  })

  it('TUS çözücü Klinik dal üretmez; FTR ≠ fizyo', () => {
    assert.equal(bransAnahtari('Fizyoterapi'), null)
    assert.equal(bransAnahtari('Fizik Tedavi'), 'fizik-tedavi')
    assert.equal(bransAnahtari('Saç Ekimi'), null)
    assert.equal(bransAnahtari('Klinik Psikoloji'), null)
    assert.equal(bransAnahtari('Odyoloji'), null)
  })

  it('motorlar: greft / soğuma / ICF / seans / makro / GYA / PTA', () => {
    const g = greftBandi(80, 40)
    assert.ok(!('hata' in g) && g.ozet.includes('3200'))
    assert.equal(sogumaUygun('2026-09-01', '2026-09-03').uygun, true)
    assert.ok('hata' in icfOzet('yürüme', 'iş', ''))
    assert.ok(!('hata' in icfOzet('yürüme', 'iş', 'L4 radikülopati')))
    const kriz = seansCercevesi('BDT', null, true)
    assert.ok(!('hata' in kriz) && kriz.ozet.includes('112'))
    const m = makroBand(70, 'koruma')
    assert.ok(!('hata' in m) && m.ozet.includes('kcal'))
    assert.ok('hata' in gyaOzet('', ['Giyinme']))
    const p = ptaKayit(30)
    assert.ok(!('hata' in p) && p.ozet.includes('tanı değildir'))
  })

  it('müttefik Klinik’te e-reçete rotası görmez (Doktor gridinde de yok)', () => {
    const fizyo = klinikAraclariListesi('fizyoterapi')
    assert.equal(fizyo.some((a) => a.route.includes('erecete')), false)
    assert.ok(klinikAraclariListesi('sac-ekimi').some((a) => a.route === '/klinik-tools/sac-greft'))
  })
})
