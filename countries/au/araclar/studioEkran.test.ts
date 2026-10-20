/**
 * The six private-role studios, as the tools screen draws them.
 * A proposed day is a row in the result (data-tarih). Psychology draws no image field.
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
import { AracGorunumu } from '@/components/ulke/uygulama/Araclar'
import { aktifAracIcerigi } from '@/lib/ulke/araclar/kayit'
import { hesabinAraci } from '@/lib/ulke/araclar/paket'
import type { HamGirdi } from '@/lib/ulke/araclar/girdi'
import { araclarMetni } from '@/lib/ulke/arayuz'

const icerik = aktifAracIcerigi()
assert.ok(icerik)

function ciz(rol: string, arac: string, ham: HamGirdi): string {
  const x = hesabinAraci(icerik, rol, arac)
  assert.ok(x, `${rol} ${arac}`)
  return renderToStaticMarkup(React.createElement(AracGorunumu, {
    x, a: araclarMetni('en-AU'), dil: 'en-AU', notDili: 'en-AU', icerik: icerik!,
    ham, degistir: () => {}, temizle: () => {}, bugun: '2026-10-20',
    kopya: 'yok', kopyalaTikla: () => {},
  }))
}

describe('private-role studios on the tools screen', () => {
  it('cosmetic surgery shows the earliest booking day, both consent lines, and no image line until one is kept', () => {
    const html = ciz('aesthetic-surgery', 'au-cosmetic-surgery-plan', {
      yas: 'yetiskin', ilk: '2026-10-01', onam: '2026-10-08', ameliyat: '2026-10-20',
      gorusme: true, dosya: true, hasta: true, goruntu: 'yok',
    })
    assert.match(html, /data-tarih="rezervasyon"/)
    assert.match(html, /15 Oct 2026|15\/10\/2026|2026-10-15|15 October 2026/)
    assert.match(html, /data-tarih="teyit"/)
    assert.match(html, /data-tarih="yirmiDort"/)
    assert.match(html, /data-alan="dosya"/)
    assert.match(html, /data-alan="hasta"/)
    assert.doesNotMatch(html, /data-alan="foto"/)
    assert.doesNotMatch(html, /data-alan="bagimsiz"/)
    assert.equal(hesabinAraci(icerik, 'cardiology', 'au-cosmetic-surgery-plan'), null)
  })

  it('a physiotherapy plan shows the next review, and an image line only when an image is kept', () => {
    const yok = ciz('physiotherapy', 'au-physio-plan', { seans: '2026-10-06', aralik: '14', dosya: true, hasta: true, goruntu: 'yok' })
    assert.match(yok, /data-tarih="sonraki"/)
    assert.doesNotMatch(yok, /data-alan="foto"/)
    const var_ = ciz('physiotherapy', 'au-physio-plan', { seans: '2026-10-06', aralik: '14', dosya: true, hasta: true, goruntu: 'var', foto: true })
    assert.match(var_, /data-alan="foto"/)
    assert.equal(hesabinAraci(icerik, 'cardiology', 'au-physio-plan'), null)
  })

  it('psychology shows the next review and no image field', () => {
    const html = ciz('clinical-psychology', 'au-psychology-plan', { seans: '2026-10-06', aralik: '14', dosya: true, hasta: true })
    assert.match(html, /data-tarih="sonraki"/)
    assert.doesNotMatch(html, /data-alan="foto"/)
    assert.doesNotMatch(html, /data-alan="goruntu"/)
    assert.equal(hesabinAraci(icerik, 'dietetics', 'au-psychology-plan'), null)
  })

  it('dietetics, occupational therapy and audiology each show their own next review', () => {
    for (const [rol, arac] of [
      ['dietetics', 'au-dietetics-plan'],
      ['occupational-therapy', 'au-ot-plan'],
      ['audiology', 'au-audiology-plan'],
    ] as const) {
      const html = ciz(rol, arac, { seans: '2026-10-06', aralik: '14', dosya: true, hasta: true, goruntu: 'yok' })
      assert.match(html, /data-tarih="sonraki"/, arac)
      assert.equal(hesabinAraci(icerik, 'cardiology', arac), null, arac)
    }
  })
})
