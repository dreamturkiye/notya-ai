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
import { BugunGorunumu, BugunKopruYedek, type BugunKoprusu } from '../../components/doktor/portal/saglikEvi/BugunGorunumu'
import { saatSecenekleri } from '../../components/doktor/portal/saglikEvi/SaatSecici'
import { TercihlerGorunumu } from '../../components/doktor/portal/saglikEvi/TercihlerGorunumu'
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
    // SAGLIGIM-GORUNUM-V3: server markup greets neutrally (device clock unknown); day-part rule in lib/portal/hastaSutunlari.test.ts
    assert.match(html, /Hoş geldiniz, Demo/)
    assert.match(html, /20:00<\/span> — (Amlodipin ve Metformin|Metformin ve Amlodipin)/)
    assert.equal((html.match(/class="sgb-ana"/g) || []).length, 1)
    assert.match(html, /Empagliflozin<\/b><small[^>]*>08:00 dozu işaretlenmedi/)
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

/**
 * PORTAL-REGRESYON-2026-11-25 — everything the earlier Özet home (HomeHero) gave the patient is still on the live home:
 * the doctor's card, the ≤48 h visit alert, the shortcuts to every attached module + İlaçlarım / Öykü / Takip, and the
 * recently shared items; a minor's page never greets the child by name; a failed daily-state load keeps the bridge.
 */
describe('Bugün keeps the earlier Özet home (PORTAL-REGRESYON-2026-11-25)', () => {
  const TAM: BugunKoprusu = {
    ...KOPRU,
    hekim: { ad: 'Dr. Gökhan Mamur', altSatir: 'İç Hastalıkları · Notya Muayenehanesi', adres: 'Bağdat Cad. No:12 Kadıköy/İstanbul', telefon: '0216 000 00 00', telefonHref: 'tel:+902160000000', avatarUrl: null, harfler: 'GM' },
    muayeneUyari48s: '26 Kasım 2026 · 10:30',
    bolumler: [
      { anahtar: 'asi-karnesi', ad: 'Aşı Karnesi', alt: 'Kayıtlı aşılar · PDF · yazdır', href: '/p/asi-karnesi', modul: true },
      { anahtar: 'gozlerim', ad: 'Gözlerim', alt: 'Kontrol, damla ve ölçümleriniz', href: '/p/gozlerim', modul: true },
      { anahtar: 'ilaclar', ad: S.bolumIlaclar, alt: S.bolumIlaclarAlt(3), href: '/p/ilaclar' },
      { anahtar: 'gecmis', ad: S.bolumOyku, alt: S.bolumOykuAlt, href: '/p/gecmis' },
      { anahtar: 'takip', ad: S.bolumTakip, alt: S.bolumTakipAlt, href: '/p/takip' },
    ],
    aktiviteler: [{ id: 'm-1', baslik: 'Mesaj: Kontrol randevunuz', tarih: '23 Kas 2026 11:00', href: '/p/mesajlar' }, { id: 'r-1', baslik: 'Hemogram', tarih: '20 Kas 2026 09:00', href: '/p/sonuclar' }],
  }
  const cizK = (k: BugunKoprusu, ad: string | null = 'Demo Hasta', d = durum()) => {
    const eski = Date.now
    Date.now = () => MS
    try { return renderToStaticMarkup(createElement(BugunGorunumu, { s: S, durum: d, eylemler: EYLEM, kopru: k, hastaAdi: ad })) } finally { Date.now = eski }
  }

  it('doctor card: name, branş · klinik, address, one-tap call (PORTAL-HEKIM-01)', () => {
    const html = cizK(TAM)
    assert.match(html, /data-testid="bugun-hekim-karti"/)
    assert.match(html, /Dr\. Gökhan Mamur/)
    assert.match(html, /İç Hastalıkları · Notya Muayenehanesi/)
    assert.match(html, /Bağdat Cad\. No:12/)
    assert.match(html, /href="tel:\+902160000000"/)
    assert.doesNotMatch(cizK(KOPRU), /bugun-hekim-karti/, 'no doctor passed → no empty card')
    assert.match(cizK({ ...TAM, hekim: { ...TAM.hekim!, adres: null, telefon: null, telefonHref: null } }), new RegExp(S.hekimBos))
  })
  it('the ≤48 h visit alert sits above the fold and links to the visits; absent when not due', () => {
    const html = cizK(TAM)
    assert.match(html, /data-testid="bugun-muayene-uyari"/)
    assert.match(html, /Muayeneniz yaklaşıyor/)
    assert.match(html, /26 Kasım 2026 · 10:30 için randevunuz var\. Gelemeyecekseniz lütfen haber verin\./)
    assert.ok(html.indexOf('bugun-muayene-uyari') < html.indexOf('sgb-kahraman'), 'above the day rings')
    assert.doesNotMatch(cizK({ ...TAM, muayeneUyari48s: null }), /bugun-muayene-uyari/)
  })
  it('Bölümlerim: every attached module first, then İlaçlarım / Öykü / Takip; recent items listed', () => {
    const html = cizK(TAM)
    const sira = ['asi-karnesi', 'gozlerim', 'ilaclar', 'gecmis', 'takip'].map((k) => html.indexOf(`data-bolum="${k}"`))
    assert.ok(sira.every((i) => i > 0), 'every section has a tile')
    assert.deepEqual([...sira].sort((a, b) => a - b), sira, 'modules first')
    assert.match(html, /href="\/p\/gozlerim"/)
    assert.match(html, /3 aktif ilaç/)
    assert.match(html, new RegExp(S.aktiviteBaslik))
    assert.match(html, /href="\/p\/mesajlar"><span>Mesaj: Kontrol randevunuz<\/span>/)
  })
  it('a minor\'s page (veli reads it): no greeting by the child\'s name, "Hasta" identity line instead; adult unchanged', () => {
    const cocuk = cizK({ ...TAM, veli: true }, 'Elif Yılmaz')
    assert.doesNotMatch(cocuk, /, Elif/)
    assert.match(cocuk, /data-testid="bugun-hasta-kimlik"><small>Hasta<\/small>Elif Yılmaz/)
    const yetiskin = cizK(TAM, 'Ayşe Demir')
    assert.match(yetiskin, /Hoş geldiniz, Ayşe/)
    assert.doesNotMatch(yetiskin, /bugun-hasta-kimlik/)
  })
  for (const b of [...Object.keys(TIBBI_BRANS_AYARLARI), ...Object.keys(OZEL_BRANS_AYARLARI)]) {
    it(`${b}: the restored pieces render on the core home (core, every branş)`, () => {
      const html = cizK(TAM, 'Demo Hasta', durum(b))
      assert.match(html, /bugun-hekim-karti/)
      assert.match(html, /bugun-muayene-uyari/)
      assert.match(html, /class="sgb-bolumler"/)
      assert.doesNotMatch(html, /yapay zek|\bAI\b/i)
    })
  }
  it('daily state failed to load: the home is never blank — alert, doctor, bridge, sections, 112 stay', () => {
    const html = renderToStaticMarkup(createElement(BugunKopruYedek, { s: S, kopru: TAM, durumMetni: S.gunlukYuklenemedi, hata: true }))
    for (const parca of ['bugun-muayene-uyari', 'bugun-hekim-karti', 'href="/m"', 'href="/s"', 'class="sgb-bolumler"', '112']) assert.ok(html.includes(parca), parca)
    assert.match(html, /role="alert"/)
  })
})

