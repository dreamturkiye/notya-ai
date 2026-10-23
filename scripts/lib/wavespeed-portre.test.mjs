import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildRequest, submitTask, pollTask, downloadImage, mapLimit, uretildiGuncelle, DEFAULT_MODEL, WAVESPEED_BASE } from './wavespeed-portre.mjs'

const res = (status, json) => ({ ok: status < 400, status, json: async () => json, arrayBuffer: async () => new ArrayBuffer(2048) })
const noSleep = async () => {}
const KEY = 'SECRET-KEY-123'

describe('wavespeed portrait helpers (mocked fetch)', () => {
  it('buildRequest: model url, square size, prompt keeps the persona prompt and adds framing', () => {
    const r = buildRequest({ istem: 'Portrait of X. AI-generated fictional person' })
    assert.equal(r.url, `${WAVESPEED_BASE}/${DEFAULT_MODEL}`)
    assert.match(r.body.prompt, /^Portrait of X/); assert.match(r.body.prompt, /head-and-shoulders/)
    assert.equal(r.body.size, '2048*2048'); assert.equal(r.body.enable_sync_mode, false)
    assert.equal(buildRequest({ istem: 'a' }, { model: 'm/x', size: '1024*1024' }).url, `${WAVESPEED_BASE}/m/x`)
  })
  it('submitTask: returns id, sends bearer, retries 500 then succeeds', async () => {
    const calls = []
    const f = async (u, o) => { calls.push(o); return calls.length === 1 ? res(500, {}) : res(200, { code: 200, data: { id: 'T1' } }) }
    assert.equal(await submitTask({ url: 'u', body: {} }, KEY, { fetchImpl: f, sleep: noSleep }), 'T1')
    assert.equal(calls.length, 2); assert.equal(calls[1].headers.Authorization, `Bearer ${KEY}`)
  })
  it('submitTask: 401 is fatal (no retry) and the error never contains the key', async () => {
    let n = 0
    await assert.rejects(submitTask({ url: 'u', body: {} }, KEY, { fetchImpl: async () => { n++; return res(401, { message: 'bad key' }) }, sleep: noSleep }), (e) => { assert.ok(!e.message.includes(KEY)); return /401/.test(e.message) })
    assert.equal(n, 1)
  })
  it('pollTask: processing -> completed returns the first output', async () => {
    const seq = [{ status: 'processing' }, { status: 'processing' }, { status: 'completed', outputs: ['https://x/a.png'] }]
    let i = 0
    assert.equal(await pollTask('T1', KEY, { fetchImpl: async () => res(200, { data: seq[i++] }), sleep: noSleep }), 'https://x/a.png')
    assert.equal(i, 3)
  })
  it('pollTask: failed throws; timeout throws; transient network errors are tolerated', async () => {
    await assert.rejects(pollTask('T', KEY, { fetchImpl: async () => res(200, { data: { status: 'failed', error: 'nsfw' } }), sleep: noSleep }), /generation failed: nsfw/)
    let t = 0
    await assert.rejects(pollTask('T', KEY, { fetchImpl: async () => res(200, { data: { status: 'processing' } }), sleep: noSleep, now: () => (t += 100_000), maxMs: 300_000 }), /timeout/)
    let k = 0
    const f = async () => { if (k++ < 2) throw new Error('net'); return res(200, { data: { status: 'completed', outputs: ['u'] } }) }
    assert.equal(await pollTask('T', KEY, { fetchImpl: f, sleep: noSleep }), 'u')
  })
  it('downloadImage: returns a buffer; error text has no URL', async () => {
    assert.equal((await downloadImage('https://t/?token=abc', { fetchImpl: async () => res(200, {}), sleep: noSleep })).length, 2048)
    await assert.rejects(downloadImage('https://t/?token=abc', { fetchImpl: async () => res(404, {}), sleep: noSleep }), (e) => !e.message.includes('token'))
  })
  it('mapLimit: never exceeds the limit, keeps order, captures errors', async () => {
    let cur = 0, max = 0
    const out = await mapLimit([1, 2, 3, 4, 5, 6, 7], 3, async (n) => { cur++; max = Math.max(max, cur); await new Promise((r) => setTimeout(r, 5)); cur--; if (n === 4) throw new Error('boom'); return n * 2 })
    assert.equal(max, 3); assert.deepEqual(out.map((o) => o.ok), [true, true, true, false, true, true, true]); assert.equal(out[6].value, 14); assert.equal(out[3].error, 'boom')
  })
  it('uretildiGuncelle: merges, sorts, is idempotent', () => {
    const src = "export const AU_PORTRE_URETILDI: ReadonlySet<string> = new Set<string>([])\nx"
    const a = uretildiGuncelle(src, ['paediatrics', 'cardiology'])
    assert.match(a, /'cardiology', 'paediatrics'/)
    assert.equal(uretildiGuncelle(a, ['cardiology']), a)
    assert.match(uretildiGuncelle(a, ['audiology']), /'audiology', 'cardiology', 'paediatrics'/)
    assert.throws(() => uretildiGuncelle('nothing', ['a']))
  })
})
