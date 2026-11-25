/**
 * PORTAL-TABAN-ONCE (Kaan, 2026-11-25) — "I want all the functionality of the old hasta portalı … and build the new stuff
 * over and above the base functionality we already had built in."
 *
 * Pins the base-first rule on the patient portal (core, all 30 branşlar + 10 Özel Branşlar):
 *   - nav: Bugün · Randevu (only while booking is ON) · Mesajlar · Ziyaretler · Sonuçlar · İlaçlar · Öykü · Takip ·
 *     chapter modules · Günlük · Doz Takvimi · Karne;
 *   - Bugün: "Randevu al" (booking ON only) and "Doktoruma yaz" directly under the greeting, above the day rings, plus the
 *     earlier home's "Yeni mesajınız var!" with the unread count; the upcoming appointment opens the booking page;
 *   - no extra request on the portal home: Bugün reads the booking state HastaShell already fetched.
 * Demoting any of these needs Kaan's explicit OK (.cursor/skills/specialty-hasta-portali/SKILL.md § Taban önce).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { portalNavSirasi } from './navSirasi'
import { PortalShell } from '../../app/portal/_components/PortalShell'
import { BugunEylemleri, BugunGorunumu, BugunKopruYedek, type BugunKoprusu } from '../../components/doktor/portal/saglikEvi/BugunGorunumu'
import { SAGLIK_EVI_SOZLERI as S } from '../saglikEvi/sozler'
import { demoDurumuUygula, gunlukDemoHam } from '../saglikEvi/demo'
import { gunlukOzeti } from '../saglikEvi/ozet'
import { TIBBI_BRANS_AYARLARI, OZEL_BRANS_AYARLARI } from '../saglikEvi/bransAyari'
import type { GunlukEylemleri } from '../../components/doktor/portal/saglikEvi/eylemler'

;(globalThis as { React?: typeof React }).React = React

const KOK = join(__dirname, '../..')
const oku = (y: string) => readFileSync(join(KOK, y), 'utf8')
const yorumsuz = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const TABAN = ['ozet', 'mesajlar', 'ziyaretler', 'sonuclar', 'ilaclar', 'gecmis', 'takip']
const YENI = ['gunluk', 'doz-takvimi', 'karne']
const MODULLER = [{ key: 'asi-karnesi', label: 'Aşı Karnesi', path: '/asi-karnesi' }, { key: 'gozlerim', label: 'Gözlerim', path: '/gozlerim' }]

describe('PORTAL-TABAN-ONCE — nav order is base first', () => {
  it('booking ON: Bugün, Randevu, the six base tabs, chapter modules, then Günlük / Doz Takvimi / Karne', () => {
    assert.deepEqual(portalNavSirasi({ randevuAcik: true, moduller: MODULLER }).map((n) => n.key),
      ['ozet', 'randevu', ...TABAN.slice(1), 'asi-karnesi', 'gozlerim', ...YENI])
  })
  it('booking OFF: no Randevu tab; the base order is unchanged', () => {
    const k = portalNavSirasi({ moduller: MODULLER }).map((n) => n.key)
    assert.ok(!k.includes('randevu'))
    assert.deepEqual(k.slice(0, TABAN.length), TABAN)
  })
  it('a new (Sağlığım) tab never sits ahead of a base tab or a chapter module; a module never duplicates a fixed tab', () => {
    const k = portalNavSirasi({ randevuAcik: true, moduller: [...MODULLER, { key: 'mesajlar', label: 'x', path: '/x' }] }).map((n) => n.key)
    const sonTaban = Math.max(...TABAN.map((t) => k.indexOf(t)), k.indexOf('gozlerim'))
    for (const y of YENI) assert.ok(k.indexOf(y) > sonTaban, `${y} must come after every base tab and module`)
    assert.equal(k.filter((x) => x === 'mesajlar').length, 1)
  })
  it('the rendered shell draws the tabs in that order (Randevu second on the phone strip)', () => {
    const html = renderToStaticMarkup(createElement(PortalShell, { basePath: '/p', ekNav: MODULLER, randevuAcik: true, children: createElement('i') }))
    const sira = ['>Bugün<', '>Randevu<', '>Mesajlar<', '>Ziyaretler<', '>Sonuçlar<', '>İlaçlar<', '>Öykü<', '>Takip<', '>Aşı Karnesi<', '>Gözlerim<', '>Günlük<', '>Doz Takvimi<', '>Karne<']
      .map((e) => html.indexOf(e))
    assert.ok(sira.every((i) => i >= 0), `missing tab: ${sira}`)
    assert.deepEqual([...sira].sort((a, b) => a - b), sira)
    assert.match(html, /href="\/p\/randevu"/)
  })
  it('the live shell passes the booking state to the nav and to the pages (one request, no hardcoded order)', () => {
    const shell = yorumsuz(oku('app/portal/hasta/[token]/HastaShell.tsx'))
    assert.match(shell, /randevuAcik=\{randevuAcik\}/)
    assert.match(shell, /<RandevuAcikSaglayici value=\{randevuAcik\}>/)
    assert.equal((shell.match(/\/randevu`/g) || []).length, 1, 'HastaShell reads the booking state once')
    assert.match(yorumsuz(oku('app/portal/_components/PortalShell.tsx')), /portalNavSirasi\(\{ randevuAcik, moduller: ekNav \}\)/)
  })
})

const KOPRU: BugunKoprusu = {
  randevu: '28 Kasım 2026 · 10:30', randevuHref: '/p/randevu', randevuAlHref: '/p/randevu', yazHref: '/p/mesajlar?yaz=1',
  mesajSayisi: 2, mesajHref: '/p/mesajlar', sonZiyaret: null, sonucSayisi: 1, sonucHref: '/p/sonuclar', karneHref: '/p/karne',
  gunlukHref: '/p/gunluk', dozHref: '/p/doz-takvimi', tercihHref: '/p/tercihler', kvkkHref: '/kvkk',
}
const ok = async () => ({ ok: true as const })
const EYLEM: GunlukEylemleri = {
  olcumEkle: ok, olcumSil: ok, doz: ok, plan: ok, tercih: ok, soru: ok, soruSil: ok, rozetGoruldu: async () => {}, uyariGoruldu: async () => {},
  fotoOku: async () => ({ ok: true, oneriler: [], okunamadi: true }), push: { durum: 'yok', ac: ok, kapat: async () => {} }, indirJson: null, indirCsv: null, veriSil: ok,
}
const SIMDI = '2026-11-24T10:20:00.000Z'
const bugun = (brans: string, kopru: BugunKoprusu = KOPRU) => {
  const eski = Date.now
  Date.now = () => Date.parse(SIMDI)
  try {
    return renderToStaticMarkup(createElement(BugunGorunumu, { s: S, durum: gunlukOzeti(demoDurumuUygula(gunlukDemoHam(SIMDI, brans), null)), eylemler: EYLEM, kopru, hastaAdi: 'Demo Hasta' }))
  } finally { Date.now = eski }
}

describe('PORTAL-TABAN-ONCE — Bugün carries the base actions first', () => {
  it('"Randevu al" → the booking page, "Doktoruma yaz" → Mesajlar with the composer, "Yeni mesajınız var!" with the count', () => {
    const html = renderToStaticMarkup(createElement(BugunEylemleri, { s: S, kopru: KOPRU }))
    assert.match(html, /data-testid="bugun-randevu-al" href="\/p\/randevu"/)
    assert.match(html, /Randevu al/)
    assert.match(html, /Sıradaki: 28 Kasım 2026 · 10:30/)
    assert.match(html, /data-testid="bugun-doktoruma-yaz" href="\/p\/mesajlar\?yaz=1"/)
    assert.match(html, /Doktoruma yaz/)
    assert.match(html, /data-testid="bugun-yeni-mesaj" href="\/p\/mesajlar"/)
    assert.match(html, /Yeni mesajınız var!/)
    assert.match(html, /2 okunmamış/)
  })
  it('booking OFF: no "Randevu al" (never a dead button); "Doktoruma yaz" stays', () => {
    const html = renderToStaticMarkup(createElement(BugunEylemleri, { s: S, kopru: { ...KOPRU, randevuAlHref: null, mesajSayisi: 0 } }))
    assert.ok(!html.includes('Randevu al'))
    assert.ok(!html.includes('Yeni mesajınız var!'))
    assert.match(html, /Doktoruma yaz/)
  })
  it('every branş (30 + 10 Özel Branşlar): the actions sit under the greeting, above the day rings and the next step', () => {
    const branslar = [...Object.keys(TIBBI_BRANS_AYARLARI), ...Object.keys(OZEL_BRANS_AYARLARI)]
    assert.ok(branslar.length >= 40, `expected 40 branşlar, got ${branslar.length}`)
    for (const b of branslar) {
      const html = bugun(b)
      const selam = html.indexOf('sgb-selam'), eylem = html.indexOf('data-testid="bugun-eylemler"'), kahraman = html.indexOf('sgb-kahraman')
      assert.ok(selam >= 0 && eylem > selam && eylem < kahraman, `${b}: actions must sit between the greeting and the rings`)
      assert.ok(html.includes('Randevu al') && html.includes('Doktoruma yaz'), b)
    }
  })
  it('when the daily state fails, the actions are still first (base never waits on the new layer)', () => {
    const html = renderToStaticMarkup(createElement(BugunKopruYedek, { s: S, kopru: KOPRU, durumMetni: S.gunlukYuklenemedi, hata: true }))
    assert.ok(html.indexOf('bugun-eylemler') >= 0 && html.indexOf('bugun-eylemler') < html.indexOf(S.gunlukYuklenemedi))
  })
  it('the Türkiye container: booking state from context (no fetch on the home), upcoming appointment → booking when ON', () => {
    const s = yorumsuz(oku('app/portal/_components/saglikEvi/Sayfalar.tsx'))
    assert.match(s, /const randevuAcik = useRandevuAcik\(\)/)
    assert.match(s, /randevuAlHref: randevuAcik \? `\$\{basePath\}\/randevu` : null/)
    assert.match(s, /randevuHref: randevuAcik \? `\$\{basePath\}\/randevu` : `\$\{basePath\}\/ziyaretler`/)
    assert.match(s, /yazHref: `\$\{basePath\}\/mesajlar\?yaz=1`/)
    assert.ok(!/portalFetch|fetch\(/.test(s), 'Bugün container must not add a request on the portal home')
    // SAGLIGIM-GORUNUM-V3: the greeting band comes first (same height in every state — nothing jumps), then the base actions
    assert.match(s, /bekliyor=\{<div className="sge sgb" aria-busy="true"><BugunBasligi [^>]*\/><BugunEylemleri/)
  })
  it('Mesajlar opens the composer for ?yaz=1 (live page → MessagesView → shared view)', () => {
    assert.match(yorumsuz(oku('app/portal/hasta/[token]/mesajlar/page.tsx')), /get\('yaz'\) === '1'/)
    assert.match(yorumsuz(oku('app/portal/_components/MessagesView.tsx')), /yaz=\{yaz\}/)
    const v = yorumsuz(oku('components/doktor/portal/PortalMesajlarGorunumu.tsx'))
    assert.match(v, /if \(!yaz \|\| !yeniMesajAcik\) return/)
    assert.match(v, /yazAlani\.current\?\.focus\(\)/)
  })
})
