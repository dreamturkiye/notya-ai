import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sgkRaporTaslagi, chaVascSkoru, doakInrKosulu, lipidIkiOlcum, raporSureTavani } from '../engines/sgkRapor'

const hasta = { adSoyad: 'QA Test', yas: 72, kadin: true }
const bugun = '2026-09-16'

test('HT şablonu: etken madde yalnız hasta_ilaclar; T.C. yok; ofis KB ölçümleri taslakta kanıt olarak durur', () => {
  const r = sgkRaporTaslagi({ sablon: 'ht', hasta, bugun, ilaclar: [{ ad: 'Delix 5', etken: 'Ramipril', aktif: true }, { ad: 'Glifor', etken: 'Metformin', aktif: true }, { ad: 'Norvasc', etken: 'Amlodipin', aktif: false }], labs: { Kre: [{ ad: 'Kre', deger: 0.9, tarih: '2026-09-01' }] }, kbSerisi: [{ sbp: 150, dbp: 92, tarih: '2026-09-16' }, { sbp: 146, dbp: 88, tarih: '2026-08-20' }], htEvreHekim: 'ht_evre1' })
  assert.deepEqual(r.draft.etkenMaddeler, ['Ramipril'])
  assert.equal(r.draft.tcSon4, ''); assert.equal(r.draft.tani.icd10, 'I10'); assert.equal(r.draft.onerilen_sure_ay, 12)
  assert.equal(r.eksikler.length, 0)
  assert.match(String(r.draft.mevcutDurum), /Ofis KB ölçümleri: 150\/92/)
  assert.ok(r.dipnotlar.some((d) => d.ref === 'SGK'))
})

test('DM şablonu: HbA1c yoksa eksik; süre 24 ay ile sınırlı; reçete yoksa etken eksik', () => {
  const r = sgkRaporTaslagi({ sablon: 'dm', hasta, bugun, ilaclar: [], labs: {}, dmTip: 'T2', sureAy: 60 })
  assert.equal(r.draft.onerilen_sure_ay, 24); assert.equal(r.draft.tani.icd10, 'E11.9')
  assert.ok(r.eksikler.some((e) => /HbA1c/.test(e))); assert.ok(r.eksikler.some((e) => /Etken madde/.test(e)))
})

test('Statin: KVR kilidi yoksa eksik; eski lipid → kontrol false', () => {
  const r = sgkRaporTaslagi({ sablon: 'statin', hasta, bugun, ilaclar: [{ ad: 'Lipitor 20', etken: 'Atorvastatin', aktif: true }], labs: { LDL: [{ ad: 'LDL', deger: 168, tarih: '2025-12-01' }] } })
  assert.ok(r.eksikler.some((e) => /KVR/.test(e))); assert.equal(r.sutKontrol[0].tamam, false)
})

test('DOAK: CHA2DS2-VASc toplamı; mekanik kapak + DOAK engeli', () => {
  assert.equal(chaVascSkoru({ kky: false, ht: true, dm: true, inmeTia: false, vaskuler: false }, 72, true), 4)
  assert.equal(chaVascSkoru({ kky: true, ht: true, dm: true, inmeTia: true, vaskuler: true }, 80, true), 9)
  const r = sgkRaporTaslagi({ sablon: 'doak', hasta, bugun, ilaclar: [{ ad: 'Eliquis', etken: 'Apiksaban', aktif: true }], labs: {}, doakEndikasyon: 'af', mekanikKapak: true, chaVasc: { kky: false, ht: true, dm: false, inmeTia: false, vaskuler: false } })
  assert.equal(r.draft.tani.icd10, 'I48'); assert.equal(r.chaVascSkor, 3)
  assert.ok(r.eksikler.some((e) => /MEKANİK KAPAK/.test(e))); assert.ok(r.eksikler.some((e) => /kreatinin/.test(e)))
  assert.ok(!/mg\b/.test(JSON.stringify(r.draft)))
})

/**
 * NOTYA-SUT-RAPOR-01 — DOAK report checklist against SUT 4.2.15.D-1 and 4.2.15.D-2.
 * Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 */
