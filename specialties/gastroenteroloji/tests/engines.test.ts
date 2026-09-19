/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — IBD/IBS / endoskopi / hepatit / acil motor birim testleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { skorHesapla, mayoBanti, hbiBanti, ibsSssBanti } from '../engines/ibdIbs'
import { endoskopiPlanla } from '../engines/endoskopi'
import { hepatitPlanla } from '../engines/hbvHcv'
import { acilTara, hekimOnayiGerekliMi, intakeAcilKodlari, INTAKE_ACIL_SECENEKLERI } from '../engines/acil'
import { rejimNormalize, rejimDozIceriyorMu, rejimGorevleri } from '../engines/rejim'
import { gastroKohortSatirlari } from '../engines/kohort'
import { hastaDiliTemizMi, sindirimimHatirlatmalari } from '../engines/portal-sindirimim'

describe('gastroenteroloji ibdIbs', () => {
  it('Mayo / HBI / IBS-SSS bantları karar desteği', () => {
    assert.equal(mayoBanti(1), 'remisyon')
    assert.equal(mayoBanti(4), 'hafif')
    assert.equal(mayoBanti(8), 'siddetli')
    assert.equal(hbiBanti(3), 'remisyon')
    assert.equal(hbiBanti(10), 'orta')
    assert.equal(ibsSssBanti(50), 'remisyon')
    assert.equal(ibsSssBanti(350), 'siddetli')
    const s = skorHesapla('mayo_kismi', 8)
    assert.ok(s.tamamMi)
    assert.equal(s.bant, 'siddetli')
    assert.match(s.ozet, /karar desteği|hekim/i)
  })

  it('eksik skor yorumlanmaz', () => {
    const s = skorHesapla('hbi', null)
    assert.equal(s.tamamMi, false)
    assert.equal(s.bant, null)
  })
})

describe('gastroenteroloji endoskopi', () => {
  it('kolonoskopi planı', () => {
    const p = endoskopiPlanla('kolonoskopi', '2025-09-19')
    assert.ok(p.tamamMi)
    assert.equal(p.sonrakiKontrol, '2026-09-19')
    assert.match(p.ozet, /HIS|tanı|yok/i)
  })
})

describe('gastroenteroloji hepatit', () => {
  it('aktif izlem 6 ay', () => {
    const p = hepatitPlanla('hbv', 'aktif_izlem', '2026-03-19')
    assert.ok(p.tamamMi)
    assert.equal(p.sonrakiAy, 6)
    assert.equal(p.sonrakiTarih, '2026-09-19')
    assert.match(p.ozet, /doz|hekim/i)
  })
})

describe('gastroenteroloji acil', () => {
  it('GI kanama → hemen + hekim onayı', () => {
    const b = acilTara(['melena ve hematemez'])
    assert.ok(b.some((x) => x.kod === 'gi_kanama'))
    assert.ok(hekimOnayiGerekliMi(b))
  })

  it('intake etiketleri motorla birebir', () => {
    const kodlar = intakeAcilKodlari(['Kanlı kusma veya siyah / kanlı dışkı', 'Yok'])
    assert.deepEqual(kodlar, ['gi_kanama'])
    assert.ok(INTAKE_ACIL_SECENEKLERI.length >= 5)
  })
})

describe('gastroenteroloji rejim', () => {
  it('dates-only; doz reddi', () => {
    assert.ok(rejimDozIceriyorMu('40 mg omeprazol'))
    assert.ok(!rejimDozIceriyorMu('sabah açlık kontrolü'))
    const g = rejimGorevleri(rejimNormalize({ ppiKontrol: '2026-10-01', biyolojikKontrol: '2026-11-01' }))
    assert.equal(g.length, 2)
  })
})

describe('gastroenteroloji kohort', () => {
  it('bayrak üretir', () => {
    const s = gastroKohortSatirlari([{
      patientId: '1', ad: 'A', sonSkorBant: 'siddetli', acikRiskBayraklari: [],
      sonrakiKontrol: '2026-01-01', gorevler: [{ kod: 'skor_mayo_kismi', due: '2026-01-01' }],
      sonVizit: null, portalVar: true,
    }], '2026-09-19')
    assert.ok(s[0].bayraklar.includes('skor_yuksek'))
    assert.ok(s[0].bayraklar.includes('gecikmis_kontrol') || s[0].bayraklar.includes('skor_izlem_gecikmis'))
  })
})

describe('gastroenteroloji portal dili', () => {
  it('hasta dili temiz + hatırlatma', () => {
    assert.ok(hastaDiliTemizMi('Kontrol randevusu'))
    assert.ok(!hastaDiliTemizMi('Crohn tanısı Mayo 8'))
    const h = sindirimimHatirlatmalari({
      bugun: '2026-09-19',
      gorevler: [{ kod: 'skor_mayo_kismi', due: '2026-10-01' }],
      sonrakiKontrolIso: '2026-10-15',
    })
    assert.ok(h.some((x) => x.ad === 'Takip formu kontrolü'))
    assert.ok(h.every((x) => hastaDiliTemizMi(x.ad)))
  })
})
