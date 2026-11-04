/**
 * AU-POLITIKA-01 (2026-11-03) — the Australian launch policy pages render, are reachable, are linked from the landing's legal
 * block, and say what the code does (no bundled consent, no compliance claim, the providers the code calls).
 * The pages are rendered with the Australian pack active (set before anything reads the active pack).
 */
process.env.NOTYA_COUNTRY = 'au'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const KOK = process.cwd()
const YENI = ['data-storage', 'sub-processors', 'data-processing-agreement'] as const

describe('AU launch policy pages render', () => {
  for (const slug of [...YENI, 'data-breach'] as const) {
    it(`/${slug} renders its title and sections`, async () => {
      const { uzantiBelgesi } = await import('@/components/ulke/UzantiBelgesiSayfasi')
      const { ulkePaketi } = await import('@/lib/ulke/ulke')
      assert.equal(ulkePaketi().kod, 'au')
      const b = ulkePaketi().uzanti!.belgeler![slug]
      const html = renderToStaticMarkup(React.createElement(uzantiBelgesi(slug).Sayfa))
      assert.ok(html.includes(b.baslik.replace(/&/g, '&amp;')), slug)
      for (const x of b.bolumler) assert.ok(html.includes(x.baslik), `${slug}: ${x.baslik}`)
      assert.match(html, /Last updated 3 November 2026\./)
    })
    it(`/${slug} has its page file and is an allowed route`, async () => {
      const kaynak = readFileSync(join(KOK, 'app', slug, 'page.ulke.tsx'), 'utf8')
      assert.match(kaynak, new RegExp(`uzantiBelgesi\\('${slug}'\\)`))
      const { AU_PAKETI } = await import('../index')
      assert.ok(AU_PAKETI.rotalar !== 'hepsi' && AU_PAKETI.rotalar.sayfalar.includes(`/${slug}`))
    })
  }
  it('the shared privacy, terms, refund and cookie pages render the Australian text', async () => {
    const { yasalSayfasi } = await import('@/components/ulke/yasalSayfa')
    const html = (k: 'privacy' | 'terms' | 'refund' | 'cookies') => renderToStaticMarkup(React.createElement(yasalSayfasi(k).Sayfa, { searchParams: {} }))
    assert.match(html('privacy'), /Overseas disclosure \(APP 8\)/)
    assert.match(html('terms'), /15-day free trial/)
    assert.match(html('refund'), /Australian Consumer Law/)
    assert.match(html('cookies'), /strictly necessary/)
  })
})

describe('AU launch policy links', () => {
  it('the landing legal block links every policy page', async () => {
    const { AU_YASAL_NOTLARI } = await import('./acilis')
    const href = AU_YASAL_NOTLARI.baglantilar.map((b) => b.href)
    for (const h of ['/privacy', '/terms', '/data-breach', '/data-request', '/security', '/data-storage', '/sub-processors', '/data-processing-agreement']) assert.ok(href.includes(h), h)
  })
})

describe('AU launch policy content', () => {
  it('the privacy policy has the APP-aligned sections, the live assistant and Stripe, and no bundled consent', async () => {
    const { AU_YASAL } = await import('../yasal')
    const p = AU_YASAL.diller[0].belgeler.find((b) => b.anahtar === 'privacy')!
    const metin = JSON.stringify(p)
    for (const b of ['What we collect', 'How we use it', 'Artificial intelligence', 'Consent before recording', 'Overseas disclosure (APP 8)', 'Security', 'How long we keep it', 'Complaints', 'Data breaches', 'Contact and Privacy Officer']) assert.ok(p.bolumler.some((x) => x.baslik.startsWith(b)), b)
    for (const x of ['Supabase', 'Vercel', 'ElevenLabs', 'OpenRouter', 'OpenAI', 'Anthropic', 'Stripe', 'Sydney', 'Live voice assistant', 'OAIC', 'small business exemption']) assert.ok(metin.includes(x), x)
    assert.doesNotMatch(metin, /by using Notya you consent|in accordance with the Privacy Act/i)
  })
  it('no launch policy claims compliance, certification or a lawyer’s review', async () => {
    const { AU_YASAL } = await import('../yasal')
    const { AU_DATA_BREACH } = await import('./veriIhlali')
    const { AU_VERI_SAKLAMA, AU_ALT_ISLEYEN_BELGESI, AU_DPA_BELGESI } = await import('./politikalar')
    const { AU_YASAL_SATIRLARI } = await import('./acilis')
    const hepsi = JSON.stringify([AU_YASAL.diller[0].belgeler, AU_DATA_BREACH, AU_VERI_SAKLAMA, AU_ALT_ISLEYEN_BELGESI, AU_DPA_BELGESI, AU_YASAL_SATIRLARI])
    assert.doesNotMatch(hepsi, /\b(is|are) (fully )?compliant\b|\bcertified\b|\bHIPAA\b|\bSOC ?2\b|\bISO ?27001\b|reviewed by (a|our) (lawyer|clinician)|point-in-time recovery is (enabled|available)|by using Notya you consent/i)
  })
  it('the breach plan states the 30-day assessment, OAIC notification and the 72-hour practice notice', async () => {
    const { AU_DATA_BREACH } = await import('./veriIhlali')
    const m = JSON.stringify(AU_DATA_BREACH)
    for (const x of ['Contain', 'Assess', 'Notify', 'Review', 'within 30 days', 'OAIC', 'within 72 hours', 'Response lead']) assert.ok(m.includes(x), x)
  })
  it('the retention page says what the code does on cancellation and how deletion and export are requested', async () => {
    const { AU_VERI_SAKLAMA } = await import('./politikalar')
    const m = JSON.stringify(AU_VERI_SAKLAMA)
    for (const x of ['ap-southeast-2', 'read-only', 'within 30 days', 'kaan@notya.io', 'state and territory health records laws', 'deleted from storage once it has been turned into text']) assert.ok(m.includes(x), x)
  })
  it('the terms carry the live trial, plan and founding facts from the billing settings', async () => {
    const { AU_YASAL } = await import('../yasal')
    const { ulkeTicari } = await import('@/lib/billing/ulkeTicari')
    const t = ulkeTicari('au')!
    const m = JSON.stringify(AU_YASAL.diller[0].belgeler.find((b) => b.anahtar === 'terms'))
    assert.ok(m.includes(`${t.deneme!.gun}-day free trial`))
    assert.ok(m.includes(`up to ${t.deneme!.muayene} visits and ${t.sesDakika!.denemeDakika} minutes`))
    assert.ok(m.includes(`${t.sesDakika!.aylikDakika} minutes of the live voice assistant each month`))
    for (const f of [t.fiyatlar!.normal.month, t.fiyatlar!.normal.year, t.fiyatlar!.kurucu!.month, t.fiyatlar!.kurucu!.year]) assert.ok(m.includes(f), f)
    assert.match(m, /renews automatically/)
    assert.match(m, /Australian Consumer Law/)
  })
})
