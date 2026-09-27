import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  bosMasaGirdi,
  izinKilitliMi,
  masaAlanlari,
  masaCiktiListesi,
  masaTurCoz,
  MASA_KISA_REHBER,
} from './masa'

describe('e-Nabız masası', () => {
  it('hekim yüzünde FHIR / Medula / USS / canlı bağlantı yok', () => {
    const c = masaAlanlari('muayene', { ...bosMasaGirdi(), hastaAd: 'Ayşe Demir', sikayet: 'öksürük' })
    const yuz = [MASA_KISA_REHBER, c.ad, ...c.alanlar.map((a) => a.etiket), ...c.eksikler].join(' ')
    assert.doesNotMatch(yuz, /FHIR|Medula|USS|canlı bağlantı|live_write|Composition|DiagnosticReport/i)
  })

  it('eksik T.C. ve tanı kırmızı listede', () => {
    const c = masaAlanlari('muayene', { ...bosMasaGirdi(), hastaAd: 'Ali' })
    assert.ok(c.eksikler.includes('T.C. Kimlik No'))
    assert.ok(c.eksikler.includes('Tanı'))
    assert.equal(c.alanlar.find((a) => a.id === 'tc')?.eksik, true)
    assert.match(c.topluMetin, /Ad Soyad: Ali/)
  })

  it('izin kilidi paket üretmez', () => {
    assert.equal(izinKilitliMi(true), true)
    assert.equal(izinKilitliMi(false), false)
  })

  it('gebe yalnız KD masasında; görüntüleme veri varsa', () => {
    const kd = masaCiktiListesi({ usgVar: true, gebeGoster: true }).map((x) => x.tur)
    const kardio = masaCiktiListesi({ usgVar: false, gebeGoster: false }).map((x) => x.tur)
    assert.ok(kd.includes('gebe') && kd.includes('usg'))
    assert.ok(!kardio.includes('gebe') && !kardio.includes('usg'))
    assert.deepEqual(kardio, ['muayene', 'recete', 'epikriz', 'rapor'])
  })

  it('tur çözümü güvenli', () => {
    assert.equal(masaTurCoz('recete'), 'recete')
    assert.equal(masaTurCoz('fhir'), 'muayene')
    assert.equal(masaTurCoz(''), 'muayene')
  })

  it('doktor yüzü FHIR söylemez', () => {
    const kok = path.join(import.meta.dirname, '../..')
    const yuz = [
      fs.readFileSync(path.join(kok, 'components/doktor/EnabizMasa.tsx'), 'utf8'),
      fs.readFileSync(path.join(kok, 'app/doktor-tools/enabiz/page.tsx'), 'utf8'),
    ].join('\n')
    assert.match(yuz, /MASA_KISA_REHBER|e-Nabız’ı aç/)
    assert.doesNotMatch(yuz, /e-Nabız Format|canlı bağlantı yok|FHIR|Medula|USS/)
  })
})
