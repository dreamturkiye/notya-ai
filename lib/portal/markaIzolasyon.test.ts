/**
 * HASTA-ALANI-MARKA — cross-doctor isolation of the portal brand (settings rows AND files), on the REAL route handlers
 * with a fake database / storage (lib/security/testing/sahteSupabase.ts). Two synthetic doctors A and B, each with a
 * portal token, settings row, logo file and profile photo. Every case runs in both directions:
 *   • settings GET / PUT, logo POST / DELETE touch only the caller's own row and own folder (the request names none);
 *   • a portal token resolves only its own doctor's brand / photo / icon / manifest;
 *   • the upload gate refuses SVG and oversize files at the route;
 *   • push names are per doctor.
 *   npx tsx --experimental-test-module-mocks --test lib/portal/markaIzolasyon.test.ts
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { deflateSync } from 'node:zlib'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import React from 'react'

;(globalThis as { React?: typeof React }).React = React // the image routes' JSX under tsx (Next uses the automatic runtime)

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-marka-anahtari'
process.env.VAULT_MASTER_KEY = process.env.VAULT_MASTER_KEY || 'qa-sentetik-kasa-anahtari-0123456789abcdef0123456789abcdef'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'

let db = new SahteVeritabani()
function sahteCreateClient(_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return { from: (t: string) => c().from(t), auth: { getUser: (j?: string) => c().auth.getUser(j) }, storage: { from: (k: string) => c().storage.from(k) } }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) mock.module(g, { namedExports: { createClient: sahteCreateClient } })
}

function crc32(b: Buffer): number { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)) } return ~c >>> 0 }
function parca(t: string, v: Buffer) { const u = Buffer.alloc(4); u.writeUInt32BE(v.length); const tv = Buffer.concat([Buffer.from(t, 'latin1'), v]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(tv)); return Buffer.concat([u, tv, c]) }
/** A real, decodable PNG (solid colour) — the icon renderer draws it. */
function png(en: number, renk: number): Buffer {
  const ih = Buffer.alloc(13); ih.writeUInt32BE(en, 0); ih.writeUInt32BE(en, 4); ih[8] = 8; ih[9] = 2
  const satir = Buffer.concat([Buffer.from([0]), Buffer.alloc(en * 3, renk)])
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), parca('IHDR', ih), parca('tEXt', Buffer.from('Author\0secret')), parca('IDAT', deflateSync(Buffer.concat(Array.from({ length: en }, () => satir)))), parca('IEND', Buffer.alloc(0))])
}

type Hekim = { id: string; jwt: string; token: string; ad: string; logoYol: string; foto: Buffer }
let A: Hekim, B: Hekim
let R: Record<string, any>
let NextRequestSinifi: typeof import('next/server').NextRequest
let encryptBytes: (b: Buffer) => Buffer
const KOVA = 'hasta-alani-marka'

function hekimKur(harf: 'a' | 'b', ad: string, renk: number): Hekim {
  const id = harf === 'a' ? '0a0a0a0a-0000-4000-8000-00000000000a' : '0b0b0b0b-0000-4000-8000-00000000000b'
  const jwt = `jwt-${harf}`
  const token = `portal-token-${harf}-0123456789`
  db.kullanicilar.set(jwt, { id })
  db.ekle('users', { id, full_name: ad, specialty: harf === 'a' ? 'pediatri' : 'kardiyoloji', clinic_name: `GIZLI-${harf.toUpperCase()} Klinik` })
  db.ekle('hasta_portal_tokens', { token_hash: token, doctor_id: id, patient_id: `hasta-${harf}`, expires_at: new Date(Date.now() + 86400e3).toISOString(), pin_hash: 'x' })
  const logoYol = `${id}/logo-${harf.repeat(16)}.png`
  db.dosyaKoy(KOVA, logoYol, png(8, renk))
  db.ekle('hasta_alani_gorunumu', { doctor_id: id, logo_yol: null, gorunen_ad: `GIZLI-${harf.toUpperCase()} Görünen`, vurgu: harf === 'a' ? 'bordo' : 'lacivert', foto_goster: true })
  const foto = png(6, renk + 1)
  db.ekle('doctor_avatars', { doctor_id: id, mime_type: 'image/png', byte_length: foto.length, image_encrypted: encryptBytes(foto).toString('base64'), updated_at: '2026-11-25T10:00:00Z' })
  return { id, jwt, token, ad, logoYol, foto }
}

