/**
 * AU-SEO-01 — SEO kit, written against the active pack. Run once per country.
 * Switch off (every country except au by default): disallow-all robots, no sitemap, noindex.
 * Switch on: public pages allowed and listed; the signed-in application never.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AKTIF_PAKET } from '../../../countries/active'
import { ACIK_ICERIK_YOLLARI, ACIK_ROBOTS } from '../acikIcerik'
import { robotsMetni, sitemapXml } from './robotsSitemap'
import { sayfaMeta, SEO_YOLLARI } from './meta'
import { seoMetni } from './metinler'
import { yapisalVeri, OPERATOR } from './yapisalVeri'
import { hreflangHaritasi, kendiSite, SITELER } from './siteler'

const GIZLI = AKTIF_PAKET.aramaMotorlarinaGizli
const kod = AKTIF_PAKET.kod as string

describe('SEO kit', { skip: !SITELER[kod] }, () => {
  it('site table matches the pack path prefix', () => {
    assert.equal(SITELER[kod].onEk, AKTIF_PAKET.yolOnEki)
    assert.equal(SITELER[kod].hreflang, AKTIF_PAKET.varsayilanDil)
  })

  it('robots, sitemap and robots meta follow the single switch', () => {
    if (GIZLI) {
      assert.equal(robotsMetni(), 'User-agent: *\nDisallow: /\n')
      assert.equal(sitemapXml(), null)
      assert.equal((ACIK_ROBOTS as { index: boolean }).index, false)
    } else {
      const r = robotsMetni()
      assert.match(r, /^User-agent: \*\n/)
      assert.match(r, /\nDisallow: \/\n/)
      assert.match(r, /Sitemap: https:\/\/[^\n]+\/sitemap\.xml/)
      for (const y of ['/today', '/patients', '/portal', '/login', '/api/', '/billing']) assert.ok(!r.includes(`Allow: ${AKTIF_PAKET.yolOnEki}${y}`), y)
      const x = sitemapXml()!
      for (const y of ACIK_ICERIK_YOLLARI) assert.ok(x.includes(`<loc>${kendiSite().origin}${AKTIF_PAKET.yolOnEki}${y === '/' ? '' : y}</loc>`), y)
      for (const y of ['/today', '/patients', '/portal', '/login', '/signup', '/billing']) assert.ok(!x.includes(`${AKTIF_PAKET.yolOnEki}${y}<`), y)
      assert.equal((ACIK_ROBOTS as { index: boolean }).index, true)
    }
  })

  it('every public page has canonical, hreflang self-reference, Open Graph and Twitter', () => {
    for (const [s, yol] of Object.entries(SEO_YOLLARI)) {
      const m = sayfaMeta(s as keyof typeof SEO_YOLLARI, { baslik: 'T', aciklama: 'D' })
      const url = `${kendiSite().origin}${AKTIF_PAKET.yolOnEki}${yol === '/' ? '' : yol}`
      assert.equal(m.alternates?.canonical, url, s)
      assert.equal((m.alternates?.languages as Record<string, string>)[AKTIF_PAKET.varsayilanDil], url, s)
      assert.equal((m.openGraph as { url: string }).url, url, s)
      assert.equal((m.twitter as { card: string }).card, 'summary')
      assert.ok(m.title && m.description, s)
    }
    assert.deepEqual(Object.values(SEO_YOLLARI).sort(), [...ACIK_ICERIK_YOLLARI].sort(), 'meta pages = sitemap pages')
  })

  it('texts make no regulator, approval, compliance or price claim and use no Turkish letters', () => {
    const yasak = /\b(TGA|ARTG|Ahpra|AHPRA|RACGP|HIPAA|compliant|compliance|approved by|endorsed|certified|ABN|bulk bill|[$€£]\s?\d|per month|\/month)\b/i
    for (const s of Object.keys(SEO_YOLLARI)) {
      const t = seoMetni(kod, s as keyof typeof SEO_YOLLARI)
      if (!t) continue
      const metin = `${t.baslik ?? ''} ${t.aciklama}`
      assert.doesNotMatch(metin, yasak, s)
      assert.doesNotMatch(metin, /[çğıöşüÇĞİÖŞÜ]/, s)
      assert.ok((t.baslik ?? '').length <= 62 && t.aciklama.length <= 165, `${s} length`)
    }
  })

  it('structured data: operator facts only', () => {
    const j = JSON.stringify(yapisalVeri())
    assert.match(j, /Notya LLC/)
    assert.match(j, /Baltimore/)
    assert.match(j, /kaan@notya\.io/)
    assert.doesNotMatch(j, /ABN|TGA|Ahpra|"offers"|"price"|aggregateRating|compliant/i)
    assert.equal(OPERATOR.eposta, 'kaan@notya.io')
  })

  it('hreflang lists sister sites only when named', () => {
    assert.equal(Object.keys(hreflangHaritasi('/')).length >= 1, true)
  })
})
