/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — country port: the shared request path refreshes once on a 401 and retries
 * once; a session that cannot be renewed goes to /login with a return path; a network failure logs nobody out;
 * the return path never leaves this country build; the notice exists in every language of the pack.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ulkeOturumluFetchKur, ulkeGuvenliNext, ulkeGirisYolu, ulkeGirisSorgusu, type UlkeJeton } from './oturumFetch'
import { oturumDolduMetni } from '../../components/ulke/oturumDolduMetinleri'
import { ulkeYolu } from './yol'
import { AKTIF_PAKET } from '../../countries/active'

function kur(jetonlar: UlkeJeton[], sunucu: (auth: string | null) => number) {
  const auths: Array<string | null> = []
  let bitti = 0
  const f = ulkeOturumluFetchKur({
    jetonCoz: async () => jetonlar.shift() ?? { durum: 'bitti' },
    fetch: (async (_i: RequestInfo | URL, init?: RequestInit) => {
      const a = new Headers(init?.headers).get('Authorization'); auths.push(a)
      return new Response('{}', { status: sunucu(a) })
    }) as typeof fetch,
    oturumBitti: () => { bitti++ },
  })
  return { f, auths, bitti: () => bitti }
}

test('ulkeFetch: expired token → 401 → refreshSession → retry succeeds', async () => {
  const k = kur([{ durum: 'tamam', jeton: 'old' }, { durum: 'tamam', jeton: 'new' }], (a) => (a === 'Bearer new' ? 200 : 401))
  assert.equal((await k.f(ulkeYolu('/api/ulke/hesap'))).status, 200)
  assert.deepEqual(k.auths, ['Bearer old', 'Bearer new'])
  assert.equal(k.bitti(), 0)
})

test('ulkeFetch: refresh refused → session-expired path (login with a return path), no retry', async () => {
  const k = kur([{ durum: 'tamam', jeton: 'old' }, { durum: 'bitti' }], () => 401)
  assert.equal((await k.f('/api/ulke/hesap')).status, 401)
  assert.equal(k.auths.length, 1)
  assert.equal(k.bitti(), 1)
})

test('ulkeFetch: no session → expired path without calling the API', async () => {
  const k = kur([{ durum: 'bitti' }], () => 200)
  assert.equal((await k.f('/api/ulke/hesap')).status, 401)
  assert.equal(k.auths.length, 0)
  assert.equal(k.bitti(), 1)
})

test('ulkeFetch: refresh failed on the network → 401 returned, nobody logged out', async () => {
  const k = kur([{ durum: 'tamam', jeton: 'old' }, { durum: 'gecici' }], () => 401)
  assert.equal((await k.f('/api/ulke/hesap')).status, 401)
  assert.equal(k.bitti(), 0)
})

test('return path: internal paths of this build only (no open redirect)', () => {
  const ic = ulkeYolu('/patients')
  assert.equal(ulkeGuvenliNext(ic), ic)
  for (const kotu of ['https://evil.com', '//evil.com', '/\\evil.com', '%2F%2Fevil.com', '/\t/evil.com', 'javascript:alert(1)', ulkeYolu('/login'), '', null]) {
    assert.equal(ulkeGuvenliNext(kotu as string), null, String(kotu))
  }
  if (AKTIF_PAKET.yolOnEki) assert.equal(ulkeGuvenliNext('/dashboard/doktor'), null, 'another build\'s path is refused')
  assert.equal(ulkeGirisYolu(ic), `${ulkeYolu('/login')}?oturum=expired&next=${encodeURIComponent(ic)}`)
  assert.deepEqual(ulkeGirisSorgusu(`?oturum=expired&next=${encodeURIComponent(ic)}`), { next: ic, doldu: true })
  assert.deepEqual(ulkeGirisSorgusu('?next=https%3A%2F%2Fevil.com'), { next: null, doldu: false })
})

test('notice: every country language has its own sentence, never Turkish', () => {
  const diller = ['en-US', 'en-GB', 'en-CA', 'en-AU', 'en-NZ', 'uz-Latn', 'uz-Cyrl', 'ru'] as const
  for (const d of diller) {
    const n = oturumDolduMetni(d).notice
    assert.ok(n.length > 10, d)
    assert.ok(!/[ğışİĞŞ]|süresi|giriş/i.test(n), `${d}: no Turkish`)
  }
  assert.notEqual(oturumDolduMetni('ru').notice, oturumDolduMetni('en-US').notice)
  assert.notEqual(oturumDolduMetni('uz-Latn').notice, oturumDolduMetni('uz-Cyrl').notice)
  assert.equal(oturumDolduMetni('tr').notice, oturumDolduMetni('en-US').notice, 'tr falls back: no Turkish in a country build')
})

// ---- guard: no hand-built Bearer header in country browser code ------------------------------------------------
const KOKLER = ['components/ulke', 'lib/ulke', 'app']
const IZINLI = new Set(['lib/ulke/oturumFetch.ts'])
const IZINLI_ONEK = ['app/api/', 'lib/ulke/fatura/', 'lib/ulke/asistan/', 'lib/ulke/sunucuOturum', 'lib/ulke/portal/giris', 'lib/ulke/testing/']
function dosyalar(d: string, c: string[] = []): string[] {
  for (const ad of readdirSync(d)) {
    if (ad === 'node_modules' || ad.startsWith('.')) continue
    const y = join(d, ad)
    if (statSync(y).isDirectory()) dosyalar(y, c)
    else if (/\.(ts|tsx)$/.test(ad) && !/\.test\.tsx?$/.test(ad)) c.push(y.replace(/\\/g, '/'))
  }
  return c
}
test('guard: country browser code builds no Authorization: Bearer header outside lib/ulke/oturumFetch.ts', () => {
  const desen = /Authorization['"]?\s*[:,]\s*(`Bearer|['"]Bearer)|setRequestHeader\(\s*['"]Authorization/i
  const bulunan: string[] = []
  for (const d of KOKLER.flatMap((k) => dosyalar(k))) {
    if (IZINLI.has(d) || IZINLI_ONEK.some((o) => d.startsWith(o))) continue
    if (d.startsWith('app/') && !/\.ulke\.tsx?$/.test(d)) continue // Türkiye routes are not part of a country build
    readFileSync(d, 'utf8').split('\n').forEach((s, i) => {
      const t = s.trim()
      if (!t.startsWith('//') && !t.startsWith('*') && desen.test(s)) bulunan.push(`${d}:${i + 1}: ${t.slice(0, 110)}`)
    })
  }
  assert.deepEqual(bulunan, [], `use ulkeFetch (lib/ulke/oturumFetch.ts):\n${bulunan.join('\n')}`)
})