const inrSatiri = (deger: number, tarih: string) => ({ ad: 'INR', deger, tarih })
const doakGirdi = (inr: ReturnType<typeof inrSatiri>[]) => ({ sablon: 'doak' as const, hasta, bugun, ilaclar: [{ ad: 'Eliquis', etken: 'Apiksaban', aktif: true }], labs: { INR: inr, Kre: [{ ad: 'Kre', deger: 0.9, tarih: '2026-09-01' }] }, doakEndikasyon: 'af' as const, chaVasc: { kky: false, ht: true, dm: false, inmeTia: false, vaskuler: false } })
const varfarinMaddesi = (r: ReturnType<typeof sgkRaporTaslagi>) => r.sutKontrol.find((k) => /son 5 INR/.test(k.madde))!

test('SUT 4.2.15.D: tek INR kaydı varfarin koşulunu tamamlamaz (önceki davranış: tek kayıt → tamam)', () => {
  const r = sgkRaporTaslagi(doakGirdi([inrSatiri(3.8, '2026-09-10')]))
  assert.equal(varfarinMaddesi(r).tamam, null)
  assert.match(varfarinMaddesi(r).madde, /en az 2 ay varfarin/)
  assert.match(varfarinMaddesi(r).madde, /en az 3’ü 2–3 dışında/)
})

test('SUT 4.2.15.D: en az birer hafta arayla son 5 INR ölçümünün en az 3’ü 2–3 dışındaysa madde tamam', () => {
  const haftalik = [inrSatiri(3.6, '2026-09-10'), inrSatiri(2.4, '2026-09-03'), inrSatiri(1.6, '2026-08-27'), inrSatiri(3.4, '2026-08-20'), inrSatiri(2.8, '2026-08-13')]
  assert.equal(doakInrKosulu(haftalik), true)
  assert.equal(varfarinMaddesi(sgkRaporTaslagi(doakGirdi(haftalik))).tamam, true)
})

test('SUT 4.2.15.D: 5 ölçümün yalnız 2’si hedef dışıysa veya ölçümler bir haftadan sıksa madde tamamlanmaz', () => {
  const hedefte = [inrSatiri(3.6, '2026-09-10'), inrSatiri(2.4, '2026-09-03'), inrSatiri(1.6, '2026-08-27'), inrSatiri(2.5, '2026-08-20'), inrSatiri(2.8, '2026-08-13')]
  const sik = [inrSatiri(3.6, '2026-09-10'), inrSatiri(3.4, '2026-09-08'), inrSatiri(1.6, '2026-09-06'), inrSatiri(3.4, '2026-09-04'), inrSatiri(1.8, '2026-09-02')]
  assert.equal(doakInrKosulu(hedefte), false)
  assert.equal(doakInrKosulu(sik), false)
  assert.equal(doakInrKosulu(sik.slice(0, 4)), false)
  assert.equal(varfarinMaddesi(sgkRaporTaslagi(doakGirdi(hedefte))).tamam, null)
})

test('SUT 4.2.15.D-1(2) / D-2(3): DOAK taslağı ilk iki dönem için sağlık kurulu raporu gerektiğini söyler; risk maddesi skor eşiği demez', () => {
  const r = sgkRaporTaslagi(doakGirdi([]))
  assert.ok(r.sutKontrol.some((k) => /ilk iki rapor dönemi \(toplam 24 ay\) 1 yıl süreli sağlık kurulu raporu/.test(k.madde) && k.tamam === null))
  assert.ok(r.sutKontrol.some((k) => /SUT 4\.2\.15\.D-1/.test(k.madde) && /hipertansiyondan en az biri/.test(k.madde)))
  assert.ok(!r.sutKontrol.some((k) => /risk skoru SUT eşiğini/.test(k.madde)))
  const dvt = sgkRaporTaslagi({ ...doakGirdi([]), doakEndikasyon: 'dvt' })
  assert.ok(dvt.sutKontrol.some((k) => /sağlık kurulu raporu/.test(k.madde)))
})

/**
 * NOTYA-SUT-RAPOR-01 (2026-10-10, second set) — checklist lines that named a SUT condition the text does not have,
 * the lipid rule, and report lengths. Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 */
