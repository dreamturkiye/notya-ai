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

test('jinekolojik Diğer opens explanation; smear and mamografi are separate', () => {
  const kd = BRANS_SORULARI['kadin-hastaliklari-dogum']
  const liste = kd.alanlar.find((a) => a.id === 'bilinenJinekolojikHastaliklar')!
  const diger = kd.alanlar.find((a) => a.id === 'jinekolojikHastalikDiger')!
  assert.ok(liste.secenekler?.includes('Diğer'))
  assert.equal(intakeAlanGorunur(diger, { bilinenJinekolojikHastaliklar: ['Myom'] }), false)
  assert.equal(intakeAlanGorunur(diger, { bilinenJinekolojikHastaliklar: ['Myom', 'Diğer'] }), true)
  assert.ok(kd.alanlar.some((a) => a.id === 'sonSmearTarihi'))
  assert.ok(kd.alanlar.some((a) => a.id === 'sonMamografiTarihi'))
  assert.ok(!kd.alanlar.some((a) => a.id === 'sonSmearMamografi'))
})
