import { test } from 'node:test'
import assert from 'node:assert/strict'
import { onbellekAnahtari, surumHash, tazeMi, tekUcus } from './dosyaOnbellek'

test('önbellek anahtarı doctor_id + patient_id; çapraz doktor ayrı', () => {
  const a = onbellekAnahtari('dok-a', 'hasta-1')
  const b = onbellekAnahtari('dok-b', 'hasta-1')
  assert.notEqual(a.doctor_id, b.doctor_id)
  assert.equal(a.patient_id, b.patient_id)
})

test('kirli veya boş satır taze değil; dolu + kirli=false taze', () => {
  assert.equal(tazeMi(null), false)
  assert.equal(tazeMi({ kirli: true, paket_metin: 'x' }), false)
  assert.equal(tazeMi({ kirli: false, paket_metin: '' }), false)
  assert.equal(tazeMi({ kirli: false, paket_metin: 'dosya' }), true)
})

test('invalidate: kirli=true tazeMi false (miss)', () => {
  const once = { kirli: false, paket_metin: 'eski' }
  assert.equal(tazeMi(once), true)
  const sonra = { ...once, kirli: true }
  assert.equal(tazeMi(sonra), false)
})

test('arşivlenmiş vizit pakette yok — derleme metni arşiv satırı içermez', () => {
  const metin = 'Vizit: 12 Mayıs 2026\nŞikayet: öksürük'
  assert.doesNotMatch(metin, /arsiv|archived/i)
  const hash = surumHash(metin, [{ tur: 'vizit', arsiv: false }])
  assert.equal(hash.length, 24)
})

test('prefetch idempotent: aynı hash ikinci yazımda değişmez', () => {
  const h1 = surumHash('aynı paket', [1, 2])
  const h2 = surumHash('aynı paket', [1, 2])
  assert.equal(h1, h2)
})

test('tekUcus aynı anahtarda tek derleme', async () => {
  const harita = new Map<string, Promise<number>>()
  let n = 0
  const uret = () => new Promise<number>((resolve) => {
    n += 1
    setTimeout(() => resolve(n), 15)
  })
  const p1 = tekUcus(harita, 'dok:hasta', uret)
  const p2 = tekUcus(harita, 'dok:hasta', uret)
  const [a, b] = await Promise.all([p1, p2])
  assert.equal(n, 1)
  assert.equal(a, 1)
  assert.equal(b, 1)
  const c = await tekUcus(harita, 'dok:hasta', uret)
  assert.equal(n, 2)
  assert.equal(c, 2)
})

test('NOTYA-AYSE-100 D2 — a cached card whose next appointment has passed is stale', async () => {
  {
    const { sonrakiRandevuGecmisMi } = await import('./dosyaOnbellek')
    const simdi = new Date('2026-09-29T20:00:00Z')
    assert.equal(sonrakiRandevuGecmisMi('27 Eylül 2026 — muayene', simdi), true)
    assert.equal(sonrakiRandevuGecmisMi('30 Eylül 2026 — kontrol', simdi), false)
    assert.equal(sonrakiRandevuGecmisMi('randevu yok', simdi), false)
    assert.equal(tazeMi({ kirli: false, paket_metin: 'x', kart_json: { randevu: '27 Eylül 2026 — muayene' } }, simdi), false)
    assert.equal(tazeMi({ kirli: false, paket_metin: 'x', kart_json: { randevu: 'randevu yok' } }, simdi), true)
  }
})
