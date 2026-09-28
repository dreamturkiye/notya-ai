import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asistanOnbellekBloklari } from './onbellekBloklari'

test('soru kuyruğu sabit öneki bozmaz; hasta ve hafıza önbelleğe yazılmaz', () => {
  const ortak = { global: 'GLOBAL', hekim: 'HİTAP Ayla', kararli: 'HAFIZA\nDOSYA GÖVDE' }
  const a = asistanOnbellekBloklari({ ...ortak, kuyruk: 'KESİN aşı listesi' })
  const b = asistanOnbellekBloklari({ ...ortak, kuyruk: 'KANIT başka soru' })
  assert.equal(a.length, 3)
  assert.equal(a.filter((x) => x.onbellek).length, 2)
  assert.deepEqual(a.slice(0, 2), b.slice(0, 2))
  assert.equal(a[2].onbellek, undefined)
  assert.equal(a[2].metin.includes('DOSYA GÖVDE'), true)
  assert.equal(a[2].metin.includes('KESİN'), true)
  assert.equal(b[2].metin.includes('KANIT'), true)
  assert.equal(a[0].metin.includes('Ayla'), false)
  assert.equal(a[1].metin.includes('Ayla'), true)
  assert.equal(a[0].metin.includes('DOSYA'), false)
})

test('boş kararlı blok kuyruğu düşürmez', () => {
  const b = asistanOnbellekBloklari({ global: 'G', hekim: 'H', kararli: '   ', kuyruk: 'gün' })
  assert.equal(b.length, 3)
  assert.equal(b[2].onbellek, undefined)
  assert.equal(b[2].metin, 'gün')
})
