/**
 * HASTA-MODULLERI — the per-patient module resolver with clinical cases, and everything downstream that must follow it
 * (quick-add tiles, Ölçüm ring goal, trends, Eğilim Bekçisi, badges / karne, Kontrol Öncesi Özet, the doctor's Ev verisi
 * tiles). Synthetic data only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hastaModulleri, hastaTercihiDegistir, hastaTercihiTemizle, icdKategori, taniKategorisi, type KlinikGirdi } from './moduller'
import { TIBBI_BRANS_AYARLARI, OZEL_BRANS_AYARLARI, bransGunlukAyari } from './bransAyari'
import { gunlukOzeti, kontrolOncesiOzet, type HamGunluk } from './ozet'
import { gunlukDemoHam, demoDurumuUygula, evVerisiDemoGirdisi, DEMO_ILAC_SINIFLARI } from './demo'
import { evVerisiHesapla } from './evVerisi'
import { olcumKurallari } from './kurallar'
import { etkinEsikler } from './hedefler'
import { ilacGirdileri } from './ilacSinifi'
import { gunHalkalari } from './bugunGorunum'
import type { EvOlcum } from './tipler'

const SIMDI = '2026-11-24T10:20:00.000Z' // 13:20 Türkiye, a Tuesday
const dahiliye = { bransAnahtar: 'dahiliye', ayar: TIBBI_BRANS_AYARLARI.dahiliye }
const ilac = (ad: string) => ilacGirdileri([ad])[0]
const klinik = (k: Partial<KlinikGirdi>): KlinikGirdi => ({ tanilar: [], icdKodlari: [], ilaclar: [], ...k })

describe('HASTA-MODULLERI: tanı / ICD / ilaç okuma', () => {
  it('ICD-10 codes in any spelling → category; chronic-list names and synonyms → category; whole words only', () => {
    assert.equal(icdKategori('I10'), 'I10'); assert.equal(icdKategori('e11.9'), 'E11'); assert.equal(icdKategori('I10.0 – Esansiyel HT'), 'I10'); assert.equal(icdKategori('Tip 2'), null)
    assert.equal(taniKategorisi('Hipertansiyon'), 'I10'); assert.equal(taniKategorisi('yüksek tansiyon'), 'I10'); assert.equal(taniKategorisi('HT'), 'I10')
    assert.equal(taniKategorisi('Diyabet'), 'E11'); assert.equal(taniKategorisi('Tip 1 diyabet'), 'E10'); assert.equal(taniKategorisi('tip 2 diyabet'), 'E11')
    assert.equal(taniKategorisi('Prediyabet / insülin direnci'), 'R73', 'prediabetes is not diabetes')
    assert.equal(taniKategorisi('diyabetik ayak bakımı'), null, 'a word that only starts with the name is not the diagnosis')
    assert.equal(taniKategorisi('Kalp yetmezliği'), 'I50'); assert.equal(taniKategorisi('KOAH'), 'J44'); assert.equal(taniKategorisi('serbest metin xyz'), null)
  })
  it('drug lines resolve to class labels through the assistant drug table (server bridge)', () => {
    assert.ok(ilac('Amlodipin 5 mg').siniflar.includes('Dihidropiridin'))
    assert.ok(ilac('Lantus').siniflar.includes('İnsülin'))
    assert.ok(ilac('Atorvastatin 20 mg').siniflar.includes('Statin'))
    assert.deepEqual(ilac('bilinmeyen krem').siniflar, [])
  })
  it('the browser demo carries the same class labels the server resolves for its drugs', () => {
    for (const [ad, g] of Object.entries(DEMO_ILAC_SINIFLARI)) { const s = ilac(ad); assert.equal(s.anahtar, g.anahtar, ad); assert.deepEqual([...s.siniflar], [...g.siniflar], ad) }
  })
})

describe('HASTA-MODULLERI: clinical cases', () => {
  it('hypertension only → BP; no glucose module, no glucose goal, no LDL card, no branş default', () => {
    const m = hastaModulleri({ ...dahiliye, hekim: null, klinik: klinik({ tanilar: ['Hipertansiyon'], ilaclar: [ilac('Ramipril'), ilac('Amlodipin')] }) })
    assert.deepEqual(m.olcumler, ['kb'])
    assert.equal(m.gunlukHedef.glukoz, undefined); assert.equal(m.gunlukHedef.kb, 2)
    assert.ok(!m.kartlar.includes('ldl'))
    assert.equal(m.aktif[0].kaynak, 'tani'); assert.equal(m.aktif[0].neden, 'Hipertansiyon', 'a diagnosis is the better reason than the drug')
    assert.equal(m.secenekler.find((x) => x.anahtar === 'glukoz')!.acik, false)
  })
  it('HT + DM2 → BP and glucose, each with its goal', () => {
    const m = hastaModulleri({ ...dahiliye, hekim: null, klinik: klinik({ tanilar: ['Diyabet'], icdKodlari: ['I10'] }) })
    assert.deepEqual(m.olcumler, ['kb', 'glukoz'])
    assert.deepEqual(m.gunlukHedef, { kb: 2, glukoz: 2 })
  })
  it('statin only → the LDL card, nothing else', () => {
    const m = hastaModulleri({ ...dahiliye, hekim: null, klinik: klinik({ ilaclar: [ilac('Atorvastatin 20 mg')] }) })
    assert.deepEqual(m.kartlar, ['ldl']); assert.deepEqual(m.olcumler, [])
    assert.equal(m.aktif[0].kaynak, 'ilac')
  })
  it('drug-only inference is conservative: insulin → glucose; metformin + PCOS → no glucose; SGLT2 alone → nothing; beta blocker alone → nothing', () => {
    const cikan = (k: KlinikGirdi) => hastaModulleri({ ...dahiliye, hekim: null, klinik: k }).aktif.filter((x) => x.kaynak === 'tani' || x.kaynak === 'ilac').map((x) => x.anahtar)
    assert.deepEqual(cikan(klinik({ ilaclar: [ilac('Lantus')] })), ['glukoz'])
    assert.deepEqual(cikan(klinik({ ilaclar: [ilac('Metformin')] })), ['glukoz'])
    assert.deepEqual(cikan(klinik({ tanilar: ['Polikistik over sendromu'], ilaclar: [ilac('Metformin')] })), [], 'PCOS explains metformin')
    assert.deepEqual(cikan(klinik({ ilaclar: [ilac('Empagliflozin')] })), [], 'SGLT2 has heart / kidney indications — not a diabetes signal on its own')
    assert.deepEqual(cikan(klinik({ ilaclar: [ilac('Concor')] })), [], 'beta blocker: migraine / rhythm too')
  })
  it('heart failure / CKD → weight with doctor notify; COPD → SpO₂ only where the branş follows SpO₂', () => {
    const kard = hastaModulleri({ bransAnahtar: 'kardiyoloji', ayar: TIBBI_BRANS_AYARLARI.kardiyoloji, hekim: null, klinik: klinik({ tanilar: ['Kalp yetmezliği'] }) })
    assert.deepEqual(kard.olcumler, ['kilo']); assert.equal(kard.kiloHekimeBildir, true); assert.ok(kard.kartlar.includes('kilo_egilim'))
    const dah = hastaModulleri({ ...dahiliye, hekim: null, klinik: klinik({ tanilar: ['Kronik böbrek hastalığı'] }) })
    assert.equal(dah.kiloHekimeBildir, true)
    assert.deepEqual(hastaModulleri({ bransAnahtar: 'gogus-hastaliklari', ayar: TIBBI_BRANS_AYARLARI['gogus-hastaliklari'], hekim: null, klinik: klinik({ tanilar: ['KOAH'] }) }).olcumler, ['spo2'])
    assert.ok(!hastaModulleri({ ...dahiliye, hekim: null, klinik: klinik({ tanilar: ['Astım'] }) }).olcumler.includes('spo2'), 'dahiliye does not follow SpO₂ → branş default instead')
  })
  it('a branş that does not follow a measurement never gets it from the file (derm patient with HT on file: no BP tile)', () => {
    const m = hastaModulleri({ bransAnahtar: 'dermatoloji', ayar: TIBBI_BRANS_AYARLARI.dermatoloji, hekim: null, klinik: klinik({ tanilar: ['Hipertansiyon', 'Diyabet'], ilaclar: [ilac('Atorvastatin')] }) })
    assert.deepEqual(m.olcumler, []); assert.deepEqual(m.kartlar, [])
  })
  it('nothing on file → the branş default exactly as before', () => {
    const m = hastaModulleri({ ...dahiliye, hekim: null, klinik: null })
    assert.deepEqual(m.olcumler, ['kb', 'glukoz', 'kilo', 'nabiz']); assert.deepEqual(m.kartlar, ['ldl', 'kilo_egilim'])
    assert.ok(m.aktif.every((x) => x.kaynak === 'brans'))
  })
  it('the doctor\'s OFF overrides the diagnosis; his ON adds a module; "otomatik" (no switch) goes back to the file', () => {
    const k = klinik({ tanilar: ['Hipertansiyon', 'Diyabet'] })
    const off = hastaModulleri({ ...dahiliye, hekim: { moduller: { kapali: ['glukoz'] } }, klinik: k })
    assert.deepEqual(off.olcumler, ['kb'])
    const g = off.secenekler.find((x) => x.anahtar === 'glukoz')!
    assert.deepEqual([g.acik, g.hekimSecimi, g.kaynak], [false, 'kapali', 'tani'])
    const on = hastaModulleri({ ...dahiliye, hekim: { moduller: { acik: ['nabiz'] } }, klinik: klinik({ tanilar: ['Hipertansiyon'] }) })
    assert.deepEqual(on.olcumler, ['kb', 'nabiz']); assert.equal(on.aktif.find((x) => x.anahtar === 'nabiz')!.kaynak, 'hekim')
    assert.deepEqual(hastaModulleri({ ...dahiliye, hekim: { moduller: { acik: [], kapali: [] } }, klinik: k }).olcumler, ['kb', 'glukoz'])
    // the doctor can turn OFF a branş default too, and can switch ON something nothing else would
    assert.deepEqual(hastaModulleri({ ...dahiliye, hekim: { moduller: { kapali: ['glukoz'] } }, klinik: null }).olcumler, ['kb', 'kilo', 'nabiz'])
  })
  it('the patient can add optional modules and remove branş-only ones, but never a doctor-enabled or diagnosis / drug module', () => {
    const k = klinik({ tanilar: ['Hipertansiyon'], ilaclar: [ilac('Lantus')] })
    const h = hastaModulleri({ ...dahiliye, hekim: { moduller: { acik: ['nabiz'] } }, klinik: k, hasta: { eklenen: ['su', 'kilo'], cikarilan: ['kb', 'glukoz', 'nabiz'] } })
    assert.deepEqual(h.olcumler, ['kb', 'glukoz', 'kilo', 'nabiz', 'su'])
    assert.equal(h.gunlukHedef.su, 0, 'a patient-added module is never part of a daily goal'); assert.equal(h.gunlukHedef.kilo, 0)
    assert.ok(h.aktif.filter((x) => ['kb', 'glukoz', 'nabiz'].includes(x.anahtar)).every((x) => !x.hastaKapatabilir))
    // branş default: the patient may switch one off, and back on
    const b = hastaModulleri({ ...dahiliye, hekim: null, klinik: null, hasta: { eklenen: [], cikarilan: ['nabiz'] } })
    assert.deepEqual(b.olcumler, ['kb', 'glukoz', 'kilo']); assert.deepEqual(b.hastaKapatti, ['nabiz'])
    // the patient cannot add a clinical module (glucose) on their own
    assert.deepEqual(hastaTercihiTemizle({ eklenen: ['glukoz', 'su'], cikarilan: ['xx'] }), { eklenen: ['su'], cikarilan: [] })
    assert.deepEqual(hastaTercihiDegistir({ eklenen: [], cikarilan: [] }, 'glukoz', true), { eklenen: [], cikarilan: [] })
    assert.equal(hastaTercihiDegistir({ eklenen: [], cikarilan: [] }, 'bilinmez', true), null)
  })
  it('patient additions never switch the branş default off', () => {
    assert.deepEqual(hastaModulleri({ ...dahiliye, hekim: null, klinik: null, hasta: { eklenen: ['su'], cikarilan: [] } }).olcumler, ['kb', 'glukoz', 'kilo', 'nabiz', 'su'])
  })
  it('brans-alan-sizmasi: the pediatric fever-medicine card never leaks — not by inference, not by a switch', () => {
    const tum = { ...TIBBI_BRANS_AYARLARI, ...OZEL_BRANS_AYARLARI }
    for (const [b, ayar] of Object.entries(tum)) {
      const m = hastaModulleri({ bransAnahtar: b, ayar, hekim: { moduller: { acik: ['ates'] } }, klinik: klinik({ tanilar: ['Hipertansiyon', 'Diyabet', 'Astım', 'Kalp yetmezliği'], ilaclar: [ilac('Atorvastatin')] }), hasta: { eklenen: ['su'], cikarilan: [] } })
      assert.equal(m.kartlar.includes('ates_ilac'), b === 'pediatri' || b === 'cocuk-cerrahisi', b)
    }
    assert.ok(hastaModulleri({ bransAnahtar: 'pediatri', ayar: TIBBI_BRANS_AYARLARI.pediatri, hekim: null, klinik: klinik({ tanilar: ['Astım'] }) }).kartlar.includes('ates_ilac'))
  })
  it('every one of the 40 branşlar resolves (core: nobody is left out)', () => {
    for (const [b, ayar] of Object.entries({ ...TIBBI_BRANS_AYARLARI, ...OZEL_BRANS_AYARLARI })) {
      const m = hastaModulleri({ bransAnahtar: b, ayar, hekim: null, klinik: null })
      assert.deepEqual(m.olcumler, ayar.olcumler, b)
    }
  })
})

describe('HASTA-MODULLERI: everything downstream follows the resolved set', () => {
  const htHam = (): HamGunluk => gunlukDemoHam(SIMDI, 'dahiliye', 'ht')
  it('HT-only Bugün: no glucose tile, no glucose in the Ölçüm ring goal, no glucose trend, no glucose badge, no LDL', () => {
    const h = htHam()
    // even a glucose reading the patient entered anyway is stored but not prompted / trended / graded
    const fazla: EvOlcum = { id: 'x1', tip: 'glukoz', deger: 140, deger2: null, baglam: 'tokluk2', olcumAt: '2026-11-24T08:00:00.000Z', kaynak: 'portal' }
    const d = gunlukOzeti({ ...h, olcumler: [...h.olcumler, fazla] })
    assert.deepEqual(d.olcumKartlari.map((k) => k.tip), ['kb', 'kilo'])
    assert.equal(d.halkalar.olcum.toplam, 2, 'ring goal = BP 2/day only (kilo is the patient\'s own, no goal)')
    assert.ok(gunHalkalari(d).every((r) => r.toplam > 0))
    assert.ok(!d.egilimler.some((e) => e.anahtar.startsWith('glukoz')))
    assert.ok(!d.rozetler.some((r) => r.id === 'seker-ustasi'))
    assert.equal(d.ldl, null); assert.ok(!d.kartlar.includes('ldl'))
    assert.ok(!d.karne.hafta.dersler.some((x) => /şeker/i.test(x.ayrinti)))
    assert.ok(d.sonOlcumler.some((o) => o.id === 'x1'), 'the reading itself is kept in the Günlük list')
    assert.ok(!JSON.stringify(d).includes('Hipertansiyon'), 'no diagnosis name reaches the patient')
    assert.deepEqual(d.moduller.aktif.map((x) => [x.anahtar, x.hekimTakip]), [['kb', true], ['kilo', false]])
  })
  it('DM2 + HT demo (dahiliye default): BP + glucose (+ patient\'s own weight) and the LDL card', () => {
    const d = gunlukOzeti(gunlukDemoHam(SIMDI))
    assert.deepEqual(d.olcumKartlari.map((k) => k.tip), ['kb', 'glukoz', 'kilo'])
    assert.equal(d.halkalar.olcum.toplam, 4)
    assert.ok(d.egilimler.some((e) => e.anahtar === 'glukoz:tokluk2'))
    assert.deepEqual(d.ldl && [d.ldl.deger, d.ldl.hedef], [92, 70])
    assert.deepEqual(demoDurumuUygula(gunlukDemoHam(SIMDI), 'ht').klinik?.tanilar, ['Hipertansiyon'])
  })
  it('Eğilim Bekçisi: no glucose rules for a non-glucose patient, but an urgent value is still caught', () => {
    const esik = etkinEsikler('genel', null)
    const b = { yasAy: null, kiloHekimeBildir: false }
    const dusuk: EvOlcum = { id: 'g', tip: 'glukoz', deger: 64, deger2: null, baglam: 'aclik', olcumAt: SIMDI, kaynak: 'portal' }
    assert.deepEqual(olcumKurallari(dusuk, [dusuk], esik, SIMDI, b, false), [], 'dikkat level dropped when glucose is not followed')
    assert.equal(olcumKurallari(dusuk, [dusuk], esik, SIMDI, b, true)[0]?.duzey, 'dikkat')
    const cokDusuk: EvOlcum = { ...dusuk, deger: 48 }
    assert.deepEqual(olcumKurallari(cokDusuk, [cokDusuk], esik, SIMDI, b, false).map((r) => r.duzey), ['acil'])
  })
  it('doctor card: HT-only tiles carry no glucose; the Modüller rows say why; readings outside the modules are one line', () => {
    const g = evVerisiDemoGirdisi(SIMDI, 'dahiliye', 'ht')
    const fazla: EvOlcum = { id: 'x1', tip: 'glukoz', deger: 140, deger2: null, baglam: 'tokluk2', olcumAt: '2026-11-23T08:00:00.000Z', kaynak: 'portal' }
    const k = evVerisiHesapla({ ...g, olcumler: [...g.olcumler, fazla] })
    assert.ok(!k.metrikler.some((m) => m.anahtar.startsWith('glukoz')))
    assert.deepEqual(k.olcumTipleri, ['kb', 'kilo'])
    assert.deepEqual(k.takipDisi, [{ tip: 'glukoz', ad: 'Kan şekeri', n: 1 }])
    const kb = k.moduller.find((m) => m.anahtar === 'kb')!
    assert.deepEqual([kb.acik, kb.kaynak, kb.neden], [true, 'tani', 'Hipertansiyon'])
    assert.equal(k.moduller.find((m) => m.anahtar === 'glukoz')!.acik, false)
    const ozet = kontrolOncesiOzet({ olcumler: [...g.olcumler, fazla], planlar: g.planlar, kayitlar: g.kayitlar, uyarilar: [], sorular: [], esikler: etkinEsikler('genel', null), simdi: SIMDI, randevuAt: null, takipTipleri: k.olcumTipleri })
    assert.ok(!ozet.metrikler.some((m) => m.anahtar.startsWith('glukoz')))
    assert.match(ozet.metin, /Takip dışı girilen ölçümler: Kan şekeri \(n=1\)/)
  })
  it('free-text specialties still resolve through bransAyari (Özel Branş slug, label)', () => {
    const b = bransGunlukAyari('İç Hastalıkları')
    assert.deepEqual(hastaModulleri({ bransAnahtar: b.anahtar, ayar: b.ayar, hekim: null, klinik: klinik({ tanilar: ['Hipertansiyon'] }) }).olcumler, ['kb'])
  })
})
