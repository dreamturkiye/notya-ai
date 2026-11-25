/**
 * HASTA-PORTALI-GUNLUK — rule engine: rolling windows, thresholds per level, the trend rule (Kaan's example: after-lunch
 * average 120 → 160 in a week → patient + doctor), cool-down / dedupe / escalation, infant fever, weight gain, the
 * pregnancy profile, doctor overrides, and the patient-text rules (112 on acil, no diagnosis words, no dose advice).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { EvOlcum } from './tipler'
import { egilimKurallari, gurultuSuz, hekimeGiderMi, pencere, tekDegerKurallari, ACIL_METNI } from './kurallar'
import { etkinEsikler, hedefteMi, hekimAyarlariniTemizle, varsayilanEsikler } from './hedefler'
import { gunEkle, trGun, trSaatAni } from './zaman'

const SIMDI = '2026-11-24T10:00:00Z' // 13:00 Türkiye
const BUGUN = trGun(SIMDI)
let n = 0
const o = (tip: EvOlcum['tip'], gunOnce: number, saat: string, deger: number, deger2: number | null = null, baglam: EvOlcum['baglam'] = null): EvOlcum =>
  ({ id: `o${++n}`, tip, deger, deger2, baglam, olcumAt: trSaatAni(gunEkle(BUGUN, -gunOnce), saat), kaynak: 'portal' })
const B = { yasAy: 480, kiloHekimeBildir: false }
const E = varsayilanEsikler()

describe('pencere (rolling windows)', () => {
  it('weekly average = last 7 days incl. today; previous = the 21 days before; daily averages oldest first', () => {
    const l = [o('glukoz', 0, '14:30', 160, null, 'tokluk2'), o('glukoz', 6, '14:30', 150, null, 'tokluk2'), o('glukoz', 7, '14:30', 120, null, 'tokluk2'), o('glukoz', 27, '14:30', 110, null, 'tokluk2'), o('glukoz', 28, '14:30', 999, null, 'tokluk2'), o('glukoz', 0, '07:30', 100, null, 'aclik')]
    const p = pencere(l, 'glukoz:tokluk2', SIMDI, 14)
    assert.equal(p.hafta.n, 2); assert.equal(p.hafta.ort, 155)
    assert.equal(p.onceki.n, 2); assert.equal(p.onceki.ort, 115) // day 28 is outside, açlık is another context
    assert.equal(p.gunluk.length, 14); assert.equal(p.gunluk[13].gun, BUGUN); assert.equal(p.gunluk[13].ort, 160); assert.equal(p.gunluk[12].ort, null)
  })
  it('keeps the diastolic average for BP', () => {
    const p = pencere([o('kb', 0, '08:00', 130, 80), o('kb', 1, '08:00', 140, 90)], 'kb', SIMDI)
    assert.equal(p.hafta.ort, 135); assert.equal(p.hafta.ort2, 85)
  })
})

describe('tek değer eşikleri', () => {
  it('BP ≥180 systolic or ≥120 diastolic → acil with the 112 sentence; reaches the doctor', () => {
    for (const [s, d] of [[182, 95], [150, 121]]) {
      const r = tekDegerKurallari(o('kb', 0, '08:00', s, d), E, B)
      assert.equal(r.length, 1); assert.equal(r[0].duzey, 'acil'); assert.ok(r[0].hastaMetni.includes(ACIL_METNI)); assert.ok(hekimeGiderMi(r[0].duzey))
    }
  })
  it('BP levels: 172/90 → hekime_bildir, 162/90 → dikkat, 128/78 → nothing, 85/55 → hekime_bildir (low)', () => {
    assert.equal(tekDegerKurallari(o('kb', 0, '08:00', 172, 90), E, B)[0].duzey, 'hekime_bildir')
    assert.equal(tekDegerKurallari(o('kb', 0, '08:00', 162, 90), E, B)[0].duzey, 'dikkat')
    assert.deepEqual(tekDegerKurallari(o('kb', 0, '08:00', 128, 78), E, B), [])
    assert.equal(tekDegerKurallari(o('kb', 0, '08:00', 78, 50), E, B)[0].duzey, 'hekime_bildir')
  })
  it('glucose: <54 acil (doctor\'s hypo plan, 112), <70 dikkat, >300 hekime_bildir', () => {
    const a = tekDegerKurallari(o('glukoz', 0, '08:00', 50, null, 'aclik'), E, B)[0]
    assert.equal(a.duzey, 'acil'); assert.match(a.hastaMetni, /düşük şeker planını/); assert.match(a.hastaMetni, /112/)
    assert.equal(tekDegerKurallari(o('glukoz', 0, '08:00', 65, null, 'aclik'), E, B)[0].duzey, 'dikkat')
    assert.equal(tekDegerKurallari(o('glukoz', 0, '15:00', 320, null, 'tokluk2'), E, B)[0].duzey, 'hekime_bildir')
    assert.deepEqual(tekDegerKurallari(o('glukoz', 0, '15:00', 150, null, 'tokluk2'), E, B), [])
  })
  it('fever under 3 months of age is acil whatever the thresholds', () => {
    const r = tekDegerKurallari(o('ates', 0, '09:00', 38.1), {}, { yasAy: 2, kiloHekimeBildir: false })
    assert.equal(r[0].duzey, 'acil'); assert.equal(r[0].kural, 'ates_bebek')
    assert.equal(tekDegerKurallari(o('ates', 0, '09:00', 38.1), E, { yasAy: 30, kiloHekimeBildir: false })[0].duzey, 'bilgi')
    assert.equal(tekDegerKurallari(o('ates', 0, '09:00', 40.2), E, B)[0].duzey, 'hekime_bildir')
  })
  it('SpO₂ <88 acil, <92 hekime_bildir; pulse 135 hekime_bildir', () => {
    assert.equal(tekDegerKurallari(o('spo2', 0, '09:00', 86), E, B)[0].duzey, 'acil')
    assert.equal(tekDegerKurallari(o('spo2', 0, '09:00', 91), E, B)[0].duzey, 'hekime_bildir')
    assert.equal(tekDegerKurallari(o('nabiz', 0, '09:00', 135), E, B)[0].duzey, 'hekime_bildir')
  })
  it('the doctor\'s per-patient override wins (COPD-type SpO₂ target)', () => {
    const e = etkinEsikler('genel', hekimAyarlariniTemizle({ esikler: { spo2: { hedefMin: 88, dikkatAlt: 88, bildirAlt: 86, acilAlt: 84 } } }))
    assert.deepEqual(tekDegerKurallari(o('spo2', 0, '09:00', 89), e, B), [])
    assert.equal(tekDegerKurallari(o('spo2', 0, '09:00', 85), e, B)[0].duzey, 'hekime_bildir')
  })
  it('pregnancy profile: 142/88 notifies, 162/100 is acil (general profile: dikkat)', () => {
    const g = varsayilanEsikler('gebelik')
    assert.equal(tekDegerKurallari(o('kb', 0, '08:00', 142, 88), g, B)[0].duzey, 'hekime_bildir')
    assert.equal(tekDegerKurallari(o('kb', 0, '08:00', 162, 100), g, B)[0].duzey, 'acil')
    assert.equal(tekDegerKurallari(o('kb', 0, '08:00', 162, 100), E, B)[0].duzey, 'dikkat')
  })
})

describe('Eğilim Bekçisi (trend)', () => {
  const seri = (ilk: number, son: number) => {
    const l: EvOlcum[] = []
    for (let g = 27; g >= 0; g--) l.push(o('glukoz', g, '14:30', g <= 6 ? son : ilk, null, 'tokluk2'))
    return l
  }
  it("Kaan's example: after-lunch average 120 → 160 within a week → hekime_bildir (patient + doctor)", () => {
    const r = egilimKurallari(seri(120, 160), E, SIMDI, B)
    const t = r.find((x) => x.kural === 'egilim_artis')
    assert.ok(t); assert.equal(t.duzey, 'hekime_bildir'); assert.equal(t.metrik, 'glukoz:tokluk2'); assert.equal(t.anahtar, 'egilim:glukoz:tokluk2')
    assert.match(t.hastaMetni, /160/); assert.match(t.hastaMetni, /120/); assert.match(t.hekimMetni, /\+40/)
  })
  it('a single high reading is not a trend; a small rise is not a trend', () => {
    const l = seri(120, 120); l.push(o('glukoz', 0, '15:00', 260, null, 'tokluk2'))
    assert.equal(egilimKurallari(l, E, SIMDI, B).filter((x) => x.kural === 'egilim_artis').length, 0)
    assert.equal(egilimKurallari(seri(120, 135), E, SIMDI, B).length, 0)
  })
  it('needs ≥4 readings in both windows', () => {
    const l = [o('glukoz', 1, '14:30', 170, null, 'tokluk2'), o('glukoz', 2, '14:30', 170, null, 'tokluk2'), o('glukoz', 3, '14:30', 170, null, 'tokluk2'), ...Array.from({ length: 10 }, (_, i) => o('glukoz', 8 + i, '14:30', 110, null, 'tokluk2'))]
    assert.equal(egilimKurallari(l, E, SIMDI, B).length, 0)
  })
  it('weight +2 kg within 3 days: dikkat by default, hekime_bildir for heart / kidney follow-up', () => {
    const l = [o('kilo', 3, '07:00', 80), o('kilo', 1, '07:00', 81), o('kilo', 0, '07:00', 82.3)]
    assert.equal(egilimKurallari(l, E, SIMDI, B).find((x) => x.kural === 'kilo_artis')?.duzey, 'dikkat')
    assert.equal(egilimKurallari(l, E, SIMDI, { ...B, kiloHekimeBildir: true }).find((x) => x.kural === 'kilo_artis')?.duzey, 'hekime_bildir')
  })
  it('fever on 3 consecutive days and repeated low glucose notify the doctor', () => {
    const a = egilimKurallari([o('ates', 0, '09:00', 38.4), o('ates', 1, '09:00', 38.2), o('ates', 2, '09:00', 38.9)], E, SIMDI, B)
    assert.equal(a.find((x) => x.kural === 'ates_3gun')?.duzey, 'hekime_bildir')
    const g = egilimKurallari([o('glukoz', 0, '08:00', 64, null, 'aclik'), o('glukoz', 3, '08:00', 66, null, 'aclik')], E, SIMDI, B)
    assert.equal(g.find((x) => x.kural === 'tekrar_dusuk_seker')?.duzey, 'hekime_bildir')
  })
})

describe('gürültü önleme (dedupe / cool-down / escalation)', () => {
  const aday = (duzey: 'dikkat' | 'hekime_bildir' | 'acil', anahtar = 'yuksek:kb') => ({ kural: 'x', anahtar, duzey, metrik: 'kb', hastaMetni: '', hekimMetni: '', veri: {} })
  const saatOnce = (h: number) => new Date(Date.parse(SIMDI) - h * 3600_000).toISOString()
  it('same key at the same level inside the cool-down is dropped; after it, allowed again', () => {
    assert.equal(gurultuSuz([aday('hekime_bildir')], [{ anahtar: 'yuksek:kb', duzey: 'hekime_bildir', olusturmaAt: saatOnce(10) }], SIMDI).length, 0)
    assert.equal(gurultuSuz([aday('hekime_bildir')], [{ anahtar: 'yuksek:kb', duzey: 'hekime_bildir', olusturmaAt: saatOnce(80) }], SIMDI).length, 1)
  })
  it('a higher level breaks through the cool-down; a lower one does not', () => {
    assert.equal(gurultuSuz([aday('acil')], [{ anahtar: 'yuksek:kb', duzey: 'hekime_bildir', olusturmaAt: saatOnce(1) }], SIMDI).length, 1)
    assert.equal(gurultuSuz([aday('dikkat')], [{ anahtar: 'yuksek:kb', duzey: 'hekime_bildir', olusturmaAt: saatOnce(1) }], SIMDI).length, 0)
  })
  it('several candidates with one key collapse to the highest; different keys stay', () => {
    const r = gurultuSuz([aday('dikkat'), aday('acil'), aday('dikkat', 'egilim:kb')], [], SIMDI)
    assert.equal(r.length, 2); assert.equal(r.find((x) => x.anahtar === 'yuksek:kb')?.duzey, 'acil')
  })
})

describe('hasta metni kuralları', () => {
  it('no disease names, no dose instructions in any patient text', () => {
    const metinler = [
      ...tekDegerKurallari(o('kb', 0, '08:00', 185, 100), E, B), ...tekDegerKurallari(o('glukoz', 0, '08:00', 50, null, 'aclik'), E, B),
      ...tekDegerKurallari(o('glukoz', 0, '08:00', 65, null, 'aclik'), E, B), ...tekDegerKurallari(o('spo2', 0, '08:00', 86), E, B),
      ...tekDegerKurallari(o('ates', 0, '08:00', 38.5), E, { yasAy: 1, kiloHekimeBildir: false }),
    ].map((r) => r.hastaMetni.toLocaleLowerCase('tr-TR'))
    for (const m of metinler) {
      assert.doesNotMatch(m, /hipertansiyon|diyabet|şeker hastalığı|preeklamps|kalp yetmezliği|hipoglisemi|hiperglisemi|enfeksiyon/)
      assert.doesNotMatch(m, /\b\d+\s?(mg|ml|ünite|unite|tablet)\b.*(alın|artırın|azaltın)/)
    }
  })
})

describe('hedefteMi', () => {
  it('BP target is below the limit (130/80 itself is outside); others inclusive', () => {
    assert.equal(hedefteMi(E.kb, 129, 79), true); assert.equal(hedefteMi(E.kb, 130, 79), false); assert.equal(hedefteMi(E.kb, 125, 80), false)
    assert.equal(hedefteMi(E['glukoz:tokluk2'], 160), true); assert.equal(hedefteMi(E['glukoz:tokluk2'], 161), false)
    assert.equal(hedefteMi(E.kilo, 80), null)
  })
  it('the doctor settings cleaner drops unknown keys and non-numbers', () => {
    const t = hekimAyarlariniTemizle({ esikler: { kb: { hedefMax: '125', hack: 1, acilUst: 'x' }, bilinmeyen: { hedefMax: 1 } }, olcumler: ['kb', 'xx'], ldlHedef: 55 })
    assert.deepEqual(t, { esikler: { kb: { hedefMax: 125 } }, olcumler: ['kb'], ldlHedef: 55 })
  })
})
