import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rutinTuret, sonrakiAday, SONRAKI_ESIK_N, type HamOlay } from './rutinTuret'

function gunluk(gun: number): HamOlay[] {
  const t = `2026-09-${String(10 + gun).padStart(2, '0')}T06:00:00Z`
  return [
    { sayfa_tipi: 'ana', eylem: 'sayfa_ac', onceki: null, sure_ms: 800, zaman: t, cihaz: 'masaustu' },
    { sayfa_tipi: 'hastalar', eylem: 'sayfa_ac', onceki: 'ana', sure_ms: 4000, zaman: t, cihaz: 'masaustu' },
    { sayfa_tipi: 'hasta', eylem: 'hasta_ac', onceki: 'hastalar', sure_ms: 2000, zaman: t, cihaz: 'masaustu' },
    { sayfa_tipi: 'not', eylem: 'sayfa_ac', onceki: 'hasta', sure_ms: 15000, zaman: t, cihaz: 'masaustu' },
    { sayfa_tipi: 'inceleme', eylem: 'not_onayla', onceki: 'not', sure_ms: 3000, zaman: t, cihaz: 'masaustu' },
    { sayfa_tipi: 'recete', eylem: 'recete_ac', onceki: 'not_onayla', sure_ms: 5000, zaman: t, cihaz: 'masaustu' },
  ]
}

test('10 günlük sentetik günlük: ana→hastalar ve not_onayla→recete_ac', () => {
  const olaylar = Array.from({ length: 10 }, (_, i) => gunluk(i)).flat()
  const p = rutinTuret(olaylar, { tipikBaslangicSaati: '09:00', gunBasinaOrtHasta: 8 })
  assert.equal(p.kartSirasi, 'hastalar')
  assert.equal(p.tipikBaslangicSaati, '09:00')
  const onay = p.gecisler.find((g) => g.from === 'not_onayla' && g.to === 'recete_ac')
  assert.ok(onay)
  assert.equal(onay.n, 10)
  assert.ok(onay.p >= 0.99)
  const anaH = p.gecisler.find((g) => g.from === 'ana' && g.to === 'hastalar')
  assert.ok(anaH && anaH.n === 10)
})

test('SonrakiAdim yalnız eşik üstünde', () => {
  const zayif: HamOlay[] = Array.from({ length: 5 }, () => ({
    sayfa_tipi: 'recete', eylem: 'recete_ac', onceki: 'not_onayla', sure_ms: 1,
  }))
  const z = rutinTuret(zayif)
  assert.equal(sonrakiAday(z, 'not_onayla'), null)

  const guclu: HamOlay[] = Array.from({ length: SONRAKI_ESIK_N }, () => ({
    sayfa_tipi: 'recete', eylem: 'recete_ac', onceki: 'not_onayla', sure_ms: 1,
  }))
  const g = rutinTuret(guclu)
  const a = sonrakiAday(g, 'not_onayla')
  assert.ok(a)
  assert.equal(a.to, 'recete_ac')
  assert.ok(a.p >= 0.6)
  assert.ok(a.n >= 8)
})
