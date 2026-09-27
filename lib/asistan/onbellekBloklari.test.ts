import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asistanOnbellekBloklari } from './onbellekBloklari'

test('soru kuyruğu dosya gövdesinin önbellek önekini bozmaz', () => {
  const ortak = { global: 'GLOBAL', hekim: 'HİTAP Ayla', kararli: 'HAFIZA\nDOSYA GÖVDE' }
  const a = asistanOnbellekBloklari({ ...ortak, kuyruk: 'KESİN aşı listesi' })
  const b = asistanOnbellekBloklari({ ...ortak, kuyruk: 'KANIT başka soru' })
  assert.equal(a.length, 4)
  assert.equal(a.filter((x) => x.onbellek).length, 3)
  assert.deepEqual(a.slice(0, 3), b.slice(0, 3))
  assert.equal(a[3].onbellek, undefined)
  assert.equal(a[2].metin.includes('KESİN'), false)
  assert.equal(a[0].metin.includes('Ayla'), false)
  assert.equal(a[1].metin.includes('Ayla'), true)
})

test('boş dosya üçüncü kırılma açmaz', () => {
  const b = asistanOnbellekBloklari({ global: 'G', hekim: 'H', kararli: '   ', kuyruk: 'gün' })
  assert.equal(b.length, 3)
  assert.equal(b[2].onbellek, undefined)
  assert.equal(b[2].metin, 'gün')
})
