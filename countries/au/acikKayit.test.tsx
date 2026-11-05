/**
 * AU-ACIK-KAYIT-01 + AU-HUKUK-YANIT-01 (Kaan, 2026-11-05) — Australia's open self-serve sign-up (no invitation code) and
 * the revised legal texts published after the Australian lawyer's answers.
 *
 *   - sign-up: no code asked or required; the account is created UNCONFIRMED and the confirmation email is sent; its
 *     link may return only to this site's sign-in page; a failed email removes the account; attempts are limited per IP;
 *   - the pages render; the public texts carry the agreed wording (assistant, terms, notice version, landing, founding).
 *
 * The Australian pack is active (set before anything reads it). The database and the auth service are stand-ins.
 */
process.env.NOTYA_COUNTRY = 'au'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'

import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import '@/lib/ulke/testing/varlikTaklidi'

// ───────────────────────── auth + database stand-in ─────────────────────────
type Olay = { tur: string; veri?: unknown }
let olaylar: Olay[] = []
const boz = { posta: null as null | { status?: number; message: string } }
function sifirla() { olaylar = []; boz.posta = null }

function sahteCreateClient() {
  return {
    auth: {
      admin: {
        createUser: async (g: Record<string, unknown>) => { olaylar.push({ tur: 'createUser', veri: g }); return { data: { user: { id: '20000000-0000-4000-8000-000000000001' } }, error: null } },
        deleteUser: async (id: string) => { olaylar.push({ tur: 'deleteUser', veri: id }); return { data: null, error: null } },
      },
      resend: async (g: Record<string, unknown>) => { olaylar.push({ tur: 'resend', veri: g }); return { data: null, error: boz.posta } },
    },
    rpc: async (ad: string) => { throw new Error(`open sign-up must not touch an invitation code (rpc ${ad})`) },
    from: (tablo: string) => {
      assert.equal(tablo, 'ulke_hesaplari')
      const z: Record<string, unknown> = {
        insert: async (g: Record<string, unknown>) => { assert.equal(g.ulke, 'au'); olaylar.push({ tur: 'insert', veri: g }); return { data: null, error: null } },
        delete: () => ({ eq: (k: string, v: string) => { if (k === 'id') olaylar.push({ tur: 'deleteRow', veri: v }); return { eq: async () => ({ error: null }), then: (r: (x: unknown) => void) => r({ error: null }) } } }),
      }
      return z
    },
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`this test may not use the network: ${String(g)}`) }) as typeof fetch

const SORMA = /invitation|invite code|early access|by quote/i

describe('AU sign-up is open (no invitation code)', () => {
  it('the pack opens sign-up and its sign-up / sign-in words never mention a code', async () => {
    const { AU_PAKETI } = await import('./index')
    const { kayitKoduGerekliMi } = await import('@/lib/ulke/davet')
    assert.equal(AU_PAKETI.uygulama!.kayitAcik, true)
    assert.equal(kayitKoduGerekliMi(AU_PAKETI), false)
    const m = AU_PAKETI.metinler['en-AU'] as Record<string, Record<string, string>>
    for (const k of ['baslik', 'aciklama', 'basarili', 'kodYokSorusu', 'fiyatBaglantisi']) assert.doesNotMatch(m.davetliKayit[k], SORMA, k)
    assert.doesNotMatch(m.giris.davetSorusu, SORMA)
    assert.match(m.davetliKayit.basarili, /confirm your email/)
  })

  it('/signup renders with no invitation-code field; founding links still carry the plan to sign-in', async () => {
    const Signup = (await import('../../app/signup/page.ulke')).default
    const html = renderToStaticMarkup(React.createElement(Signup, { searchParams: { plan: 'sesli_pro_founding', interval: 'year' } }))
    assert.ok(html.includes('Create your Notya account'))
    assert.ok(!html.includes('ulke-kayit-kod'), 'no code field')
    assert.doesNotMatch(html, /invitation code/i)
    assert.match(html.replace(/&amp;/g, '&'), /\/login\?plan=sesli_pro_founding&interval=year/)
  })
})

