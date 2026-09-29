import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FISH_HIZ, FISH_MODEL, ayseFishTamMi, fishAsrDosyaAdi, fishAsrMetni, fishIstegi, fishMetni, fishSayiOku, fishRakamlariOku } from './fishSes'

test('Fish metni cümle arasına kısa durak koyar, duygu etiketini siler', () => {
  assert.equal(fishMetni(''), '')
  assert.equal(fishMetni('   '), '')
  assert.equal(fishMetni('Tek cümle.'), 'Tek cümle.')
  assert.equal(
    fishMetni('Hocam, dosyayı açtım. Elif ateşli.'),
    'Hocam, dosyayı açtım. [break] Elif ateşli.',
  )
  assert.equal(fishMetni('[çok endişeli] Hocam, iyi haber değil. [rahat] Kusma yok.'), 'Hocam, iyi haber değil. [break] Kusma yok.')
})

test('Fish rakamları Türkçe okur — 57 fifty seven olmaz', () => {
  assert.equal(fishSayiOku(0), 'sıfır')
  assert.equal(fishSayiOku(11), 'on bir')
  assert.equal(fishSayiOku(57), 'elli yedi')
  assert.equal(fishSayiOku(100), 'yüz')
  assert.equal(fishSayiOku(2026), 'iki bin yirmi altı')
  assert.equal(fishRakamlariOku('Kaan Arioglu — dosyada yaş: 57 yaşında.'), 'Kaan Arioglu — dosyada yaş: elli yedi yaşında.')
  assert.match(fishMetni('Kaan Arioglu — dosyada yaş: 57 yaşında.'), /elli yedi yaşında/)
  assert.match(fishMetni('Kaan Arioglu — dosyada yaş: 57 yaşında.'), /,/)
  assert.doesNotMatch(fishMetni('57 yaşında'), /57/)
  assert.equal(fishIstegi('.'), null)
  assert.equal(fishIstegi('…'), null)
})

test('Fish isteği kilitli: haber sesi, hız 1, ücretsiz model, duygu yok', () => {
  const istek = fishIstegi('Amoksisilin elli miligram. Aşı yapılmaz.')
  assert.ok(istek)
  assert.equal(istek!.model, FISH_MODEL)
  assert.equal(FISH_MODEL, 's2.1-pro-free')
  const govde = istek!.govde
  assert.equal(govde.reference_id, '27d0d61d7dc8479da8dfd991ae3ad66b')
  assert.equal(govde.language, 'tr')
  assert.equal(govde.normalize, false)
  assert.equal((govde.prosody as { speed: number }).speed, FISH_HIZ)
  assert.equal(FISH_HIZ, 1)
  assert.equal(govde.temperature, 0.7)
  assert.equal(govde.latency, 'low')
  assert.equal(govde.chunk_length, 120)
  assert.equal(govde.text, 'Amoksisilin elli miligram. [break] Aşı yapılmaz.')
  assert.equal(fishIstegi('[excited]'), null)
})

test('Fish ASR düz metin — konuşmacı etiketi beyne gitmez', () => {
  assert.equal(fishAsrMetni('<|speaker:0|>Kaan Arıoğlu kaç yaşında?'), 'Kaan Arıoğlu kaç yaşında?')
  assert.equal(fishAsrMetni('[laughter] eee'), 'eee')
  assert.equal(fishAsrDosyaAdi('audio/wav'), 'tur.wav')
  assert.equal(ayseFishTamMi('aysekaya', 'key'), true)
  assert.equal(ayseFishTamMi('aysekaya', ''), false)
  assert.equal(ayseFishTamMi('mehmetdemir', 'key'), false)
})
