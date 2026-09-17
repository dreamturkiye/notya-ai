/**
 * NOTYA-AVATAR-01 — avatar kapısının iki işi:
 *  1) fotoğraf yokken bile karşılama ekranı sağlam görünsün (baş harf, Türkçe doğru),
 *  2) yüklemede yalnız makul görseller geçsin (tür + boyut).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AVATAR_IZINLI_MIME,
  AVATAR_MAX_BYTES,
  AvatarGecersizError,
  avatarDataUrl,
  avatarDogrula,
  avatarMimeGecerliMi,
  doktorBasHarfleri,
} from './avatar'

test('baş harfler ad ve soyadın ilk harfini alır', () => {
  assert.equal(doktorBasHarfleri('Gökhan Yılmaz'), 'GY')
})

test('unvan baş harfe karışmaz', () => {
  assert.equal(doktorBasHarfleri('Prof. Dr. Ayşe Yılmaz'), 'AY')
  assert.equal(doktorBasHarfleri('Uzm. Dr. Gökhan Demir'), 'GD')
  assert.equal(doktorBasHarfleri('Op. Dr. Selin Kaya'), 'SK')
})

test('Türkçe büyütme: "ismail" → İ, "ışıl" → I', () => {
  // toUpperCase() burada "I" verir ve avatarda yanlış harf çıkar.
  assert.equal(doktorBasHarfleri('ismail Çetin'), 'İÇ')
  assert.equal(doktorBasHarfleri('ışıl Şahin'), 'IŞ')
})

test('ikiden fazla ad varsa ilk iki harf alınır', () => {
  assert.equal(doktorBasHarfleri('Mehmet Ali Kara'), 'MA')
})

test('ad boş/bozuksa bile kırık avatar yerine harf döner', () => {
  assert.equal(doktorBasHarfleri(''), 'D')
  assert.equal(doktorBasHarfleri('   '), 'D')
  assert.equal(doktorBasHarfleri('Dr.'), 'D')
})

test('yalnız JPEG/PNG/WebP kabul edilir', () => {
  assert.deepEqual([...AVATAR_IZINLI_MIME], ['image/jpeg', 'image/png', 'image/webp'])
  assert.ok(avatarMimeGecerliMi('image/png'))
  assert.ok(!avatarMimeGecerliMi('application/pdf'))
  assert.ok(!avatarMimeGecerliMi('image/svg+xml')) // SVG betik taşır — avatarda yeri yok
})

test('avatarDogrula geçerli görseli geçirir', () => {
  assert.doesNotThrow(() => avatarDogrula('image/jpeg', 120_000))
})

test('avatarDogrula yanlış türü Türkçe mesajla reddeder', () => {
  assert.throws(() => avatarDogrula('application/pdf', 1000), (e: unknown) => {
    assert.ok(e instanceof AvatarGecersizError)
    assert.match((e as Error).message, /JPEG, PNG, WebP/)
    return true
  })
})

test('avatarDogrula boş dosyayı reddeder', () => {
  assert.throws(() => avatarDogrula('image/png', 0), AvatarGecersizError)
})

test('avatarDogrula 4 MB sınırını uygular', () => {
  assert.doesNotThrow(() => avatarDogrula('image/png', AVATAR_MAX_BYTES))
  assert.throws(() => avatarDogrula('image/png', AVATAR_MAX_BYTES + 1), AvatarGecersizError)
})

test('avatarDataUrl img etiketine doğrudan verilebilir', () => {
  assert.equal(avatarDataUrl('image/png', 'QUJD'), 'data:image/png;base64,QUJD')
})
