/**
 * GERI-CAGIRMA-01 — what the doctor sees: the tile is a BASE tool on every branş's list, the home card is hidden
 * until there is something true to show, and the kohort link renders only on a due/overdue panel.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GeriCagirmaKartiGorunumu, GERI_CAGIRMA_YOLU } from '@/components/doktor/geriCagirma/GeriCagirmaKarti'
import { KohortBaglantisiGorunumu } from '@/components/doktor/geriCagirma/KohortBaglantisi'
import { doktorAraclariListesi, ORTAK_DOKTOR_ARACLARI, BRANS_DOKTOR_ARACLARI } from '@/lib/doktor/doktorAraclari'
import { KOHORT_KAYNAKLARI } from './nedenler'
import { bosSayac, sonAylar, type GeriCagirmaOzeti } from './tipler'

const ozet = (o: Partial<GeriCagirmaOzeti> = {}): GeriCagirmaOzeti => {
  const egilim = sonAylar('2026-11', 6).map(bosSayac)
  return { kurulu: true, goster: false, cagrilabilir: 0, bayat: false, buAy: egilim[5], egilim, paraBirimi: 'TRY', ...o }
}
const ciz = (o: GeriCagirmaOzeti | null) => renderToStaticMarkup(createElement(GeriCagirmaKartiGorunumu, { ozet: o }))

describe('GERI-CAGIRMA-01 · tile (classify-before-add: BASE, all specialties)', () => {
  it('is one universal tile, on every branş list and for a doctor with no branş at all', () => {
    const tile = ORTAK_DOKTOR_ARACLARI.filter((a) => a.route === GERI_CAGIRMA_YOLU)
    assert.equal(tile.length, 1)
    assert.equal(tile[0].branslar, null)
    assert.ok(!BRANS_DOKTOR_ARACLARI.some((a) => a.route === GERI_CAGIRMA_YOLU))
    for (const brans of [...KOHORT_KAYNAKLARI.map((k) => k.brans), null, 'sac-ekimi', 'diyetisyen']) {
      assert.equal(doktorAraclariListesi(brans).filter((a) => a.route === GERI_CAGIRMA_YOLU).length, 1, String(brans))
    }
  })

  it('commercial copy: no ticket id, no person, no claim about revenue', () => {
    const t = ORTAK_DOKTOR_ARACLARI.find((a) => a.route === GERI_CAGIRMA_YOLU)!
    assert.ok(!/GERI-CAGIRMA|Gökhan|Kaan|kazan|gelir|garanti/i.test(`${t.title} ${t.desc}`))
  })
})

describe('GERI-CAGIRMA-01 · home card', () => {
  it('renders nothing before data, before the migration, and when there is nothing to show', () => {
    assert.equal(ciz(null), '')
    assert.equal(ciz(ozet({ kurulu: false, goster: true, cagrilabilir: 5 })), '')
    assert.equal(ciz(ozet()), '')
  })

  it('shows the measured sentence, the trend and the link when a patient can be recalled', () => {
    const egilim = sonAylar('2026-11', 6).map(bosSayac)
    egilim[5] = { ay: '2026-11', gonderilen: 20, randevuAlan: 14, gelen: 9, tahsilatKurus: 0 }
    const html = ciz(ozet({ goster: true, cagrilabilir: 12, buAy: egilim[5], egilim }))
    assert.match(html, /Bu ay geri çağırma sonrası 14 hasta randevu aldı · bunlardan 9 hasta muayeneye geldi/)
    assert.match(html, /12 hasta şu an geri çağrılabilir → Geri çağırma/)
    assert.ok(html.includes(`href="${GERI_CAGIRMA_YOLU}"`))
    assert.ok(!/kaydedilen tahsilat/.test(html), 'no recorded payment → no amount')
    assert.ok(!/kazan|₺/.test(html))
  })
})

describe('GERI-CAGIRMA-01 · "Bu listeyi geri çağır"', () => {
  const ciz2 = (yol: string | null) => renderToStaticMarkup(createElement(KohortBaglantisiGorunumu, { yol }))
  it('renders on every kohort panel with that panel\'s own source, and nowhere else', () => {
    for (const k of KOHORT_KAYNAKLARI) assert.ok(ciz2(k.rota).includes(`/doktor-tools/geri-cagirma?kaynak=${k.kaynak}`), k.rota)
    assert.ok(ciz2('/ozel-branslar/sac-kohort').includes('kaynak=ozel-vade'))
    for (const yol of ['/doktor-tools', '/doktor-tools/epikriz', '/doktor-tools/geri-cagirma', '/ozel-branslar/sac-greft', null]) assert.equal(ciz2(yol), '', String(yol))
  })
})
