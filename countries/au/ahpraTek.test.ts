/**
 * LOOK-PARITY-04 (Australia): the AHPRA number lives in Practice details only; the old account field is migrated or dropped.
 * Synthetic accounts only. The stand-in database. No network.
 */
process.env.NOTYA_COUNTRY = 'au'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0004'

import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sahteVeritabani } from '@/lib/ulke/testing/sahteVeritabani'

const vt = sahteVeritabani()
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as { exports?: Record<string, { require?: { default?: string }; import?: { default?: string } }>; main?: string; module?: string }
  const kok = dirname(pkgYolu)
  const adaylar = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean) as string[]
  for (const g of new Set(adaylar.map((x) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: vt.createClient } })
  }
}

const A = '10000000-0000-4000-8000-0000000000a1'

function hesapKoy(meta: Record<string, unknown>) {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.hesaplar['jeton-a'] = { id: A, email: 'qa-a@notya.test', app_metadata: { country: 'au' }, user_metadata: meta }
  vt.tablo('ulke_hesaplari').push({ id: A, full_name: 'QA', ulke: 'au', ui_language: 'en-AU' })
}

describe('Australia: one AHPRA store', () => {
  let rota: typeof import('../../app/api/ulke/muayenehane/route.ulke')
  let eski: typeof import('../../app/api/ulke/meslek-kaydi/route.ulke')
  let hesap: typeof import('../../app/api/ulke/hesap/route.ulke')
  let NextRequest: typeof import('next/server').NextRequest
  before(async () => {
    rota = await import('../../app/api/ulke/muayenehane/route.ulke')
    eski = await import('../../app/api/ulke/meslek-kaydi/route.ulke')
    hesap = await import('../../app/api/ulke/hesap/route.ulke')
    NextRequest = (await import('next/server')).NextRequest
  })
  const istek = (yol: string, govde?: unknown) => new NextRequest(`https://au.notya.test${yol}`, { method: govde === undefined ? 'GET' : 'POST', headers: { authorization: 'Bearer jeton-a', 'content-type': 'application/json' }, ...(govde === undefined ? {} : { body: JSON.stringify(govde) }) })
  const meta = () => vt.hesaplar['jeton-a'].user_metadata as Record<string, unknown>

  it('a valid old value moves into practice details and the old field is gone', async () => {
    hesapKoy({ meslekKaydi: 'med0001234567' })
    const r = await rota.GET(istek('/api/ulke/muayenehane'))
    assert.deepEqual((await r.json()).degerler, { ahpra: 'MED0001234567' })
    assert.equal(meta().meslekKaydi, undefined)
    assert.deepEqual(meta().muayenehane, { ahpra: 'MED0001234567' })
  })

  it('an invalid old value (the stray "cardiology") is dropped, never invented into a number', async () => {
    hesapKoy({ meslekKaydi: 'cardiology' })
    const r = await rota.GET(istek('/api/ulke/muayenehane'))
    assert.deepEqual((await r.json()).degerler, {})
    assert.equal(meta().meslekKaydi, undefined)
    assert.equal(meta().muayenehane, undefined)
  })

  it('an existing practice-details number wins over the old field', async () => {
    hesapKoy({ meslekKaydi: 'MED0000000001', muayenehane: { ahpra: 'NMW0009999999' } })
    const r = await rota.GET(istek('/api/ulke/muayenehane'))
    assert.deepEqual((await r.json()).degerler, { ahpra: 'NMW0009999999' })
    assert.equal(meta().meslekKaydi, undefined)
  })

  it('saving practice details also clears the old field', async () => {
    hesapKoy({ meslekKaydi: 'cardiology' })
    const r = await rota.POST(istek('/api/ulke/muayenehane', { ahpra: 'MED0001234567' }))
    assert.equal(r.status, 200)
    assert.equal(meta().meslekKaydi, undefined)
  })

  it('the old route is closed and the account never reports the old field', async () => {
    hesapKoy({ meslekKaydi: 'MED0001234567' })
    assert.equal((await eski.POST(istek('/api/ulke/meslek-kaydi', { meslekKaydi: 'MED0001234567' }))).status, 404)
    const h = await (await hesap.GET(istek('/api/ulke/hesap'))).json()
    assert.equal('meslekKaydi' in h, false)
  })
})
