import { test } from 'node:test'
import assert from 'node:assert/strict'
import { girdiDogrula, testSonucuYorumla, ayarBransKodu } from './ayar'

test('girdiDogrula: TC 11 hane, tesis 6-10 hane, branş, ortam, imza', () => {
  assert.deepEqual(girdiDogrula({ doktorTc: '12345678901', tesisKodu: '11068891', bransKodu: '1600', ortam: 'gercek', imzaYontemi: 'token', sifre: 'abcd12' }), [])
  const h = girdiDogrula({ doktorTc: '123', tesisKodu: '12', bransKodu: 'ab', ortam: 'prod', imzaYontemi: 'x', sifre: '1' })
  assert.equal(h.length, 6)
  assert.deepEqual(girdiDogrula({}), []) // boş girdi = değişiklik yok
})

test('testSonucuYorumla: yetki hatası / ulaşılamadı / doğrulandı', () => {
  assert.equal(testSonucuYorumla({ sonucKodu: 'PARSE', sonucMesaji: 'HTTP 401: Unauthorized' }).durum, 'kimlik_hatali')
  assert.equal(testSonucuYorumla({ sonucKodu: '1', sonucMesaji: 'Kullanıcı adı veya şifre hatalı' }).durum, 'kimlik_hatali')
  assert.equal(testSonucuYorumla({ sonucKodu: 'PARSE', sonucMesaji: 'fetch failed' }).durum, 'hata')
  assert.equal(testSonucuYorumla({ sonucKodu: '1', sonucMesaji: 'Reçete bulunamadı' }).durum, 'baglandi')
})

test('ayarBransKodu: yalnız pozitif sayı', () => {
  assert.equal(ayarBransKodu({ bransKodu: 1600 }), 1600)
  assert.equal(ayarBransKodu({ bransKodu: 0 }), null)
  assert.equal(ayarBransKodu(null), null)
})
