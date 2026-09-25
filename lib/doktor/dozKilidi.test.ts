import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DOZ_YER_TUTUCU, kaynakSayilari, receteDozsuz, soapDozKilidi, soapDozUydurmaKilidi, uydurmaDozTemizle } from './dozKilidi'
import fs from 'node:fs'
import path from 'node:path'
import { dozKilitliBrans } from './soapUret'

// KD-DERM-SAFETY-FINDINGS F1 — the three doses seen in KD-PROMPTS-LOCK / DERM-PROMPTS-LOCK test notes, none said by the hekim.
const KD_TRANSKRIPT = 'Kan grubunuz A Rh negatif, indirekt Coombs negatifti; 28. haftada anti-D yapacağız. 50 gram yükleme testi yapılmadı. Tansiyon 128/82, fundus 27 santim.'
const DERM_TRANSKRIPT = 'Yirmi dört yaşında, yüzde nodülokistik akne. Kilo 62. İzotretinoin başlamayı düşünüyoruz, gebelik testi ve lipid isteyelim.'

test('anti-D 300 mcg the hekim never said is removed from the plan body and flagged for hekim review', () => {
  const r = soapDozKilidi({ soap: { plan: '1) 28. haftada anti-D (300 mcg) IM.\n2) 50 gram yükleme testi.' }, aiDegerlendirme: 'Öneri (doktor onayına tabi): anti-D 300 mcg (1500 IU) IM.' }, KD_TRANSKRIPT)
  assert.ok(!/300|1500/.test(r.soap!.plan as string + r.aiDegerlendirme!.split('⚠')[0]))
  assert.ok((r.soap!.plan as string).includes(`anti-D (${DOZ_YER_TUTUCU})`))
  assert.ok((r.soap!.plan as string).includes('28. haftada') && (r.soap!.plan as string).includes('50 gram yükleme'), 'numbers the hekim said stay')
  assert.match(r.aiDegerlendirme!, /⚠ Doz kontrolü \(hekim onayı\).*"300 mcg" \(plan\)/)
})

test('aspirin 81 mg/gün in aiDegerlendirme is replaced', () => {
  const r = soapDozKilidi({ aiDegerlendirme: 'Preeklampsi riski: düşük doz aspirin 81 mg/gün, 12–16. hafta arası başlanabilir.' }, KD_TRANSKRIPT)
  assert.ok(!r.aiDegerlendirme!.split('⚠')[0].includes('81'))
  assert.ok(r.aiDegerlendirme!.includes(`aspirin ${DOZ_YER_TUTUCU}`))
  assert.ok(r.aiDegerlendirme!.includes('12–16. hafta'))
})

test('izotretinoin 0,5 mg/kg/gün ≈30 mg/gün and cumulative 120–150 mg/kg are replaced; reçete önerisi loses doz', () => {
  const r = soapDozKilidi({
    aiDegerlendirme: 'İzotretinoin 0,5 mg/kg/gün ≈30 mg/gün; kümülatif 120–150 mg/kg hedeflenir.',
    receteOnerisi: [{ etkenMadde: 'izotretinoin', ticariOrnek: 'Roaccutane 20 mg', doz: '30 mg', kullanim: '1x1' }],
    ilaclar: [{ ad: 'İzotretinoin', doz: '30 mg/gün', kullanim: 'günde 1' }],
  }, DERM_TRANSKRIPT)
  const on = r.aiDegerlendirme!.split('⚠')[0]
  assert.ok(!/0,5|30 mg|120|150/.test(on), on)
  assert.equal(r.receteOnerisi![0].doz, undefined); assert.equal(r.receteOnerisi![0].kullanim, undefined); assert.equal(r.receteOnerisi![0].ticariOrnek, 'Roaccutane')
  assert.equal((r.ilaclar![0] as { doz: string }).doz, DOZ_YER_TUTUCU)
})

test('a dose the hekim dictated is kept exactly (digits, Turkish decimal comma, thousands dot)', () => {
  const tr = 'Anti-D 300 mikrogram yapıyoruz. İzotretinoin günde 0,5 mg/kg. Oksitosin 1.000 mL içinde.'
  const r = soapDozKilidi({ soap: { plan: 'Anti-D 300 mcg IM. İzotretinoin 0.5 mg/kg/gün. Oksitosin 1000 mL.' } }, tr)
  assert.equal(r.soap!.plan, 'Anti-D 300 mcg IM. İzotretinoin 0.5 mg/kg/gün. Oksitosin 1000 mL.')
  assert.equal(r.aiDegerlendirme, undefined, 'no flag when nothing was removed')
})

test('patient-file context counts as source (sürekli ilaç dozları)', () => {
  const r = soapDozKilidi({ aiDegerlendirme: 'Levotiroksin 50 mcg devam.' }, 'Tiroid kontrolü.', 'Sürekli ilaçlar: levotiroksin 50 mcg')
  assert.equal(r.aiDegerlendirme, 'Levotiroksin 50 mcg devam.')
})

test('lab values and non-dose numbers are not treated as doses', () => {
  const k = kaynakSayilari('')
  for (const s of ['Hb 10,2 g/dL', 'glukoz 126 mg/dL', 'eGFR 85 mL/dk/1.73 m²', 'β-hCG 1200 mIU/mL', '75 g OGTT önerilir', '27 hafta 2 gün', 'TSH 2,4', '5 gün sonra kontrol', 'PASI %75', '3 ay']) {
    assert.equal(uydurmaDozTemizle(s, k).metin, s, s)
  }
})

