/**
 * Pure helpers for countries/au/scripts/au-portreler-wavespeed.mjs (AU-PORTRE-02). No fs, no env, no real network:
 * `fetch` and `sleep` are injected so the unit tests run offline. The API key is only ever placed in an
 * Authorization header and is never returned in an error message or log line.
 * API shape (read from the hq repo, server/lib/seedreamStack.ts): POST {BASE}/{model} -> {code:200,data:{id}};
 * GET {BASE}/predictions/{id}/result -> {data:{status:'created'|'processing'|'completed'|'failed',outputs:[url],error}}.
 */
export const WAVESPEED_BASE = 'https://api.wavespeed.ai/api/v3'
/** Text-to-image sibling of the 'bytedance/seedream-v4.5/edit' model hq already uses; override with --model. */
export const DEFAULT_MODEL = 'bytedance/seedream-v4.5'
/** Seedream 4.5 enforces a ~2K minimum; the portrait is downscaled to 1024x1024 afterwards. Override with --size. */
export const DEFAULT_SIZE = '2048*2048'
/** Matches Türkiye's /doctors/dr_<name>.jpg: tight head-and-shoulders, face large in frame, softly blurred bright clinical background. */
export const FRAMING =
  ' Framing: tight head-and-shoulders portrait like a corporate hospital website photo, face fills about half of the square frame, eyes on the upper third, shallow depth of field with a softly blurred bright clinical background, natural skin texture, photorealistic.'

export function buildRequest(g, { model = DEFAULT_MODEL, size = DEFAULT_SIZE } = {}) {
  return {
    url: `${WAVESPEED_BASE}/${model}`,
    body: { prompt: `${g.istem.replace(/plain warm cream background \(#faf6ee\) with a gentle blur/, 'bright softly blurred clinical background').replace('chest-up', 'head-and-shoulders')}${FRAMING}`, size, enable_sync_mode: false, enable_base64_output: false },
  }
}

const cut = (v) => String(typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 240)

async function withRetry(fn, { tries = 3, sleep, baseMs = 2000 }) {
  let last
  for (let i = 0; i < tries; i++) {
    try { return await fn() } catch (e) {
      last = e
      if (e.fatal || i === tries - 1) break
      await sleep(baseMs * 2 ** i)
    }
  }
  throw last
}

/** Submit one task; retries 429/5xx and network errors with backoff. Returns the task id. */
export async function submitTask(req, apiKey, { fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), tries = 3, baseMs = 2000 } = {}) {
  return withRetry(async () => {
    const r = await fetchImpl(req.url, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) })
    const j = await r.json().catch(() => ({}))
    if (r.ok && j?.data?.id) return j.data.id
    const e = new Error(`submit failed (HTTP ${r.status}): ${cut(j?.message ?? j)}`)
    e.fatal = r.status >= 400 && r.status < 500 && r.status !== 429
    throw e
  }, { tries, sleep, baseMs })
}

/** Poll until completed. Transient poll errors are tolerated; 'failed' or timeout throws. Returns the output URL (never logged). */
export async function pollTask(id, apiKey, { fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), intervalMs = 3000, maxMs = 300_000, now = Date.now } = {}) {
  const t0 = now()
  let wait = intervalMs
  let errs = 0
  while (now() - t0 < maxMs) {
    try {
      const r = await fetchImpl(`${WAVESPEED_BASE}/predictions/${id}/result`, { headers: { Authorization: `Bearer ${apiKey}` } })
      const j = await r.json().catch(() => ({}))
      const d = j?.data
      if (r.ok && d?.status === 'completed' && d.outputs?.[0]) return d.outputs[0]
      if (r.ok && d?.status === 'failed') { const e = new Error(`generation failed: ${cut(d.error || 'unknown')}`); e.fatal = true; throw e }
      if (!r.ok && r.status >= 400 && r.status < 500 && r.status !== 429) { const e = new Error(`poll rejected (HTTP ${r.status})`); e.fatal = true; throw e }
      errs = 0
    } catch (e) {
      if (e.fatal || ++errs >= 5) throw e
    }
    await sleep(wait)
    wait = Math.min(Math.round(wait * 1.25), 8000)
  }
  throw new Error('poll timeout')
}

/** Download a result image to a Buffer; retries; error text never contains the URL. */
export async function downloadImage(url, { fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), tries = 3, baseMs = 1500 } = {}) {
  return withRetry(async () => {
    const r = await fetchImpl(url)
    if (!r.ok) throw new Error(`download failed (HTTP ${r.status})`)
    const b = Buffer.from(await r.arrayBuffer())
    if (b.length < 1024) throw new Error('download too small')
    return b
  }, { tries, sleep, baseMs })
}

/** Run fn over items with at most `limit` in flight; never rejects, returns [{item, ok, value|error}] in input order. */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      try { out[i] = { item: items[i], ok: true, value: await fn(items[i], i) } } catch (e) { out[i] = { item: items[i], ok: false, error: e.message } }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

/** Idempotently merge roles into the `AU_PORTRE_URETILDI` Set literal of portreler.ts; returns the new source. */
export function uretildiGuncelle(src, roles) {
  const re = /(export const AU_PORTRE_URETILDI[^=]*=\s*new Set<string>\(\[)([^\]]*)(\]\))/
  const m = src.match(re)
  if (!m) throw new Error('AU_PORTRE_URETILDI literal not found in portreler.ts')
  const have = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])
  const all = [...new Set([...have, ...roles])].sort()
  return src.replace(re, `$1${all.length ? `\n  ${all.map((r) => `'${r}'`).join(', ')},\n` : ''}$3`)
}
