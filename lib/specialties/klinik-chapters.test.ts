import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { KLINIK_YENI_SLUGS } from './klinikDikey'
import { bransAnahtari } from './bransAnahtari'
import { doktorAraclariListesi } from '@/lib/doktor/doktorAraclari'
import { klinikAraclariListesi } from '@/lib/klinik/klinikAraclari'
import { greftBandi } from '@/specialties/sac-ekimi/engines/sac'
import { sogumaUygun } from '@/specialties/medikal-estetik/engines/estetik'
import { cerrahiSoguma } from '@/specialties/estetik-cerrahi/engines/cerrahi'
import { lazerSeansVadesi } from '@/specialties/klinik-dermatoloji/engines/derm'
import { icfOzet } from '@/specialties/fizyoterapi/engines/fizyo'
import { seansCercevesi } from '@/specialties/klinik-psikolog/engines/psikolog'
import { makroBand } from '@/specialties/diyetisyen/engines/diyet'
import { gyaOzet } from '@/specialties/ergoterapi/engines/ergo'
import { ptaKayit, sessizOdaKayit } from '@/specialties/odyoloji/engines/odyo'
import { ivGuvenlik } from '@/specialties/longevity/engines/long'
import { seansVadesi as psikVade } from '@/specialties/klinik-psikolog/engines/psikolog'
import { kontrolTakvimi } from '@/specialties/diyetisyen/engines/diyet'
import { seansVadesi as ergoVade } from '@/specialties/ergoterapi/engines/ergo'
import { fotoKvkkRiza } from '@/specialties/sac-ekimi/engines/sac'
import { rizaIkiNusha } from '@/specialties/estetik-cerrahi/engines/cerrahi'
import { portalModulleri } from '@/lib/portal/moduller'