test('PPH blood-loss threshold ≥500 mL is not treated as an invented drug dose', () => {
  const k = kaynakSayilari('')
  const pph = 'Postpartum hemoraji (PPH): vajinal doğumda ≥500 mL, sezaryende ≥1000 mL kan kaybı eşiği.'
  assert.equal(uydurmaDozTemizle(pph, k).metin, pph)
  assert.equal(uydurmaDozTemizle(pph, k).dozlar.length, 0)
  const karisik = 'PPH ≥500 mL kan kaybı; oksitosin 10 IU bolus.'
  const r = uydurmaDozTemizle(karisik, k)
  assert.ok(r.metin.includes('≥500 mL'), r.metin)
  assert.ok(r.metin.includes(DOZ_YER_TUTUCU), r.metin)
  assert.ok(r.dozlar.some((d) => /10\s*IU/i.test(d)), String(r.dozlar))
})

test('dose units the regex must catch', () => {
  const k = kaynakSayilari('')
  for (const s of ['1500 IU', '4 g yükleme magnezyum', '2 mU/dk oksitosin', '400 mcg folik asit', '1000ü/damla', '6 mg deksametazon', '20 ünite']) {
    assert.ok(uydurmaDozTemizle(s, k).dozlar.length === 1, s)
  }
})

test('receteDozsuz (was dahiliyeReceteDozsuz) unchanged', () => {
  const r = receteDozsuz([{ etkenMadde: 'metformin', ticariOrnek: 'Glifor 1000 mg', doz: '1000 mg', kullanim: '2x1', not: 'yemekle' }])
  assert.deepEqual(r[0], { etkenMadde: 'metformin', ticariOrnek: 'Glifor', not: 'yemekle · Doz hekim yazar' })
})

test('the FULL lock (dose-free receteOnerisi) is the prompt-locked chapters only — pediatri keeps its mg/kg reçete', () => {
  for (const b of ['dahiliye', 'kadin-dogum', 'kadin-hastaliklari-dogum', 'dermatoloji', 'Deri ve Zührevi Hastalıklar']) assert.ok(dozKilitliBrans(b), b)
  for (const b of ['pediatri', 'genel', 'kardiyoloji', null]) assert.ok(!dozKilitliBrans(b), String(b))
  assert.ok(dozKilitliBrans('genel', 'kadin-dogum'))
})

// CROSS-SPECIALTY-PARITY (2026-09-17) — dose invention was fixed where it was noticed (KD / derm). The ~26 branches with no
// specialties/<slug>/ folder ran the same shared SOAP + chat path with no backstop at all. They get it now.
const KARDIYO_TRANSKRIPT = 'Altmış iki yaşında erkek, efor dispnesi. EF %45 ölçüldü. Metoprolol başlayalım, ramipril ekleyelim. Tansiyon 150/95.'

test('baseline branch (kardiyoloji): an invented dose is removed and flagged, exactly like a chapter branch', () => {
  const r = soapDozUydurmaKilidi({ soap: { plan: 'Metoprolol süksinat 50 mg 1x1, ramipril 5 mg 1x1 başlandı.' } }, KARDIYO_TRANSKRIPT)
  const plan = r.soap!.plan as string
  assert.ok(!/50 mg|5 mg/.test(plan), plan)
  assert.equal(plan, `Metoprolol süksinat ${DOZ_YER_TUTUCU} 1x1, ramipril ${DOZ_YER_TUTUCU} 1x1 başlandı.`)
  assert.match(r.aiDegerlendirme!, /⚠ Doz kontrolü \(hekim onayı\)/)
  assert.ok(plan.includes('1x1'), 'kullanım sıklığı is not a dose token')
})

test('baseline branch keeps its receteOnerisi doses (pediatrik mg/kg is by design, NOTYA-SOAP-02 §3)', () => {
  const girdi = { receteOnerisi: [{ etkenMadde: 'amoksisilin', ticariOrnek: 'Largopen 400 mg', doz: '50 mg/kg/gün', kullanim: '2x1' }] }
  const baseline = soapDozUydurmaKilidi(structuredClone(girdi), 'Yedi yaşında, otit. Kilo 24.')
  assert.equal(baseline.receteOnerisi![0].doz, '50 mg/kg/gün')
  assert.equal(baseline.receteOnerisi![0].kullanim, '2x1')
  // the same note through the chapter lock loses them
  const kilitli = soapDozKilidi(structuredClone(girdi), 'Yedi yaşında, otit. Kilo 24.')
  assert.equal(kilitli.receteOnerisi![0].doz, undefined)
})

test('a dose the baseline-branch hekim dictated is kept, and a clean note is untouched', () => {
  const tr = 'Metoprolol 50 mg başlayalım.'
  const r = soapDozUydurmaKilidi({ soap: { plan: 'Metoprolol 50 mg 1x1.' } }, tr)
  assert.equal(r.soap!.plan, 'Metoprolol 50 mg 1x1.')
  assert.equal(r.aiDegerlendirme, undefined)
})

test('both call paths are wired for every branch, not only dozKilitliBrans', () => {
  const kok = path.join(import.meta.dirname, '..', '..')
  const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
  // SOAP: the ternary has no bare `: veri` escape hatch left
  assert.ok(oku('lib/doktor/soapUret.ts').includes('? soapDozKilidi(veri, girdi.transcript, girdi.klinikBaglam) : soapDozUydurmaKilidi(veri, girdi.transcript, girdi.klinikBaglam)'))
  // chat: the cleaner runs before the chapter-only branch, so no `if (dozKilitliBrans(...))` gates it
  const chat = oku('lib/asistan/ayseCevapla.ts') // NOTYA-TEK-BEYIN: the chat route's pipeline lives here
  assert.ok(chat.indexOf('const dozTemiz = uydurmaDozTemizle(') < chat.indexOf('if (dozKilitliBrans(hekimBransi, specialty))'))
  assert.ok(chat.includes('aiData.speech = dozTemiz.metin'))
})
