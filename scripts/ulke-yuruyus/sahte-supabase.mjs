#!/usr/bin/env node
/**
 * NOTYA-UZ-MUAYENE-01 — local STAND-IN for a country's Supabase project, for the walk-through (./yuruyus.mjs).
 * Never deployed, never a dependency of the application. Synthetic accounts and data only; everything is in memory.
 *
 *   node scripts/ulke-yuruyus/sahte-supabase.mjs [port=54399]
 *
 * Just enough of three services for the country screens:
 *   auth      password login, "who am I", logout, admin create / delete user
 *   rest      a small PostgREST: select / insert / upsert / update / delete with the filters the application uses
 *             (eq, neq, in, gte, lt, is.null, not.is.null), order, limit, single-object answers, and the two
 *             invitation-code functions. An operator it does not know is an ERROR (400) — it never ignores a filter,
 *             because an ignored filter would make a broken ownership check look fine.
 *   storage   upload / download / remove of objects. A browser session may upload only under a folder named after its
 *             own account id (what the storage policy of migration 132 enforces in the real project); the service role
 *             may read and remove anything.
 *
 * Inspection, for the walk-through only:  GET /__gunluk (request log)   GET /__tablo/<name> (rows)   GET /__depo (object paths)
 */
import http from 'node:http'
import { createHash, randomUUID } from 'node:crypto'

const PORT = Number(process.argv[2] || 54399)
const SERVIS = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sahte-servis'

const hesaplar = {
  'qa-uz@notya.test': { id: 'aaaaaaaa-0000-4000-8000-000000000001', sifre: 'sinov-parol-1', ulke: 'uz', dil: 'uz-Latn', ad: 'QA Shifokor Bir' },
  'qa-ru@notya.test': { id: 'aaaaaaaa-0000-4000-8000-000000000002', sifre: 'sinov-parol-2', ulke: 'uz', dil: 'ru', ad: 'QA Врач Два' },
  'qa-tr@notya.test': { id: 'aaaaaaaa-0000-4000-8000-000000000003', sifre: 'sinov-parol-3', ulke: 'tr', dil: 'tr', ad: 'QA Hekim Uc' },
  'qa-damgasiz@notya.test': { id: 'aaaaaaaa-0000-4000-8000-000000000004', sifre: 'sinov-parol-4', ulke: null, dil: 'tr', ad: 'QA Damgasiz' },
}
const GECERLI_KOD = 'QATEST0000000001'
const kodlar = new Map([[createHash('sha256').update(GECERLI_KOD).digest('hex'), { ulke: 'uz', kalan: 1 }]])
const jetonlar = new Map()
const gunluk = []
/** table → rows. `users` starts with one row per account that has a country stamp. */
const tablolar = { users: [] }
for (const h of Object.values(hesaplar)) if (h.ulke) tablolar.users.push({ id: h.id, full_name: h.ad, country: h.ulke, ui_language: h.dil })
const tablo = (ad) => (tablolar[ad] ??= [])
/** Tables whose rows have no id of their own (the key is another table's id). */
const KIMLIKSIZ = new Set(['hekim_dil_tercihleri', 'hekim_rolu', 'hasta_ulke_bilgisi', 'muayene_dil_kaydi', 'not_dil_kaydi', 'ai_kullanim'])
/** bucket/path → { tur, veri: Buffer } */
const depo = new Map()

const kullanici = (eposta) => {
  const h = hesaplar[eposta]
  return { id: h.id, aud: 'authenticated', role: 'authenticated', email: eposta, app_metadata: { provider: 'email', providers: ['email'], ...(h.ulke ? { country: h.ulke } : {}) }, user_metadata: { full_name: h.ad, ui_language: h.dil }, created_at: '2026-10-08T00:00:00Z' }
}
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Access-Control-Expose-Headers': '*' }
const yaz = (res, status, govde) => { res.writeHead(status, { 'Content-Type': 'application/json', ...cors }); res.end(govde === undefined ? '' : JSON.stringify(govde)) }
const hata = (res, status, code, message) => yaz(res, status, { code, message, details: null, hint: null })

