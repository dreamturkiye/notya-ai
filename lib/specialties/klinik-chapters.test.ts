import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { specialtyProfile } from './registry'
import { KLINIK_YENI_SLUGS } from './klinikDikey'
import { bransAnahtari } from './bransAnahtari'
import { doktorAraclariListesi } from '@/lib/doktor/doktorAraclari'
import { greftBandi } from '@/specialties/sac-ekimi/engines/sac'
import { sogumaUygun } from '@/specialties/medikal-estetik/engines/estetik'
import { icfOzet } from '@/specialties/fizyoterapi/engines/fizyo'
import { seansCercevesi } from '@/specialties/klinik-psikolog/engines/psikolog'
import { makroBand } from '@/specialties/diyetisyen/engines/diyet'
import { gyaOzet } from '@/specialties/ergoterapi/engines/ergo'
import { ptaKayit } from '@/specialties/odyoloji/engines/odyo'
import { muayeneCekListesi } from '@/lib/doktor/muayeneCekListesi'

describe('KLINIK-EXCEPTIONAL-01 chapter pack', () => {
  it('8 yeni dal registry + portal Strong + TUS sızıntısı yok', () => {
    for (const k of KLINIK_YENI_SLUGS) {
      const p = specialtyProfile(k)
      assert.equal(p.key, k)
      assert.equal(p.olgunluk, 'beta-hazir')
      assert.equal(p.portal?.[0]?.derinlik, 'Strong')
      const arac = doktorAraclariListesi(k)
      assert.ok(arac.some((a) => a.branslar?.includes(k)), k)
      assert.ok(arac.some((a) => a.route.endsWith('-kohort')), `${k} kohort`)
      assert.equal(arac.some((a) => a.route.includes('hedef-boy')), false, k)
      assert.equal(arac.some((a) => a.branslar?.includes('kardiyoloji')), false, k)
    }
    assert.equal(doktorAraclariListesi('kardiyoloji').some((a) => a.route.startsWith('/doktor-tools/sac-')), false)
    assert.equal(doktorAraclariListesi('fizik-tedavi').some((a) => a.route.startsWith('/doktor-tools/fizyo-')), false)
    assert.equal(doktorAraclariListesi('psikiyatri').some((a) => a.route.includes('psikolog')), false)
    assert.equal(doktorAraclariListesi('kulak-burun-bogaz').some((a) => a.route.startsWith('/doktor-tools/odyo-')), false)
  })

  it('etiketler kanonik anahtara çözülür; FTR ≠ fizyo', () => {
    assert.equal(bransAnahtari('Fizyoterapi'), 'fizyoterapi')
    assert.equal(bransAnahtari('Fizik Tedavi'), 'fizik-tedavi')
    assert.equal(bransAnahtari('Saç Ekimi'), 'sac-ekimi')
    assert.equal(bransAnahtari('Klinik Psikoloji'), 'klinik-psikolog')
    assert.equal(bransAnahtari('Odyoloji'), 'odyoloji')
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

  it('çek listesi saç maddeleri kardiyolojiye sızmaz', () => {
    const sac = muayeneCekListesi({ seansBransi: 'sac-ekimi', doktorBransi: 'sac-ekimi' })
    const kard = muayeneCekListesi({ seansBransi: 'kardiyoloji', doktorBransi: 'kardiyoloji' })
    assert.ok(sac.some((m) => m.id.startsWith('sac-')))
    assert.equal(kard.some((m) => m.id.startsWith('sac-')), false)
  })

  it('müttefik e-reçete görmez', () => {
    const fizyo = doktorAraclariListesi('fizyoterapi')
    assert.equal(fizyo.some((a) => a.route === '/doktor-tools/erecete'), false)
    assert.ok(doktorAraclariListesi('sac-ekimi').some((a) => a.route === '/doktor-tools/erecete'))
  })
})
