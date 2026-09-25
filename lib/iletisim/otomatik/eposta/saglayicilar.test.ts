import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { erisimAl, gonder, iptalEt, kodTakas, yetkiAdresi } from './saglayicilar'

type Cagri = { url: string; init: RequestInit }
let cagrilar: Cagri[] = []
let yanitlar: Array<() => Response> = []
const asilFetch = globalThis.fetch

function json(durum: number, govde: unknown): () => Response {
  return () => new Response(govde === undefined ? null : JSON.stringify(govde), { status: durum, headers: { 'Content-Type': 'application/json' } })
}
function idJetonu(talepler: Record<string, unknown>): string {
  return `e30.${Buffer.from(JSON.stringify(talepler)).toString('base64url')}.imza`
}
const form = (c: Cagri) => new URLSearchParams(String(c.init.body))

beforeEach(() => {
  process.env.ENCRYPTION_MASTER_KEY = 'test-anahtari'
  process.env.GOOGLE_OAUTH_CLIENT_ID = 'g-istemci'
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'g-sir'
  process.env.MS_OAUTH_CLIENT_ID = 'm-istemci'
  process.env.MS_OAUTH_CLIENT_SECRET = 'm-sir'
  process.env.NEXT_PUBLIC_APP_URL = 'https://www.notya.io'
  cagrilar = []
  yanitlar = []
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    cagrilar.push({ url: String(url), init: init ?? {} })
    const y = yanitlar.shift()
    if (!y) throw new Error(`beklenmeyen istek: ${String(url)}`)
    return y()
  }) as typeof fetch
})
afterEach(() => {
  globalThis.fetch = asilFetch
})

test('yetkiAdresi google: yalnız gönderme + kimlik, çevrimdışı, PKCE, izin ekranı', () => {
  const u = new URL(yetkiAdresi('google', { durum: 'D', meydanOkuma: 'M' }))
  assert.equal(u.origin + u.pathname, 'https://accounts.google.com/o/oauth2/v2/auth')
  const p = u.searchParams
  assert.deepEqual(p.get('scope')!.split(' ').sort(), ['email', 'https://www.googleapis.com/auth/gmail.send', 'openid'])
  assert.equal(p.get('access_type'), 'offline')
  assert.equal(p.get('prompt'), 'consent')
  assert.equal(p.get('code_challenge'), 'M')
  assert.equal(p.get('code_challenge_method'), 'S256')
  assert.equal(p.get('state'), 'D')
  assert.equal(p.get('client_id'), 'g-istemci')
  assert.equal(p.get('redirect_uri'), 'https://www.notya.io/api/iletisim/eposta/google/donus')
  assert.equal(p.get('include_granted_scopes'), null)
})