describe('KLINIK-10-EXCEPTIONAL — 10 dal Klinik kategorisi', () => {
  it('10 dal Klinik Araçlar’da; Doktor Araçlar’a sızmaz', () => {
    assert.equal(KLINIK_YENI_SLUGS.length, 10)
    for (const k of KLINIK_YENI_SLUGS) {
      const arac = klinikAraclariListesi(k)
      assert.ok(arac.some((a) => a.route === '/klinik-tools/kayit-kvkk'), `${k} kayit-kvkk`)
      assert.ok(arac.some((a) => a.route === '/klinik-tools/hasta-portali'), `${k} hasta-portali`)
      assert.ok(arac.some((a) => a.dallar.includes(k)), k)
      assert.ok(arac.some((a) => a.route.startsWith('/klinik-tools/')), k)
      assert.ok(arac.some((a) => a.route.endsWith('-kohort')), `${k} kohort`)
      assert.equal(doktorAraclariListesi(k).some((a) => a.route.startsWith('/klinik-tools/')), false, k)
    }
    for (const tus of ['kardiyoloji', 'fizik-tedavi', 'psikiyatri', 'kulak-burun-bogaz', 'dermatoloji', 'plastik-cerrahi'] as const) {
      assert.equal(doktorAraclariListesi(tus).some((a) => a.route.startsWith('/klinik-tools/')), false, tus)
    }
  })

  it('TUS çözücü Klinik dal üretmez; FTR ≠ fizyo; çıplak derm TUS’tur', () => {
    assert.equal(bransAnahtari('Fizyoterapi'), null)
    assert.equal(bransAnahtari('Fizik Tedavi'), 'fizik-tedavi')
    assert.equal(bransAnahtari('Saç Ekimi'), null)
    assert.equal(bransAnahtari('klinik-dermatoloji'), null)
    assert.equal(bransAnahtari('estetik-cerrahi'), null)
    assert.equal(bransAnahtari('Dermatoloji'), 'dermatoloji')
    assert.equal(bransAnahtari('Plastik Cerrahi'), 'plastik-cerrahi')
  })

  it('motorlar: greft / soğuma / cerrahi / lazer / ICF / seans / makro / GYA / PTA', () => {
    const g = greftBandi(80, 40)
    assert.ok(!('hata' in g) && g.ozet.includes('3200'))
    assert.equal(sogumaUygun('2026-09-01', '2026-09-03').uygun, true)
    assert.equal(cerrahiSoguma('2026-09-01', '2026-09-03').uygun, true)
    const l = lazerSeansVadesi('2026-09-01', 28, '2026-09-29')
    assert.ok(!('hata' in l) && l.durum === 'bugun')
    assert.ok('hata' in icfOzet('yürüme', 'iş', ''))
    assert.ok(!('hata' in icfOzet('yürüme', 'iş', 'L4 radikülopati')))
    const kriz = seansCercevesi('BDT', null, true)
    assert.ok(!('hata' in kriz) && kriz.ozet.includes('112'))
    const m = makroBand(70, 'koruma')
    assert.ok(!('hata' in m) && m.ozet.includes('kcal'))
    assert.ok('hata' in gyaOzet('', ['Giyinme']))
    const p = ptaKayit(30)
    assert.ok(!('hata' in p) && p.ozet.includes('tanı değildir'))
    assert.ok(!('hata' in ivGuvenlik(['IV set ve ürün lotu kaydı (karışım yazılmaz)', 'Alerji / önceki reaksiyon soruldu', 'Acil set / 112 yolu görünür'])))
    assert.ok(!('hata' in psikVade('2026-09-01', 7, '2026-09-08')))
    assert.equal(kontrolTakvimi('2026-09-01', '2026-09-15').length, 3)
    assert.ok(!('hata' in ergoVade('2026-09-01', 7, '2026-09-08')))
    assert.ok(!('hata' in sessizOdaKayit(4, true)))
    assert.ok('hata' in fotoKvkkRiza(false, '2026-09-01'))
    assert.ok('hata' in rizaIkiNusha(true, false))
  })

  it('portal: Klinik derm ≠ TUS Derim; estetik cerrahi ≠ Yaram', () => {
    const tus = portalModulleri({ doktorBransi: 'Dermatoloji', hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
    assert.deepEqual(tus.moduller, ['dermatoloji'])
    const klinik = portalModulleri({ doktorBransi: 'klinik-dermatoloji', hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
    assert.deepEqual(klinik.moduller, ['klinik-derim'])
    const cer = portalModulleri({ doktorBransi: 'estetik-cerrahi', hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
    assert.deepEqual(cer.moduller, ['estetik-ameliyatim'])
    const plastik = portalModulleri({ doktorBransi: 'plastik-cerrahi', hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false })
    assert.deepEqual(plastik.moduller, ['yaram'])
  })

  it('müttefik Klinik’te e-reçete görmez', () => {
    const fizyo = klinikAraclariListesi('fizyoterapi')
    assert.equal(fizyo.some((a) => a.route.includes('erecete')), false)
    assert.ok(klinikAraclariListesi('klinik-dermatoloji').some((a) => a.route === '/klinik-tools/derm-lazer'))
    assert.ok(klinikAraclariListesi('estetik-cerrahi').some((a) => a.route === '/klinik-tools/cerrahi-onam'))
    assert.ok(klinikAraclariListesi('longevity').some((a) => a.route === '/klinik-tools/long-guvenlik'))
    assert.ok(klinikAraclariListesi('klinik-psikolog').some((a) => a.route === '/klinik-tools/psikolog-vade'))
    assert.ok(klinikAraclariListesi('diyetisyen').some((a) => a.route === '/klinik-tools/diyet-takvim'))
    assert.ok(klinikAraclariListesi('ergoterapi').some((a) => a.route === '/klinik-tools/ergo-seans'))
    assert.ok(klinikAraclariListesi('odyoloji').some((a) => a.route === '/klinik-tools/odyo-oda'))
  })
})
