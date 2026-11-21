/**
 * ALT-SAYFA-01 (beta feedback, iPhone Safari, 2026-11-21) — a real mobile-viewport render: the doctor frame
 * (components/doktor/KabukGorunumu.tsx, phone layout with its fixed bottom tab bar) with the shared bottom sheet
 * (components/doktor/AltSayfa.tsx) open on a long appointment form, in headless Chrome at 390 / 414 / 430 px.
 * The save button must be inside the viewport and be the element a tap at its centre reaches — not the tab bar.
 *
 * Checked three ways: (1) as shipped, (2) with the "hide the tab bar while a sheet is open" rule switched off (the frame
 * must still not paint the tab bar over a page modal — the old z-index trap), (3) a control that rebuilds the old trap
 * and must FAIL, proving the harness sees an overlap when there is one. Skips where no Chrome binary is installed.
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import KabukGorunumu, { type KabukOge, type KabukProps } from '@/components/doktor/KabukGorunumu'
import AltSayfa from '@/components/doktor/AltSayfa'

const CHROME = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
  .find((y): y is string => Boolean(y && existsSync(y)))

const oge = (id: string, label: string, ikon: string, ek: Partial<KabukOge> = {}): KabukOge => ({ id, label, ikon, aktif: false, ...ek })
const props = (): Omit<KabukProps, 'children'> => ({
  marka: 'Notya', kicker: 'DOKTOR', asistan: null,
  calisma: { baslik: 'Çalışma alanı', ogeler: [oge('a', 'Ana Sayfa', 'anaSayfa')] }, diger: null, onGit: () => {},
  hesap: { harfler: 'KA', avatarUrl: null, ad: 'Dr. QA', alt: 'KBB Uzmanı', avatarAd: 'QA', avatarBasligi: 'Hesabım', avatarEtiketi: 'Hesabım', saat: '10:00', hava: null, cikis: 'Çıkış', onHesap: () => {}, onCikis: () => {} },
  sekme: [oge('a', 'Ana Sayfa', 'anaSayfa'), oge('r', 'Randevular', 'randevular', { aktif: true }), oge('h', 'Hastalar', 'hastalar'), oge('m', 'Mesajlar', 'mesajlar')],
  menu: { asistan: [], ogeler: [] }, menuAktif: false, menuAcik: false, onMenu: () => {}, geri: null, anaSayfaId: 'a',
  menuMetni: 'Menü', menuKapat: 'Menüyü kapat', anaMenu: 'Ana menü', anaSayfa: false, genis: true, kompakt: false, bitkiSrc: 'data:,', altYazi: '©',
})

const h = React.createElement
function uzunForm(): React.ReactNode {
  const alanlar = ['Hasta ara', 'Hasta adı', 'Cep telefonu', 'E-posta', 'Tarih', 'Saat', 'Tür', 'Hasta durumu', 'Ücret', 'Oda', 'Not / Şikayet']
  return h(React.Fragment, null,
    h('h3', null, 'Yeni Randevu'),
    ...alanlar.map((a) => h('label', { key: a, style: { display: 'block', marginBottom: 14 } }, a, h('input', { style: { display: 'block', width: '100%', height: 44 } }))),
    h('textarea', { rows: 6, style: { width: '100%' } }))
}
const kaydet = h('button', { type: 'submit', id: 'kaydet', style: { width: '100%', height: 48 } }, 'Randevuyu Kaydet')

/**
 * Desktop headless Chrome will not make a window narrower than 500 px, so the page is drawn in an IFRAME of the phone's
 * width: media queries, `position: fixed` and elementFromPoint all work against the iframe's own viewport. The frame is
 * `srcdoc` (same origin), so the measurement is written onto the outer document, which --dump-dom prints.
 */
function sayfa(govde: string, en: number, ekCss = ''): string {
  const olc = `
    (function(){
      var b=document.getElementById('kaydet'); b.scrollIntoView({block:'end'}); var r=b.getBoundingClientRect();
      var x=r.left+r.width/2, y=r.top+r.height/2; var el=document.elementFromPoint(x,y);
      var nav=document.querySelector('.notya-alt-nav'); var navGorunur=nav?getComputedStyle(nav).display!=='none':false;
      parent.document.body.setAttribute('data-sonuc', JSON.stringify({ icinde: r.top>=0 && r.bottom<=window.innerHeight && r.width>0,
        vurulan: el ? (el===b || b.contains(el)) : false, kim: el ? (el.className || el.tagName) : null, navGorunur: navGorunur, en: window.innerWidth }));
    })();`
  const ic = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}${ekCss}</style></head><body>${govde}<script>window.addEventListener('load',function(){${olc}})</script></body></html>`
  const kacis = ic.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}iframe{border:0;display:block}</style></head><body><iframe width="${en}" height="844" srcdoc="${kacis}"></iframe></body></html>`
}

function olc(html: string): { icinde: boolean; vurulan: boolean; kim: string | null; navGorunur: boolean; en: number } {
  const dizin = mkdtempSync(join(tmpdir(), 'alt-sayfa-'))
  const dosya = join(dizin, 'sayfa.html')
  writeFileSync(dosya, html)
  const cikti = execFileSync(CHROME!, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--window-size=600,900', `--user-data-dir=${join(dizin, 'profil')}`, '--virtual-time-budget=3000', '--dump-dom', `file://${dosya}`], { encoding: 'utf8', timeout: 60_000, stdio: ['ignore', 'pipe', 'ignore'] })
  const m = cikti.match(/<body[^>]*data-sonuc="([^"]*)"/)
  assert.ok(m, 'the page reported no measurement')
  return JSON.parse(m![1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
}

const sheetliKabuk = () => renderToStaticMarkup(h(KabukGorunumu, { ...props(), children: h(AltSayfa, { etiket: 'Yeni Randevu', onKapat: () => {}, onSubmit: () => {}, eylemler: kaydet }, uzunForm()) }))

describe('ALT-SAYFA-01 — the appointment sheet\'s save button on a phone', { skip: CHROME ? false : 'no Chrome binary on this machine' }, () => {
  for (const en of [390, 414, 430]) {
    it(`${en} px: the save button is visible, tappable, and the tab bar steps aside`, () => {
      const s = olc(sayfa(sheetliKabuk(), en))
      assert.equal(s.en, en)
      assert.equal(s.icinde, true, 'save button inside the viewport')
      assert.equal(s.vurulan, true, `a tap reaches the save button, not ${s.kim}`)
      assert.equal(s.navGorunur, false, 'tab bar hidden while the sheet is open')
    })
  }
  it('390 px, tab bar NOT hidden: the frame still paints the sheet above it (no z-index trap)', () => {
    const s = olc(sayfa(sheetliKabuk(), 390, 'body:has([aria-modal="true"]) .notya-alt-nav.notya-alt-nav { display: flex !important; }'))
    assert.equal(s.navGorunur, true)
    assert.equal(s.vurulan, true, `a tap reaches the save button, not ${s.kim}`)
  })
  it('control: the old trap (content box z-index 1, buttons at the end of one scrolling block) is caught', () => {
    const eski = renderToStaticMarkup(h(KabukGorunumu, { ...props(), children:
      h('div', { style: { position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end' } },
        h('form', { style: { width: '100%', maxHeight: '100vh', overflowY: 'auto', background: '#fff' } }, uzunForm(), h('div', { style: { height: 40 } }), kaydet)) }))
    const s = olc(sayfa(eski, 390, '.notya-icerik { z-index: 1 !important; } form { padding-bottom: 0 }'))
    assert.equal(s.vurulan, false, 'the harness must see the tab bar covering the old button')
  })
})
