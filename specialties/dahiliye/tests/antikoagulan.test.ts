import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ttr, crcl, ajanBul, antikoagulanDegerlendir } from '../engines/antikoagulan'

test('Rosendaal TTR: doğrusal interpolasyon', () => {
  // 1,5 → 2,5 on 10 days: values 1.5,1.6,...,2.4 → in range from day 5 (2.0) to 9 → 5/10 = %50
  assert.equal(ttr([{ deger: 1.5, tarih: '2026-01-01' }, { deger: 2.5, tarih: '2026-01-11' }]).yuzde, 50)
  assert.equal(ttr([{ deger: 2.5, tarih: '2026-01-01' }, { deger: 2.5, tarih: '2026-01-29' }]).yuzde, 100)
  assert.equal(ttr([{ deger: 2.5, tarih: '2026-01-01' }, { deger: 2.5, tarih: '2026-06-01' }]).yuzde, null)
})

test('Cockcroft-Gault ve ajan bulma', () => {
  assert.equal(crcl(80, 60, 1.2, false), 42); assert.equal(crcl(80, 60, 1.2, true), 35)
  assert.equal(ajanBul(['Eliquis 5 apiksaban']), 'apiksaban'); assert.equal(ajanBul(['coumadin']), 'warfarin'); assert.equal(ajanBul(['aspirin']), null)
})

const t = { ajan: null, endikasyon: 'af' as const, hedefInr: null, yas: 82, kadin: true, kiloKg: 58, kre: 1.1, hb: 12.5, plt: 220, inr: [] as { deger: number; tarih: string }[], ilacMetinleri: [] as string[], sbp: 135, hasBled: {}, bugun: '2026-09-16' }

test('apiksaban 2/3 kriter → azaltılmış doz kriteri (mg yok); dabigatran KrKl <30 kırmızı; mekanik kapak + DOAK kırmızı', () => {
  const a = antikoagulanDegerlendir({ ...t, ajan: 'apiksaban' })
  assert.match(a.uygunluk[0], /2'si/); assert.ok(!/\bmg\b/.test(JSON.stringify(a.uygunluk)))
  assert.ok(antikoagulanDegerlendir({ ...t, ajan: 'dabigatran', kre: 1.8 }).kirmizi.some((k) => /Dabigatran/.test(k)))
  assert.ok(antikoagulanDegerlendir({ ...t, ajan: 'rivaroksaban', endikasyon: 'mekanik_kapak' }).kirmizi.some((k) => /MEKANİK KAPAK/.test(k)))
})

test('warfarin: stabil → 4 hafta; hedef dışı → 1 hafta; INR ≥9 kırmızı; HAS-BLED liste skor değil', () => {
  const s = antikoagulanDegerlendir({ ...t, ajan: 'warfarin', inr: [{ deger: 2.4, tarih: '2026-07-20' }, { deger: 2.6, tarih: '2026-08-17' }, { deger: 2.2, tarih: '2026-09-14' }] })
  assert.equal(s.sonrakiInr, '2026-10-12'); assert.equal(s.ttr, 100)
  assert.equal(antikoagulanDegerlendir({ ...t, ajan: 'warfarin', inr: [{ deger: 3.8, tarih: '2026-09-14' }] }).sonrakiInr, '2026-09-21')
  assert.equal(antikoagulanDegerlendir({ ...t, ajan: 'warfarin', inr: [{ deger: 9.4, tarih: '2026-09-14' }] }).kirmizi.length, 1)
  const h = antikoagulanDegerlendir({ ...t, ajan: 'warfarin', ilacMetinleri: ['coraspin aspirin'] })
  assert.equal(h.hasBledMaddeleri.length, 9); assert.ok(!('skor' in h)); assert.ok(h.uyarilar.some((u) => /antiplatelet/.test(u)))
})
