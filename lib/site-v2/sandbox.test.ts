import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { siteV2AcikMi } from './sandbox'
import { HASTALAR, HEKIM, KAYNAK } from './demoVeri'

describe('site-v2 sandbox kapısı', () => {
  it('production ve notya-ai.vercel.app kapalı', () => {
    assert.equal(siteV2AcikMi({ VERCEL_ENV: 'production', NODE_ENV: 'production' }), false)
    assert.equal(siteV2AcikMi({ VERCEL_ENV: 'preview', VERCEL_URL: 'notya-ai.vercel.app' }), false)
    assert.equal(siteV2AcikMi({ NODE_ENV: 'development' }), true)
    assert.equal(siteV2AcikMi({ VERCEL_ENV: 'preview', VERCEL_URL: 'notya-ai-git-site-v2-getvelacom.vercel.app' }), true)
  })

  it('middleware production’da /site-v2’yi keser', () => {
    const mw = readFileSync(new URL('../../middleware.ts', import.meta.url), 'utf8')
    assert.match(mw, /siteV2AcikMi/)
    assert.match(mw, /\/site-v2/)
  })
})

describe('site-v2 demo veri — beta sahnesi, PHI yok', () => {
  it('Gökhan beta hekim kimliği; hastalar sentetik', () => {
    assert.equal(KAYNAK, 'sentetik-beta')
    assert.match(HEKIM.ad, /Gökhan Mamur/)
    assert.match(HEKIM.unvan, /Çocuk Sağlığı/)
    assert.ok(HASTALAR.some((h) => h.brans === 'pediatri' && h.veli))
    assert.ok(HASTALAR.some((h) => h.brans === 'kd' && !h.veli))
  })

  it('gerçek TC / şifre / PACS yok', () => {
    const ham = [
      readFileSync(new URL('./demoVeri.ts', import.meta.url), 'utf8'),
      readFileSync(new URL('../../app/site-v2/page.tsx', import.meta.url), 'utf8'),
    ].join('\n')
    assert.doesNotMatch(ham, /\b[1-9]\d{10}\b/)
    assert.doesNotMatch(ham, /Gokhan-2026|şifre\s*:/i)
    assert.doesNotMatch(ham, /PACS/i)
  })
})