describe('sign-up protections (lib/ulke/kayitKorumasi)', () => {
  it('reads the caller address from the hosting network headers', async () => {
    const { istemciIp } = await import('@/lib/ulke/kayitKorumasi')
    assert.equal(istemciIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })), '203.0.113.7')
    assert.equal(istemciIp(new Headers({ 'x-real-ip': '198.51.100.2' })), '198.51.100.2')
    assert.equal(istemciIp(new Headers()), null)
  })
  it('limits attempts per address', async () => {
    const { kayitDenemesiIzinli, KAYIT_IP_SINIRI } = await import('@/lib/ulke/kayitKorumasi')
    for (let i = 0; i < KAYIT_IP_SINIRI; i++) assert.equal(kayitDenemesiIzinli('192.0.2.50'), true, String(i))
    assert.equal(kayitDenemesiIzinli('192.0.2.50'), false)
    assert.equal(kayitDenemesiIzinli('192.0.2.51'), true, 'another address is not affected')
  })
  it('the confirmation link returns only to this site’s own sign-in page', async () => {
    const { onayDonusAdresi } = await import('@/lib/ulke/kayitKorumasi')
    assert.equal(onayDonusAdresi('https://au.notya.io/login?plan=sesli_pro_founding', 'au.notya.io'), 'https://au.notya.io/login?plan=sesli_pro_founding')
    assert.equal(onayDonusAdresi('https://au.notya.io/au/login', 'au.notya.io'), 'https://au.notya.io/au/login')
    for (const kotu of ['https://evil.test/login', 'http://au.notya.io/login', 'https://au.notya.io/today', 'https://u:p@au.notya.io/login', 'javascript:alert(1)', '/login', 7, null]) {
      assert.equal(onayDonusAdresi(kotu, 'au.notya.io'), undefined, String(kotu))
    }
    assert.equal(onayDonusAdresi('https://au.notya.io/login', null), undefined)
  })
})

describe('POST /api/ulke/kayit on the Australian build', () => {
  let rota: typeof import('../../app/api/ulke/kayit/route.ulke')
  let NextRequest: typeof import('next/server').NextRequest
  before(async () => {
    rota = await import('../../app/api/ulke/kayit/route.ulke')
    NextRequest = (await import('next/server')).NextRequest
  })
  beforeEach(sifirla)
  const GOVDE = { adSoyad: 'QA Australian Doctor', eposta: 'QA-New@Notya.Test', sifre: 'a-long-password-9', dil: 'en-AU', donus: 'https://au.notya.test/login?plan=sesli_pro_founding&interval=year' }
  const gonder = async (govde: unknown, ip = '203.0.113.10') => {
    const r = await rota.POST(new NextRequest('https://au.notya.test/api/ulke/kayit', { method: 'POST', body: JSON.stringify(govde), headers: { 'content-type': 'application/json', host: 'au.notya.test', 'x-forwarded-for': ip } }))
    return { s: r.status, j: await r.json() }
  }

  it('no code: the account is created unconfirmed, stamped au, and the confirmation email returns to sign-in with the plan', async () => {
    assert.deepEqual(await gonder(GOVDE), { s: 200, j: { ok: true, onay: true } })
    const yarat = olaylar.find((o) => o.tur === 'createUser')!.veri as Record<string, any>
    assert.equal(yarat.email, 'qa-new@notya.test')
    assert.equal(yarat.email_confirm, false, 'email verification is kept: not auto-confirmed')
    assert.deepEqual(yarat.app_metadata, { country: 'au' })
    assert.equal(yarat.user_metadata.davetli, false)
    assert.deepEqual(olaylar.find((o) => o.tur === 'resend')!.veri, { type: 'signup', email: 'qa-new@notya.test', options: { emailRedirectTo: 'https://au.notya.test/login?plan=sesli_pro_founding&interval=year' } })
    assert.ok(!olaylar.some((o) => o.tur === 'deleteUser'))
  })

  it('a code is not needed and is ignored; a foreign return address is dropped', async () => {
    assert.equal((await gonder({ ...GOVDE, davetKodu: 'nonsense', donus: 'https://evil.test/login' }, '203.0.113.11')).s, 200)
    assert.deepEqual(olaylar.find((o) => o.tur === 'resend')!.veri, { type: 'signup', email: 'qa-new@notya.test' })
  })

  it('the confirmation email cannot be sent: the account is removed again so the person can retry', async () => {
    boz.posta = { status: 500, message: 'smtp down' }
    assert.deepEqual(await gonder(GOVDE, '203.0.113.12'), { s: 500, j: { code: 'OLUSTURULAMADI' } })
    assert.ok(olaylar.some((o) => o.tur === 'deleteUser'))
    boz.posta = { status: 429, message: 'rate limit' }
    assert.deepEqual(await gonder(GOVDE, '203.0.113.13'), { s: 429, j: { code: 'COK_DENEME' } })
  })

  it('bad input is still refused', async () => {
    assert.deepEqual(await gonder({ ...GOVDE, sifre: 'short' }, '203.0.113.14'), { s: 400, j: { code: 'SIFRE_KISA' } })
    assert.deepEqual(await gonder({ ...GOVDE, eposta: 'not-an-email' }, '203.0.113.14'), { s: 400, j: { code: 'EPOSTA_GECERSIZ' } })
    assert.ok(!olaylar.some((o) => o.tur === 'createUser'))
  })

  it('too many attempts from one address: 429, nothing created', async () => {
    const { KAYIT_IP_SINIRI } = await import('@/lib/ulke/kayitKorumasi')
    for (let i = 0; i < KAYIT_IP_SINIRI; i++) await gonder({ ...GOVDE, sifre: 'x' }, '203.0.113.99')
    sifirla()
    assert.deepEqual(await gonder(GOVDE, '203.0.113.99'), { s: 429, j: { code: 'COK_DENEME' } })
    assert.equal(olaylar.length, 0)
  })
})

