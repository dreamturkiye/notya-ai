import test from 'node:test'
import assert from 'node:assert/strict'
import { KIMLIK_GIZLENEMEDI, sinirliHavuz, sinirliKuyruk, topluIsle, type BatchBelge } from './otoBatch'
import { notaBloklariUygula, type BlokGirdi } from './notaBlok'

const belgeler: BatchBelge[] = [0, 1, 2, 3].map((i) => ({ belgeId: `d${i}`, ad: `us${i}.jpg`, yuklemeSirasi: i }))
const girdi = (id: string, i: number): BlokGirdi => ({ belgeId: id, etiket: 'Ultrason', tarih: '20.10.2026', yuklemeSirasi: i, bulgular: [`Bulgu ${i}`] })

test('N=4: all succeed -> exactly ONE write containing four blocks in upload order', async () => {
  let yazim = 0; let yazilan: BlokGirdi[] = []
  const r = await topluIsle(belgeler, {
    maskele: async () => ({ ok: true, yuk: 1 }),
    degerlendir: async (b) => { await new Promise((x) => setTimeout(x, (4 - b.yuklemeSirasi) * 3)); return { ok: true, girdi: girdi(b.belgeId, b.yuklemeSirasi) } },
    yaz: async (g) => { yazim++; yazilan = g },
  })
  assert.equal(yazim, 1); assert.equal(r.yazimSayisi, 1)
  assert.equal(r.genel.eklenen, 4)
  const metin = notaBloklariUygula('', yazilan).metin
  assert.deepEqual(metin.match(/Ultrason \d\/4/g), ['Ultrason 1/4', 'Ultrason 2/4', 'Ultrason 3/4', 'Ultrason 4/4'])
  assert.deepEqual(metin.match(/Bulgu \d/g), ['Bulgu 0', 'Bulgu 1', 'Bulgu 2', 'Bulgu 3']) // finished out of order, written in order
})

test('partial failure: masking failure and evaluation error do not block the others; failed ones are marked', async () => {
  let yazilan: BlokGirdi[] = []; let yazim = 0
  const aciklar: string[] = []
  const r = await topluIsle(belgeler, {
    maskele: async (b) => (b.belgeId === 'd1' ? { ok: false, neden: KIMLIK_GIZLENEMEDI } : { ok: true, yuk: 1 }),
    degerlendir: async (b) => (b.belgeId === 'd2' ? { ok: false, neden: 'model hatası' } : { ok: true, girdi: girdi(b.belgeId, b.yuklemeSirasi) }),
    yaz: async (g) => { yazim++; yazilan = g },
    durum: (id, a) => aciklar.push(`${id}:${a}`),
  })
  assert.equal(yazim, 1)
  assert.deepEqual(yazilan.map((x) => x.belgeId).sort(), ['d0', 'd3'])
  assert.equal(r.belgeler.find((x) => x.belgeId === 'd1')?.asama, 'atlandi')
  assert.equal(r.belgeler.find((x) => x.belgeId === 'd1')?.not, KIMLIK_GIZLENEMEDI)
  assert.equal(r.belgeler.find((x) => x.belgeId === 'd2')?.asama, 'hata')
  assert.deepEqual(r.genel, { toplam: 4, eklenen: 2, atlanan: 1, hatali: 1 })
  assert.ok(aciklar.includes('d1:maskeleniyor') && aciklar.includes('d0:degerlendiriliyor') && aciklar.includes('d0:nota_eklendi'))
})

test('masking fallback: when masking throws, nothing is evaluated (never sent) and no write happens', async () => {
  let degerlendirildi = 0; let yazim = 0
  const r = await topluIsle(belgeler, {
    maskele: async () => { throw new Error('ocr timeout') },
    degerlendir: async (b) => { degerlendirildi++; return { ok: true, girdi: girdi(b.belgeId, 0) } },
    yaz: async () => { yazim++ },
  })
  assert.equal(degerlendirildi, 0); assert.equal(yazim, 0)
  assert.equal(r.genel.atlanan, 4)
})

test('write failure marks the written documents as errors (they stay in Belgeler)', async () => {
  const r = await topluIsle(belgeler.slice(0, 2), { maskele: async () => ({ ok: true, yuk: 1 }), degerlendir: async (b) => ({ ok: true, girdi: girdi(b.belgeId, 0) }), yaz: async () => { throw new Error('db') } })
  assert.equal(r.genel.hatali, 2)
})

test('concurrency is bounded', async () => {
  let aktif = 0, tepe = 0
  await sinirliHavuz(Array.from({ length: 8 }, () => async () => { aktif++; tepe = Math.max(tepe, aktif); await new Promise((x) => setTimeout(x, 5)); aktif-- }), 3)
  assert.ok(tepe <= 3 && tepe >= 2)
  aktif = 0; tepe = 0
  const k = sinirliKuyruk(2)
  await Promise.all(Array.from({ length: 6 }, () => k(async () => { aktif++; tepe = Math.max(tepe, aktif); await new Promise((x) => setTimeout(x, 5)); aktif-- })))
  assert.ok(tepe <= 2)
})
