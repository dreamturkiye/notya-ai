/**
 * NOTYA-ULKE-01 — the same code asked the same questions as an UZBEKISTAN build (NOTYA_COUNTRY=uz).
 *
 * The country is fixed before anything is imported, the way the build fixes it. Proves, for the first country after
 * Türkiye: nothing of Türkiye is reachable — no tool for any specialty, no feature, no route, no Turkish sentence —
 * and an account that is not Uzbekistan's is refused.
 */
process.env.NOTYA_COUNTRY = 'uz'

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import type { Ozellik } from './tipler'

const KOK = resolve(__dirname, '../..')

/** Every URL path the app directory can serve: pages and API routes, dynamic segments filled with a sample value. */
export function uygulamaYollari(): { sayfalar: string[]; api: string[] } {
  const sayfalar: string[] = []
  const api: string[] = []
  const gez = (dizin: string) => {
    for (const ad of readdirSync(dizin)) {
      const yol = join(dizin, ad)
      if (statSync(yol).isDirectory()) { gez(yol); continue }
      if (!/^(page|route)\.(tsx|ts|jsx|js)$/.test(ad)) continue
      const parcalar = relative(join(KOK, 'app'), dizin).split(sep).filter(Boolean)
        .filter((p) => !(p.startsWith('(') && p.endsWith(')')))
        .map((p) => (p.startsWith('[') ? 'ornek-deger' : p))
      const url = '/' + parcalar.join('/')
      ;(ad.startsWith('route') ? api : sayfalar).push(url)
    }
  }
  gez(join(KOK, 'app'))
  return { sayfalar: [...new Set(sayfalar)].sort(), api: [...new Set(api)].sort() }
}