const iste = (yontem: string, yol: string, o: { jwt?: string; govde?: unknown; form?: FormData } = {}) =>
  new NextRequestSinifi(`http://localhost${yol}`, {
    method: yontem,
    headers: { ...(o.jwt ? { authorization: `Bearer ${o.jwt}` } : {}), ...(o.govde !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: o.form ?? (o.govde !== undefined ? JSON.stringify(o.govde) : undefined),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
const form = (b: Buffer, ad = 'logo.png', tur = 'image/png') => { const f = new FormData(); f.append('file', new Blob([new Uint8Array(b)], { type: tur }), ad); return f }
const satir = (h: Hekim) => JSON.stringify(db.tablo('hasta_alani_gorunumu').find((r) => r.doctor_id === h.id))
const dosyalar = () => [...(db.depolama.get(KOVA)?.keys() || [])].sort()

before(async () => {
  NextRequestSinifi = (await import('next/server')).NextRequest
  encryptBytes = (await import('../vault/crypto')).encryptBytes
  R = {
    ayar: await import('../../app/api/doktor/hasta-alani/route'),
    logo: await import('../../app/api/doktor/hasta-alani/logo/route'),
    gorsel: await import('../../app/api/portal/hasta/[token]/marka/gorsel/route'),
    ikon: await import('../../app/api/portal/hasta/[token]/marka/ikon/route'),
    manifest: await import('../../app/api/portal/hasta/[token]/manifest/route'),
    sunucu: await import('./markaSunucu'),
  }
})
beforeEach(() => {
  db = new SahteVeritabani()
  A = hekimKur('a', 'Kaan Arıoğlu', 10)
  B = hekimKur('b', 'Selin Demir', 200)
})

for (const [ad, arayan, kurban] of [['A → B', () => A, () => B], ['B → A', () => B, () => A]] as const) {
  describe(`brand settings and files stay with their doctor (${ad})`, () => {
    it('GET returns only the caller\'s own settings', async () => {
      const y = await R.ayar.GET(iste('GET', '/api/doktor/hasta-alani', { jwt: arayan().jwt }))
      const t = await y.text()
      assert.equal(y.status, 200)
      assert.ok(t.includes(`GIZLI-${arayan() === A ? 'A' : 'B'}`))
      assert.ok(!t.includes(`GIZLI-${kurban() === A ? 'A' : 'B'}`), 'no foreign marker')
    })
    it('PUT writes the caller\'s row; the other doctor\'s row is byte-identical', async () => {
      const once = satir(kurban())
      const y = await R.ayar.PUT(iste('PUT', '/api/doktor/hasta-alani', { jwt: arayan().jwt, govde: { gorunenAd: 'Yeni Ad', vurgu: 'cam', fotoGoster: false, doctor_id: kurban().id } }))
      assert.equal(y.status, 200)
      assert.equal(satir(kurban()), once)
      const benim = db.tablo('hasta_alani_gorunumu').find((r) => r.doctor_id === arayan().id)!
      assert.equal(benim.gorunen_ad, 'Yeni Ad'); assert.equal(benim.vurgu, 'cam'); assert.equal(benim.foto_goster, false)
      assert.equal(db.tablo('hasta_alani_gorunumu').length, 2, 'no extra row for a body-supplied doctor id')
    })
    it('logo POST lands in the caller\'s own folder with metadata stripped; DELETE never removes a foreign file', async () => {
      const yabanci = dosyalar().filter((f) => f.startsWith(kurban().id))
      const y = await R.logo.POST(iste('POST', '/api/doktor/hasta-alani/logo', { jwt: arayan().jwt, form: form(png(16, 77)) }))
      assert.equal(y.status, 201)
      const yeni = db.tablo('hasta_alani_gorunumu').find((r) => r.doctor_id === arayan().id)!.logo_yol as string
      assert.ok(yeni.startsWith(`${arayan().id}/logo-`), yeni)
      const bayt = db.depolama.get(KOVA)!.get(yeni) as Buffer
      assert.ok(!bayt.toString('latin1').includes('tEXt'), 'metadata stripped before storage')
      const d = await R.logo.DELETE(iste('DELETE', '/api/doktor/hasta-alani/logo', { jwt: arayan().jwt }))
      assert.equal(d.status, 200)
      assert.ok(!dosyalar().includes(yeni), 'own logo removed')
      assert.deepEqual(dosyalar().filter((f) => f.startsWith(kurban().id)), yabanci, 'foreign files untouched')
      assert.equal(satir(kurban()), JSON.stringify(db.tablo('hasta_alani_gorunumu').find((r) => r.doctor_id === kurban().id)))
    })
    it('a portal token resolves only its own doctor (brand, manifest, photo, icon)', async () => {
      const k = await R.sunucu.portalMarkaKaydi(arayan().token)
      assert.equal(k.doctorId, arayan().id)
      assert.ok(k.marka.ad.includes(`GIZLI-${arayan() === A ? 'A' : 'B'}`))
      const m = await (await R.manifest.GET(new Request('http://x'), { params: { token: arayan().token } })).text()
      assert.ok(m.includes(`GIZLI-${arayan() === A ? 'A' : 'B'}`) && !m.includes(`GIZLI-${kurban() === A ? 'A' : 'B'}`))
      assert.ok(!m.includes('Notya'), 'manifest names the doctor, not Notya')
      const g = await R.gorsel.GET(new Request('http://x'), { params: { token: arayan().token } })
      assert.equal(g.status, 200)
      assert.deepEqual(Buffer.from(await g.arrayBuffer()), arayan().foto, 'the token doctor\'s own photo')
      assert.match(String(g.headers.get('cache-control')), /private.*immutable/)
      const i = await R.ikon.GET(new Request('http://x/?b=192'), { params: { token: arayan().token } })
      assert.equal(i.status, 200)
      assert.equal(i.headers.get('content-type'), 'image/png')
    })
  })
}

describe('route-level upload gate and unknown links', () => {
  it('SVG (even named .png / typed image/png) and oversize files are refused, nothing stored', async () => {
    const once = dosyalar()
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    const y1 = await R.logo.POST(iste('POST', '/api/doktor/hasta-alani/logo', { jwt: A.jwt, form: form(svg, 'logo.png', 'image/png') }))
    assert.equal(y1.status, 400)
    assert.match(await y1.text(), /SVG/)
    const y2 = await R.logo.POST(iste('POST', '/api/doktor/hasta-alani/logo', { jwt: A.jwt, form: form(Buffer.concat([png(4, 1), Buffer.alloc(2 * 1024 * 1024)])) }))
    assert.equal(y2.status, 400)
    assert.deepEqual(dosyalar(), once)
  })
  it('no session → 401; unknown or expired token → neutral brand, 404 photo', async () => {
    assert.equal((await R.ayar.GET(iste('GET', '/api/doktor/hasta-alani'))).status, 401)
    assert.equal((await R.logo.POST(iste('POST', '/api/doktor/hasta-alani/logo', { form: form(png(4, 1)) }))).status, 401)
    db.tablo('hasta_portal_tokens').find((r) => r.doctor_id === A.id)!.expires_at = new Date(Date.now() - 1000).toISOString()
    assert.equal(await R.sunucu.portalMarkaKaydi(A.token), null)
    assert.equal((await R.gorsel.GET(new Request('http://x'), { params: { token: A.token } })).status, 404)
    assert.equal((await R.gorsel.GET(new Request('http://x'), { params: { token: 'yok' } })).status, 404)
  })
  it('photo switched off → the token route does not serve it', async () => {
    db.tablo('hasta_alani_gorunumu').find((r) => r.doctor_id === A.id)!.foto_goster = false
    assert.equal((await R.gorsel.GET(new Request('http://x'), { params: { token: A.token } })).status, 404)
  })
  it('push names are per doctor (one batched lookup)', async () => {
    const adlar = await R.sunucu.pushMarkaAdlari(db.istemci(), [A.id, B.id])
    assert.equal(adlar.get(A.id), 'GIZLI-A Görünen')
    assert.equal(adlar.get(B.id), 'GIZLI-B Görünen')
  })
})
