import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import { doktorAraclariListesi } from '@/lib/doktor/doktorAraclari'
import { klinikAraclariListesi } from '@/lib/klinik/klinikAraclari'
import { portalModulleri } from '@/lib/portal/moduller'
import {
  KLINIK_PORTAL_MODUL,
  klinikPortalDallariTam,
  klinikPortalModulu,
} from './klinikPortal'

const bos = { hastaYasYil: 40, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false }

describe('KLINIK-PORTAL — aynı Sağlığım kabuğu, 10 dal', () => {
  it('10 dalın portal modülü ve mint aracı var; Doktor gridine sızmaz', () => {
    assert.equal(klinikPortalDallariTam(), true)
    for (const slug of KLINIK_YENI_SLUGS) {
      assert.ok(klinikAraclariListesi(slug).some((a) => a.route === '/klinik-tools/hasta-portali'), slug)
      const p = portalModulleri({ doktorBransi: slug, ...bos })
      assert.deepEqual(p.moduller, [KLINIK_PORTAL_MODUL[slug]], slug)
      assert.equal(p.nav.length, 1, slug)
      assert.ok(!p.moduller.includes('dermatoloji'), slug)
      assert.ok(!p.moduller.includes('yaram'), slug)
      assert.ok(!p.moduller.includes('ftrm'), slug)
      assert.ok(!p.moduller.includes('psikiyatri'), slug)
    }
    assert.equal(doktorAraclariListesi('kardiyoloji').some((a) => a.route === '/klinik-tools/hasta-portali'), false)
    assert.equal(doktorAraclariListesi('dermatoloji').some((a) => a.route.startsWith('/klinik-tools/')), false)
  })

  it('hekim klinik ve müttefik aynı kabuk; TUS eşleniği sızmaz', () => {
    assert.equal(klinikPortalModulu('Saç Ekimi'), 'sacim')
    assert.equal(klinikPortalModulu('Fizyoterapi'), 'fizyom')
    assert.equal(klinikPortalModulu('Dermatoloji'), null)
    assert.deepEqual(portalModulleri({ doktorBransi: 'Dermatoloji', ...bos }).moduller, ['dermatoloji'])
    assert.deepEqual(portalModulleri({ doktorBransi: 'klinik-dermatoloji', ...bos }).moduller, ['klinik-derim'])
    assert.deepEqual(portalModulleri({ doktorBransi: 'plastik-cerrahi', ...bos }).moduller, ['yaram'])
    assert.deepEqual(portalModulleri({ doktorBransi: 'estetik-cerrahi', ...bos }).moduller, ['estetik-ameliyatim'])
    assert.deepEqual(portalModulleri({ doktorBransi: 'fizik-tedavi', ...bos }).moduller, ['ftrm'])
    assert.deepEqual(portalModulleri({ doktorBransi: 'fizyoterapi', ...bos }).moduller, ['fizyom'])
  })
})
