/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — doctors were logged out ~1 h after login. These tests pin the fix:
 * the shared request path refreshes once on a 401 and retries once; a session the auth server refuses goes to the
 * expired-session path; a network failure does not log anybody out; one refresh serves parallel callers; the
 * login return path never leaves the site.
 */
import { strict as assert } from 'node:assert'
import { test, beforeEach } from 'node:test'
import { oturumluFetchKur } from './oturumFetch'
import { jetonCoz, ensureDoctorAccessToken, saveDoctorSession, getDoctorAccessToken, __oturumOrtaminiAyarla, type JetonCozumu } from './clientAuth'
import { guvenliNext, girisYolu, girisSayfasi, girisSorgusu, oturumMesajiMi } from './oturumYolu'
import { pinGerekliMi } from '../portal/portalFetch'

// ---- doktorFetch (injected parts) --------------------------------------------------------------------------------

type Cagri = { url: string; auth: string | null }

function kur(senaryo: { jetonlar: JetonCozumu[]; sunucu: (auth: string | null) => number }) {
  const cagrilar: Cagri[] = []
  const jetonIstekleri: Array<{ zorla?: boolean; reddedilen?: string } | undefined> = []
  let bitti = 0
  const f = oturumluFetchKur({
    jetonCoz: async (s) => { jetonIstekleri.push(s); return senaryo.jetonlar.shift() ?? { durum: 'bitti' } },
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      cagrilar.push({ url: String(input), auth })
      return new Response('{}', { status: senaryo.sunucu(auth) })
    }) as typeof fetch,
    oturumBitti: () => { bitti++ },
  })
  return { f, cagrilar, jetonIstekleri, bitti: () => bitti }
}

test('doktorFetch: expired token → 401 → one refresh → retry with the new token succeeds', async () => {
  const k = kur({
    jetonlar: [{ durum: 'tamam', jeton: 'eski' }, { durum: 'tamam', jeton: 'yeni' }],
    sunucu: (a) => (a === 'Bearer yeni' ? 200 : 401),
  })
  const r = await k.f('/api/doktor/hastalar', { headers: { 'Content-Type': 'application/json' } })
  assert.equal(r.status, 200)
  assert.deepEqual(k.cagrilar.map((c) => c.auth), ['Bearer eski', 'Bearer yeni'])
  assert.deepEqual(k.jetonIstekleri[1], { zorla: true, reddedilen: 'eski' })
  assert.equal(k.bitti(), 0)
})

test('doktorFetch: refresh refused by the auth server → session-expired path, no retry', async () => {
  const k = kur({ jetonlar: [{ durum: 'tamam', jeton: 'eski' }, { durum: 'bitti' }], sunucu: () => 401 })
  const r = await k.f('/api/doktor/hastalar')
  assert.equal(r.status, 401)
  assert.equal(k.cagrilar.length, 1)
  assert.equal(k.bitti(), 1)
})

test('doktorFetch: no session at all → session-expired path without calling the API', async () => {
  const k = kur({ jetonlar: [{ durum: 'bitti' }], sunucu: () => 200 })
  const r = await k.f('/api/doktor/hastalar')
  assert.equal(r.status, 401)
  assert.equal(k.cagrilar.length, 0)
  assert.equal(k.bitti(), 1)
})

test('doktorFetch: refresh failed on the network → the 401 is returned, nobody is logged out', async () => {
  const k = kur({ jetonlar: [{ durum: 'tamam', jeton: 'eski' }, { durum: 'gecici', jeton: 'eski' }], sunucu: () => 401 })
  const r = await k.f('/api/doktor/hastalar')
  assert.equal(r.status, 401)
  assert.equal(k.cagrilar.length, 1)
  assert.equal(k.bitti(), 0)
})

test('doktorFetch: a non-401 answer is returned untouched (one call, no refresh)', async () => {
  const k = kur({ jetonlar: [{ durum: 'tamam', jeton: 't' }], sunucu: () => 403 })
  const r = await k.f('/api/doktor/hastalar/yabanci')
  assert.equal(r.status, 403)
  assert.equal(k.cagrilar.length, 1)
  assert.equal(k.jetonIstekleri.length, 1)
})

test('doktorFetch: retries at most once even if the fresh token is refused too', async () => {
  const k = kur({ jetonlar: [{ durum: 'tamam', jeton: 'a' }, { durum: 'tamam', jeton: 'b' }], sunucu: () => 401 })
  const r = await k.f('/api/x')
  assert.equal(r.status, 401)
  assert.equal(k.cagrilar.length, 2)
})

// ---- clientAuth: the one refresher -------------------------------------------------------------------------------

