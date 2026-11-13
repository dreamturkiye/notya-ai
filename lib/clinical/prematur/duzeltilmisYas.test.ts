import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buyumeAyi, duzeltilmisYas, duzeltilmisYasMetni, gestasyonGunu, gestasyonMetni, postmenstrualMetni, TERM_GUN, VARSAYILAN_DUZELTME_KURALI } from './duzeltilmisYas'

const g = (h: number, d = 0) => h * 7 + d

describe('düzeltilmiş yaş — tanım ve kesim kuralı', () => {
  it('24–42 hafta: yalnız < 37 hafta düzeltilir; düzeltme = (40 hafta − gestasyon)', () => {
    for (let hafta = 24; hafta <= 42; hafta++) {
      const y = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(hafta), tarihIso: '2026-03-01' })
      assert.equal(y.gecerli, true, `${hafta} hf`)
      assert.equal(y.kronolojikGun, 59)
      if (hafta < 37) {
        assert.equal(y.prematur, true, `${hafta} hf prematür`)
        assert.equal(y.erkenGun, TERM_GUN - hafta * 7)
        assert.equal(y.duzeltilmisGun, 59 - (40 - hafta) * 7)
        assert.equal(y.buyume.duzeltilmis, true)
        assert.equal(y.gelisim.duzeltilmis, true)
      } else {
        // term bebek HİÇ düzeltilmez
        assert.equal(y.prematur, false, `${hafta} hf term`)
        assert.equal(y.erkenGun, 0)
        assert.equal(y.duzeltilmisGun, 59)
        assert.equal(y.buyume.duzeltilmis, false)
        assert.equal(y.gelisim.duzeltilmis, false)
        assert.equal(y.buyume.gun, 59)
        assert.equal(y.terimTarihiIso, null)
      }
    }
  })

  it('sınır: 36+6 prematür, 37+0 değil', () => {
    assert.equal(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(36, 6), tarihIso: '2026-02-01' }).prematur, true)
    assert.equal(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(37, 0), tarihIso: '2026-02-01' }).prematur, false)
  })

  it('tahmini term tarihi = doğum + (280 − gestasyon)', () => {
    const y = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(28), tarihIso: '2026-03-01' })
    assert.equal(y.terimTarihiIso, '2026-03-26') // 84 gün
    assert.equal(y.duzeltilmisGun, 59 - 84)
  })

  it('kronolojik 24. ay doğum günü: bir gün önce düzeltilir, o gün düzeltme biter', () => {
    const once = duzeltilmisYas({ dogumIso: '2024-01-15', gestasyonGun: g(30), tarihIso: '2026-01-14' })
    const gun = duzeltilmisYas({ dogumIso: '2024-01-15', gestasyonGun: g(30), tarihIso: '2026-01-15' })
    assert.equal(once.kronolojikAy, 23)
    assert.equal(once.buyume.duzeltilmis, true)
    assert.equal(gun.kronolojikAy, 24)
    assert.equal(gun.buyume.duzeltilmis, false)
    assert.equal(gun.gelisim.duzeltilmis, false)
    assert.equal(gun.buyume.gun, gun.kronolojikGun)
  })

  it('29 Şubat doğum: takvim ayı hesabı bozulmaz', () => {
    const y = duzeltilmisYas({ dogumIso: '2024-02-29', gestasyonGun: g(32), tarihIso: '2026-02-27' })
    assert.equal(y.kronolojikAy, 23)
    assert.equal(y.buyume.duzeltilmis, true)
    assert.equal(duzeltilmisYas({ dogumIso: '2024-02-29', gestasyonGun: g(32), tarihIso: '2026-02-28' }).kronolojikAy, 23)
    assert.equal(duzeltilmisYas({ dogumIso: '2024-02-29', gestasyonGun: g(32), tarihIso: '2026-03-01' }).kronolojikAy, 24)
  })

  it('doğum günü = bugün: kronolojik 0 gün, term öncesi', () => {
    const y = duzeltilmisYas({ dogumIso: '2026-05-05', gestasyonGun: g(25), tarihIso: '2026-05-05' })
    assert.equal(y.kronolojikGun, 0)
    assert.equal(y.duzeltilmisGun, -105)
    assert.equal(y.buyume.termOncesi, true)
    assert.equal(y.gelisim.termOncesi, true)
    assert.equal(buyumeAyi(y), null) // Neyzi / WHO term öncesi için tanımsız
  })

  it('term öncesi → term olunca: buyumeAyi ≥ 0', () => {
    const y = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(34), tarihIso: '2026-03-01' }) // 59 − 42 = 17 gün
    assert.equal(y.duzeltilmisGun, 17)
    assert.ok(Math.abs((buyumeAyi(y) as number) - 17 / 30.4375) < 1e-9)
  })

  it('postmenstrüel yaş = gestasyon + kronolojik', () => {
    const y = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(28, 3), tarihIso: '2026-01-31' })
    assert.equal(y.postmenstrualGun, g(28, 3) + 30)
    assert.equal(postmenstrualMetni(y), '32+5')
  })

  it('geçersiz girdi: sessizce yanlış hesap yapmaz', () => {
    assert.equal(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: null, tarihIso: '2026-02-01' }).durumKodu, 'gestasyon-yok')
    assert.equal(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: null, tarihIso: '2026-02-01' }).buyume.duzeltilmis, false)
    assert.equal(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: 100, tarihIso: '2026-02-01' }).durumKodu, 'gestasyon-gecersiz')
    assert.equal(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: 400, tarihIso: '2026-02-01' }).durumKodu, 'gestasyon-gecersiz')
    assert.equal(duzeltilmisYas({ dogumIso: '2026-03-01', gestasyonGun: g(30), tarihIso: '2026-02-01' }).durumKodu, 'tarih-gecersiz')
    assert.equal(duzeltilmisYas({ dogumIso: 'bozuk', gestasyonGun: g(30), tarihIso: '2026-02-01' }).durumKodu, 'tarih-gecersiz')
    assert.equal(duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: 200.5, tarihIso: '2026-02-01' }).durumKodu, 'gestasyon-gecersiz')
  })

  it('kural enjekte edilir: başka kesim ve üst sınır', () => {
    const kural = { ...VARSAYILAN_DUZELTME_KURALI, baslangicHafta: 35, buyumeUstAy: 12, gelisimUstAy: 36 }
    const a = duzeltilmisYas({ dogumIso: '2025-01-01', gestasyonGun: g(36), tarihIso: '2025-06-01' }, kural)
    assert.equal(a.prematur, false) // 36 ≥ 35
    const b = duzeltilmisYas({ dogumIso: '2024-01-01', gestasyonGun: g(30), tarihIso: '2025-03-01' }, kural)
    assert.equal(b.buyume.duzeltilmis, false) // 14 ay ≥ 12
    assert.equal(b.gelisim.duzeltilmis, true) // 14 ay < 36
  })

  it('gestasyonGunu: ondalık hafta → gün', () => {
    assert.equal(gestasyonGunu(32 + 4 / 7), g(32, 4))
    assert.equal(gestasyonGunu(32.57), g(32, 4))
    assert.equal(gestasyonGunu(19.9), null)
    assert.equal(gestasyonGunu(46), null)
    assert.equal(gestasyonGunu(null), null)
    assert.equal(gestasyonMetni(g(29, 6)), '29+6')
  })

  it('ekran metni', () => {
    const y = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(30), tarihIso: '2026-06-01' }) // 151 gün − 70 = 81 gün
    assert.match(duzeltilmisYasMetni(y, '2026-06-01'), /^2 aylık$/)
    const t = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(30), tarihIso: '2026-01-10' })
    assert.match(duzeltilmisYasMetni(t, '2026-01-10'), /term öncesi/)
    const term = duzeltilmisYas({ dogumIso: '2026-01-01', gestasyonGun: g(39), tarihIso: '2026-06-01' })
    assert.equal(duzeltilmisYasMetni(term, '2026-06-01'), '')
  })
})
