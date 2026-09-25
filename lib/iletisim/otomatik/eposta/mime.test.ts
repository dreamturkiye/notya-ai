import { test } from 'node:test'
import assert from 'node:assert/strict'
import { baslikKodla, epostaGecerliMi, epostaMesaji, govdeKodla } from './mime'

function kelimeCoz(kodlu: string): string {
  return kodlu
    .split('\r\n ')
    .map((k) => {
      const m = /^=\?UTF-8\?B\?([A-Za-z0-9+/=]+)\?=$/.exec(k)
      assert.ok(m, `geçersiz encoded-word: ${k}`)
      return Buffer.from(m[1], 'base64').toString('utf8')
    })
    .join('')
}

test('baslikKodla: ASCII olduğu gibi kalır', () => {
  assert.equal(baslikKodla('Appointment reminder'), 'Appointment reminder')
})

test('baslikKodla: Türkçe konu RFC 2047 ile kodlanır ve aynen geri çözülür', () => {
  const konu = 'Randevunuz yarın saat 14:30 — Dr. Gökhan Işık, Çocuk Sağlığı ve Hastalıkları İzmir Şubesi'
  const kodlu = baslikKodla(konu)
  assert.notEqual(kodlu, konu)
  assert.ok(/^[\x20-\x7e\r\n]*$/.test(kodlu), 'başlıkta ASCII dışı karakter kaldı')
  for (const k of kodlu.split('\r\n ')) assert.ok(k.length <= 75, `encoded-word 75'i aşıyor: ${k.length}`)
  assert.equal(kelimeCoz(kodlu), konu)
})

test('baslikKodla: çok baytlı harf iki kelimeye bölünmez', () => {
  const konu = 'ğ'.repeat(60)
  const kodlu = baslikKodla(konu)
  // her kelime tek başına geçerli UTF-8 olmalı
  for (const k of kodlu.split('\r\n ')) {
    const b64 = /\?B\?(.+)\?=/.exec(k)![1]
    assert.ok(!Buffer.from(b64, 'base64').toString('utf8').includes('�'))
  }
  assert.equal(kelimeCoz(kodlu), konu)
})

test('baslikKodla: satır sonu ile başlık enjekte edilemez', () => {
  assert.equal(baslikKodla('Merhaba\r\nBcc: kurban@ornek.com'), 'Merhaba Bcc: kurban@ornek.com')
})

test('epostaMesaji: başlıklar, UTF-8 gövde, CRLF', () => {
  const ham = epostaMesaji({ alici: 'hasta@ornek.com', konu: 'Hatırlatma', metin: 'Merhaba Ayşe Hanım,\nRandevunuz yarın.' })
  const [basliklar, govde] = ham.split('\r\n\r\n')
  assert.ok(!basliklar.includes('From:'), 'From yazılmamalı — Gmail hesabın kendi adını koyar')
  assert.match(basliklar, /^To: hasta@ornek\.com$/m)
  assert.match(basliklar, /^Subject: =\?UTF-8\?B\?/m)
  assert.match(basliklar, /^Content-Type: text\/plain; charset="UTF-8"$/m)
  assert.match(basliklar, /^Content-Transfer-Encoding: base64$/m)
  assert.equal(Buffer.from(govde.replace(/\r\n/g, ''), 'base64').toString('utf8'), 'Merhaba Ayşe Hanım,\r\nRandevunuz yarın.')
})

test('govdeKodla: 76 karakterlik satırlar', () => {
  for (const s of govdeKodla('ş'.repeat(500)).split('\r\n')) assert.ok(s.length <= 76)
})

test('epostaGecerliMi', () => {
  assert.equal(epostaGecerliMi('dr.gokhan@gmail.com'), true)
  assert.equal(epostaGecerliMi('a@b'), false)
  assert.equal(epostaGecerliMi('a b@c.com'), false)
  assert.equal(epostaGecerliMi('a@c.com\r\nBcc: x@y.com'), false)
  assert.equal(epostaGecerliMi('a@c.com, x@y.com'), false)
})