class SahteDepo {
  m = new Map<string, string>()
  getItem(k: string) { return this.m.has(k) ? (this.m.get(k) as string) : null }
  setItem(k: string, v: string) { this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
  key(i: number) { return [...this.m.keys()][i] ?? null }
  clear() { this.m.clear() }
  get length() { return this.m.size }
}

const SDK = 'sb-anjayzospuurymjmmtim-auth-token'
let depo: SahteDepo
let simdi: number
let yenilemeIstekleri: string[]
let yanitla: (rt: string) => Response | Promise<Response>

beforeEach(() => {
  depo = new SahteDepo()
  simdi = 1_800_000_000_000
  yenilemeIstekleri = []
  yanitla = (rt) => new Response(JSON.stringify({ access_token: 'AT-' + rt, refresh_token: 'RT-' + rt, expires_in: 3600 }), { status: 200 })
  __oturumOrtaminiAyarla({
    depo: () => depo as unknown as Storage,
    simdi: () => simdi,
    kilitler: () => null,
    fetch: (async (_u: RequestInfo | URL, init?: RequestInit) => {
      const rt = (JSON.parse(String(init?.body)) as { refresh_token: string }).refresh_token
      yenilemeIstekleri.push(rt)
      return yanitla(rt)
    }) as typeof fetch,
  })
})

const sn = () => Math.floor(simdi / 1000)

test('clientAuth: a valid token is returned without any network call', async () => {
  saveDoctorSession({ access_token: 'AT1', refresh_token: 'RT1', expires_at: sn() + 3000 })
  assert.deepEqual(await jetonCoz(), { durum: 'tamam', jeton: 'AT1' })
  assert.equal(yenilemeIstekleri.length, 0)
})

test('clientAuth: an expiring token is refreshed once, saved, and the SDK copy of the token family is removed', async () => {
  depo.setItem(SDK, JSON.stringify({ access_token: 'AT1', refresh_token: 'RT1', expires_at: sn() + 30 }))
  assert.equal(await ensureDoctorAccessToken(), 'AT-RT1')
  assert.deepEqual(yenilemeIstekleri, ['RT1'])
  assert.equal(depo.getItem(SDK), null, 'no second refresher may find a copy of the refresh token')
  assert.equal(getDoctorAccessToken(), 'AT-RT1')
})

test('clientAuth: parallel callers share ONE refresh (a single-use refresh token is never presented twice)', async () => {
  saveDoctorSession({ access_token: 'AT1', refresh_token: 'RT1', expires_at: sn() + 10 })
  let birak!: () => void
  const bekle = new Promise<void>((r) => { birak = r })
  yanitla = async (rt) => { await bekle; return new Response(JSON.stringify({ access_token: 'AT-' + rt, refresh_token: 'RT-' + rt, expires_in: 3600 }), { status: 200 }) }
  const p = Promise.all([jetonCoz(), jetonCoz(), jetonCoz({ zorla: true, reddedilen: 'AT1' })])
  birak()
  const sonuc = await p
  assert.deepEqual(yenilemeIstekleri, ['RT1'])
  assert.ok(sonuc.every((c) => c.durum === 'tamam' && c.jeton === 'AT-RT1'))
})

test('clientAuth: a 401 on a token that was already rotated uses the new token, no extra refresh', async () => {
  saveDoctorSession({ access_token: 'AT2', refresh_token: 'RT2', expires_at: sn() + 3000 })
  assert.deepEqual(await jetonCoz({ zorla: true, reddedilen: 'AT1' }), { durum: 'tamam', jeton: 'AT2' })
  assert.equal(yenilemeIstekleri.length, 0)
})

test('clientAuth: refresh refused (revoked / already used) → bitti and every stored copy is cleared', async () => {
  saveDoctorSession({ access_token: 'AT1', refresh_token: 'RT1', expires_at: sn() + 10 })
  depo.setItem(SDK, JSON.stringify({ access_token: 'x', refresh_token: 'y' }))
  yanitla = () => new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid Refresh Token: Already Used' }), { status: 400 })
  assert.deepEqual(await jetonCoz(), { durum: 'bitti' })
  assert.equal(await ensureDoctorAccessToken(), null)
  assert.equal(depo.getItem('auth-token'), null)
  assert.equal(depo.getItem(SDK), null)
})

test('clientAuth: refresh failing on the network keeps the session (laptop offline after sleep)', async () => {
  saveDoctorSession({ access_token: 'AT1', refresh_token: 'RT1', expires_at: sn() + 10 })
  __oturumOrtaminiAyarla({ depo: () => depo as unknown as Storage, simdi: () => simdi, kilitler: () => null, fetch: (async () => { throw new TypeError('Failed to fetch') }) as typeof fetch })
  const c = await jetonCoz()
  assert.equal(c.durum, 'gecici')
  assert.ok(depo.getItem('auth-token'), 'session kept for the next try')
  // 5xx is transient too.
  __oturumOrtaminiAyarla({ depo: () => depo as unknown as Storage, simdi: () => simdi, kilitler: () => null, fetch: (async () => new Response('{}', { status: 503 })) as typeof fetch })
  assert.equal((await jetonCoz()).durum, 'gecici')
  assert.ok(depo.getItem('auth-token'))
})

test('clientAuth: refresh runs inside the cross-tab lock and re-reads storage there (another tab already refreshed)', async () => {
  saveDoctorSession({ access_token: 'AT1', refresh_token: 'RT1', expires_at: sn() + 10 })
  const adlar: string[] = []
  __oturumOrtaminiAyarla({
    depo: () => depo as unknown as Storage,
    simdi: () => simdi,
    fetch: (async () => { yenilemeIstekleri.push('X'); return new Response('{}', { status: 500 }) }) as typeof fetch,
    kilitler: () => ({
      request: async (ad: string, fn: () => Promise<unknown>) => {
        adlar.push(ad)
        // The other tab finished its refresh while we waited for the lock.
        depo.setItem('auth-token', JSON.stringify({ access_token: 'AT-diger', refresh_token: 'RT-diger', expires_at: sn() + 3600 }))
        return fn()
      },
    }),
  })
  assert.deepEqual(await jetonCoz(), { durum: 'tamam', jeton: 'AT-diger' })
  assert.deepEqual(adlar, ['notya-doktor-oturum'])
  assert.equal(yenilemeIstekleri.length, 0)
})

test('clientAuth: expires_at missing → read from the JWT exp claim (old sessions never refreshed)', async () => {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  const jwt = `${b64({ alg: 'HS256' })}.${b64({ sub: 'u1', exp: sn() - 5 })}.imza`
  depo.setItem('auth-token', JSON.stringify({ access_token: jwt, refresh_token: 'RT9' }))
  assert.equal(await ensureDoctorAccessToken(), 'AT-RT9')
})

// ---- return path (no open redirect) ------------------------------------------------------------------------------

test('guvenliNext: internal paths only', () => {
  assert.equal(guvenliNext('/dashboard/doktor/hastalar'), '/dashboard/doktor/hastalar')
  assert.equal(guvenliNext('/dashboard/doktor/hastalar/12?sekme=asi#x'), '/dashboard/doktor/hastalar/12?sekme=asi#x')
  for (const kotu of ['https://evil.com', '//evil.com', '/\\evil.com', '\\\\evil.com', 'javascript:alert(1)', '%2F%2Fevil.com', '/%2F/evil.com', '/\t/evil.com', 'evil.com', '', '   ', '/giris/doktor', '/giris?x=1', null, undefined]) {
    assert.equal(guvenliNext(kotu as string), null, String(kotu))
  }
})

test('girisYolu: doctor vs Notya Klinik login, with the notice flag and next', () => {
  assert.equal(girisYolu('/dashboard/doktor/hastalar'), '/giris/doktor?oturum=doldu&next=%2Fdashboard%2Fdoktor%2Fhastalar')
  assert.equal(girisSayfasi('/dashboard/notya-klinik/hastalar'), '/giris/notya-klinik')
  assert.equal(girisSayfasi('/ozel-branslar/sac-foto'), '/giris/notya-klinik')
  assert.equal(girisSayfasi('/doktor-tools/hatirlatma'), '/giris/doktor')
  assert.equal(girisYolu('//evil.com'), '/giris/doktor?oturum=doldu')
  assert.deepEqual(girisSorgusu('?oturum=doldu&next=%2Fdashboard%2Fdoktor%2Fhastalar'), { next: '/dashboard/doktor/hastalar', doldu: true })
  assert.deepEqual(girisSorgusu('?next=https%3A%2F%2Fevil.com'), { next: null, doldu: false })
})

test('oturumMesajiMi: session messages get the "Giriş yap" button, other errors do not', () => {
  assert.ok(oturumMesajiMi('Oturum geçersiz. Lütfen tekrar giriş yapın.'))
  assert.ok(oturumMesajiMi('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.'))
  assert.ok(oturumMesajiMi('Oturum bulunamadı.'))
  assert.ok(!oturumMesajiMi('Hastalar alınamadı'))
})

test('portal: a lapsed PIN unlock is recognised (the portal goes back to its PIN screen)', async () => {
  assert.ok(await pinGerekliMi(new Response(JSON.stringify({ code: 'pin_required', pinRequired: true }), { status: 401 })))
  assert.ok(!(await pinGerekliMi(new Response(JSON.stringify({ error: 'x' }), { status: 401 }))))
  assert.ok(!(await pinGerekliMi(new Response('{}', { status: 200 }))))
})
