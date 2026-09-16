import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gorevleriUret, gorevDurumu, taburcuKurali, pretermOnerileri, bebekGorevleri, pphKarti, partografUyari, ONAM_KUTUPHANESI, CS_ENDIKASYONLARI } from '../engines/dogum-spine'

describe('görev motoru', () => {
  it('generates windows from SAT; ikili is hard with an alternative; Rh task only when Rh negatif', () => {
    const g = gorevleriUret({ sat: '2026-06-01', rhNegatif: false })
    const ikili = g.find((x) => x.kod === 'ikili_nt')!
    assert.ok(ikili.sert); assert.ok(ikili.kacirilinca?.includes('NIPT'))
    assert.equal(ikili.hedefBaslangic, '2026-08-17'); assert.equal(ikili.hedefBitis, '2026-09-06') // 11+0 .. 13+6 (day 77 .. day 97)
    assert.ok(!g.some((x) => x.kod === 'rhogam'))
    assert.ok(gorevleriUret({ sat: '2026-06-01', rhNegatif: true }).some((x) => x.kod === 'rhogam'))
  })
  it('derives SAT from TDT when SAT missing; GDM window 24–28', () => {
    const g = gorevleriUret({ tdt: '2027-03-08' })
    const gdm = g.find((x) => x.kod === 'gdm')!
    assert.equal(gdm.hedefBaslangic, '2026-11-16')
  })
  it('status: bekliyor / pencerede / kacirildi / tamam', () => {
    const [g] = gorevleriUret({ sat: '2026-06-01' }).filter((x) => x.kod === 'ikili_nt')
    assert.equal(gorevDurumu(g, '2026-08-01', false), 'bekliyor'); assert.equal(gorevDurumu(g, '2026-08-20', false), 'pencerede')
    assert.equal(gorevDurumu(g, '2026-09-10', false), 'kacirildi'); assert.equal(gorevDurumu(g, '2026-09-10', true), 'tamam')
  })
})

describe('taburcu gate', () => {
  it('blocks without NTP-1/HepB-1/VitK/işitme; documented exception opens it', () => {
    const r = taburcuKurali({ ntp1: true, hepb1: true, vitk: false, isitme: true }, null)
    assert.equal(r.kapatilabilir, false); assert.deepEqual(r.zorunluEksik, ['K vitamini'])
    assert.equal(taburcuKurali({ ntp1: true, hepb1: true, vitk: true, isitme: true }, null).kapatilabilir, true)
    assert.equal(taburcuKurali({}, { tur: 'sevk', aciklama: 'YDYBÜ sevk, 32 hf' }).kapatilabilir, true)
    assert.equal(taburcuKurali({}, { tur: 'red', aciklama: 'kısa' }).kapatilabilir, false)
  })
})

describe('preterm card', () => {
  it('steroid 24–33+6, MgSO4 ≤32 when birth <24h, PPROM antibiotics, no orders', () => {
    const a = pretermOnerileri({ hafta: 30, pprom: true, dogum24saatIcinde: true })
    assert.ok(a.some((x) => x.madde.includes('betametazon'))); assert.ok(a.some((x) => x.madde.includes('MgSO4'))); assert.ok(a.some((x) => x.madde.includes('PPROM antibiyotik')))
    assert.ok(a.every((x) => x.madde.includes('hekim kararı') || /izlem|sevk|YDYBÜ/.test(x.madde)))
    const b = pretermOnerileri({ hafta: 35, pprom: false, dogum24saatIcinde: false })
    assert.ok(!b.some((x) => x.madde.includes('MgSO4'))); assert.ok(!b.some((x) => x.madde.includes('Tokoliz')))
  })
})

describe('bebek tasks and PPH', () => {
  it('live birth <34 hf adds YDYBÜ + ROP; male adds urology exam; stillbirth none', () => {
    const t = bebekGorevleri({ hafta: 32, kiloGram: 1800, cinsiyet: 'E', komplikasyonlar: [], canli: true })
    assert.ok(t.some((x) => x.kod === 'ydybu')); assert.ok(t.some((x) => x.kod === 'rop')); assert.ok(t.some((x) => x.kod === 'uro_muayene'))
    assert.equal(bebekGorevleri({ hafta: 39, kiloGram: 3200, cinsiyet: 'K', komplikasyonlar: [], canli: false }).length, 0)
  })
  it('PPH thresholds', () => { assert.equal(pphKarti(650).acil, true); assert.equal(pphKarti(400).acil, false); assert.ok(pphKarti(1200).siniflama.startsWith('Majör')) })
})

describe('partograf alert/action', () => {
  it('no progress over 4h in active phase → action line', () => {
    const r = partografUyari([{ zaman: '2026-09-16T08:00:00Z', servikal_acilma: 4 }, { zaman: '2026-09-16T10:00:00Z', servikal_acilma: 4 }, { zaman: '2026-09-16T12:30:00Z', servikal_acilma: 4 }])
    assert.ok(r.aksiyon)
    const ok = partografUyari([{ zaman: '2026-09-16T08:00:00Z', servikal_acilma: 4 }, { zaman: '2026-09-16T10:00:00Z', servikal_acilma: 7 }])
    assert.equal(ok.uyari, null)
  })
})

describe('library sanity', () => {
  it('onam templates cover the spec list; sezaryen has the tüp ligasyonu extra box; C/S list is SB-style', () => {
    for (const k of ['gebelik_takibi', 'nt_11_14', 'ayrintili_usg', 'amniyosentez', 'cvs', 'kordosentez', 'vajinal_dogum', 'sezaryen', 'ssvd', 'dc_dusuk', 'ektopik']) assert.ok(ONAM_KUTUPHANESI.some((o) => o.kod === k), k)
    assert.ok(ONAM_KUTUPHANESI.find((o) => o.kod === 'sezaryen')!.ekKutu?.includes('TÜP LİGASYONU'))
    assert.ok(CS_ENDIKASYONLARI.length >= 12)
  })
})
