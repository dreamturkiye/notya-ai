import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { encryptPII } from '@/lib/security/encryption'
import * as durumRota from '@/app/api/iletisim/eposta/route'
import * as denemeRota from '@/app/api/iletisim/eposta/deneme/route'
import * as baslatRota from '@/app/api/iletisim/eposta/[saglayici]/baslat/route'
import * as donusRota from '@/app/api/iletisim/eposta/[saglayici]/donus/route'
import { CEREZ_ADI, durumImzala } from './durum'

const ENV = ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', 'MS_OAUTH_CLIENT_ID', 'MS_OAUTH_CLIENT_SECRET', 'ENCRYPTION_MASTER_KEY', 'NEXT_PUBLIC_APP_URL'] as const
const yedek: Record<string, string | undefined> = {}
const asilFetch = globalThis.fetch

beforeEach(() => {
  for (const k of ENV) {
    yedek[k] = process.env[k]
    delete process.env[k]
  }
  globalThis.fetch = (async (url: string | URL) => {
    throw new Error(`ağa çıkılmamalı: ${String(url)}`)
  }) as typeof fetch
})
afterEach(() => {
  for (const k of ENV) {
    if (yedek[k] === undefined) delete process.env[k]
    else process.env[k] = yedek[k]
  }
  globalThis.fetch = asilFetch
})

function ac() {
  process.env.ENCRYPTION_MASTER_KEY = 'rota-testi'
  process.env.GOOGLE_OAUTH_CLIENT_ID = 'g'
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'gs'
  process.env.NEXT_PUBLIC_APP_URL = 'https://www.notya.io'
}

const istek = (yol: string, init?: ConstructorParameters<typeof NextRequest>[1]) => new NextRequest(`https://www.notya.io${yol}`, init)

test('yapılandırılmamışken her rota 503 + Türkçe mesaj, oturum bile sorulmaz', async () => {
  for (const r of [
    await durumRota.GET(istek('/api/iletisim/eposta')),
    await durumRota.DELETE(istek('/api/iletisim/eposta', { method: 'DELETE' })),
    await denemeRota.POST(istek('/api/iletisim/eposta/deneme', { method: 'POST' })),
    await baslatRota.POST(istek('/api/iletisim/eposta/google/baslat', { method: 'POST' }), { params: { saglayici: 'google' } }),
  ]) {
    assert.equal(r.status, 503)
    const g = (await r.json()) as { error: string }
    assert.match(g.error, /yakında/i)
  }
})

test('yapılandırılmamışken dönüş Ayarlar\'a sakin bir sonuçla yönlenir', async () => {
  const r = await donusRota.GET(istek('/api/iletisim/eposta/google/donus?code=x&state=y'), { params: { saglayici: 'google' } })
  assert.equal(r.status, 303)
  assert.equal(r.headers.get('location'), 'https://www.notya.io/dashboard/doktor/ayarlar?eposta=kapali')
})

test('bilinmeyen sağlayıcı 404', async () => {
  ac()
  const r = await baslatRota.POST(istek('/api/iletisim/eposta/yahoo/baslat', { method: 'POST' }), { params: { saglayici: 'yahoo' } })
  assert.equal(r.status, 404)
})

test('başlat: oturumsuz 401', async () => {
  ac()
  const r = await baslatRota.POST(istek('/api/iletisim/eposta/google/baslat', { method: 'POST' }), { params: { saglayici: 'google' } })
  assert.equal(r.status, 401)
})

test('dönüş: doktor vazgeçtiyse "vazgecildi", ağa çıkmaz', async () => {
  ac()
  const r = await donusRota.GET(istek('/api/iletisim/eposta/google/donus?error=access_denied&state=x'), { params: { saglayici: 'google' } })
  assert.equal(r.headers.get('location'), 'https://www.notya.io/dashboard/doktor/ayarlar?eposta=vazgecildi')
})

test('dönüş: çerez yok / nonce uyuşmuyor / sağlayıcı farklı / imza bozuk → hata, ağa çıkmaz', async () => {
  ac()
  const durum = durumImzala({ doktorId: 'doktor-a', saglayici: 'google', nonce: 'N1' })
  const cerez = (n: string) => ({ headers: { cookie: `${CEREZ_ADI}=${encodeURIComponent(encryptPII(JSON.stringify({ n, v: 'V' })))}` } })
  const vakalar: Array<[string, string, ConstructorParameters<typeof NextRequest>[1] | undefined]> = [
    ['google', `?code=K&state=${durum}`, undefined], // çerez yok (başka tarayıcı)
    ['google', `?code=K&state=${durum}`, cerez('BASKA')], // nonce farklı
    ['microsoft', `?code=K&state=${durum}`, cerez('N1')], // state google için imzalı
    ['google', `?code=K&state=${durum}x`, cerez('N1')], // imza bozuk
    ['google', `?state=${durum}`, cerez('N1')], // kod yok
  ]
  if (!process.env.MS_OAUTH_CLIENT_ID) {
    process.env.MS_OAUTH_CLIENT_ID = 'm'
    process.env.MS_OAUTH_CLIENT_SECRET = 'ms'
  }
  for (const [s, q, init] of vakalar) {
    const r = await donusRota.GET(istek(`/api/iletisim/eposta/${s}/donus${q}`, init), { params: { saglayici: s } })
    assert.equal(r.headers.get('location'), 'https://www.notya.io/dashboard/doktor/ayarlar?eposta=hata', `${s}${q}`)
    assert.match(r.headers.get('set-cookie') ?? '', new RegExp(`${CEREZ_ADI}=;`), 'tek kullanımlık çerez silinmeli')
  }
})
