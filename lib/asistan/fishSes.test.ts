import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FISH_ASR_DIL, FISH_HIZ, FISH_KLIP_MIN_MS, FISH_MODEL, asrKlipDenetle, ayseFishTamMi, fishAsrDilKoduUyumluMu, fishAsrDilUyumluMu, fishAsrDosyaAdi, fishAsrGovde, fishAsrMetni, fishAsrYenidenDenenirMi, fishIstegi, fishMetni, fishSayiOku, fishRakamlariOku } from './fishSes'
import { pcmdenWav } from './fishMikrofon'

function msgpackAsrOku(b: Uint8Array): { audio: Uint8Array; language: string; ignore_timestamps: boolean } {
  let i = 0
  if (b[i++] !== 0x83) throw new Error('map')
  const alan: Record<string, unknown> = {}
  for (let k = 0; k < 3; k++) {
    const t = b[i++]
    if ((t & 0xe0) !== 0xa0) throw new Error('key')
    const kn = t & 0x1f
    const ad = new TextDecoder().decode(b.subarray(i, i + kn))
    i += kn
    const v = b[i]
    if (v === 0xc3 || v === 0xc2) {
      alan[ad] = v === 0xc3
      i += 1
    } else if ((v & 0xe0) === 0xa0) {
      const n = v & 0x1f
      alan[ad] = new TextDecoder().decode(b.subarray(i + 1, i + 1 + n))
      i += 1 + n
    } else if (v === 0xc4) {
      const n = b[i + 1]
      alan[ad] = b.subarray(i + 2, i + 2 + n)
      i += 2 + n
    } else if (v === 0xc5) {
      const n = (b[i + 1] << 8) | b[i + 2]
      alan[ad] = b.subarray(i + 3, i + 3 + n)
      i += 3 + n
    } else if (v === 0xc6) {
      const n = (b[i + 1] << 24) | (b[i + 2] << 16) | (b[i + 3] << 8) | b[i + 4]
      alan[ad] = b.subarray(i + 5, i + 5 + n)
      i += 5 + n
    } else {
      throw new Error('val')
    }
  }
  return alan as { audio: Uint8Array; language: string; ignore_timestamps: boolean }
}

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

test('ASR isteği Türkçeye sabit, tekrar kuralı yalnız ağ / 5xx', () => {
  const ses = new Uint8Array([1, 2, 3, 4, 5])
  const govde = fishAsrGovde(ses)
  assert.equal(govde[0], 0x83)
  const okunan = msgpackAsrOku(govde)
  assert.deepEqual(okunan.audio, ses)
  assert.equal(okunan.language, 'tr')
  assert.equal(okunan.language, FISH_ASR_DIL)
  assert.equal(okunan.ignore_timestamps, true)
  const buyuk = new Uint8Array(400)
  buyuk[0] = 9
  buyuk[399] = 8
  assert.deepEqual(msgpackAsrOku(fishAsrGovde(buyuk)).audio, buyuk)
  const uzun = new Uint8Array(70_000)
  uzun[0] = 1
  uzun[69_999] = 2
  const uzunOkunan = msgpackAsrOku(fishAsrGovde(uzun))
  assert.equal(uzunOkunan.language, 'tr')
  assert.equal(uzunOkunan.audio[0], 1)
  assert.equal(uzunOkunan.audio[69_999], 2)
  assert.equal(fishAsrYenidenDenenirMi(null), true)
  assert.equal(fishAsrYenidenDenenirMi(502), true)
  assert.equal(fishAsrYenidenDenenirMi(400), false)
  assert.equal(fishAsrYenidenDenenirMi(429), false)
})

test('çöp klip Fish\'e gitmez: boş, kısa, sessiz; gerçek konuşma geçer', async () => {
  const hz = 16000
  const wav = async (saniye: number, genlik: number) => {
    const n = Math.round(hz * saniye)
    const o = new Float32Array(n)
    for (let i = 0; i < n; i++) o[i] = genlik * Math.sin((i / hz) * 2 * Math.PI * 220)
    return new Uint8Array(await pcmdenWav([o], hz).arrayBuffer())
  }
  assert.equal(asrKlipDenetle(new Uint8Array(0), 'audio/wav').neden, 'bos')
  assert.equal(asrKlipDenetle(new Uint8Array(30), 'audio/wav').neden, 'bozuk')
  const kisa = asrKlipDenetle(await wav(0.3, 0.3), 'audio/wav')
  assert.equal(kisa.uygun, false)
  assert.equal(kisa.neden, 'kisa')
  assert.ok(kisa.sureMs != null && kisa.sureMs < FISH_KLIP_MIN_MS)
  const sessiz = asrKlipDenetle(await wav(1.2, 0.001), 'audio/wav')
  assert.equal(sessiz.neden, 'sessiz')
  const iyi = asrKlipDenetle(await wav(1.2, 0.2), 'audio/wav')
  assert.equal(iyi.uygun, true)
  assert.ok(iyi.sureMs != null && Math.abs(iyi.sureMs - 1200) <= 2)
  assert.ok(iyi.rms != null && iyi.rms > 0.1)
  assert.equal(asrKlipDenetle(new Uint8Array(500), 'audio/webm').neden, 'kisa_bayt')
  assert.equal(asrKlipDenetle(new Uint8Array(5000), 'audio/webm').uygun, true)
})

test('fishAsrDilUyumluMu — non-Latin script or empty transcript is junk', () => {
  assert.equal(fishAsrDilUyumluMu('Hastamız kaç yaşında hocam?'), true)
  assert.equal(fishAsrDilUyumluMu('Kaan Arıoğlu\'nun dosyasını açar mısın'), true)
  assert.equal(fishAsrDilUyumluMu('Bugün mesajlarımız var mı? Bakar mısın?'), true)
  assert.equal(fishAsrDilUyumluMu('کان رو از کجا شنودم؟'), false)
  assert.equal(fishAsrDilUyumluMu('Привет как дела'), false)
  assert.equal(fishAsrDilUyumluMu('你好'), false)
  assert.equal(fishAsrDilUyumluMu(''), false)
  assert.equal(fishAsrDilUyumluMu('... ?'), false)
  assert.equal(fishAsrDilUyumluMu('paracetamol 15 mg/kg'), true)
  assert.equal(fishAsrDilUyumluMu('José\'nin dosyası'), true)
  assert.equal(fishAsrDilUyumluMu('Pekin bukýn, hřib, mesaž, masáž, má.'), false)
  assert.equal(fishAsrDilKoduUyumluMu(null), true)
  assert.equal(fishAsrDilKoduUyumluMu('tr'), true)
  assert.equal(fishAsrDilKoduUyumluMu('cs'), false)
  assert.equal(fishAsrDilKoduUyumluMu('zh'), false)
})
