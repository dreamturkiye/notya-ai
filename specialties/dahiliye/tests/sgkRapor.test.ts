import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sgkRaporTaslagi, chaVascSkoru, doakInrKosulu } from '../engines/sgkRapor'

const hasta = { adSoyad: 'QA Test', yas: 72, kadin: true }
const bugun = '2026-09-16'

test('HT şablonu: etken madde yalnız hasta_ilaclar; T.C. yok; iki yüksek ofis KB → kontrol tamam', () => {
  const r = sgkRaporTaslagi({ sablon: 'ht', hasta, bugun, ilaclar: [{ ad: 'Delix 5', etken: 'Ramipril', aktif: true }, { ad: 'Glifor', etken: 'Metformin', aktif: true }, { ad: 'Norvasc', etken: 'Amlodipin', aktif: false }], labs: { Kre: [{ ad: 'Kre', deger: 0.9, tarih: '2026-09-01' }] }, kbSerisi: [{ sbp: 150, dbp: 92, tarih: '2026-09-16' }, { sbp: 146, dbp: 88, tarih: '2026-08-20' }], htEvreHekim: 'ht_evre1' })
  assert.deepEqual(r.draft.etkenMaddeler, ['Ramipril'])
  assert.equal(r.draft.tcSon4, ''); assert.equal(r.draft.tani.icd10, 'I10'); assert.equal(r.draft.onerilen_sure_ay, 12)
  assert.equal(r.sutKontrol[0].tamam, true); assert.equal(r.eksikler.length, 0)
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