test('yetkiAdresi microsoft: common kiracı (iş + kişisel), Mail.Send + User.Read + offline_access', () => {
  const u = new URL(yetkiAdresi('microsoft', { durum: 'D', meydanOkuma: 'M' }))
  assert.equal(u.origin + u.pathname, 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
  assert.deepEqual(u.searchParams.get('scope')!.split(' ').sort(), [
    'email', 'https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/User.Read', 'offline_access', 'openid',
  ])
  // Still nothing that can read mail.
  assert.doesNotMatch(u.searchParams.get('scope')!, /Mail\.Read|Mail\.ReadWrite/i)
  assert.equal(u.searchParams.get('redirect_uri'), 'https://www.notya.io/api/iletisim/eposta/microsoft/donus')
  assert.equal(u.searchParams.get('code_challenge_method'), 'S256')
})

test('kodTakas google: kod + doğrulayıcı gönderilir, adres id_token\'dan okunur', async () => {
  yanitlar.push(json(200, { access_token: 'at', refresh_token: 'rt', scope: 'openid https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email', id_token: idJetonu({ email: 'Dr.Gokhan@Gmail.com' }) }))
  const t = await kodTakas('google', { kod: 'KOD', dogrulayici: 'V' })
  assert.deepEqual(t, { ok: true, yenilemeJetonu: 'rt', adres: 'dr.gokhan@gmail.com' })
  assert.equal(cagrilar[0].url, 'https://oauth2.googleapis.com/token')
  const f = form(cagrilar[0])
  assert.equal(f.get('grant_type'), 'authorization_code')
  assert.equal(f.get('code'), 'KOD')
  assert.equal(f.get('code_verifier'), 'V')
  assert.equal(f.get('client_secret'), 'g-sir')
})

test('kodTakas google: doktor "gönder" iznini kaldırdıysa izin-eksik', async () => {
  yanitlar.push(json(200, { access_token: 'at', refresh_token: 'rt', scope: 'openid https://www.googleapis.com/auth/userinfo.email', id_token: idJetonu({ email: 'a@b.com' }) }))
  const t = await kodTakas('google', { kod: 'K', dogrulayici: 'V' })
  assert.equal(t.ok, false)
  assert.equal(!t.ok && t.neden, 'izin-eksik')
})

test('kodTakas microsoft: adres Graph /me mail alanından (iş hesabı, id_token e-postasız)', async () => {
  yanitlar.push(json(200, { access_token: 'at', refresh_token: 'rt', scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read openid email', id_token: idJetonu({ preferred_username: 'g.yilmaz@klinik.onmicrosoft.com' }) }))
  yanitlar.push(json(200, { mail: 'Dr.Gokhan@Klinik.com.tr', userPrincipalName: 'g.yilmaz@klinik.onmicrosoft.com' }))
  assert.deepEqual(await kodTakas('microsoft', { kod: 'K', dogrulayici: 'V' }), { ok: true, yenilemeJetonu: 'rt', adres: 'dr.gokhan@klinik.com.tr' })
  assert.equal(cagrilar[0].url, 'https://login.microsoftonline.com/common/oauth2/v2.0/token')
  assert.equal(cagrilar[1].url, 'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName')
  assert.equal((cagrilar[1].init.headers as Record<string, string>).Authorization, 'Bearer at')
  assert.equal(cagrilar[1].init.method ?? 'GET', 'GET')
})

test('kodTakas microsoft: /me mail boşsa userPrincipalName; /me başarısızsa id_token; hiçbiri adres değilse hata', async () => {
  yanitlar.push(json(200, { access_token: 'at', refresh_token: 'rt', scope: 'Mail.Send', id_token: idJetonu({}) }))
  yanitlar.push(json(200, { mail: null, userPrincipalName: 'doktor@klinik.com' }))
  assert.deepEqual(await kodTakas('microsoft', { kod: 'K', dogrulayici: 'V' }), { ok: true, yenilemeJetonu: 'rt', adres: 'doktor@klinik.com' })

  yanitlar.push(json(200, { access_token: 'at', refresh_token: 'rt', scope: 'https://graph.microsoft.com/Mail.Send openid email', id_token: idJetonu({ preferred_username: 'doktor@outlook.com' }) }))
  yanitlar.push(json(403, { error: { code: 'Authorization_RequestDenied' } }))
  assert.deepEqual(await kodTakas('microsoft', { kod: 'K', dogrulayici: 'V' }), { ok: true, yenilemeJetonu: 'rt', adres: 'doktor@outlook.com' })

  yanitlar.push(json(200, { access_token: 'at', refresh_token: 'rt', scope: 'Mail.Send', id_token: idJetonu({ preferred_username: '+905551112233' }) }))
  yanitlar.push(json(200, { mail: null, userPrincipalName: '+905551112233' }))
  const t = await kodTakas('microsoft', { kod: 'K', dogrulayici: 'V' })
  assert.equal(t.ok, false)
})

test('kodTakas google: Graph /me çağrılmaz', async () => {
  yanitlar.push(json(200, { access_token: 'at', refresh_token: 'rt', scope: 'openid https://www.googleapis.com/auth/gmail.send', id_token: idJetonu({ email: 'a@b.com' }) }))
  assert.equal((await kodTakas('google', { kod: 'K', dogrulayici: 'V' })).ok, true)
  assert.equal(cagrilar.length, 1)
})

test('kodTakas: sağlayıcı hatası iletilir, jeton yoksa hata', async () => {
  yanitlar.push(json(400, { error: 'invalid_grant', error_description: 'Bad Request' }))
  const t = await kodTakas('google', { kod: 'K', dogrulayici: 'V' })
  assert.deepEqual(t, { ok: false, neden: 'hata', hata: 'invalid_grant: Bad Request' })
  yanitlar.push(json(200, { access_token: 'at', scope: 'https://www.googleapis.com/auth/gmail.send', id_token: idJetonu({ email: 'a@b.com' }) }))
  const t2 = await kodTakas('google', { kod: 'K', dogrulayici: 'V' })
  assert.equal(!t2.ok && t2.hata, 'no_refresh_token')
})

test('erisimAl: başarı; Microsoft yeni yenileme jetonu döndürürse saklanmak üzere verilir', async () => {
  yanitlar.push(json(200, { access_token: 'at-g', expires_in: 3599 }))
  assert.deepEqual(await erisimAl('google', 'rt'), { ok: true, erisimJetonu: 'at-g' })
  yanitlar.push(json(200, { access_token: 'at-m', refresh_token: 'rt-2' }))
  assert.deepEqual(await erisimAl('microsoft', 'rt'), { ok: true, erisimJetonu: 'at-m', yeniYenilemeJetonu: 'rt-2' })
  assert.equal(form(cagrilar[1]).get('grant_type'), 'refresh_token')
})

test('erisimAl: invalid_grant / interaction_required = izin geri alındı (yenilenmeli)', async () => {
  yanitlar.push(json(400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }))
  const g = await erisimAl('google', 'rt')
  assert.equal(!g.ok && g.iptal, true)
  yanitlar.push(json(400, { error: 'interaction_required', error_description: 'AADSTS50173: The provided grant has expired\r\nTrace ID: x' }))
  const m = await erisimAl('microsoft', 'rt')
  assert.equal(!m.ok && m.iptal, true)
  assert.equal(!m.ok && m.hata, 'interaction_required: AADSTS50173: The provided grant has expired')
})

test('erisimAl: sunucu hatası / ağ hatası geçicidir, bağlantı bozulmaz', async () => {
  yanitlar.push(json(503, {}))
  const a = await erisimAl('google', 'rt')
  assert.equal(!a.ok && a.iptal, false)
  yanitlar.push(() => { throw new Error('ECONNRESET') })
  const b = await erisimAl('google', 'rt')
  assert.equal(!b.ok && b.iptal, false)
})

test('gonder google: users.messages.send, raw base64url RFC 2822, Türkçe konu kodlu', async () => {
  yanitlar.push(json(200, { id: '18c0ffee', threadId: 't', labelIds: ['SENT'] }))
  const s = await gonder('google', 'at', { alici: 'hasta@ornek.com', konu: 'Randevu hatırlatması', metin: 'Yarın 10:00. Sağlığım: https://www.notya.io/s/abc' })
  assert.deepEqual(s, { ok: true, disId: '18c0ffee' })
  assert.equal(cagrilar[0].url, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send')
  assert.equal((cagrilar[0].init.headers as Record<string, string>).Authorization, 'Bearer at')
  const raw = JSON.parse(String(cagrilar[0].init.body)).raw as string
  assert.match(raw, /^[A-Za-z0-9_-]+$/)
  const mesaj = Buffer.from(raw, 'base64url').toString('utf8')
  assert.match(mesaj, /^To: hasta@ornek\.com\r$/m)
  assert.match(mesaj, /^Subject: =\?UTF-8\?B\?/m)
})

test('gonder microsoft: /me/sendMail düz metin, gönderilenlere kaydet, 202', async () => {
  yanitlar.push(json(202, undefined))
  const s = await gonder('microsoft', 'at', { alici: 'hasta@ornek.com', konu: 'Hatırlatma', metin: 'Merhaba' })
  assert.deepEqual(s, { ok: true })
  assert.equal(cagrilar[0].url, 'https://graph.microsoft.com/v1.0/me/sendMail')
  assert.deepEqual(JSON.parse(String(cagrilar[0].init.body)), {
    message: { subject: 'Hatırlatma', body: { contentType: 'Text', content: 'Merhaba' }, toRecipients: [{ emailAddress: { address: 'hasta@ornek.com' } }] },
    saveToSentItems: true,
  })
})

test('gonder: 401 ve yetki eksikliği yenilenmeli; gönderim sınırı (403/429) değil', async () => {
  yanitlar.push(json(401, { error: { code: 401, message: 'Invalid Credentials', status: 'UNAUTHENTICATED' } }))
  assert.equal(((await gonder('google', 'at', { alici: 'a@b.com', konu: 'k', metin: 'm' })) as { yetkisiz: boolean }).yetkisiz, true)
  yanitlar.push(json(403, { error: { code: 403, message: 'Request had insufficient authentication scopes.', status: 'PERMISSION_DENIED' } }))
  assert.equal(((await gonder('google', 'at', { alici: 'a@b.com', konu: 'k', metin: 'm' })) as { yetkisiz: boolean }).yetkisiz, true)
  yanitlar.push(json(403, { error: { code: 403, message: 'User-rate limit exceeded (Mail sending)' } }))
  assert.equal(((await gonder('google', 'at', { alici: 'a@b.com', konu: 'k', metin: 'm' })) as { yetkisiz: boolean }).yetkisiz, false)
  yanitlar.push(json(429, { error: { code: 429, message: 'User-rate limit exceeded' } }))
  assert.equal(((await gonder('google', 'at', { alici: 'a@b.com', konu: 'k', metin: 'm' })) as { yetkisiz: boolean }).yetkisiz, false)
  yanitlar.push(json(403, { error: { code: 'ErrorAccessDenied', message: 'Access is denied.' } }))
  assert.equal(((await gonder('microsoft', 'at', { alici: 'a@b.com', konu: 'k', metin: 'm' })) as { yetkisiz: boolean }).yetkisiz, true)
})

test('iptalEt: Google revoke uç noktası; zaten iptal (400) da başarı; Microsoft ağ çağrısı yok', async () => {
  yanitlar.push(json(200, {}))
  assert.equal(await iptalEt('google', 'rt'), true)
  assert.equal(cagrilar[0].url, 'https://oauth2.googleapis.com/revoke')
  assert.equal(form(cagrilar[0]).get('token'), 'rt')
  yanitlar.push(json(400, { error: 'invalid_token' }))
  assert.equal(await iptalEt('google', 'rt'), true)
  assert.equal(await iptalEt('microsoft', 'rt'), true)
  assert.equal(cagrilar.length, 2)
})
