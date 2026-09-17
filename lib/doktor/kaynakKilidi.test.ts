import { test } from 'node:test'
import assert from 'node:assert/strict'
import { soapKaynakKilidi, uydurmaKaynakTemizle } from './kaynakKilidi'
import { KD_ACOG_ILGILI, kdDogrulanmisKaynaklar, kdKaynakListesiBlogu } from '../../specialties/kadin-dogum/protocols/dogrulanmis-kaynaklar'
import { ACOG_MAP } from '../../specialties/kadin-dogum/protocols/acog-map'

// KD-KAYNAK-KILIDI — the literal citations from the pre-fix KD chat run (smoke-out/kd-kaynak-kilidi-once.json), none in the repo's verified list.
const L = kdDogrulanmisKaynaklar()
const temiz = (s: string) => uydurmaKaynakTemizle(s, L)

test('PPH: "ACOG Practice Bulletin #183" / "ACOG PB #183" (not in the verified list) → organisation name only', () => {
  const r = temiz('Kaynak: DÖBYR 2026 + ACOG Practice Bulletin #183 (Postpartum Hemorrhage).\n| DÖBYR | ACOG PB #183 |')
  assert.equal(r.bulgular.length, 2)
  assert.ok(!/183/.test(r.metin))
  assert.ok(r.metin.includes('DÖBYR 2026 + ACOG önerileri'), r.metin)
})

test('GBS: "Practice Bulletin 797" / "ACOG PB 797" — 797 is a Committee Opinion, the wrong document type is not verified', () => {
  const r = temiz('GBS taraması 36 0/7–37 6/7 hafta (ACOG Practice Bulletin No. 797). ACOG PB 797 evrensel kültür önerir.')
  assert.equal(r.bulgular.length, 2)
  assert.ok(!/797/.test(r.metin))
  assert.ok(r.bulgular.every((b) => b.neden === 'dogrulanmamis'))
  assert.equal(temiz('GBS: ACOG Committee Opinion No. 797 — grup B streptokok taraması 36–37. hafta.').bulgular.length, 0, 'the verified CO 797 on its topic stays')
})

test('PPROM: "ACOG PB 188" (replaced; the verified list has PB 217) is removed', () => {
  const r = temiz('32 hafta PPROM: latency antibiyotiği ve antenatal kortikosteroid (ACOG Practice Bulletin No. 188); ACOG 188 ile uyumlu.')
  assert.ok(!/188/.test(r.metin))
  assert.equal(temiz('Erken membran rüptüründe ACOG PB 217 geçerlidir.').bulgular.length, 0)
  assert.equal(temiz('### 2. Latency Antibiyotiği\n\n| | SB Riskli Gebelikler Rehberi | ACOG PB 217 |').bulgular.length, 0, 'post-fix run: table under a latency heading')
})

test('verified number on the wrong topic is flagged (PB 222 cited for GBS); on its topic it stays, even when the topic is only in a heading', () => {
  assert.equal(temiz('GBS profilaksisi için ACOG PB 222 esas alınır.').bulgular[0]?.neden, 'konu-uyusmuyor')
  assert.equal(temiz('## Ağır Özellikli Preeklampsi — Doğum Zamanlaması\n\n### ACOG\n**ACOG Practice Bulletin No. 222**').bulgular.length, 0)
})

test('other societies and Turkish sources: RCOG Green-top, NICE NG, invented TJOD year, unknown Yayın No.', () => {
  const r = temiz('PPH: RCOG Green-top Guideline No. 52, NICE NG235 ve TJOD 2019 postpartum kanama önerileri. DÖBYR 2026 (HSGM Yayın No. 1402); Yayın No. 925.')
  assert.deepEqual(r.bulgular.map((b) => b.alinti), ['RCOG Green-top Guideline No. 52', 'NICE NG235', 'TJOD 2019', 'Yayın No. 925'])
  assert.ok(r.metin.includes('RCOG kılavuzu, NICE kılavuzu ve TJOD postpartum kanama önerileri'), r.metin)
  assert.ok(r.metin.includes('DÖBYR 2026 (HSGM Yayın No. 1402)'), 'verified SB source stays')
  assert.equal(temiz('PKOS tanısında TJOD PKOS Kılavuzu 2023 Rotterdam kriterlerini kullanır.').bulgular.length, 0)
  assert.equal(temiz('Preeklampside TJOD 2023 önerileri.').bulgular[0]?.neden, 'konu-uyusmuyor')
})

test('a short form after an ACOG mention is caught ("ACOG PB 222 (preeklampsi) ve PB 652"); plain text is untouched', () => {
  const r = temiz('Preeklampside magnezyum: ACOG PB 222 ve PB 652.')
  assert.deepEqual(r.bulgular.map((b) => b.alinti), ['PB 652'])
  for (const s of ['Hb 10 g/dL, CO2 normal, 2 PB ped.', 'ACOG 34. haftada doğum önerir; ACOG 2020 tablosu.', 'Uluslararası kılavuzlar (ör. ACOG) ve TJOD önerileri doğrultusunda.', 'SUT P.901.120 ikili tarama; 28. haftada anti-D.']) assert.equal(temiz(s).metin, s)
})

test('soapKaynakKilidi: note fields cleaned, hekim-review line in aiDegerlendirme; clean note unchanged', () => {
  const r = soapKaynakKilidi({ soap: { plan: 'GBS kültürü alındı (ACOG PB 797).' }, aiDegerlendirme: 'Postpartum kanama izlemi (ACOG Practice Bulletin No. 183).' }, L)
  assert.ok(!/797|183/.test(r.soap.plan + r.aiDegerlendirme!.split('⚠')[0]))
  assert.match(r.aiDegerlendirme!, /⚠ Kaynak kontrolü \(hekim onayı\).*"ACOG PB 797" \(plan\)/)
  const t = { soap: { plan: 'SB DÖBYR 2026 izlem takvimi.' }, aiDegerlendirme: 'Uygun.' }
  assert.deepEqual(soapKaynakKilidi(t, L), t)
})

test('verified list is copied, not invented: every ACOG number is an acog-map row or named in its notes; prompt block lists them Turkish-first', () => {
  const notlar = ACOG_MAP.map((r) => `${r.notes} ${r.title}`).join(' ')
  for (const i of KD_ACOG_ILGILI) assert.ok(new RegExp(`\\b${i.numara}\\b`).test(notlar), `${i.etiket} not in acog-map notes`)
  assert.ok(L.filter((k) => k.aile.startsWith('ACOG') || k.aile.startsWith('SMFM')).every((k) => ACOG_MAP.some((r) => r.pbNumber === k.numara) || KD_ACOG_ILGILI.some((i) => i.numara === k.numara)))
  assert.ok(L.every((k) => k.konu.length > 0))
  const blok = kdKaynakListesiBlogu()
  assert.ok(blok.includes('postpartum_care: önce SB Doğum Sonu Bakım Yönetim Rehberi'))
  assert.ok(blok.includes('gbs: Türk rehberi repoda yok; uluslararası: ACOG CO 797'))
  assert.ok(!/\b(183|188|652|782)\b/.test(blok))
})
