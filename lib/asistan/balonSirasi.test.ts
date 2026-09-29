import { test } from 'node:test'
import assert from 'node:assert/strict'
import { benzerCevapMi, cevapEkle, kullaniciEkle, type Balon } from './balonSirasi'

const ekle = (role: 'user' | 'ai', text: string, olay?: number): Balon => ({ role, text, ...(olay != null ? { olay } : {}) })

const SELAM = 'Merhaba Hocam, teşekkür ederim; iyiyim. Siz nasılsınız?'
const KAHVE = 'Çok naziksiniz Hocam! Gerçekten kahve içemem ama kahve molasında size eşlik edip sohbet edebilirim.'
const SORU = 'Ben de iyiyim. Bir kahve içelim mi sizinle bugün?'

test('ekran cevabı doktorun cümlesini kendi önüne koyar, selamın önüne değil', () => {
  const once = cevapEkle([{ role: 'ai', text: SELAM }], SORU, KAHVE, ekle)
  assert.deepEqual(once.map((m) => m.role + ':' + m.text.slice(0, 12)), [
    'ai:Merhaba Hoca',
    'user:Ben de iyiyi',
    'ai:Çok naziksin',
  ])
  const tekrar = cevapEkle(once, SORU, KAHVE, ekle)
  assert.equal(tekrar.length, 3, 'aynı tur ikinci kez eklenmez')
})

test('geç gelen kullanıcı dökümü cevabın arkasına değil önüne oturur', () => {
  const selam: Balon = { role: 'ai', text: SELAM }
  const cevap: Balon = { role: 'ai', text: KAHVE, olay: 5 }
  const sirali = kullaniciEkle([selam, cevap], SORU, 4, ekle)
  assert.deepEqual(sirali.map((m) => m.role), ['ai', 'user', 'ai'])
  assert.equal(sirali[1].text, SORU)
  const ayni = kullaniciEkle(sirali, SORU, 4, ekle)
  assert.equal(ayni.filter((m) => m.role === 'user').length, 1)
})

test('olaysız ekran balonu dururken geç gelen döküm soruyu cevabın arkasına taşımaz', () => {
  const yerlesmis = cevapEkle([{ role: 'ai', text: SELAM }], SORU, KAHVE, ekle)
  const sonra = kullaniciEkle(yerlesmis, SORU, 4, ekle)
  assert.deepEqual(sonra.map((m) => m.role), ['ai', 'user', 'ai'])
})

test('aynı izolasyonun ikinci modeli yeni balon açmaz', () => {
  const a = 'Hocam, yalnızca kendi hastalarınızın dosyalarına erişebiliyorum; başka bir hekimin hastası olan Rıdvan Dilmen\'in dosya bilgilerini görüntüleyemem.'
  const b = 'Hocam, yalnızca kendi hastalarınızın dosyalarına erişebiliyorum; başka bir hekimin hastası olan Rıdvan Dilmen\'in dosyasını açamam. Dr. Gökhan Mamur\'un kendi hesabından kontrol etmesi gerekir.'
  assert.ok(benzerCevapMi(a, b))
  const soru = 'Rıdvan Dilmen dosyasına bakabilir misin?'
  const once = cevapEkle([{ role: 'ai', text: SELAM }], soru, a, ekle)
  const tekrar = cevapEkle(once, soru, b, ekle)
  assert.equal(tekrar.filter((m) => m.role === 'ai').length, 2, 'selam + bir izolasyon')
  assert.equal(tekrar.at(-1)?.text, a)
})