test('HT kontrol listesi: "iki vizitte doğrulanmış" SUT koşulu değildir — listede yok; SUT EK-4/F 51 maddesi var', () => {
  const kb = [{ sbp: 150, dbp: 92, tarih: '2026-09-01' }, { sbp: 148, dbp: 94, tarih: '2026-08-01' }]
  const r = sgkRaporTaslagi({ sablon: 'ht', hasta, bugun, ilaclar: [{ ad: 'Micardis', etken: 'Telmisartan', aktif: true }], labs: {}, kbSerisi: kb, htEvreHekim: 'Evre 1' })
  assert.ok(!r.sutKontrol.some((k) => /≥2 ayrı vizit|iki vizit/.test(k.madde)))
  const arb = r.sutKontrol.find((k) => /SUT EK-4\/F 51/.test(k.madde))!
  assert.match(arb.madde, /monoterapi ile kan basıncının yeterince kontrol altına alınamadığı raporda belirtildi/)
  assert.equal(arb.tamam, null, 'ölçüm sayısından otomatik işaretlenmez; hekim doğrular')
  // Kılavuz bilgisi dipnotta kalır, SUT maddesi diye gösterilmez.
  assert.ok(r.dipnotlar.some((d) => d.ref === 'HT_UZLASI2025'))
})

test('D vitamini / B12 kontrol listesi: metinde eşik yok — "<20 ng/mL" ve "<200 pg/mL" SUT maddesi olarak gösterilmez', () => {
  const v = sgkRaporTaslagi({ sablon: 'vitd', hasta, bugun, ilaclar: [{ ad: 'Devit-3', etken: 'kolekalsiferol', aktif: true }], labs: { VitD: [{ ad: 'VitD', deger: 8, tarih: '2026-09-10' }], Ca: [{ ad: 'Ca', deger: 9.4, tarih: '2026-09-10' }] } })
  assert.ok(!v.sutKontrol.some((k) => /<20 ng\/mL|<200 pg\/mL/.test(k.madde)))
  assert.ok(v.sutKontrol.some((k) => /SUT EK-4\/E 13\/31/.test(k.madde) && /yalnızca ruhsatlı endikasyonlarında ödenir/.test(k.madde) && /EK-4\/F 3/.test(k.madde) && k.tamam === null))
  assert.match(String(v.draft.mevcutDurum), /25-OH D: 8 ng\/mL \(2026-09-10\)/, 'lab sonucu taslakta kanıt olarak durur')
  const b = sgkRaporTaslagi({ sablon: 'b12', hasta, bugun, ilaclar: [], labs: { B12: [{ ad: 'B12', deger: 140, tarih: '2026-09-10' }] } })
  assert.ok(!b.sutKontrol.some((k) => /<200 pg\/mL|EK-4\/E 13\/31/.test(k.madde)))
  assert.ok(b.sutKontrol.every((k) => k.tamam === null), 'B12 için metinde kural yok: hiçbir madde lab değerinden işaretlenmez')
})

test('SUT 4.2.28.A-1(3): ilk lipid raporunda son 6 ay içinde en az bir hafta arayla İKİ ölçüm; tek ölçüm maddeyi tamamlamaz', () => {
  const ldl = (deger: number, tarih: string) => ({ ad: 'LDL', deger, tarih })
  assert.equal(lipidIkiOlcum([ldl(172, '2026-09-10'), ldl(168, '2026-09-01')], bugun), 'iki')
  assert.equal(lipidIkiOlcum([ldl(172, '2026-09-10')], bugun), 'tek')
  assert.equal(lipidIkiOlcum([ldl(172, '2026-09-10'), ldl(168, '2026-09-06')], bugun), 'tek', 'dört gün arayla iki ölçüm bir hafta koşulunu sağlamaz')
  assert.equal(lipidIkiOlcum([ldl(172, '2026-09-10'), ldl(168, '2026-02-01')], bugun), 'tek', 'ikinci ölçüm 6 aydan eski')
  assert.equal(lipidIkiOlcum([ldl(168, '2025-12-01')], bugun), 'yok')
  const girdi = (labs: ReturnType<typeof ldl>[]) => sgkRaporTaslagi({ sablon: 'statin', hasta, bugun, ilaclar: [{ ad: 'Lipitor 20', etken: 'Atorvastatin', aktif: true }], labs: { LDL: labs }, kvrKategoriHekim: 'Yüksek' })
  const madde = (r: ReturnType<typeof sgkRaporTaslagi>) => r.sutKontrol.find((k) => /SUT 4\.2\.28\.A-1\(3\)/.test(k.madde))!
  assert.match(madde(girdi([])).madde, /en az bir hafta arayla yapılmış iki kan lipid düzeyi sonucu/)
  assert.equal(madde(girdi([ldl(172, '2026-09-10'), ldl(168, '2026-09-01')])).tamam, true)
  assert.equal(madde(girdi([ldl(172, '2026-09-10')])).tamam, null, 'önceki davranış: tek güncel ölçüm → tamam')
  assert.equal(madde(girdi([ldl(168, '2025-12-01')])).tamam, false)
})

