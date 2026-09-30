import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FISH_ISINMA_URL, fishIsinma } from './fishIsinma'

test('isinma: one GET on the keep-alive agent with the bearer; a gateway 404 is a successful warm-up', async () => {
  const calls: { url: string; method: string; auth: string }[] = []
  const fetcher = (async (url: string, init: { method?: string; headers?: Record<string, string> } = {}) => {
    calls.push({ url, method: init.method || '', auth: init.headers?.Authorization || '' })
    return { status: 404, ok: false, text: async () => 'no_route' }
  }) as unknown as Parameters<typeof fishIsinma>[1]
  const r = await fishIsinma('anahtar', fetcher)
  assert.deepEqual(calls, [{ url: FISH_ISINMA_URL, method: 'GET', auth: 'Bearer anahtar' }])
  assert.equal(r.durum, 404)
  assert.equal(r.hata, null)
  assert.ok(r.isinma_ms >= 0)
})

test('isinma: a transport failure is reported, never thrown', async () => {
  const fetcher = (async () => { throw new TypeError('fetch failed') }) as unknown as Parameters<typeof fishIsinma>[1]
  const r = await fishIsinma('anahtar', fetcher)
  assert.equal(r.durum, null)
  assert.equal(r.hata, 'TypeError')
})
