/**
 * AU-PORTAL-LOOK-01 — Türkiye's patient portal ("Sağlığım") is drawn THROUGH the shared views in components/doktor/portal.
 * This test pins Türkiye's output: the HTML each Türkiye container renders for the demo patient is compared with the
 * snapshot taken BEFORE the views were extracted (__golden__). Any difference in markup, class, style or word fails.
 * Rewrite the snapshots only on purpose:  GOLDEN_YAZ=1 npx tsx --test components/doktor/portal/portalGoruntuParite.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import './reactGlobal'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SAGLIGIM_DEMO } from '@/lib/portal/demoData'
import { PortalShell } from '@/app/portal/_components/PortalShell'
import { HomeHero } from '@/app/portal/_components/HomeHero'
import { VisitsListView, VisitDetailView } from '@/app/portal/_components/VisitsView'
import { MessagesView } from '@/app/portal/_components/MessagesView'
import { PinGate } from '@/app/portal/_components/PinGate'
import { EmptyState } from '@/app/portal/_components/ui'

const DIR = join(__dirname, '__golden__')
const h = React.createElement
const BASE = '/portal/hasta/TOKEN'

const durumlar: Record<string, () => React.ReactElement> = {
  kabuk: () => h(PortalShell, { basePath: BASE, hastaAdi: 'Demo Hasta', ekNav: [{ key: 'asi-karnesi', label: 'Aşı Karnesi', path: '/asi-karnesi' }], children: h('p', null, 'icerik') }),
  'kabuk-adsiz': () => h(PortalShell, { basePath: BASE, children: h('p', null, 'icerik') }),
  ozet: () => h(HomeHero, { basePath: BASE, data: SAGLIGIM_DEMO }),
  'ozet-uyari': () => h(HomeHero, { basePath: BASE, data: { ...SAGLIGIM_DEMO, hekim: null as never, portal: { moduller: [], nav: [] }, summary: { ...SAGLIGIM_DEMO.summary, muayeneUyari48s: 'Cuma 10:00', bekleyenMesaj: 2, sonAktivite: [{ id: 'a', tur: 'mesaj', baslik: 'Yeni', tarih: '2026-01-02T10:00:00Z' }] } } }),
  ziyaretler: () => h(VisitsListView, { basePath: BASE, data: SAGLIGIM_DEMO }),
  'ziyaretler-bos': () => h(VisitsListView, { basePath: BASE, data: { ...SAGLIGIM_DEMO, visits: [], yonlendirmeler: [] } }),
  'ziyaret-detay': () => h(VisitDetailView, { basePath: BASE, visit: SAGLIGIM_DEMO.visits[0] }),
  'ziyaret-yok': () => h(VisitDetailView, { basePath: BASE, visit: null }),
  mesajlar: () => h(MessagesView, { data: SAGLIGIM_DEMO, token: 'TOKEN' }),
  'mesajlar-demo': () => h(MessagesView, { data: SAGLIGIM_DEMO }),
  'mesajlar-bos': () => h(MessagesView, { data: { ...SAGLIGIM_DEMO, messages: [] }, token: 'TOKEN' }),
  pin: () => h(PinGate, { token: 'TOKEN', onUnlocked: () => undefined }),
  bos: () => h(EmptyState, { title: 'Başlık', body: 'Gövde', art: 'sonuclar' }),
}

describe('Türkiye patient portal markup is unchanged', () => {
  for (const [ad, yap] of Object.entries(durumlar)) {
    it(ad, () => {
      const html = renderToStaticMarkup(yap())
      const yol = join(DIR, `${ad}.html`)
      if (process.env.GOLDEN_YAZ === '1') { mkdirSync(DIR, { recursive: true }); writeFileSync(yol, html); return }
      assert.ok(existsSync(yol), `missing snapshot ${ad}`)
      assert.equal(html, readFileSync(yol, 'utf8'))
    })
  }
})