describe('an Uzbekistan build', () => {
  let ulke: typeof import('./ulke')
  let metin: typeof import('./metin')
  let hesap: typeof import('./hesapUlkesi')
  let kapi: typeof import('./rotaKapisi')
  let araclar: typeof import('../doktor/doktorAraclari')
  let etiketler: Record<string, string>

  before(async () => {
    ulke = await import('./ulke')
    metin = await import('./metin')
    hesap = await import('./hesapUlkesi')
    kapi = await import('./rotaKapisi')
    araclar = await import('../doktor/doktorAraclari')
    etiketler = (await import('../intake/bransSorulari')).BRANS_ETIKETLERI as Record<string, string>
  })

  it('serves Uzbekistan: Uzbek in Latin script by default, Russian as the alternative', () => {
    assert.equal(ulke.aktifUlke(), 'uz')
    assert.equal(ulke.ulkePaketi().varsayilanDil, 'uz-Latn')
    assert.equal(ulke.dilSec('ru'), 'ru')
    assert.equal(ulke.dilSec('uz-Latn'), 'uz-Latn')
    // Not switched on / not this country's → the country's own default. Never Turkish.
    for (const ham of ['tr', 'uz-Cyrl', 'en', '', null]) assert.equal(ulke.dilSec(ham), 'uz-Latn', String(ham))
  })

  it('no feature of the Turkish application is on', () => {
    const kapali: Ozellik[] = ['bolunmemisUygulama', 'doktorAraclari', 'asistan', 'sesProfili', 'goruntuDegerlendirme']
    for (const o of kapali) assert.equal(ulke.ozellikAcik(o), false, o)
  })

  it('the tool list is empty for every one of the 30 specialties, and no tool opens by deep link', () => {
    const hamlar: (string | null)[] = [...Object.keys(etiketler), 'kadin-dogum', 'Kadın Hastalıkları ve Doğum', 'İç Hastalıkları', 'genel', '', null]
    assert.ok(Object.keys(etiketler).length >= 30)
    for (const ham of hamlar) {
      assert.deepEqual(araclar.doktorAraclariListesi(ham), [], String(ham))
      assert.deepEqual(araclar.doktorAraclariGruplu(ham), [], String(ham))
      for (const a of araclar.TUM_DOKTOR_ARACLARI) {
        assert.equal(araclar.doktorAraciBransaUygun(a.route, ham), false, `${ham} → ${a.route}`)
      }
    }
    for (const a of araclar.TUM_DOKTOR_ARACLARI) {
      assert.equal(araclar.doktorAraciUlkedeGecerli(a), false, a.route)
      assert.equal(araclar.doktorAracYoluUlkedeAcik(a.route), false, a.route)
    }
    for (const yol of ['/doktor-tools', '/doktor-tools/hatirlatma', '/doktor-tools/olmayan']) {
      assert.equal(araclar.doktorAracYoluUlkedeAcik(yol), false, yol)
    }
  })

  it('text comes from the Uzbek pack; asking for Turkish gives Uzbek, not Turkish', () => {
    const uz = metin.metin('hesap', 'girisReddi')
    const ru = metin.metin('hesap', 'girisReddi', 'ru')
    assert.equal(uz, 'Elektron pochta yoki parol notoʻgʻri.')
    assert.equal(ru, 'Неверный адрес электронной почты или пароль.')
    assert.equal(metin.metin('hesap', 'girisReddi', 'tr'), uz)
    assert.doesNotMatch(uz + ru, /[çğıöşüİĞŞÇÖÜ]/)
  })

  it('accounts: only an account stamped uz belongs here; an unstamped (pre-country) or Turkish account is refused', () => {
    assert.equal(hesap.hesapBuUlkedeMi({ app_metadata: { country: 'uz' } }), true)
    assert.equal(hesap.hesapBuUlkedeMi({ app_metadata: { country: 'tr' } }), false)
    assert.equal(hesap.hesapBuUlkedeMi({ app_metadata: {} }), false)
    assert.equal(hesap.hesapBuUlkedeMi({}), false)
    assert.equal(hesap.hesapBuUlkedeMi(null), false)
    assert.equal(hesap.satirBuUlkedeMi({ country: 'uz' }), true)
    assert.equal(hesap.satirBuUlkedeMi({ country: 'tr' }), false)
    assert.equal(hesap.satirBuUlkedeMi({}), false)
    assert.equal(hesap.satirBuUlkedeMi(null), false)
  })

  it('routes: every page and every API route of the Turkish application is closed unless the pack lists it', () => {
    const izin = ulke.ulkePaketi().rotalar
    assert.notEqual(izin, 'hepsi')
    if (izin === 'hepsi') return
    const { sayfalar, api } = uygulamaYollari()
    assert.ok(sayfalar.length > 150 && api.length > 200, `route scan looks wrong: ${sayfalar.length} pages, ${api.length} api`)
    // `sayfalar` / `api` are the route files of the PRE-SPLIT application (page.tsx, route.ts). In this build they are
    // not routes at all (only *.ulke.* files are); the gate is the second lock and must close every one of them. The
    // only addresses that stay open are ones the pack lists, and each of those is served by a *.ulke.* file here.
    const acikSayfa = sayfalar.filter((y) => kapi.rotaAcikMi(izin, y))
    const acikApi = api.filter((y) => kapi.rotaAcikMi(izin, y))
    for (const y of acikSayfa) {
      assert.ok(izin.sayfalar.includes(y), `${y} is open but not listed`)
      assert.ok(existsSync(join(KOK, 'app', y === '/' ? '' : y.slice(1), 'page.ulke.tsx')), `${y} is listed and exists only as a pre-split page`)
    }
    assert.deepEqual(acikApi, [], 'no API route of the pre-split application may be open')
    assert.ok(sayfalar.length - acikSayfa.length > 150)
    // Static files of the Turkish product that sit in public/ are closed too.
    for (const yol of ['/manifest.json', '/sw.js', '/dahiliye-final-audit.html', '/sagligim/x.png', '/sitemap.xml', '/kvkk', '/giris/doktor', '/kayit', '/dashboard/doktor', '/doktor-tools/erecete', '/api/users/me', '/api/doktor/hastalar', '/api/cron/kvkk-imha']) {
      assert.equal(kapi.rotaAcikMi(izin, yol), false, yol)
    }
    // Framework internals stay open or no page could load its own scripts.
    assert.equal(kapi.rotaAcikMi(izin, '/_next/static/chunks/main.js'), true)
    // A prefix cannot be stretched: '/api/ulke/' never opens '/api/ulkeler'.
    assert.equal(kapi.rotaAcikMi({ sayfalar: [], apiOnEkleri: ['/api/ulke/'] }, '/api/ulkeler'), false)
    assert.equal(kapi.rotaAcikMi({ sayfalar: [], apiOnEkleri: ['/api/ulke/'] }, '/api/ulke/hesap'), true)
    assert.equal(kapi.rotaAcikMi({ sayfalar: ['/login'], apiOnEkleri: [] }, '/login/'), true)
    assert.equal(kapi.rotaAcikMi({ sayfalar: ['/login'], apiOnEkleri: [] }, '/login/x'), false)
  })

  it('hidden from search engines; no sitemap exists to list it', () => {
    assert.equal(ulke.ulkePaketi().aramaMotorlarinaGizli, true)
    assert.match(kapi.ROBOTS_HERKESE_KAPALI, /^User-agent: \*\nDisallow: \/\n$/)
    for (const ad of ['sitemap.ts', 'sitemap.xml', 'sitemap.js']) assert.equal(existsSync(join(KOK, 'app', ad)), false, ad)
    assert.equal(existsSync(join(KOK, 'public', 'sitemap.xml')), false)
  })
})
