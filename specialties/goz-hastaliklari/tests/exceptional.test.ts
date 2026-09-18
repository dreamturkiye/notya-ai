/**
 * GOZ-EXCEPTIONAL-01 — göz-only Araçlar motorları + chapter derinlik motorları. Sentetik veri; tanı / doz / GİL gücü üretilmez.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gozKohortSatiri, gozKohortSatirlari, gozHatirlatmaMesaji, GOZ_BAYRAK_AD } from '../engines/kohort'
import { vaSatiri, vaKarsilastir, gilKodAra } from '../engines/araclar'
import { biyometriNormalize, biyometriMetni, biyometriTamMi, postopNormalize, postopUyarilari, postopMetni } from '../engines/katarakt'
import { gozSgkTaslak, gozSgkMetni } from '../engines/sgkRapor'
import { sgkKapilari } from '../engines/antiVegf'

const T = '2026-09-18'
const bos = { gorevler: [], planliIvt: [], drSonrakiKontrol: null, planliKontroller: [], sonVizit: null, portalVar: true }

describe('göz kohort (Araçlar › Göz kohort paneli)', () => {
  it('flags geciken GA/OCT, IVT window + overdue, DR tarama, kontrol — each from hekim data only', () => {
    const s = gozKohortSatiri({ ...bos, patientId: 'p1', ad: 'QA Sentetik', gorevler: [{ kod: 'glokom_ga', due: '2026-08-01' }, { kod: 'glokom_oct', due: '2026-12-01' }, { kod: 'dr_tarama', due: T }], planliIvt: [{ tarih: '2026-09-10', goz: 'sag' }, { tarih: '2026-09-25', goz: 'sol' }, { tarih: '2026-11-01', goz: 'sol' }], planliKontroller: [{ tarih: '2026-09-01', neden: 'Glokom kontrolü' }] }, T)
    assert.deepEqual(s.bayraklar, ['ga_oct_gecikti', 'ivt_gecikti', 'ivt_penceresi', 'dr_tarama', 'kontrol_gecikti'])
    assert.equal(s.enErkenTarih, '2026-08-01')
    assert.ok(s.detay.some((d) => d.includes('IVT OD 2026-09-10')))
    assert.ok(!s.detay.some((d) => d.includes('2026-11-01')), 'IVT beyond the 14-day window is not listed')
    assert.ok(!s.detay.some((d) => d.includes('OCT')), 'OCT not yet due is not flagged')
  })
  it('DR kontrol date passed → dr_tarama; nothing due → no row', () => {
    assert.deepEqual(gozKohortSatiri({ ...bos, patientId: 'p', ad: 'a', drSonrakiKontrol: '2026-09-01' }, T).bayraklar, ['dr_tarama'])
    assert.equal(gozKohortSatirlari([{ ...bos, patientId: 'p', ad: 'a', drSonrakiKontrol: '2027-01-01', planliKontroller: [{ tarih: '2026-10-01', neden: 'x' }] }], T).length, 0)
  })
  it('sorted oldest overdue first', () => {
    const r = gozKohortSatirlari([
      { ...bos, patientId: 'b', ad: 'B', planliKontroller: [{ tarih: '2026-09-15', neden: 'k' }] },
      { ...bos, patientId: 'a', ad: 'A', planliKontroller: [{ tarih: '2026-07-15', neden: 'k' }] },
    ], T)
    assert.deepEqual(r.map((x) => x.patientId), ['a', 'b'])
  })
  it('recall message is patient-safe: no diagnosis, values, drugs; carries 112 redirect', () => {
    for (const b of Object.keys(GOZ_BAYRAK_AD) as Array<keyof typeof GOZ_BAYRAK_AD>) {
      const m = gozHatirlatmaMesaji([b])
      assert.equal(m.konu, 'Göz kontrol hatırlatması')
      assert.match(m.metin, /112/)
      assert.doesNotMatch(m.metin, /glokom|retinopati|DR |evre|mmHg|µm|logMAR|bevacizumab|ranibizumab|aflibersept|tanı|makula ödemi/i)
    }
  })
})

describe('VA / logMAR studio helpers', () => {
  it('decimal, Snellen and letters Δ via engines/va', () => {
    assert.deepEqual([vaSatiri('0,5').ondalik, vaSatiri('0,5').logmar], ['0,50', '0,30'])
    assert.equal(vaSatiri('6/12').logmar, '0,30')
    assert.equal(vaSatiri('20/40').ondalik, '0,50')
    assert.equal(vaKarsilastir('0,5', '1,0').harf, 15)
    assert.equal(vaKarsilastir('1,0', '0,5').harf, -15)
  })
  it('PS / EH / IH / IHY are not numeric — no logMAR, no Δ, explicit note', () => {
    for (const x of ['PS 1m', 'EH', 'IH', 'IHY']) { const s = vaSatiri(x); assert.equal(s.logmar, null, x); assert.equal(s.hata, null, x) }
    const k = vaKarsilastir('PS 1m', '0,1')
    assert.equal(k.harf, null); assert.match(k.not!, /hekim yorumlar/)
    assert.match(vaSatiri('abc').hata!, /Okunamadı/)
  })
  it('GİL EK-3/G search: code or Turkish name, no price field anywhere', () => {
    assert.deepEqual(gilKodAra('torik').map((k) => k.kod), ['G10110'])
    assert.deepEqual(gilKodAra('G10090').map((k) => k.kod), ['G10090'])
    assert.equal(gilKodAra('').length, 5)
    assert.doesNotMatch(JSON.stringify(gilKodAra('')), /TL|₺|fiyat:|\d+,\d{2} ?TL/)
  })
})

describe('Katarakt: biyometri stored, IOL power never computed; post-op card', () => {
  it('biyometri normalizes Turkish decimals, rejects out-of-range typos, outputs no power', () => {
    const { biyometri, hatalar } = biyometriNormalize({ alMm: '23,45', k1D: '43,25', k2D: '44,00', kAks: '90', aSabiti: '118,9', cihaz: 'Optik biyometre', tarih: '2026-09-10' })
    assert.equal(hatalar.length, 0)
    assert.equal(biyometri.alMm, 23.45)
    assert.ok(biyometriTamMi(biyometri))
    const m = biyometriMetni(biyometri, 'Sağ göz')
    assert.match(m, /AL 23,45 mm/)
    assert.doesNotMatch(m, /güç(ü)? [+-]?\d|power|\+\d+(,\d+)? ?D\b|SRK|Barrett|Haigis|Hoffer/i)
    assert.ok(biyometriNormalize({ alMm: '234' }).hatalar[0].includes('aralığı'))
    assert.ok(biyometriNormalize({ k1D: 'x' }).hatalar[0].includes('sayı değil'))
  })
  it('post-op endoftalmi flag is the hekim\'s — turns into same-day alert, no thresholds invented', () => {
    const g1 = postopNormalize({ tarih: '2026-09-11', va: '0,3', gib: '18', kornea: 'hafif ödem', endoftalmiBayrak: true })
    const u = postopUyarilari({ gun1: g1 })
    assert.equal(u.acil.length, 1); assert.match(u.acil[0], /aynı gün/)
    assert.equal(postopUyarilari({ gun1: postopNormalize({ gib: '45' }) }).acil.length, 0, 'no IOP threshold invented')
    assert.match(postopMetni('gun1', g1, 'Sağ göz'), /ENDOFTALMİ ŞÜPHESİ \(hekim\)/)
  })
  it('GİL draft mirrors anti-VEGF quality: mandatory items, eksikler, EK-3/G code, Medula = hekim', () => {
    const eksik = gozSgkTaslak({ sablon: 'katarakt_gil', hasta: { adSoyad: '' }, goz: 'sag', gecmis: [], bugun: T })
    for (const e of ['Güncel düzeltilmiş görme keskinliği', 'Biyometri', 'GİL tipi', 'EK-3/G', 'Ön-op kontrol listesi']) assert.ok(eksik.eksikler.some((x) => x.includes(e)), e)
    assert.ok(eksik.sutKontrol.some((x) => x.madde.includes('Medula') && x.tamam === null))
    const { biyometri } = biyometriNormalize({ alMm: 23.4, k1D: 43, k2D: 44, aSabiti: 118.9 })
    const tam = gozSgkTaslak({ sablon: 'katarakt_gil', hasta: { adSoyad: '' }, goz: 'sol', vaSimdi: '0,3', gecmis: [], bugun: T, gil: { tip: 'torik', ek3gKod: 'G10110', biyometri, kontrolEksik: [], planlananTarih: '2026-10-01' } })
    assert.deepEqual(tam.eksikler, [])
    assert.match(tam.draft.mevcutDurum!, /G10110/)
    assert.ok(tam.draft.zorunluTetkikler!.some((x) => x.includes('AL 23,4 mm')))
    const metin = gozSgkMetni(tam)
    assert.doesNotMatch(metin, /\b\d{11}\b|TL|₺/)
    assert.doesNotMatch(metin, /güç(ü)? [+-]?\d/i)
  })
})

describe('SUT anti-VEGF kapı studio = chapter engine', () => {
  it('same gates as the chapter (ranibizumab 2. basamak engel; muayenehane → uyarı, odenebilir null)', () => {
    assert.equal(sgkKapilari({ ajan: 'ranibizumab', goz: 'sag', tarih: T, basamak: '2', gecmis: [] }).odenebilir, false)
    assert.equal(sgkKapilari({ ajan: 'bevacizumab', goz: 'sag', tarih: T, basamak: 'muayenehane', gecmis: [] }).odenebilir, null)
  })
})
