/**
 * Araçlar › KD kohort paneli — saf motor (engines/kd-kohort.ts) + sunucu kapsam kilitleri. Sentetik tarihler; gerçek hasta yok.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { kdKohortSatiri, kdKohortSatirlari, kdHatirlatmaMesaji, type KdKohortGirdi } from '../engines/kd-kohort'
import { addDays } from '../engines/dates'

const KOK = path.join(import.meta.dirname, '../../..')

const BUGUN = '2026-09-18'
const girdi = (p: Partial<KdKohortGirdi>): KdKohortGirdi => ({ patientId: 'p1', ad: 'QA Hasta', dogumIso: '1994-01-01', gebelik: null, serviks: null, sonVizit: null, portalVar: true, ...p })
const gebelik = (p: Partial<NonNullable<KdKohortGirdi['gebelik']>>) => ({ durum: 'aktif' as const, sat: null, tdt: null, rhNegatif: false, dogumTarihi: null, izlemHaftalari: [], yapilanlar: [], lohusaGunleri: [], ...p })

test('kohort: lohusa 1. ve 6. hafta — kayıt yoksa bayrak, kayıt varsa yok; lohusa satırı listenin en üstünde', () => {
  const l1 = kdKohortSatiri(girdi({ gebelik: gebelik({ durum: 'dogum_yapti', dogumTarihi: addDays(BUGUN, -4) }) }), BUGUN)
  assert.deepEqual(l1.bayraklar, ['lohusa_1hf'])
  assert.ok(l1.lohusa)
  const l6 = kdKohortSatiri(girdi({ gebelik: gebelik({ durum: 'dogum_yapti', dogumTarihi: addDays(BUGUN, -45), lohusaGunleri: [3] }) }), BUGUN)
  assert.deepEqual(l6.bayraklar, ['lohusa_6hf'])
  assert.equal(kdKohortSatiri(girdi({ gebelik: gebelik({ durum: 'dogum_yapti', dogumTarihi: addDays(BUGUN, -45), lohusaGunleri: [3, 35] }) }), BUGUN).bayraklar.length, 0)
  assert.equal(kdKohortSatiri(girdi({ gebelik: gebelik({ durum: 'dogum_yapti', dogumTarihi: addDays(BUGUN, -1) }) }), BUGUN).bayraklar.length, 0, 'day 1: not yet due')
  const lmp = addDays(BUGUN, -(13 * 7 + 3))
  const sirali = kdKohortSatirlari([
    girdi({ patientId: 'serviks', ad: 'A', serviks: { sonTarama: '2019-01-01' } }),
    girdi({ patientId: 'kapaniyor', ad: 'B', gebelik: gebelik({ sat: lmp, izlemHaftalari: [8] }) }),
    girdi({ patientId: 'lohusa', ad: 'C', gebelik: gebelik({ durum: 'dogum_yapti', dogumTarihi: addDays(BUGUN, -10) }) }),
    girdi({ patientId: 'lohusa6', ad: 'E', gebelik: gebelik({ durum: 'dogum_yapti', dogumTarihi: addDays(BUGUN, -44), lohusaGunleri: [4] }) }),
    girdi({ patientId: 'temiz', ad: 'D', gebelik: gebelik({ sat: lmp, izlemHaftalari: [8], yapilanlar: ['ikili_nt'] }), dogumIso: null }),
  ], BUGUN)
  assert.deepEqual(sirali.map((s) => s.patientId), ['lohusa', 'lohusa6', 'kapaniyor', 'serviks'])
  assert.ok(sirali[2].bayraklar.includes('tarama_kapaniyor'))
})

test('kohort: DÖBYR izlem gecikmesi (geç başvuru kuralı), OGTT / anti-D / GBS zamanı, serviks', () => {
  const lmp = (h: number) => addDays(BUGUN, -h * 7)
  const gecBasvuru = kdKohortSatiri(girdi({ gebelik: gebelik({ sat: lmp(30), izlemHaftalari: [27] }) }), BUGUN)
  assert.ok(!gecBasvuru.bayraklar.includes('izlem_gecikti'), 'windows closed before first record are not flagged')
  const kayitsiz = kdKohortSatiri(girdi({ gebelik: gebelik({ sat: lmp(20) }) }), BUGUN)
  assert.ok(kayitsiz.bayraklar.includes('izlem_gecikti'))
  assert.ok(kdKohortSatiri(girdi({ gebelik: gebelik({ sat: lmp(25), izlemHaftalari: [10, 20] }) }), BUGUN).bayraklar.includes('ogtt_zamani'))
  const rh = kdKohortSatiri(girdi({ gebelik: gebelik({ sat: lmp(28), rhNegatif: true, izlemHaftalari: [10, 20], yapilanlar: ['ogtt_gdm'] }) }), BUGUN)
  assert.ok(rh.bayraklar.includes('anti_d_zamani'))
  assert.ok(!kdKohortSatiri(girdi({ gebelik: gebelik({ sat: lmp(28), rhNegatif: true, izlemHaftalari: [10, 20], yapilanlar: ['ogtt_gdm', 'anti_d_28'] }) }), BUGUN).bayraklar.includes('anti_d_zamani'))
  assert.ok(kdKohortSatiri(girdi({ gebelik: gebelik({ sat: lmp(36), izlemHaftalari: [10, 20, 30], yapilanlar: ['ogtt_gdm'] }) }), BUGUN).bayraklar.includes('gbs_zamani'))
  assert.ok(kdKohortSatiri(girdi({ serviks: { sonTarama: null } }), BUGUN).bayraklar.includes('serviks_tarama'))
  assert.ok(!kdKohortSatiri(girdi({ serviks: { sonTarama: '2024-01-01' } }), BUGUN).bayraklar.includes('serviks_tarama'))
  assert.ok(!kdKohortSatiri(girdi({ dogumIso: '2010-01-01', serviks: { sonTarama: null } }), BUGUN).bayraklar.includes('serviks_tarama'), 'under 21: no cervical screening flag')
})

test('kohort hatırlatma: hasta-güvenli (tanı / değer / hafta / ilaç yok) + 112', () => {
  const m = kdHatirlatmaMesaji(['lohusa_1hf', 'anti_d_zamani', 'tarama_kapaniyor', 'serviks_tarama'])
  assert.match(m.metin, /112/)
  assert.match(m.metin, /Doğum sonrası kontrol/)
  assert.doesNotMatch(m.metin, /anti-D|\bRh\b|OGTT|GBS|HPV|smear|\d+\s*(mg|µg|hf|hafta)|preeklampsi|diyabet/i)
})

test('kohort API: hasta kimlikleri yalnız doctor_id kapsamlı satırlardan; her sorgu doctor_id ile', () => {
  const src = fs.readFileSync(path.join(KOK, 'app/api/doktor/gebelik/_kohort.ts'), 'utf8')
  const from = src.match(/\.from\('[a-z_]+'\)/g) || []
  const eq = src.match(/\.from\('[a-z_]+'\)\.(select|insert)\([^)]*\)(\.eq\('doctor_id', doctorId\))?/g) || []
  assert.ok(from.length >= 9)
  for (const q of eq) if (/select/.test(q) && !/hasta_mesaj_konulari/.test(q)) assert.match(q, /\.eq\('doctor_id', doctorId\)/, q)
  const route = fs.readFileSync(path.join(KOK, 'app/api/doktor/gebelik/kohort/route.ts'), 'utf8')
  assert.match(route, /kdKohortVerisi\(sb, user\.id, bugun\(\), ids\)/, 'POST filters ids through the doctor-scoped cohort first')
})


test('commercial copy: no engineering jargon in kohort strings', () => {
  for (const d of ['specialties/kadin-dogum/engines/kd-kohort.ts', 'specialties/kadin-dogum/ui/araclar/KdKohortPaneli.tsx']) {
    const kod = fs.readFileSync(path.join(KOK, d), 'utf8').split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*\*)/.test(l)).join('\n')
    assert.doesNotMatch(kod, /\brepo(da|su)?\b|sprint|Gökhan|Gokhan|audit|\.html/i, d)
  }
})
