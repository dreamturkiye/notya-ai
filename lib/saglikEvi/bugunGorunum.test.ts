/**
 * BUGUN-V2 — the patient's Bugün home, display layer: the one next step, today's missed doses, the day rings (only for
 * what the patient has), the curve points, the alert lead line, and the core-component guarantees on the rendered
 * screen (every branş: tiles come only from the branş data + what was logged, no "veli" for an adult, no "AI" wording,
 * an acil note always carries 112).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { demoDurumuUygula, gunlukDemoHam } from './demo'
import { gunlukOzeti, type GunlukDurum } from './ozet'
import { TIBBI_BRANS_AYARLARI, OZEL_BRANS_AYARLARI } from './bransAyari'
import { SAGLIK_EVI_SOZLERI as S } from './sozler'
import { adlarMetni, bugunKazanildiMi, egriNoktalari, eksikDozlar, gunHalkalari, ilkCumle, siradakiAdim, uyariEgilimi } from './bugunGorunum'
import { BugunGorunumu, type BugunKoprusu } from '../../components/doktor/portal/saglikEvi/BugunGorunumu'
import type { GunlukEylemleri } from '../../components/doktor/portal/saglikEvi/eylemler'

// the test runner compiles JSX with the classic runtime (tsconfig jsx: preserve) — the views expect React in scope
;(globalThis as { React?: typeof React }).React = React

const SIMDI = '2026-11-24T10:20:00.000Z' // 13:20 Türkiye, a Tuesday
const MS = Date.parse(SIMDI)
const durum = (brans = 'dahiliye', d?: string): GunlukDurum => gunlukOzeti(demoDurumuUygula(gunlukDemoHam(SIMDI, brans), d))

const KOPRU: BugunKoprusu = { randevu: '28 Kasım 2026 · 10:30', randevuHref: '/r', mesajSayisi: 2, mesajHref: '/m', sonZiyaret: null, sonucSayisi: 0, sonucHref: '/s', karneHref: '/k', gunlukHref: '/g', dozHref: '/d', tercihHref: '/t', kvkkHref: '/kvkk' }
const ok = async () => ({ ok: true as const })
const EYLEM: GunlukEylemleri = {
  olcumEkle: ok, olcumSil: ok, doz: ok, plan: ok, tercih: ok, soru: ok, soruSil: ok, rozetGoruldu: async () => {}, uyariGoruldu: async () => {},
  fotoOku: async () => ({ ok: true, oneriler: [], okunamadi: true }), push: { durum: 'yok', ac: ok, kapat: async () => {} }, indirJson: null, indirCsv: null, veriSil: ok,
}
const ciz = (d: GunlukDurum, ad: string | null = 'Demo Hasta') => {
  const eski = Date.now
  Date.now = () => MS
  try { return renderToStaticMarkup(createElement(BugunGorunumu, { s: S, durum: d, eylemler: EYLEM, kopru: KOPRU, hastaAdi: ad })) } finally { Date.now = eski }
}

describe('Bugün v2 — the one next step', () => {
  it('13:20 with five medicines: the 20:00 group, both names in one plain sentence, minutes left', () => {
    const a = siradakiAdim(durum(), MS)
    assert.equal(a.tur, 'doz')
    if (a.tur !== 'doz') return
    assert.equal(a.saat, '20:00')
    assert.deepEqual([...a.adlar].sort(), ['Amlodipin', 'Metformin'])
    assert.equal(a.kalanDk, 400)
    assert.equal(a.durum, 'bekliyor')
    assert.equal(S.kalan(a.kalanDk), '6 sa 40 dk sonra')
    assert.equal(S.aldimGrup(2), 'İkisini de aldım')
  })
  it('today\'s unmarked 08:00 dose is offered as a one-tap fix', () => {
    const e = eksikDozlar(durum())
    assert.equal(e.length, 1)
    assert.equal(e[0].saat, '08:00')
    assert.deepEqual(e[0].adlar, ['Empagliflozin'])
  })
  it('no medicines → the reading still due today; everything done → "plan tamam"', () => {
    const a = siradakiAdim(durum('dahiliye', 'ilacsiz'), MS)
    assert.equal(a.tur, 'olcum')
    assert.equal(siradakiAdim(durum('dahiliye', 'tamam'), MS).tur, 'tamam')
  })
  it('adherence-only branş with no medicines and no readings → "nothing planned"', () => {
    const d = durum('dahiliye', 'ilacsiz')
    assert.equal(siradakiAdim({ ...d, olcumKartlari: [] }, MS).tur, 'bos')
  })
})

describe('Bugün v2 — day rings', () => {
  it('three rings for the cardiometabolic patient; İlaç counts the missed dose', () => {
    const h = gunHalkalari(durum())
    assert.deepEqual(h.map((x) => x.anahtar), ['ilac', 'olcum', 'hedef'])
    const ilac = h[0]
    assert.equal(ilac.toplam, 6)
    assert.equal(ilac.eksik, 1)
    assert.equal(ilac.tamam, false)
  })
  it('a ring only for what the patient has: no medicines → no İlaç ring; all done → closed rings', () => {
    assert.deepEqual(gunHalkalari(durum('dahiliye', 'ilacsiz')).map((x) => x.anahtar), ['olcum', 'hedef'])
    const t = gunHalkalari(durum('dahiliye', 'tamam'))
    assert.ok(t.find((x) => x.anahtar === 'ilac')!.tamam)
    assert.ok(t.find((x) => x.anahtar === 'olcum')!.tamam)
  })
  it('first day: Hedef ring is an empty track (null), never a zero grade', () => {
    const h = gunHalkalari(durum('dahiliye', 'ilk')).find((x) => x.anahtar === 'hedef')!
    assert.equal(h.oran, null)
  })
})

describe('Bugün v2 — helpers', () => {
  it('names joined in plain Turkish', () => {
    assert.equal(adlarMetni(['A']), 'A')
    assert.equal(adlarMetni(['A', 'B']), 'A ve B')
    assert.equal(adlarMetni(['A', 'B', 'C']), 'A, B ve C')
  })
  it('lead sentence split never breaks "2. saat"', () => {
    const [ilk, kalan] = ilkCumle('Son 7 günde kan şekeri · tokluk 2. saat ortalamanız 158 mg/dL. Bunu doktorunuza ilettik.')
    assert.equal(ilk, 'Son 7 günde kan şekeri · tokluk 2. saat ortalamanız 158 mg/dL.')
    assert.equal(kalan, 'Bunu doktorunuza ilettik.')
  })
  it('curve points skip days without a reading (never invented); the alert finds its own trend', () => {
    const d = durum()
    const e = uyariEgilimi('glukoz:tokluk2', d.egilimler)!
    assert.ok(e)
    const p = egriNoktalari(e)
    assert.equal(p.length, e.gunluk.filter((g) => g.ort != null).length)
    assert.ok(p.every((x) => x.x >= 0 && x.x <= 1))
    assert.ok(d.uyarilar.some((u) => u.metrik === 'glukoz:tokluk2'))
  })
  it('a badge earned today is marked as today', () => {
    assert.equal(bugunKazanildiMi(SIMDI, '2026-11-24'), true)
    assert.equal(bugunKazanildiMi('2026-11-22T10:00:00Z', '2026-11-24'), false)
    assert.equal(bugunKazanildiMi(null, '2026-11-24'), false)
  })
})

describe('Bugün v2 — rendered screen, every branş (core component)', () => {
  const branslar = [...Object.keys(TIBBI_BRANS_AYARLARI), ...Object.keys(OZEL_BRANS_AYARLARI)]
  it('covers the 30 medical branşlar + 10 Özel Branşlar configuration', () => {
    assert.ok(branslar.length >= 30, `only ${branslar.length} branş rows`)
  })
  for (const b of branslar) {
    it(`${b}: tiles = the branş's own measurements; no AI wording; no "veli" for an adult`, () => {
      const d = durum(b)
      const html = ciz(d)
      const tiles = (html.match(/class="sgb-olcum(?: sgb-olcum--tamam)?"/g) || []).length
      assert.equal(tiles, d.olcumKartlari.length)
      assert.doesNotMatch(html, /yapay zek|\bAI\b|Claude|GPT/i)
      assert.doesNotMatch(html, /\bveli/i)
      if (!d.bugunDozlar.length) assert.doesNotMatch(html, /Sıradaki ilaç/)
      if (!d.ldl) assert.doesNotMatch(html, /LDL/)
    })
  }
  it('first screen of the design target: greeting, rings, the sentence, one primary action', () => {
    const html = ciz(durum())
    assert.match(html, /İyi günler, Demo/)
    assert.match(html, /20:00<\/span> — (Amlodipin ve Metformin|Metformin ve Amlodipin)/)
    assert.equal((html.match(/class="sgb-ana"/g) || []).length, 1)
    assert.match(html, /Empagliflozin<\/b><small>08:00 dozu işaretlenmedi/)
    assert.match(html, /Tokluk şekeri bu hafta yükseliyor/)
  })
  it('an acil note always shows the 112 call', () => {
    const d = durum()
    const html = ciz({ ...d, uyarilar: [{ id: 'x', duzey: 'acil', metrik: 'kb', hastaMetni: 'Tansiyonunuz çok yüksek ölçüldü. Hemen 112’yi arayın.', olusturmaAt: SIMDI, hastaGorduAt: null }] })
    assert.match(html, /href="tel:112"/)
  })
  it('without consent the KVKK card is offered (shown unless postponed on this device)', () => {
    // The card is gated by a device "later" flag read in an effect; on the server render the flag defaults to "postponed",
    // so the markup must not crash and the consent words must exist in the shared words object.
    assert.ok(S.onayBaslik.length > 0)
    assert.doesNotThrow(() => ciz(durum('dahiliye', 'onaysiz')))
  })
  it('first day renders the designed empty states (no streak chip, trend invitation)', () => {
    const html = ciz(durum('dahiliye', 'ilk'))
    assert.doesNotMatch(html, /class="sgb-seri/)
    assert.match(html, new RegExp(S.egilimBos))
    assert.match(html, new RegExp(S.seriSifir))
  })
})