// ───────────────────────── PostgREST ─────────────────────────
const AYAR = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'])
const deger = (ham) => (ham === 'null' ? null : ham === 'true' ? true : ham === 'false' ? false : ham)
function suzgec(kolon, ham) {
  const es = (s, v) => String(s[kolon] ?? '') === String(v) && (s[kolon] ?? null) !== null
  if (ham.startsWith('eq.')) { const v = deger(ham.slice(3)); return (s) => (typeof v === 'boolean' ? s[kolon] === v : es(s, ham.slice(3))) }
  if (ham.startsWith('neq.')) return (s) => !es(s, ham.slice(4))
  if (ham.startsWith('gte.')) return (s) => String(s[kolon] ?? '') >= ham.slice(4)
  if (ham.startsWith('lt.')) return (s) => String(s[kolon] ?? '') < ham.slice(3)
  if (ham === 'is.null') return (s) => (s[kolon] ?? null) === null
  if (ham === 'not.is.null') return (s) => (s[kolon] ?? null) !== null
  if (ham.startsWith('in.(') && ham.endsWith(')')) {
    const liste = ham.slice(4, -1).split(',').map((x) => x.replace(/^"|"$/g, ''))
    return (s) => liste.includes(String(s[kolon] ?? ''))
  }
  return null
}
function rest(req, res, url, govde) {
  const ad = decodeURIComponent(url.pathname.slice('/rest/v1/'.length))
  if (!/^[a-z_0-9]+$/.test(ad)) return hata(res, 404, 'PGRST205', `no table ${ad}`)
  const suzgecler = []
  for (const [k, v] of url.searchParams) {
    if (AYAR.has(k)) continue
    const f = suzgec(k, v)
    if (!f) return hata(res, 400, 'PGRST100', `stand-in: filter ${k}=${v} is not implemented`)
    suzgecler.push(f)
  }
  const uyan = (s) => suzgecler.every((f) => f(s))
  const tercih = String(req.headers.prefer || '')
  const tekNesne = String(req.headers.accept || '').includes('vnd.pgrst.object')
  const satirlar = tablo(ad)
  let sonuc
  if (req.method === 'GET' || req.method === 'HEAD') sonuc = satirlar.filter(uyan)
  else if (req.method === 'POST') {
    const gelen = Array.isArray(govde) ? govde : [govde]
    const catisma = url.searchParams.get('on_conflict')
    sonuc = []
    for (const y of gelen) {
      const anahtarlar = catisma ? catisma.split(',').map((k) => k.trim()) : null
      const var_ = anahtarlar && tercih.includes('resolution=merge-duplicates') ? satirlar.find((s) => anahtarlar.every((k) => String(s[k]) === String(y[k]))) : null
      if (var_) { Object.assign(var_, y); sonuc.push(var_); continue }
      if (!KIMLIKSIZ.has(ad) && y.id && satirlar.some((s) => s.id === y.id)) return hata(res, 409, '23505', 'duplicate key value violates unique constraint')
      const yeni = { ...(KIMLIKSIZ.has(ad) ? {} : { id: randomUUID() }), created_at: new Date().toISOString(), ...y }
      if (ad === 'sessions' && !yeni.started_at) yeni.started_at = yeni.created_at
      satirlar.push(yeni); sonuc.push(yeni)
    }
  } else if (req.method === 'PATCH') {
    if (!suzgecler.length) return hata(res, 400, '21000', 'UPDATE requires a WHERE clause')
    sonuc = satirlar.filter(uyan)
    for (const s of sonuc) Object.assign(s, govde)
  } else if (req.method === 'DELETE') {
    if (!suzgecler.length) return hata(res, 400, '21000', 'DELETE requires a WHERE clause')
    sonuc = satirlar.filter(uyan)
    tablolar[ad] = satirlar.filter((s) => !uyan(s))
  } else return hata(res, 405, 'PGRST000', 'method')

  const sira = url.searchParams.get('order')
  if (sira) {
    const [kolon, yon] = sira.split(',')[0].split('.')
    sonuc = [...sonuc].sort((a, b) => (String(a[kolon] ?? '') < String(b[kolon] ?? '') ? -1 : String(a[kolon] ?? '') > String(b[kolon] ?? '') ? 1 : 0) * (yon === 'desc' ? -1 : 1))
  }
  const sinir = url.searchParams.get('limit')
  if (sinir) sonuc = sonuc.slice(0, Number(sinir))
  const yazma = req.method !== 'GET' && req.method !== 'HEAD'
  if (yazma && !tercih.includes('return=representation')) return yaz(res, req.method === 'POST' ? 201 : 204)
  if (tekNesne) return sonuc.length === 1 ? yaz(res, 200, sonuc[0]) : hata(res, 406, 'PGRST116', `JSON object requested, multiple (or no) rows returned (${sonuc.length})`)
  return yaz(res, req.method === 'POST' ? 201 : 200, sonuc)
}