describe('24-hour time pickers (PORTAL-REGRESYON-2026-11-25 — Tercihler quiet hours, dose times)', () => {
  it('values are HH:MM 00:00–23:45 in 15-minute steps; an off-grid saved value is kept; no AM/PM anywhere', () => {
    const l = saatSecenekleri('22:00')
    assert.equal(l.length, 96)
    assert.equal(l[0], '00:00'); assert.equal(l[95], '23:45')
    assert.ok(l.includes('23:00') && l.includes('07:00'))
    const ozel = saatSecenekleri('08:10')
    assert.equal(ozel.length, 97); assert.ok(ozel.indexOf('08:10') === ozel.indexOf('08:00') + 1)
    assert.equal(saatSecenekleri('bozuk').length, 96)
  })
  it('Tercihler renders the quiet hours as 24-hour selects in a wrapping row (no native time input)', () => {
    const d = durum()
    const html = renderToStaticMarkup(createElement(TercihlerGorunumu, { s: S, durum: { ...d, tercihler: { ...d.tercihler, sessizBas: '23:00', sessizBit: '07:00' } }, eylemler: EYLEM, gorunum: { buyuk: false, kontrast: false }, gorunumAyarla: () => {} }))
    assert.doesNotMatch(html, /type="time"/)
    assert.match(html, /sge-anahtar sge-anahtar--saat/)
    assert.match(html, /<option value="23:00" selected="">23:00<\/option>/)
    assert.match(html, /<option value="07:00" selected="">07:00<\/option>/)
    assert.doesNotMatch(html, /\b(AM|PM)\b/)
  })
})