describe('AU revised texts (5 November 2026)', () => {
  const ASISTAN = 'The assistant helps the practitioner find and read back information recorded in the patient’s file. It does not make clinical decisions; every clinical decision stays with the practitioner.'
  const YASAK = /does not generate new clinical assessments|retrieval[- ]only|general reference information|clinical decision support|decision support only/i

  it('the assistant is described with the agreed wording only, on every public AU page and policy', async () => {
    const { AU_ASISTAN_TANIMI, AU_GIZLILIK } = await import('./uzanti/gizlilik')
    const { AU_YASAL } = await import('./yasal')
    const { AU_ARAYUZ } = await import('./arayuz')
    const { ulkeTicari } = await import('@/lib/billing/ulkeTicari')
    assert.equal(AU_ASISTAN_TANIMI, ASISTAN)
    const belgeler = JSON.stringify(AU_YASAL.diller[0].belgeler)
    const acilis = JSON.stringify(AU_ARAYUZ.acilis)
    const kurucu = JSON.stringify(ulkeTicari('au'))
    for (const [ad, m] of [['policies', belgeler], ['landing', acilis], ['founding', kurucu], ['notice', JSON.stringify(AU_GIZLILIK)]] as const) assert.doesNotMatch(m, YASAK, ad)
    assert.ok(belgeler.includes(ASISTAN), 'privacy policy and medical disclaimer')
    assert.ok(JSON.stringify(AU_GIZLILIK.bildirim).includes(ASISTAN), 'collection notice')
  })

  it('collection notice: new version, assistant described, consent mechanics unchanged', async () => {
    const { AU_GIZLILIK } = await import('./uzanti/gizlilik')
    assert.equal(AU_GIZLILIK.surum, 'au-2026-11-05')
    assert.match(AU_GIZLILIK.riza.kayitSatiri, /notice version %2/)
    assert.match(AU_GIZLILIK.riza.kutu, /I consent/)
  })

  it('terms: self-serve sign-up, liability, NSW law, disputes; refunds case by case', async () => {
    const { AU_YASAL } = await import('./yasal')
    const b = (k: string) => JSON.stringify(AU_YASAL.diller[0].belgeler.find((x) => x.anahtar === k))
    const t = b('terms')
    for (const x of ['self-serve sign-up', 'no invitation code is needed', 'Limitation of liability', 'fees paid by the Practice in the 12 months', 'laws of New South Wales', 'Resolution Institute', 'while founding places remain', 'Annual prices are locked for the prepaid year', 'We act within 30 days']) assert.ok(t.includes(x), x)
    assert.doesNotMatch(t, /invitation code we provide|early-access period/)
    assert.ok(b('refund').includes('Refund requests are considered case by case'))
  })

  it('landing, founding page and receipts carry the agreed lines; no "by quote" line', async () => {
    const { AU_YASAL_SATIRLARI } = await import('./uzanti/acilis')
    const { AU_ARAYUZ } = await import('./arayuz')
    const { ulkeTicari } = await import('@/lib/billing/ulkeTicari')
    assert.ok(AU_YASAL_SATIRLARI.some((s) => s.includes('Use of the public website does not constitute patient consent.')))
    const acilis = JSON.stringify(AU_ARAYUZ.acilis)
    assert.doesNotMatch(acilis, /Prices are given by quote|invitation code|Early access/)
    assert.ok(acilis.includes('Current pricing is published on the founding page.'))
    assert.ok(acilis.includes('Paediatric tools plot growth measurements and record immunisation dates against the Australian schedule.'))
    const k = ulkeTicari('au')!
    assert.ok(JSON.stringify(k.kurucuSayfasi).includes('while places remain'))
    assert.ok(JSON.stringify(k.kurucuSayfasi).includes('Founding doctor — receives the founding pricing.'))
    assert.match(k.faturaNotu!, /non-resident supplier/)
    assert.equal(ulkeTicari('tr'), null, 'Türkiye: no footer')
  })

  it('the revised policy pages render', async () => {
    const { yasalSayfasi } = await import('@/components/ulke/yasalSayfa')
    const html = (k: 'privacy' | 'terms' | 'refund') => renderToStaticMarkup(React.createElement(yasalSayfasi(k).Sayfa, { searchParams: {} }))
    assert.match(html('terms'), /Governing law and forum/)
    assert.match(html('privacy'), /does not make clinical decisions/)
    assert.match(html('refund'), /case by case/)
    assert.match(html('privacy'), /au-2026-11-05/)
  })
})
