/**
 * Every offered Australian role has its own patient chapter. A foreign role's lines do not render.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0011'
process.env.NOTYA_COUNTRY = 'au'

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PortalSayfaGorunumu } from '@/components/ulke/portal/PortalSayfasi'
import { portalMetni } from '@/lib/ulke/arayuz'
import { portalBolumu } from '@/lib/ulke/portal/bolum'
import type { PortalIcerigi } from '@/lib/ulke/portal/tipler'
import { AU_PAKETI } from './index'
import { AU_PORTAL_BOLUMLERI } from './portalBolumleri'

const ROLLER = AU_PAKETI.uygulama!.roller!
const YOK = ['thoracic-surgery', 'cardiovascular-surgery', 'clinic-dermatology', 'hair-transplant', 'longevity']

function sayfa(bolum: PortalIcerigi['bolum']): string {
  const icerik: PortalIcerigi = {
    dil: 'en-AU', hasta: { ad: 'QA Patient' }, hekim: { ad: 'QA Doctor', rol: 'Cardiology' },
    randevular: null, saatDilimi: null, ozetler: [], istek: null, bitis: '2026-10-12T10:00:00.000Z', bolum,
  }
  return renderToStaticMarkup(React.createElement(PortalSayfaGorunumu, {
    p: portalMetni('en-AU'), r: null, icerik, acilNumara: '000',
    form: { gunler: [], neden: '' }, setForm: () => {}, istekGonder: () => {}, istekBekliyor: false, istekHatasi: null, cikis: () => {},
  }))
}

describe('Australia patient chapters', () => {
  it('every offered role has a chapter, and a removed role has none', () => {
    assert.deepEqual(Object.keys(AU_PORTAL_BOLUMLERI).sort(), [...ROLLER].sort())
    for (const rol of YOK) assert.equal(AU_PORTAL_BOLUMLERI[rol], undefined, rol)
    for (const rol of ROLLER) {
      const b = AU_PORTAL_BOLUMLERI[rol]!
      assert.ok(b.baslik.length > 8, rol)
      // AU-PEDIATRI-GOLD Strong push: specialty lines + Triple Zero emergency line.
      assert.equal(b.satirlar.length, 3, rol)
      assert.match(b.satirlar[2]!, /Triple Zero \(000\)/, rol)
    }
  })

  it('cardiology does not carry the paediatrics, psychology, eye or kidney chapter', () => {
    const yazi = [AU_PORTAL_BOLUMLERI.cardiology!.baslik, ...AU_PORTAL_BOLUMLERI.cardiology!.satirlar].join(' ')
    assert.match(yazi, /heart check/i)
    assert.doesNotMatch(yazi, /growth and immunisation|your next session|eye check|kidney check|picture|child/i)
    const psik = AU_PORTAL_BOLUMLERI['clinical-psychology']!.satirlar.join(' ')
    assert.doesNotMatch(psik, /photo|photograph|image/i)
    assert.match(AU_PORTAL_BOLUMLERI['aesthetic-medicine']!.satirlar.join(' '), /hair transplantation/i)
    assert.doesNotMatch(yazi, /hair transplantation/i)
  })

  it('a kept follow-up is overdue, today, coming up, or planned, and only on that role', () => {
    const kalp = portalBolumu('cardiology', '2026-10-10', ['2026-10-08', '2026-10-10', '2026-10-15', '2026-11-01', '2026-10-08'])
    assert.equal(kalp?.anahtar, 'cardiology')
    assert.deepEqual(kalp?.tarihler.map((t) => [t.gun, t.durum]), [
      ['2026-10-08', 'gecikti'],
      ['2026-10-10', 'bugun'],
      ['2026-10-15', 'yaklasiyor'],
      ['2026-11-01', 'planli'],
    ])
    assert.equal(portalBolumu('hair-transplant', '2026-10-10', ['2026-10-15']), undefined)
    assert.equal(portalBolumu(null, '2026-10-10', []), undefined)
  })

  it('the cardiology page shows that chapter and its dates, and not the paediatrics chapter', () => {
    const html = sayfa(portalBolumu('cardiology', '2026-10-10', ['2026-10-15']))
    assert.match(html, /data-bolum="cardiology"/)
    assert.match(html, /Your heart check/)
    assert.match(html, /data-bolum-tarih="2026-10-15"/)
    assert.match(html, /data-durum="yaklasiyor"/)
    assert.match(html, /Coming up/)
    assert.doesNotMatch(html, /Growth and immunisation|data-bolum="paediatrics"|Your next session/)
    const bos = sayfa(undefined)
    assert.doesNotMatch(bos, /data-alan="portal-bolum"/)
  })
})