// ───────────────────────── server ─────────────────────────
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const parcalar = []
  for await (const p of req) parcalar.push(p)
  const ham = Buffer.concat(parcalar)
  const jsonMu = String(req.headers['content-type'] || '').includes('application/json')
  let g = {}
  if (jsonMu && ham.length) { try { g = JSON.parse(ham.toString('utf8')) } catch { return hata(res, 400, 'PGRST102', 'bad json') } }
  if (!url.pathname.startsWith('/__')) gunluk.push(`${req.method} ${url.pathname}${url.search}`)
  if (req.method === 'OPTIONS') return yaz(res, 204)
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const servisMi = bearer === SERVIS
  const oturumEposta = jetonlar.get(bearer)

  if (url.pathname === '/__gunluk') return yaz(res, 200, gunluk)
  if (url.pathname === '/__depo') return yaz(res, 200, [...depo.keys()])
  if (url.pathname.startsWith('/__tablo/')) return yaz(res, 200, tablo(url.pathname.slice('/__tablo/'.length)))

  // ── auth ──
  if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
    const h = hesaplar[g.email]
    if (!h || h.sifre !== g.password) return yaz(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' })
    const jeton = `jeton-${h.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    jetonlar.set(jeton, g.email)
    return yaz(res, 200, { access_token: jeton, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: `yenile-${h.id}`, user: kullanici(g.email) })
  }
  if (url.pathname === '/auth/v1/user') return oturumEposta ? yaz(res, 200, kullanici(oturumEposta)) : yaz(res, 401, { code: 401, msg: 'invalid JWT' })
  if (url.pathname === '/auth/v1/logout') return yaz(res, 204)
  if (url.pathname === '/auth/v1/admin/users' && req.method === 'POST') {
    if (hesaplar[g.email]) return yaz(res, 422, { code: 422, error_code: 'email_exists', msg: 'A user with this email address has already been registered' })
    const id = `bbbbbbbb-0000-4000-8000-${String(Object.keys(hesaplar).length).padStart(12, '0')}`
    hesaplar[g.email] = { id, sifre: g.password, ulke: g.app_metadata?.country ?? null, dil: g.user_metadata?.ui_language ?? 'tr', ad: g.user_metadata?.full_name ?? '' }
    return yaz(res, 200, kullanici(g.email))
  }
  if (url.pathname.startsWith('/auth/v1/admin/users/') && req.method === 'DELETE') {
    const id = url.pathname.split('/').pop()
    for (const [e, h] of Object.entries(hesaplar)) if (h.id === id) delete hesaplar[e]
    return yaz(res, 200, {})
  }

  // ── functions ──
  if (url.pathname === '/rest/v1/rpc/davet_kodu_kullan') {
    const k = kodlar.get(g.p_hash)
    if (!k || k.ulke !== g.p_ulke || k.kalan < 1) return yaz(res, 200, false)
    k.kalan--
    return yaz(res, 200, true)
  }
  if (url.pathname === '/rest/v1/rpc/davet_kodu_iade') { const k = kodlar.get(g.p_hash); if (k) k.kalan++; return yaz(res, 204) }

  // ── storage ──
  if (url.pathname.startsWith('/storage/v1/object/')) {
    const yol = decodeURIComponent(url.pathname.slice('/storage/v1/object/'.length))
    if (req.method === 'DELETE') {
      if (!servisMi) return yaz(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' })
      for (const p of g.prefixes || []) depo.delete(`${yol}/${p}`)
      return yaz(res, 200, [])
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      // The storage policy: a signed-in account writes only under a folder named after its own id.
      const [, klasor] = yol.split('/')
      const sahibi = oturumEposta ? hesaplar[oturumEposta]?.id : null
      if (!servisMi && (!sahibi || klasor !== sahibi)) return yaz(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' })
      // supabase-js sends a browser Blob as multipart form data: keep the bytes of the one file part.
      let veri = ham
      const tur = String(req.headers['content-type'] || '')
      const sinir = /boundary=([^;]+)/.exec(tur)?.[1]
      let icTur = tur
      if (sinir) {
        const metin = ham.toString('latin1')
        const bas = metin.indexOf('\r\n\r\n', metin.indexOf('filename='))
        const son = metin.lastIndexOf(`\r\n--${sinir}`)
        if (bas > -1 && son > bas) veri = Buffer.from(metin.slice(bas + 4, son), 'latin1')
        icTur = /Content-Type:\s*([^\r\n]+)/i.exec(metin.slice(0, bas))?.[1] ?? 'application/octet-stream'
      }
      depo.set(yol, { tur: icTur, veri })
      return yaz(res, 200, { Key: yol, Id: randomUUID() })
    }
    if (req.method === 'GET') {
      if (!servisMi) return yaz(res, 400, { statusCode: '404', error: 'not_found', message: 'Object not found' })
      const nesne = depo.get(yol)
      if (!nesne) return yaz(res, 400, { statusCode: '404', error: 'not_found', message: 'Object not found' })
      res.writeHead(200, { 'Content-Type': nesne.tur, 'Content-Length': nesne.veri.length, ...cors })
      return res.end(nesne.veri)
    }
  }

  // ── tables ──
  if (url.pathname.startsWith('/rest/v1/')) {
    // The browser never reads tables in these screens: only the server (service role) does.
    if (!servisMi) return hata(res, 401, '42501', 'stand-in: table access without the service role')
    return rest(req, res, url, g)
  }
  yaz(res, 404, { message: `sahte-supabase: ${req.method} ${url.pathname} not implemented` })
}).listen(PORT, '127.0.0.1', () => console.log(`sahte supabase :${PORT}`))
