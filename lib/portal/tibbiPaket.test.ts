/**
 * BRANS-PAKETI Phase 2 — the medical branş packages on the shared registry. Pins: leak gate over all 40 branşlar with
 * every template accepted; package page paths exist; pediatri age windows + veli wording only under 18; KD pregnancy
 * modules follow the ACTIVE pregnancy record (week 28 gate for fetal movements); medicine / diagnosis-bound modules;
 * red flags (acil → 112); danger-sign marks in the payload carry no professional text; "what matters today" summary;
 * no dose in any template text; demos resolve through the live resolver.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  BRANS_PAKETLERI, DOZ_DESENI, PAKET_ADI, PAKET_YOLU, hastaPaketiCoz, kayitDegerlendir, modulBransaAitMi, paketBransi, paketModulu,
  type PaketBransi, type PaketGirdisi, type PaketModulTanimi, type SablonKaydi,
} from './bransPaketi'
import { bugunOzeti, hastaYukuKur } from './bransPaketiYuk'
import { tibbiDemoBundle, tibbiPaketDemosu } from './bransPaketiDemo'
import { SPECIALTIES } from '@/lib/doktor/specialties'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'

const KABUL = '2026-11-27T08:00:00Z'
const BUGUN = '2026-11-27'
const tum = Object.values(BRANS_PAKETLERI).flat() as PaketModulTanimi[]
const tumKabul = (): Record<string, SablonKaydi> => Object.fromEntries(tum.map((m) => [m.kod, { icerik: null, kabulAt: KABUL }]))
const g = (o: Partial<PaketGirdisi>): PaketGirdisi => ({ doktorBransi: 'pediatri', sablonlar: tumKabul(), hastaAyar: {}, tanilar: [], icdKodlari: [], ilaclar: [], hastaYasYil: 40, bugun: BUGUN, ...o })
const kodlar = (o: Partial<PaketGirdisi>) => hastaPaketiCoz(g(o)).moduller.map((m) => m.tanim.kod).sort()
const gunOnce = (n: number) => new Date(Date.parse(`${BUGUN}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10)
const TIBBI = SPECIALTIES.map((s) => s.key as PaketBransi)
const PAKETLI = [...KLINIK_YENI_SLUGS, ...TIBBI].filter((b) => BRANS_PAKETLERI[b]?.length)

describe('BRANS-PAKETI Phase 2 — registry and leak gate (all 40)', () => {
  it('the batch-(a) branşlar have real packages; codes unique; each module filed under its own branş', () => {
    for (const b of ['pediatri', 'kadin-hastaliklari-dogum', 'dermatoloji'] as PaketBransi[]) assert.ok((BRANS_PAKETLERI[b] || []).length >= 4, `${b}`)
    const k = tum.map((m) => m.kod)
    assert.equal(new Set(k).size, k.length)
    for (const b of PAKETLI) for (const m of BRANS_PAKETLERI[b]!) assert.equal(m.brans, b, m.kod)
  })

  it('every branş with a package resolves only its own modules, even with every template of every branş accepted', () => {
    for (const b of PAKETLI) {
      const c = hastaPaketiCoz(g({ doktorBransi: b, tanilar: ['Atopik dermatit', 'Kalp yetmezliği', 'Astım'], ilaclar: ['Zoretanin', 'Coumadin', 'Humira'], hastaYasYil: 40, gebelikSat: gunOnce(200) }))
      assert.equal(c.brans, b)
      for (const m of c.moduller) assert.equal(m.tanim.brans, b, `${m.tanim.kod} leaked into ${b}`)
      for (const o of PAKETLI) if (o !== b) for (const m of BRANS_PAKETLERI[o]!) assert.equal(modulBransaAitMi(m.kod, b), false, `${m.kod} → ${b}`)
    }
  })

  it('legacy / free-text specialty values resolve to the right package (KD "kadin-dogum", "Dermatoloji", "Çocuk Sağlığı ve Hastalıkları")', () => {
    assert.equal(paketBransi('kadin-dogum'), 'kadin-hastaliklari-dogum')
    assert.equal(paketBransi('Dermatoloji'), 'dermatoloji')
    assert.equal(paketBransi('Çocuk Sağlığı ve Hastalıkları'), 'pediatri')
    assert.equal(paketBransi('klinik-dermatoloji'), 'klinik-dermatoloji')
  })

  it('every package renders on an EXISTING portal page and has a name for the Bugün card', () => {
    for (const b of PAKETLI) {
      const yol = PAKET_YOLU[b]
      assert.ok(existsSync(join(process.cwd(), 'app/portal/hasta/[token]', yol, 'page.tsx')), `${b}: ${yol} has no page`)
      assert.ok(PAKET_ADI[b] && !/veli|çocuğ/i.test(PAKET_ADI[b]), `${b}: neutral package name`)
    }
  })

  it('no dose in any template text (timeline, list, note) of any branş', () => {
    for (const m of tum) for (const t of [m.varsayilan.not || '', ...(m.varsayilan.maddeler || []), ...(m.varsayilan.adimlar || []).flatMap((a) => [a.baslik, a.ayrinti])]) assert.doesNotMatch(t, DOZ_DESENI, `${m.kod}: ${t}`)
  })
})

describe('BRANS-PAKETI Phase 2 — pediatri (veli experience, age windows)', () => {
  it('an adult or unknown-age patient of a pediatri doctor gets no veli module', () => {
    assert.deepEqual(kodlar({ hastaYasYil: 19 }), [])
    assert.deepEqual(kodlar({ hastaYasYil: null }), [])
  })
  it('age windows: 1 month → newborn + 0–12 milestones; 18 months → 1–3 milestones + feeding; 4 years → 3–6 milestones', () => {
    const ay1 = kodlar({ hastaYasYil: 1 / 12 })
    assert.ok(ay1.includes('ped-yenidogan') && ay1.includes('ped-gelisim-0-1') && ay1.includes('ped-bebek-gunu'))
    const ay18 = kodlar({ hastaYasYil: 1.5 })
    assert.ok(ay18.includes('ped-gelisim-1-3') && ay18.includes('ped-bebek-gunu') && ay18.includes('ped-hasta-gun') && ay18.includes('ped-asi-sonrasi'))
    assert.ok(!ay18.includes('ped-yenidogan') && !ay18.includes('ped-gelisim-0-1') && !ay18.includes('ped-gelisim-3-6'))
    const y4 = kodlar({ hastaYasYil: 4 })
    assert.ok(y4.includes('ped-gelisim-3-6') && !y4.includes('ped-bebek-gunu'))
  })
  it('red flags: lethargy / breathing / non-blanching rash / seizure → acil (112); fluids + urine → hekime_bildir; fever under 3 months → acil', () => {
    const ic = paketModulu('ped-hasta-gun')!.varsayilan
    for (const a of ['halsiz', 'nefes', 'dokuntu', 'nobet']) { const b = kayitDegerlendir(ic, { [a]: true })[0]; assert.equal(b.duzey, 'acil', a); assert.match(b.bayrak.hasta, /112/) }
    assert.equal(kayitDegerlendir(ic, { sivi: true, idrar: true })[0].duzey, 'hekime_bildir')
    assert.equal(kayitDegerlendir(ic, { sivi: true }).length, 0)
    assert.equal(kayitDegerlendir(paketModulu('ped-yenidogan')!.varsayilan, { ates: true })[0].duzey, 'acil')
  })
  it('every pediatri module is veli-only (yas: cocuk)', () => {
    for (const m of BRANS_PAKETLERI.pediatri!) assert.equal(m.yas, 'cocuk', m.kod)
  })
})

describe('BRANS-PAKETI Phase 2 — kadın hastalıkları-doğum (pregnancy journey)', () => {
  const kd = (o: Partial<PaketGirdisi>) => kodlar({ doktorBransi: 'kadin-hastaliklari-dogum', ...o })
  it('no active pregnancy → no pregnancy modules; postpartum and menstrual calendar are doctor-switched (off by default)', () => {
    assert.deepEqual(kd({ gebelikSat: null }), [])
    assert.ok(kd({ hastaAyar: { 'kd-lohusa-gunluk': { acik: true, baslangic: null, ayar: {} } } }).includes('kd-lohusa-gunluk'))
  })
  it('week 20 → journey + symptoms (no fetal movements yet); week 30 → fetal movements on; start date = SAT on file', () => {
    const h20 = kd({ gebelikSat: gunOnce(140) })
    assert.deepEqual(h20, ['kd-gebelik-belirti', 'kd-gebelik-zaman'])
    assert.ok(kd({ gebelikSat: gunOnce(210) }).includes('kd-hareket'))
    const c = hastaPaketiCoz(g({ doktorBransi: 'kadin-hastaliklari-dogum', gebelikSat: gunOnce(210) }))
    assert.equal(c.moduller.find((m) => m.tanim.kod === 'kd-gebelik-zaman')?.baslangic, gunOnce(210))
    assert.equal(c.moduller.find((m) => m.tanim.kod === 'kd-gebelik-zaman')?.neden, 'gebelik')
  })
  it('the doctor’s off wins over the pregnancy record; the pregnancy record of the patient never opens modules for another branş', () => {
    assert.ok(!kd({ gebelikSat: gunOnce(210), hastaAyar: { 'kd-hareket': { acik: false, baslangic: null, ayar: {} } } }).includes('kd-hareket'))
    assert.ok(!kodlar({ doktorBransi: 'dermatoloji', gebelikSat: gunOnce(210) }).some((k) => k.startsWith('kd-')))
  })
  it('reduced fetal movements, bleeding, fluid, severe headache, preterm contractions → acil (112)', () => {
    assert.equal(kayitDegerlendir(paketModulu('kd-hareket')!.varsayilan, { azaldi: true })[0].duzey, 'acil')
    const ic = paketModulu('kd-gebelik-belirti')!.varsayilan
    for (const a of ['kanama', 'su', 'basagri', 'karin', 'kasilma']) { const b = kayitDegerlendir(ic, { [a]: true })[0]; assert.equal(b.duzey, 'acil', a); assert.match(b.bayrak.hasta, /112/) }
  })
  it('the "today" summary shows the pregnancy week and the next step', () => {
    const p = tibbiPaketDemosu('kadin-hastaliklari-dogum')!
    const o = bugunOzeti(p)
    assert.equal(o.ogeler[0].tur, 'zaman')
    assert.match(o.ogeler[0].ilerleme!.etiket, /^30\. hafta$/)
    assert.match(o.ogeler[0].metin, /Sırada: Büyüme kontrolü/)
  })
})

describe('BRANS-PAKETI Phase 2 — dermatoloji', () => {
  const d = (o: Partial<PaketGirdisi>) => kodlar({ doktorBransi: 'dermatoloji', ...o })
  it('default: skin diary + photo diary; isotretinoin / systemic monitoring follow the approved medicine list; care routine follows atopic dermatitis', () => {
    assert.deepEqual(d({}), ['dmt-foto', 'dmt-gunluk'])
    assert.ok(d({ ilaclar: ['Zoretanin 20 mg kapsül'] }).includes('dmt-izotretinoin'))
    assert.ok(d({ ilaclar: ['Humira kalem'] }).includes('dmt-sistemik'))
    assert.ok(d({ icdKodlari: ['L20.9'] }).includes('dmt-bakim'))
    assert.ok(d({ tanilar: ['Atopik dermatit'] }).includes('dmt-bakim'))
    assert.ok(!d({ ilaclar: ['Fucidin krem'] }).includes('dmt-izotretinoin'))
    assert.equal(paketModulu('dmt-foto')!.serbestEtiket, true)
  })
  it('skin peeling / blisters / mucosal sores and airway swelling → acil (112)', () => {
    const ic = paketModulu('dmt-gunluk')!.varsayilan
    assert.equal(kayitDegerlendir(ic, { soyulma: true })[0].duzey, 'acil')
    assert.equal(kayitDegerlendir(ic, { alerji: true })[0].duzey, 'acil')
    assert.equal(kayitDegerlendir(paketModulu('dmt-izotretinoin')!.varsayilan, { zarar: true })[0].duzey, 'acil')
  })
})

describe('BRANS-PAKETI Phase 2 — patient payload and demos', () => {
  it('danger-sign marks carry the level only (no professional text, no flag rules) and ordinary fields are unmarked', () => {
    const p = tibbiPaketDemosu('dermatoloji')!
    const m = p.moduller.find((x) => x.kod === 'dmt-gunluk')!
    assert.equal(m.icerik.alanlar!.find((a) => a.id === 'soyulma')!.isaret, 'acil')
    assert.equal(m.icerik.alanlar!.find((a) => a.id === 'kasinti')!.isaret, undefined)
    const json = JSON.stringify(p)
    assert.ok(!/"bayraklar"|"hekim":/.test(json))
    assert.ok(!json.includes('SJS'))
  })
  it('"today": diary done today is marked done; programme progress counts today’s ticks', () => {
    const o = bugunOzeti(tibbiPaketDemosu('dermatoloji')!, 5)
    const bakim = o.ogeler.find((x) => x.kod === 'dmt-bakim')!
    assert.deepEqual(bakim.ilerleme && [bakim.ilerleme.n, bakim.ilerleme.m], [2, 5])
    assert.equal(o.ogeler.find((x) => x.kod === 'dmt-gunluk')!.tamam, false)
  })
  it('a timeline without a start date says so instead of inventing a day', () => {
    const p = hastaYukuKur({ brans: 'kadin-hastaliklari-dogum', cozum: hastaPaketiCoz(g({ doktorBransi: 'kadin-hastaliklari-dogum', hastaAyar: { 'kd-lohusa-zaman': { acik: true, baslangic: null, ayar: {} } } })), sablonlar: {}, hastaAyar: {}, kayitlar: [], fotolar: [], paylasimOnayi: true, lab: [], ilaclar: [] }, BUGUN)
    assert.match(bugunOzeti(p).ogeler[0].metin, /Başlangıç tarihi/)
  })
  it('every branş with a package has a demo through the live resolver; the pediatri demo is a child (veli) with child imagery allowed, others adult', () => {
    for (const b of PAKETLI.filter((x) => (TIBBI as string[]).includes(x))) {
      const p = tibbiPaketDemosu(b)!
      assert.ok(p.moduller.length > 0, `${b} demo empty`)
      for (const m of p.moduller) assert.equal(paketModulu(m.kod)!.brans, b)
      assert.equal(tibbiDemoBundle(b).hasta.onSekizAlti, b === 'pediatri' || b === 'cocuk-cerrahisi')
    }
    assert.ok(tibbiPaketDemosu('pediatri')!.moduller.some((m) => m.kod === 'ped-gelisim-1-3'))
  })
})
