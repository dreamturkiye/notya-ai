import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPII, encryptPII } from '@/lib/security/encryption'
import { epostaGonder, hazirMi, HATA } from './gonderim'
import type { Baglanti } from './depo'

/** Just enough of PostgREST for depo.ts; anything else throws so a new query can't pass silently. */
function sahteSb(satirlar: Baglanti[]) {
  const sb = {
    from(tablo: string) {
      assert.equal(tablo, 'doktor_eposta_baglantilari')
      let guncelleme: Record<string, unknown> | null = null
      const zincir = {
        select: () => zincir,
        update: (g: Record<string, unknown>) => ((guncelleme = g), zincir),
        eq(kolon: string, deger: string) {
          assert.equal(kolon, 'doctor_id')
          if (guncelleme) {
            for (const r of satirlar) if (r.doctor_id === deger) Object.assign(r, guncelleme)
            return Promise.resolve({ error: null })
          }
          return { maybeSingle: () => Promise.resolve({ data: satirlar.find((r) => r.doctor_id === deger) ?? null, error: null }) }
        },
      }
      return zincir
    },
  }
  return sb as unknown as SupabaseClient
}

type Cagri = { url: string; init: RequestInit }
let cagrilar: Cagri[] = []
let yanitlar: Array<() => Response> = []
const asilFetch = globalThis.fetch
const json = (durum: number, govde: unknown) => () =>
  new Response(govde === undefined ? null : JSON.stringify(govde), { status: durum, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  process.env.ENCRYPTION_MASTER_KEY = 'test-anahtari-gonderim'
  process.env.GOOGLE_OAUTH_CLIENT_ID = 'g'
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'gs'
  process.env.MS_OAUTH_CLIENT_ID = 'm'
  process.env.MS_OAUTH_CLIENT_SECRET = 'ms'
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

function satir(g: Partial<Baglanti> = {}): Baglanti {
  return { doctor_id: 'doktor-a', saglayici: 'google', adres: 'dr.a@gmail.com', refresh_token_encrypted: encryptPII('rt-a'), durum: 'bagli', son_hata: null, ...g }
}

test('bağlı değilse ağa çıkmadan reddeder', async () => {
  const s = await epostaGonder(sahteSb([]), { doktorId: 'doktor-a', alici: 'hasta@ornek.com', metin: 'Merhaba' })
  assert.deepEqual(s, { ok: false, hata: HATA.bagliDegil })
  assert.equal(cagrilar.length, 0)
})

test('geçersiz alıcı / boş metin ağa çıkmadan reddedilir', async () => {
  const sb = sahteSb([satir()])
  assert.deepEqual(await epostaGonder(sb, { doktorId: 'doktor-a', alici: 'a@b.com\nBcc: x@y.com', metin: 'M' }), { ok: false, hata: HATA.alici })
  assert.deepEqual(await epostaGonder(sb, { doktorId: 'doktor-a', alici: 'a@b.com', metin: '  ' }), { ok: false, hata: HATA.metin })
  assert.equal(cagrilar.length, 0)
})

test('yalnız o doktorun bağlantısı kullanılır (başka doktorun jetonu asla)', async () => {
  const sb = sahteSb([satir({ doctor_id: 'doktor-b', refresh_token_encrypted: encryptPII('rt-b') })])
  const s = await epostaGonder(sb, { doktorId: 'doktor-a', alici: 'hasta@ornek.com', metin: 'Merhaba' })
  assert.deepEqual(s, { ok: false, hata: HATA.bagliDegil })
  assert.equal(cagrilar.length, 0)
})

test('başarılı gönderim: çözülen jetonla yenile, gönder, eski hatayı temizle', async () => {
  const r = satir({ son_hata: 'eski' })
  yanitlar.push(json(200, { access_token: 'at' }), json(200, { id: 'm1' }))
  const s = await epostaGonder(sahteSb([r]), { doktorId: 'doktor-a', alici: 'hasta@ornek.com', konu: 'Randevu', metin: 'Yarın 10:00' })
  assert.deepEqual(s, { ok: true, disId: 'm1' })
  assert.equal(new URLSearchParams(String(cagrilar[0].init.body)).get('refresh_token'), 'rt-a')
  assert.equal(r.son_hata, null)
})

test('konu verilmezse varsayılan konu, satır sonları tek satıra iner', async () => {
  yanitlar.push(json(200, { access_token: 'at' }), json(200, { id: 'm1' }))
  await epostaGonder(sahteSb([satir()]), { doktorId: 'doktor-a', alici: 'hasta@ornek.com', metin: 'M' })
  const ham = Buffer.from(JSON.parse(String(cagrilar[1].init.body)).raw, 'base64url').toString('utf8')
  const kodlu = /^Subject: (.*)$/m.exec(ham)![1]
  assert.equal(Buffer.from(/\?B\?(.+)\?=/.exec(kodlu)![1], 'base64').toString('utf8'), 'Randevunuz hakkında')
})

test('izin geri alındıysa (invalid_grant) bağlantı "yenilenmeli" olur ve gönderim durur', async () => {
  const r = satir()
  yanitlar.push(json(400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }))
  const s = await epostaGonder(sahteSb([r]), { doktorId: 'doktor-a', alici: 'hasta@ornek.com', metin: 'M' })
  assert.deepEqual(s, { ok: false, hata: HATA.yenilenmeli })
  assert.equal(r.durum, 'yenilenmeli')
  assert.match(r.son_hata ?? '', /invalid_grant/)
  assert.equal(cagrilar.length, 1)
  // sonraki gönderim ağa çıkmaz
  assert.deepEqual(await epostaGonder(sahteSb([r]), { doktorId: 'doktor-a', alici: 'hasta@ornek.com', metin: 'M' }), { ok: false, hata: HATA.yenilenmeli })
  assert.equal(await hazirMi(sahteSb([r]), 'doktor-a'), false)
})

test('geçici hata bağlantıyı bozmaz', async () => {
  const r = satir()
  yanitlar.push(json(200, { access_token: 'at' }), json(429, { error: { message: 'User-rate limit exceeded' } }))
  const s = await epostaGonder(sahteSb([r]), { doktorId: 'doktor-a', alici: 'hasta@ornek.com', metin: 'M' })
  assert.deepEqual(s, { ok: false, hata: HATA.gecici })
  assert.equal(r.durum, 'bagli')
  assert.match(r.son_hata ?? '', /429/)
})

test('Microsoft döndürdüğü yeni yenileme jetonu şifreli saklanır', async () => {
  const r = satir({ saglayici: 'microsoft', adres: 'dr.a@outlook.com' })
  yanitlar.push(json(200, { access_token: 'at', refresh_token: 'rt-a-2' }), json(202, undefined))
  const s = await epostaGonder(sahteSb([r]), { doktorId: 'doktor-a', alici: 'hasta@ornek.com', metin: 'M' })
  assert.deepEqual(s, { ok: true })
  assert.ok(!r.refresh_token_encrypted.includes('rt-a-2'))
  assert.equal(decryptPII(r.refresh_token_encrypted), 'rt-a-2')
})

test('hazirMi: bağlı + sağlayıcı yapılandırılmış olmalı', async () => {
  assert.equal(await hazirMi(sahteSb([satir()]), 'doktor-a'), true)
  assert.equal(await hazirMi(sahteSb([]), 'doktor-a'), false)
  delete process.env.GOOGLE_OAUTH_CLIENT_SECRET
  assert.equal(await hazirMi(sahteSb([satir()]), 'doktor-a'), false)
})