test('rapor süresi: genel tavan 24 ay (SUT 4.1.3(5)); DOAK 12 ay (4.2.15.D-1(2), D-2(3)); evolokumab 6 ay (4.2.28.E(1)); glarjin+liksisenatid 12 ay (4.2.38(7))', () => {
  assert.deepEqual([raporSureTavani('ht', ['Ramipril']).ay, raporSureTavani('dm', ['Metformin']).ay, raporSureTavani('statin', ['Atorvastatin']).ay, raporSureTavani('doak', ['Warfarin']).ay], [24, 24, 24, 24])
  const doak = sgkRaporTaslagi({ ...doakGirdi([]), sureAy: 24 })
  assert.equal(doak.draft.onerilen_sure_ay, 12, 'önceki davranış: 24 ay kabul ediliyordu')
  assert.equal(doak.sureTavani, 12)
  assert.match(doak.draft.hekim_degerlendirmesi || '', /12 ay süreyle/)
  assert.ok(doak.dipnotlar.some((d) => /SUT 4\.2\.15\.D/.test(d.not) && /12 ay/.test(d.not)))
  // Katalogdaki (TİTCK) yazımlar da tanınır: "Dabigatran etexilate", "Rivoraksaban", "Edoksaban tosilat".
  for (const etken of ['Dabigatran etexilate', 'Rivaroksaban', 'Rivoraksaban', 'Apiksaban', 'Edoksaban tosilat']) {
    assert.equal(raporSureTavani('doak', [etken]).ay, 12, etken)
    assert.equal(sgkRaporTaslagi({ ...doakGirdi([]), ilaclar: [{ ad: 'X', etken, aktif: true }], sureAy: 24 }).draft.onerilen_sure_ay, 12, etken)
  }
  const varfarin = sgkRaporTaslagi({ ...doakGirdi([]), ilaclar: [{ ad: 'Coumadin', etken: 'Varfarin sodyum', aktif: true }], sureAy: 24 })
  assert.deepEqual(varfarin.draft.etkenMaddeler, ['Varfarin sodyum'])
  assert.equal(varfarin.draft.onerilen_sure_ay, 24, 'varfarin için metinde özel süre yok: genel tavan')
  const pcsk9 = sgkRaporTaslagi({ sablon: 'statin', hasta, bugun, ilaclar: [{ ad: 'Repatha', etken: 'Evolocumab', aktif: true }], labs: {}, sureAy: 12 })
  assert.equal(pcsk9.draft.onerilen_sure_ay, 6)
  assert.ok(pcsk9.sutKontrol.some((k) => /SUT 4\.2\.28\.E/.test(k.madde) && /6 ay süreli sağlık kurulu raporu/.test(k.madde)))
  const glarLiksi = sgkRaporTaslagi({ sablon: 'dm', hasta, bugun, ilaclar: [{ ad: 'Suliqua', etken: 'İnsülin glarjin/liksisenatid', aktif: true }], labs: {}, dmTip: 'T2', sureAy: 24 })
  assert.deepEqual(glarLiksi.draft.etkenMaddeler, ['İnsülin glarjin/liksisenatid'], 'katalogdaki büyük İ’li yazım tanınır')
  assert.equal(glarLiksi.draft.onerilen_sure_ay, 12)
  assert.equal(sgkRaporTaslagi({ sablon: 'dm', hasta, bugun, ilaclar: [{ ad: 'Lantus', etken: 'İnsülin glarjin', aktif: true }], labs: {}, dmTip: 'T2', sureAy: 24 }).draft.onerilen_sure_ay, 24, 'tek başına insülin glarjin: genel tavan')
  assert.ok(glarLiksi.sutKontrol.some((k) => /SUT 4\.2\.38\(7\)/.test(k.madde)))
  // Varsayılan süre de tavanı aşmaz.
  assert.equal(sgkRaporTaslagi({ sablon: 'statin', hasta, bugun, ilaclar: [{ ad: 'Repatha', etken: 'Evolocumab', aktif: true }], labs: {} }).draft.onerilen_sure_ay, 6)
})
