/**
 * GENEL-CERRAHI-EXCEPTIONAL-01 — motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { preopSkorla, preopYasakIceriyorMu } from '../engines/preop'
import { yaraSkorla } from '../engines/yaraDren'
import { patolojiSkorla, patolojiYasakIceriyorMu } from '../engines/patoloji'
import { acilTara, hekimOnayiGerekliMi, intakeAcilKodlari, INTAKE_ACIL_SECENEKLERI } from '../engines/acil'
import { gcKohortSatirlari } from '../engines/kohort'
import { gcSeridi } from '../engines/serit'
import { hastaDiliTemizMi } from '../engines/portal-ameliyatim'
import fs from 'node:fs'
import path from 'node:path'

describe('genel-cerrahi preop', () => {
  it('checklist karar desteği; doz/OR reddi', () => {
    assert.ok(preopYasakIceriyorMu('75 mg antikoagülan'))
    assert.ok(preopYasakIceriyorMu('OR slot 14:00'))
    const s = preopSkorla({ planlananAmeliyatEtiket: 'Laparoskopik kolesistektomi etiketi', ameliyatTarihi: '2026-10-10', tamamlanan: ['onam', 'laboratuvar'] })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /karar desteği|hekim/i)
  })
})

describe('genel-cerrahi yara', () => {
  it('tarih zorunlu; özet tanı yazmaz', () => {
    assert.equal(yaraSkorla({ tip: 'yara' }).tamamMi, false)
    const s = yaraSkorla({ tip: 'dren', tarih: '2026-09-19', bolge: 'Sağ üst kadran', sonrakiKontrol: '2026-09-26', drenCikisMl: 40 })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /karar desteği|hekim/i)
  })
})

describe('genel-cerrahi patoloji', () => {
  it('tanı/evre reddi; belge takibi OK', () => {
    assert.ok(patolojiYasakIceriyorMu('malign adenokarsinom'))
    const s = patolojiSkorla({ etiket: 'Ameliyat materyali', durum: 'bekleniyor', ornekTarihi: '2026-09-10' })
    assert.ok(s.tamamMi)
    assert.match(s.ozet, /Belge köprüsü|hekim/i)
  })
})

describe('genel-cerrahi acil', () => {
  it('akut karın → hemen + hekim onayı', () => {
    const b = acilTara(['şiddetli karın ağrısı ve ateş kusma'])
    assert.ok(b.some((x) => x.kod === 'akut_karin'))
    assert.ok(hekimOnayiGerekliMi(b))
  })
  it('intake etiketleri motor ile birebir', () => {
    const kodlar = intakeAcilKodlari(INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket))
    assert.equal(kodlar.length, INTAKE_ACIL_SECENEKLERI.length)
    const intake = fs.readFileSync(path.join(process.cwd(), 'lib/intake/bransSorulari.ts'), 'utf8')
    for (const s of INTAKE_ACIL_SECENEKLERI) assert.ok(intake.includes(s.etiket), s.etiket)
  })
})

describe('genel-cerrahi kohort + serit', () => {
  it('bayrak üretir', () => {
    const s = gcKohortSatirlari([{
      patientId: '1', ad: 'A', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01', ameliyatTarihi: null, preopEksik: false,
      gorevler: [{ kod: 'yara_kontrol', due: '2026-01-01' }],
      sonVizit: null, portalVar: true, patolojiBekliyor: true,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('yara_gecikmis') || s[0].bayraklar.includes('patoloji_bekliyor') || s[0].bayraklar.includes('gecikmis_kontrol'))
  })
  it('şerit chip üretir', () => {
    const s = gcSeridi({
      bugun: '2026-09-19', preopTamam: 2, preopToplam: 6, ameliyatTarihi: '2026-10-01',
      yaraTip: 'Yara izlem', patolojiDurum: 'bekleniyor', riskBayraklari: [], riskHekimOnay: true,
      sonrakiKontrol: null, gorevler: [], planlar: [],
    })
    assert.ok(s.chips.some((c) => c.ad === 'Pre-op'))
  })
})

describe('genel-cerrahi portal dili', () => {
  it('hasta dili tanı/doz reddeder', () => {
    assert.equal(hastaDiliTemizMi('malign tanı kesin'), false)
    assert.equal(hastaDiliTemizMi('Kontrol randevusu'), true)
  })
})
