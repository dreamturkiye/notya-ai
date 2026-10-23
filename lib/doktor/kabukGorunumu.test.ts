/**
 * AU-LOOK-PARITY-01 — the shared frame view (components/doktor/KabukGorunumu.tsx) draws what the Türkiye chrome draws, from
 * injected items: the pine assistant button, icons on every row, badges, the phone sheet, and real links for a country.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import KabukGorunumu, { type KabukOge, type KabukProps } from '@/components/doktor/KabukGorunumu'

const oge = (id: string, label: string, ikon: string, ek: Partial<KabukOge> = {}): KabukOge => ({ id, label, ikon, aktif: false, ...ek })
const temel = (ek: Partial<KabukProps> = {}): Omit<KabukProps, 'children'> => ({
  marka: 'Notya', kicker: 'DOCTOR',
  asistan: oge('asistan', 'Ask the assistant', 'asistan', { href: '/au/asistan' }),
  calisma: { baslik: 'Work area', ogeler: [oge('bugun', 'Today', 'anaSayfa', { href: '/au/today', aktif: true }), oge('mesaj', 'Messages', 'mesajlar', { pasif: true, isaret: 'mesaj', rozet: 3 })] },
  diger: { baslik: 'Other', ogeler: [oge('ayarlar', 'Settings', 'ayarlar', { href: '/au/settings' })] },
  onGit: () => {},
  hesap: { harfler: 'KA', avatarUrl: null, ad: 'Kaan', alt: 'Cardiology', avatarAd: 'Kaan', avatarBasligi: 'My account', avatarEtiketi: 'My account', saat: '11:01 pm', hava: null, cikis: 'Sign out', onHesap: () => {}, onCikis: () => {} },
  sekme: [oge('bugun', 'Today', 'anaSayfa', { href: '/au/today', aktif: true })],
  menu: { asistan: [oge('asistan', 'Ask the assistant', 'asistan', { href: '/au/asistan' })], ogeler: [oge('ayarlar', 'Settings', 'ayarlar', { href: '/au/settings' })] },
  menuAktif: false, menuAcik: false, onMenu: () => {}, geri: null, anaSayfaId: '/au/today',
  menuMetni: 'Menu', menuKapat: 'Close menu', anaMenu: 'Main menu', anaSayfa: true, genis: false, kompakt: false, bitkiSrc: '/p.jpg', altYazi: 'footer', ...ek,
})
const ciz = (p: Omit<KabukProps, 'children'>) => renderToStaticMarkup(React.createElement(KabukGorunumu, { ...p, children: React.createElement('p', null, 'icerik') }))

describe('shared doctor frame', () => {
  it('draws the pine assistant button, an icon on every row, the badge and the account cluster', () => {
    const h = ciz(temel())
    assert.match(h, /<a href="\/au\/asistan" style="[^"]*background:#2f4334[^"]*"><svg[^>]*>.*?<\/svg><span[^>]*>Ask the assistant<\/span><\/a>/)
    for (const s of ['Work area', 'Other', 'Today', 'Messages', 'Settings', 'Sign out', '11:01 pm', 'DOCTOR', 'Cardiology']) assert.ok(h.includes(s), s)
    assert.equal((h.match(/<nav class="notya-yan"[\s\S]*?<\/nav>/)?.[0].match(/<svg/g) ?? []).length, 1 + 1 + 1 + 1 + 1, 'leaf + assistant + three rows')
    assert.match(h, /data-duvar="mesaj"/)
    assert.match(h, />3<\/span>/)
    assert.match(h, /aria-current="page"/)
  })
  it('a row without a page looks the same and does nothing; the phone sheet opens from the tab bar', () => {
    const h = ciz(temel({ menuAcik: true }))
    assert.match(h, /role="dialog" aria-label="Menu"/)
    assert.match(h, /aria-label="Close menu"/)
    assert.doesNotMatch(ciz(temel()), /role="dialog"/)
    assert.match(h, /aria-disabled="true"/)
  })
  it('without a specialty switch there is no empty box under the sidebar', () => {
    assert.doesNotMatch(ciz(temel()), /padding-top:14px/)
    assert.match(ciz(temel({ yanAlt: React.createElement('i', null, 'sw') })), /padding-top:14px/)
  })
})
