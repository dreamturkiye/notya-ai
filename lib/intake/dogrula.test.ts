import { test } from 'node:test'
import assert from 'node:assert/strict'
import { intakeAlanGorunur, intakeIlkHata } from './dogrula'
import { BRANS_SORULARI } from './bransSorulari'
import type { IntakeBolum } from './coreAlanlar'

test('gebelikHaftasi only when Hamileyim; required when visible', () => {
  const kd = BRANS_SORULARI['kadin-hastaliklari-dogum']
  const radio = kd.alanlar.find((a) => a.id === 'gebelikSuphesi')!
  const hafta = kd.alanlar.find((a) => a.id === 'gebelikHaftasi')!
  assert.ok(radio.secenekler?.includes('Hamileyim'))
  assert.equal(hafta.gosterEger?.deger, 'Hamileyim')

  assert.equal(intakeAlanGorunur(hafta, { gebelikSuphesi: 'Hayır' }), false)
  assert.equal(intakeAlanGorunur(hafta, { gebelikSuphesi: 'Hamileyim' }), true)

  const bolumler: IntakeBolum[] = [{ baslik: 't', alanlar: [radio, hafta] }]
  assert.equal(intakeIlkHata(bolumler, { gebelikSuphesi: 'Hayır' }), null)
  assert.equal(intakeIlkHata(bolumler, { gebelikSuphesi: 'Hamileyim' })?.alan.id, 'gebelikHaftasi')
  assert.equal(intakeIlkHata(bolumler, { gebelikSuphesi: 'Hamileyim', gebelikHaftasi: '12' }), null)
})
