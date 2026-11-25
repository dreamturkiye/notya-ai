/**
 * SAGLIGIM-ZEMIN (Kaan, 2026-11-25) — pins the full-page background photo of Sağlığım:
 *   - the child rule (Kaan, standing): a photo with a baby / child is never drawn for an adult patient or on an adult
 *     branş page — only on the pediatric pages (pediatri / çocuk cerrahisi modules) AND only for a patient under 18;
 *     unknown age = adult;
 *   - one map for every branş (the photo follows the page, never the branş);
 *   - every photo exists as AVIF + WebP for desktop and phone within the performance budget, and has its CSS rule;
 *   - the layer is never in the server markup (drawn after hydration: no layout shift, content paints first).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { COCUK_GORSELLERI, PEDIATRIK_SAYFALAR, SAYFA_ZEMINI, VARSAYILAN_ZEMIN, ZEMIN_GORSELLERI, portalZemini } from './zemin'
import { portalNavSirasi } from './navSirasi'
import { ASI_KARNESI_NAV } from './moduller'
import { SPECIALTIES } from '../doktor/specialties'
import { KLINIK_YENI_SLUGS } from '../specialties/klinikDikey'
import { specialtyProfile } from '../specialties/registry'
import { PortalShell } from '../../app/portal/_components/PortalShell'

;(globalThis as { React?: typeof React }).React = React

const KOK = join(__dirname, '../..')
const BRANSLAR = [...SPECIALTIES.map((s) => s.key), ...KLINIK_YENI_SLUGS]
const COCUK_BRANSLARI = new Set(['pediatri', 'cocuk-cerrahisi'])

/** Every page key a patient of this branş can open: base + daily-health-home + the branş's own modules + aşı karnesi. */
function sayfaAnahtarlari(brans: string): string[] {
  const moduller = (specialtyProfile(brans).portal || []).flatMap((m) => m.nav || [])
  return [...portalNavSirasi({ randevuAcik: true, moduller: [...moduller, ASI_KARNESI_NAV] }).map((n) => n.key), 'tercihler', '']
}

describe('SAGLIGIM-ZEMIN — child photos only for children on pediatric pages', () => {
  it('covers all 40 branşlar (30 medical + 10 Özel Branşlar), pediatric chapters included', () => {
    assert.equal(new Set(BRANSLAR).size, 40)
    for (const b of COCUK_BRANSLARI) assert.ok(BRANSLAR.includes(b), b)
    // the pediatric modules really are reached by the walk below
    assert.ok(sayfaAnahtarlari('pediatri').includes('asi-onam'))
    assert.ok(sayfaAnahtarlari('cocuk-cerrahisi').includes('cocugumun-cerrahisi'))
  })

  it('an adult patient (or unknown age) never gets a child photo, on any page of any branş', () => {
    for (const brans of BRANSLAR) {
      for (const key of sayfaAnahtarlari(brans)) {
        for (const onSekizAlti of [undefined, null, false]) {
          const z = portalZemini(key || undefined, { onSekizAlti })
          assert.ok(!COCUK_GORSELLERI.has(z), `${brans} › ${key || '(none)'} › onSekizAlti=${onSekizAlti} → ${z}`)
        }
      }
    }
  })

  it('a child photo appears only on a pediatric page, and only for an under-18 patient', () => {
    for (const brans of BRANSLAR) {
      for (const key of sayfaAnahtarlari(brans)) {
        const z = portalZemini(key || undefined, { onSekizAlti: true })
        if (COCUK_GORSELLERI.has(z)) assert.ok(PEDIATRIK_SAYFALAR.has(key), `${brans} › ${key} → ${z}`)
      }
    }
  })

  it('the pediatric pages belong to the pediatric chapters (aşı karnesi: age rule)', () => {
    for (const key of PEDIATRIK_SAYFALAR) {
      const sahipler = BRANSLAR.filter((b) => (specialtyProfile(b).portal || []).some((m) => (m.nav || []).some((n) => n.key === key)))
      for (const b of sahipler) assert.ok(COCUK_BRANSLARI.has(b), `${key} declared by ${b}`)
    }
    assert.equal(portalZemini('asi-karnesi', { onSekizAlti: true }), 'baby-health')
    assert.notEqual(portalZemini('asi-karnesi', { onSekizAlti: false }), 'baby-health')
  })

  it('only the pediatric pages map to a child photo at all', () => {
    for (const [key, z] of Object.entries(SAYFA_ZEMINI)) {
      if (COCUK_GORSELLERI.has(z)) assert.ok(PEDIATRIK_SAYFALAR.has(key), key)
    }
    assert.ok(!COCUK_GORSELLERI.has(VARSAYILAN_ZEMIN))
  })
})

describe('SAGLIGIM-ZEMIN — one map, real files, within budget', () => {
  it('base pages get the agreed scenes; unknown pages fall back to the home photo', () => {
    assert.equal(portalZemini('ozet'), 'hero')
    assert.equal(portalZemini('doz-takvimi'), 'ilaclar-care')
    assert.equal(portalZemini('ilaclar'), 'ilaclar-care')
    assert.equal(portalZemini('karne'), 'wellness-kitchen')
    assert.equal(portalZemini('bilinmeyen-modul'), VARSAYILAN_ZEMIN)
    assert.equal(portalZemini(undefined), VARSAYILAN_ZEMIN)
  })

  it('every photo has desktop + phone AVIF/WebP within the budget and its CSS rule', () => {
    const css = readFileSync(join(KOK, 'app/portal/sagligim.css'), 'utf8')
    for (const ad of ZEMIN_GORSELLERI) {
      for (const [rol, avifTavan] of [['masaustu', 125 * 1024], ['telefon', 52 * 1024]] as const) {
        const avif = statSync(join(KOK, `public/portal/zemin/${ad}-${rol}.avif`)).size
        const webp = statSync(join(KOK, `public/portal/zemin/${ad}-${rol}.webp`)).size
        assert.ok(avif <= avifTavan, `${ad}-${rol}.avif ${avif} B`)
        assert.ok(webp <= avifTavan * 1.5, `${ad}-${rol}.webp ${webp} B`)
      }
      assert.ok(css.includes(`.sg-zemin-foto[data-zemin='${ad}']`), `CSS rule for ${ad}`)
    }
  })

  it('the photo layer is never in the server markup (drawn after hydration; no layout shift)', () => {
    const html = renderToStaticMarkup(createElement(PortalShell, { basePath: '/portal/demo', hastaAdi: 'Demo Hasta', children: createElement('p', null, 'x') }))
    assert.ok(html.includes('sg-shell'))
    assert.ok(!html.includes('sg-zemin'))
  })
})
