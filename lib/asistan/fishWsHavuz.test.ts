import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FishWsHavuz } from './fishWsHavuz'
import type { FishWsOturumu } from './fishWsSunucu'

function sahte(acilis: number, simdi: () => number, kapali = false): FishWsOturumu & { kapatildi: number } {
  const o = {
    kapatildi: 0,
    bagla: () => {},
    yas: () => simdi() - acilis,
    metin: () => true,
    bitir: async () => {},
    kapat: () => { o.kapatildi += 1 },
    acik: () => !kapali && o.kapatildi === 0,
    bayt: () => 0,
  }
  return o
}

test('havuz: hazirla opens one socket; al takes it while fresh and opens nothing new', async () => {
  let saat = 1000
  const simdi = () => saat
  const acilan: number[] = []
  const havuz = new FishWsHavuz(async () => { acilan.push(saat); return sahte(saat, simdi) }, 120_000, simdi)
  havuz.hazirla('k')
  havuz.hazirla('k') // second call is a no-op while the first is fresh
  assert.equal(havuz.bekleyenVarMi(), true)
  saat += 30_000
  const r = await havuz.al('k')
  assert.equal(r.havuzdan, true)
  assert.deepEqual(acilan, [1000])
  assert.equal(havuz.bekleyenVarMi(), false)
})

test('havuz: a socket older than the idle limit is dropped and a fresh one opened for the turn', async () => {
  let saat = 0
  const simdi = () => saat
  const acilanlar: ReturnType<typeof sahte>[] = []
  const havuz = new FishWsHavuz(async () => { const o = sahte(saat, simdi); acilanlar.push(o); return o }, 120_000, simdi)
  havuz.hazirla('k')
  saat = 121_000
  const r = await havuz.al('k')
  assert.equal(r.havuzdan, false)
  assert.equal(acilanlar.length, 2)
  assert.equal(acilanlar[0].kapatildi, 1, 'stale pooled socket is closed')
  assert.equal(r.oturum, acilanlar[1])
})

test('havuz: a pooled socket that died while waiting is skipped; a failed pre-open never breaks the turn', async () => {
  let saat = 0
  const simdi = () => saat
  let n = 0
  const havuz = new FishWsHavuz(async () => { n += 1; if (n === 1) return sahte(saat, simdi, true); if (n === 2) throw new Error('ws_acilis_zaman'); return sahte(saat, simdi) }, 120_000, simdi)
  havuz.hazirla('k') // n=1: opens but is dead by the time the turn arrives
  await assert.rejects(havuz.al('k'), /ws_acilis_zaman/) // dead socket skipped → fresh open (n=2) throws, like today
  havuz.hazirla('k') // n=3 ok
  const r2 = await havuz.al('k')
  assert.equal(r2.havuzdan, true)
  assert.equal(n, 3)
  // pre-open failure is swallowed: the turn opens its own socket
  let m = 0
  const havuz2 = new FishWsHavuz(async () => { m += 1; if (m === 1) throw new Error('http_429'); return sahte(saat, simdi) }, 120_000, simdi)
  havuz2.hazirla('k')
  const r3 = await havuz2.al('k')
  assert.equal(r3.havuzdan, false)
  assert.equal(m, 2)
})

test('havuz: hazirla after a stale pending socket replaces it', async () => {
  let saat = 0
  const simdi = () => saat
  const acilanlar: ReturnType<typeof sahte>[] = []
  const havuz = new FishWsHavuz(async () => { const o = sahte(saat, simdi); acilanlar.push(o); return o }, 60_000, simdi)
  havuz.hazirla('k')
  saat = 61_000
  havuz.hazirla('k')
  await Promise.resolve()
  assert.equal(acilanlar.length, 2)
  const r = await havuz.al('k')
  assert.equal(r.havuzdan, true)
  assert.equal(r.oturum, acilanlar[1])
  assert.equal(acilanlar[0].kapatildi, 1)
})
