/**
 * YENI-DOKTOR-UX-2026-10 — the English set's in-place tips and first-run checklist: every screen of the
 * signed-in application has a tip, every tip is two to four short sentences, and the checklist's
 * placeholders are present. The spelling of every sentence is already checked by ingilizce.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EN_UYGULAMA_TEMEL } from './uygulama'
import type { UlkeIpucuBolumu } from '@/lib/ulke/arayuz/metinTipleri'

const BOLUMLER: readonly UlkeIpucuBolumu[] = ['bugun', 'takvim', 'hastalar', 'muayene', 'araclar', 'klinik', 'onBuro', 'ayarlar', 'fatura', 'gizlilik']

describe('en: in-place tips (YENI-DOKTOR-UX-2026-10)', () => {
  const t = EN_UYGULAMA_TEMEL.ipuclari
  it('the set fills the tips: controls and one tip per screen', () => {
    assert.ok(t, 'ipuclari missing from EN_UYGULAMA_TEMEL')
    for (const alan of [t!.rozet, t!.anladim, t!.birDaha, t!.ayarEtiket, t!.ayarIzoh] as const) {
      assert.ok(alan.trim().length >= 2, `empty control text: ${alan}`)
    }
    assert.ok(t!.ac.includes('%'), 'the trigger’s accessible name must carry % for the heading')
    for (const bolum of BOLUMLER) {
      const i = t!.bolumler[bolum]
      assert.ok(i, `no tip for ${bolum}`)
      assert.ok(i!.baslik.trim().length >= 3, `${bolum}: empty heading`)
      assert.ok(i!.satirlar.length >= 2 && i!.satirlar.length <= 4, `${bolum}: ${i!.satirlar.length} sentences (2–4)`)
      for (const s of i!.satirlar) assert.ok(s.trim().length >= 10 && s.length <= 160, `${bolum}: sentence length: ${s}`)
    }
  })
  it('the first-run checklist: every step named, the done-counter carries %1 and %2', () => {
    const k = EN_UYGULAMA_TEMEL.ilkAdimlar
    assert.ok(k, 'ilkAdimlar missing from EN_UYGULAMA_TEMEL')
    assert.ok(k!.tamamOrani.includes('%1') && k!.tamamOrani.includes('%2'))
    for (const anahtar of ['rol', 'hasta', 'randevu', 'muayene'] as const) {
      assert.ok(k!.adimlar[anahtar].etiket.trim().length >= 3, `${anahtar}: empty label`)
      assert.ok(k!.adimlar[anahtar].aciklama.trim().length >= 3, `${anahtar}: empty line`)
    }
  })
})

// IPUCU-TETIK-01 (2026-11-10, core): the same small labelled "?" icon as Türkiye, inside or right after the heading.
describe('en: the tip trigger (IPUCU-TETIK-01)', () => {
  const KOK = join(__dirname, '..', '..', '..')
  it('renders a labelled 44px button with a 22px visual and a title tooltip', async () => {
    const { Ipucu } = await import('@/components/ulke/uygulama/Ipucu')
    assert.equal(EN_UYGULAMA_TEMEL.ipuclari!.sayfa, 'Tip about this page')
    const html = renderToStaticMarkup(React.createElement(Ipucu, { m: EN_UYGULAMA_TEMEL as never, bolum: 'bugun' }))
    assert.match(html, /<button[^>]*aria-label="Tip about this page"/)
    assert.match(html, /<button[^>]*title="Tip about this page"/)
    assert.match(html, /<button[^>]*width:44px;height:44px/)
    assert.match(html, /class="uza-ipucu-ikon"[^>]*width:22px;height:22px/)
  })
  it('home: the trigger is inside the h1, on the line of its last word', () => {
    const b = readFileSync(join(KOK, 'components/ulke/uygulama/Bugun.tsx'), 'utf8')
    const h1 = b.slice(b.indexOf("fontSize: 'clamp(28px, 8vw, 48px)'"), b.indexOf('</h1>', b.indexOf("fontSize: 'clamp(28px, 8vw, 48px)'")))
    assert.match(h1, /whiteSpace: 'nowrap'[^\n]*<Ipucu m=\{m\} bolum="bugun" \/>/)
  })
})

describe('uz: the tip trigger names the page in every language (IPUCU-TETIK-01)', () => {
  it('uz-Latn, uz-Cyrl and ru fill ipuclari.sayfa', async () => {
    const { UZ_UYGULAMA_METINLERI } = await import('@/countries/uz/uygulama/metinler')
    for (const [dil, m] of Object.entries(UZ_UYGULAMA_METINLERI)) assert.ok((m.ipuclari?.sayfa ?? '').trim().length >= 8, dil)
  })
})
