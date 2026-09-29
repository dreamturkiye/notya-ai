/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — tur kilidi: bir nonce = bir iş; iptal yalnız sesi akan tura.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TurKilidi, TurYayini, type TurOlayi } from './turKilidi'

const ertele = () => new Promise((r) => setImmediate(r))

test('aynı anahtar: iş bir kez çağrılır, iki abone aynı olayları alır (geç gelen baştan)', async () => {
  const k = new TurKilidi()
  let cagri = 0
  let devam: () => void = () => {}
  const is = async (y: TurYayini) => {
    cagri += 1
    y.yayinla({ t: 'soz', metin: 'Bir.' })
    await new Promise<void>((r) => { devam = r })
    y.yayinla({ t: 'soz', metin: 'İki.' })
  }
  const a = k.al('d|o|n1', 'o', is)
  const b = k.al('d|o|n1', 'o', is)
  assert.equal(a.yeni, true)
  assert.equal(b.yeni, false)
  const ao: TurOlayi[] = []
  const bo: TurOlayi[] = []
  a.yayin.dinle((o) => ao.push(o))
  await ertele()
  b.yayin.dinle((o) => bo.push(o))
  devam()
  await ertele(); await ertele()
  assert.equal(cagri, 1)
  assert.deepEqual(ao, bo)
  assert.deepEqual(ao.map((o) => o.t), ['soz', 'soz', 'bitti'])
  const c = k.al('d|o|n1', 'o', is)
  assert.equal(c.yeni, false, 'bitmiş tur ömrü boyunca hatırlanır')
  assert.equal(cagri, 1)
})

test('son abone ayrılınca sesi akan tur iptal edilir; biri kalırsa sürer', async () => {
  const k = new TurKilidi()
  let sinyal: AbortSignal | null = null
  const is = async (_y: TurYayini, iptal: AbortSignal) => { sinyal = iptal; await new Promise((r) => iptal.addEventListener('abort', r)) }
  const a = k.al('x', 'o', is)
  const b = k.al('x', 'o', is)
  await ertele()
  a.birak()
  assert.equal(sinyal!.aborted, false, 'bir abone hâlâ dinliyor')
  b.birak()
  assert.equal(sinyal!.aborted, true)
})

test('aynı oturumda yeni nonce: sesi hâlâ akan eski tur bırakılır; bitmiş tur ve başka oturum dokunulmaz', async () => {
  const k = new TurKilidi()
  const sinyaller: Record<string, AbortSignal> = {}
  const asili = (ad: string) => async (_y: TurYayini, iptal: AbortSignal) => { sinyaller[ad] = iptal; await new Promise((r) => iptal.addEventListener('abort', r)) }
  k.al('bitmis', 'o1', async () => {})
  k.al('eski', 'o1', asili('eski'))
  k.al('baska', 'o2', asili('baska'))
  await ertele()
  k.al('yeni', 'o1', asili('yeni'))
  await ertele()
  assert.equal(sinyaller.eski.aborted, true)
  assert.equal(sinyaller.baska.aborted, false)
  assert.equal(sinyaller.yeni.aborted, false)
})

test('ömür dolunca anahtar unutulur; iş hatası "hata" olayıyla kapanır', async () => {
  let t = 0
  const k = new TurKilidi({ omurMs: 1000, simdi: () => t })
  const y = k.al('a', 'o', async () => { throw new Error('x') }).yayin
  await ertele(); await ertele()
  assert.deepEqual(y.olaylar.map((o) => o.t), ['hata'])
  assert.equal(k.var('a'), true)
  t = 5000
  assert.equal(k.var('a'), false)
})

test('anahtar doktoru, oturumu ve nonce\'u birlikte taşır — biri değişince ayrı tur', async () => {
  const k = new TurKilidi()
  let cagri = 0
  const is = async () => { cagri += 1 }
  const anahtarlar = [
    TurKilidi.anahtar('doktor-a', 'oturum-1', 'nonce-1'),
    TurKilidi.anahtar('doktor-b', 'oturum-1', 'nonce-1'),
    TurKilidi.anahtar('doktor-a', 'oturum-2', 'nonce-1'),
    TurKilidi.anahtar('doktor-a', 'oturum-1', 'nonce-2'),
  ]
  assert.equal(new Set(anahtarlar).size, 4)
  for (const a of anahtarlar) k.al(a, a, is)
  await ertele()
  assert.equal(cagri, 4)
})
