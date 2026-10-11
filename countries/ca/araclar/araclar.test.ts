/**
 * NOTYA-ULKE-UYGULA-CA — Canada: THE TOOLS OF THE SHARED SET, as the audit of 2026-10-10 decided them for this country
 * (docs/araclar-denetim/CA.md; ca-kararlar.json). The two tools of the country's own: ./yeniAraclar.test.ts.
 *
 *   1. WHICH TOOLS ARE ON. The four the owner ordered off stay off; the dose calculator is back on (his order later
 *      the same day), written the way this country writes a dose.
 *   2. WHO SEES WHICH TOOL: eleven tools of the set are shown to more roles; every other tool to the set's own roles.
 *   3. WHAT A NATIONAL SOURCE STATES for the shared tools that take a country's — each with its source, as opened on
 *      2026-10-10 — and what is deliberately NOT stated, because no national source states it or because it is
 *      provincial.
 *   4. LICENCE STATES: "free" only where the rights holder's own notice was read.
 */
import '../testing/caDerlemesi'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { type BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { girdiyiCoz } from '@/lib/ulke/araclar/girdi'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { aracCalistir, hesabinAraclari, paketinAraci, sayiMetni, type Yazici } from '@/lib/ulke/araclar/paket'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { sondakiSifirlariAt } from '@/lib/ulke/araclar/yazim'
import { EN_ROL_ARACLARI } from '../../_dil/en/araclar'
import { CA_ARAYUZ } from '../arayuz'
import { CA_GIRDI } from '../ayarlar'
import { CA_PAKETI } from '../index'
import { CA_ONAY_BEKLEYEN_ANAHTARLAR as KENDI } from './onayBekleyen'

const D = 'en-CA'
const KOK = resolve(__dirname, '../../..')
const A = CA_ARAYUZ.araclar as UlkeAraclari
const M = A.metinler[D]!
const ROLLER = CA_PAKETI.uygulama!.roller!
const O: BirimOrtami = { birimler: CA_PAKETI.uygulama!.birimler, lab: A.labBirimleri, sayi: CA_PAKETI.bicim }
const BUGUN = '2026-10-10'
// the way the screens write a number here: a point for decimals; an amount of a medicine with no zero after the last figure
const yazici: Yazici = { sayi: (deger, ondalik) => deger.toFixed(ondalik), tarih: (iso) => iso, birim: (kod) => A.birimler[kod]?.[D] ?? `?${kod}?`, doz: (deger, ondalik) => sondakiSifirlariAt(deger.toFixed(ondalik), '.') }
const acik = A.araclar.map((p) => p.anahtar)
const araci = (k: string) => A.araclar.find((p) => p.anahtar === k)!
/** The tools on a role's grid, by key, in the order shown. */
const izgara = (rol: string | null): string[] => { const x = hesabinAraclari(A, rol); return [...x.temel, ...x.rol].map((y) => y.tanim.anahtar) }
const calistir = (k: string, ham: Record<string, string | boolean>) => { const x = paketinAraci(A, k)!; return aracCalistir(x, girdiyiCoz(x.tanim.alanlar, ham, O), BUGUN, A) }
const yazili = (k: string, ham: Record<string, string | boolean>) => Object.fromEntries(calistir(k, ham).sayilar.map((s) => [s.anahtar, sayiMetni(s, M, yazici, O)]))
const metin = (k: string) => araci(k).metin

/** The four tools of the set that are off here, by the owner's order of 2026-10-10. */
const EMIRLE_KAPALI = ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi']

/** WHO SEES A TOOL OF THE SET HERE, where the audit's decision differs from the set: the set's role(s) first, then the roles the audit adds. */
const GORENLER: Readonly<Record<string, readonly string[]>> = {
  'doz-hesabi': ['paediatrics', 'family-medicine', 'emergency-medicine'],
  'antikoagulan-vadeleri': ['cardiovascular-surgery', 'vascular-surgery', 'family-medicine', 'internal-medicine', 'cardiology', 'hematology'],
  'kalp-damar-preop': ['cardiovascular-surgery', 'vascular-surgery'],
  'greft-yara-izlem': ['cardiovascular-surgery', 'vascular-surgery'],
  'odyometri-pta': ['otolaryngology', 'audiology'],
  pasi: ['dermatology', 'clinic-dermatology'],
  easi: ['dermatology', 'clinic-dermatology'],
  scorad: ['dermatology', 'clinic-dermatology'],
  'yama-okuma': ['dermatology', 'clinic-dermatology'],
  'plastik-yara-greft': ['plastic-surgery', 'aesthetic-surgery'],
  'postop-agri': ['anaesthesia', 'pain-medicine'],
}

describe('ca tools 1: which tools of the shared set are on', () => {
  it('every tool of the set but the four the owner ordered off, the patient\'s page and the follow-up list; beyond the set, the two of this country\'s own', () => {
    const setten = ['hasta-portali', ...EN_ROL_ARACLARI.map((a) => a.anahtar).filter((k) => !EMIRLE_KAPALI.includes(k))]
    assert.deepEqual(acik, [...setten, ...KENDI, 'takip-paneli'])
    assert.equal(acik.length, 44)
    for (const k of acik) assert.equal(Boolean(kitAraci(k)), !KENDI.includes(k), `${k}: a tool of the kit, or one of the two of this country's own`)
  })

  it('THE FOUR STAY OFF: ESI triage (the audit\'s one "remove"), the report outline and both kidney tools — placeholders, on no grid', () => {
    for (const k of EMIRLE_KAPALI) {
      assert.ok(!acik.includes(k), `${k} is switched on`)
      assert.equal(A.yuvalar.find((y) => y.anahtar === k)?.acik, false, k)
      for (const rol of [null, ...ROLLER]) assert.ok(!izgara(rol).includes(k), `${k} is on the grid of ${rol}`)
    }
    assert.deepEqual(Object.keys(CA_GIRDI.araclar.kapali).sort(), [...EMIRLE_KAPALI].sort())
    // the two that wait for a rights holder say "permission needed"
    for (const k of ['esi-triyaj', 'rapor-taslagi']) assert.equal(A.yuvalar.find((y) => y.anahtar === k)?.lisans?.durum, 'izin-gerekli', k)
  })

  /**
   * THE DOSE CALCULATOR IS BACK ON (the owner's order of 2026-10-10, after its faults were corrected in the kit). The
   * two examples are the ones the audit found the faults with (docs/araclar-denetim/CA.md, faults 2 and 3). How an
   * amount is written: ISMP Canada, "Do Not Use: Dangerous Abbreviations, Symbols and Dose Designations" (2006,
   * reaffirmed 2018), https://www.ismp-canada.org/download/ISMPC_List_of_Dangerous_Abbreviations.pdf, as the
   * corrections job read it on 2026-10-10: no zero by itself after a decimal point.
   */
  it('THE DOSE CALCULATOR IS ON AGAIN, and writes an amount as this country writes it: "160 mg" and "5 mL", never "160.00 mg" or "5.0 mL"', () => {
    assert.ok(acik.includes('doz-hesabi'))
    assert.ok(!A.yuvalar.some((y) => y.anahtar === 'doz-hesabi'), 'no longer a placeholder')
    assert.deepEqual(A.dozYazimi, { sondaSifir: false })
    // a child of 16 kg at 10 mg/kg for one dose, a liquid of 160 mg in 5 mL
    const s = yazili('doz-hesabi', { kilo: '16', mg_kg: '10', mod: 'doz', doz_sayisi: '1', kons_mg: '160', kons_ml: '5' })
    assert.equal(s.doz_mg, '160 mg')
    assert.equal(s.doz_ml, '5 mL')
    for (const v of Object.values(s)) assert.doesNotMatch(v, /\.\d*0 (mg|mL)$/, `a zero after the last figure: ${v}`)
  })

  it('THE DOSE CALCULATOR ROUNDS NO VOLUME: a baby of 4 kg at 2 mg/kg, a liquid of 50 mg in 1 mL, is 0.16 mL (not "0.2 mL"), with both cautions', () => {
    const sonuc = calistir('doz-hesabi', { kilo: '4', mg_kg: '2', mod: 'doz', doz_sayisi: '1', kons_mg: '50', kons_ml: '1' })
    assert.equal(sayiMetni(sonuc.sayilar.find((x) => x.anahtar === 'doz_ml')!, M, yazici, O), '0.16 mL')
    assert.deepEqual([...sonuc.uyarilar], ['ml_yuvarlanmadi', 'ml_kucuk'])
    // weight is asked in kilograms only, the unit of this pack
    assert.equal(kitAraci('doz-hesabi')!.alanlar.find((a) => a.anahtar === 'kilo')?.olcu, 'agirlik')
    assert.equal(CA_PAKETI.uygulama!.birimler.agirlik, 'kg')
  })
})

describe('ca tools 2: who sees which tool', () => {
  it('ELEVEN TOOLS OF THE SET ARE SHOWN TO MORE ROLES HERE, as the audit lists them', () => {
    assert.deepEqual(Object.keys(CA_GIRDI.araclar.gorenler ?? {}).sort(), Object.keys(GORENLER).sort())
    for (const [k, roller] of Object.entries(GORENLER)) {
      assert.deepEqual([...(araci(k).roller ?? [])], [...roller], k)
      for (const r of roller) assert.ok(ROLLER.includes(r), `${k}: ${r} is no role of this country`)
      // the set's own roles keep the tool: a role is only ever added
      const set = EN_ROL_ARACLARI.find((a) => a.anahtar === k)!.roller ?? []
      for (const r of set) assert.ok(roller.includes(r), `${k}: ${r} lost the tool`)
      // and the grid agrees with the list
      assert.deepEqual(ROLLER.filter((r) => izgara(r).includes(k)).sort(), [...roller].sort(), k)
    }
  })

  it('EVERY OTHER TOOL OF THE SET IS SHOWN TO THE SET\'S OWN ROLES, none added and none lost', () => {
    for (const a of EN_ROL_ARACLARI) {
      if (EMIRLE_KAPALI.includes(a.anahtar) || a.anahtar in GORENLER) continue
      assert.deepEqual([...(araci(a.anahtar).roller ?? [])], [...(a.roller ?? [])], a.anahtar)
    }
    assert.equal(araci('hasta-portali').roller, null, 'the patient\'s page is a base tool: every role')
  })

  it('WHAT A DOCTOR SEES ON THE GRID, before and after — examples', () => {
    const HEKIM = 'ca-egfr-ckd-epi-2021'
    // FAMILY MEDICINE: before, the patient's page and nothing else
    assert.deepEqual(izgara('family-medicine'), ['hasta-portali', 'ca-unit-converter', 'antikoagulan-vadeleri', 'doz-hesabi', HEKIM, 'takip-paneli'])
    // THE AUDIOLOGIST: before, the patient's page and nothing else; an allied profession, so no estimated GFR
    assert.deepEqual(izgara('audiology'), ['hasta-portali', 'ca-unit-converter', 'odyometri-pta', 'takip-paneli'])
    // THE DERMATOLOGIST OF A CLINIC: before, the patient's page and nothing else; now the four dermatology tools
    assert.deepEqual(izgara('clinic-dermatology'), ['hasta-portali', 'ca-unit-converter', 'pasi', 'easi', 'scorad', 'yama-okuma', HEKIM, 'takip-paneli'])
    assert.deepEqual(izgara('clinic-dermatology'), izgara('dermatology'))
    // THE SPLIT: both halves see the three lists of the specialty that was one
    assert.deepEqual(izgara('vascular-surgery'), ['hasta-portali', 'ca-unit-converter', 'kalp-damar-preop', 'greft-yara-izlem', 'antikoagulan-vadeleri', HEKIM, 'takip-paneli'])
    assert.deepEqual(izgara('cardiovascular-surgery'), izgara('vascular-surgery'))
    // PEDIATRICS keeps its two tools (the dose calculator is back); EMERGENCY MEDICINE gains the dose calculator
    assert.deepEqual(izgara('paediatrics'), ['hasta-portali', 'ca-unit-converter', 'hedef-boy', 'doz-hesabi', HEKIM, 'takip-paneli'])
    assert.deepEqual(izgara('emergency-medicine'), ['hasta-portali', 'ca-unit-converter', 'kritik-yol', 'doz-hesabi', HEKIM, 'takip-paneli'])
    // roles the audit adds
    assert.deepEqual(izgara('hematology'), ['hasta-portali', 'ca-unit-converter', 'antikoagulan-vadeleri', HEKIM, 'takip-paneli'])
    assert.deepEqual(izgara('pain-medicine'), ['hasta-portali', 'ca-unit-converter', 'postop-agri', HEKIM, 'takip-paneli'])
    // doctor roles with no tool of the set: before, the patient's page and nothing else; now the two of the core set
    for (const rol of ['psychiatry', 'neurology', 'gastroenterology', 'obstetrics-gynaecology', 'rehabilitation-medicine', 'geriatric-medicine', 'clinical-immunology-allergy', 'reproductive-endocrinology', 'longevity', 'hair-transplant']) assert.deepEqual(izgara(rol), ['hasta-portali', 'ca-unit-converter', HEKIM, 'takip-paneli'], rol)
    // the professions with no tool of the set: the base tools and the follow-up list
    for (const rol of ['physiotherapy', 'clinical-psychology', 'dietetics', 'occupational-therapy', 'psychotherapy']) assert.deepEqual(izgara(rol), ['hasta-portali', 'ca-unit-converter', 'takip-paneli'], rol)
    // an account without a role: the base tools only
    assert.deepEqual(izgara(null), ['hasta-portali', 'ca-unit-converter'])
  })

  it('NO SPECIALTY\'S TOOL LEAKS: a tool of one specialty is on no other specialty\'s grid', () => {
    assert.ok(!izgara('cardiology').includes('hedef-boy'), 'expected height is pediatrics only')
    assert.ok(!izgara('cardiology').includes('gorme-keskinligi'))
    assert.ok(!izgara('ophthalmology').includes('antikoagulan-vadeleri'))
    assert.ok(!izgara('obstetrics-gynaecology').includes('doz-hesabi'))
    assert.ok(!izgara('physiotherapy').includes('ca-egfr-ckd-epi-2021'))
    assert.deepEqual([...(araci('hedef-boy').roller ?? [])], ['paediatrics'])
    assert.deepEqual([...(araci('rtp-basamak').roller ?? [])], ['sports-medicine'])
  })

  it('THE CORE SET, WITH THE TOOLS THAT EXIST: the patient\'s page and the unit converter for every role; the follow-up list for every role (22 roles had it before)', () => {
    for (const rol of ROLLER) { assert.ok(izgara(rol).includes('hasta-portali'), rol); assert.ok(izgara(rol).includes('ca-unit-converter'), rol); assert.ok(izgara(rol).includes('takip-paneli'), rol) }
    assert.deepEqual([...(araci('takip-paneli').roller ?? [])], [...ROLLER])
    // "My templates" and "Consultations" of the audit's core set are features this pack does not have: not switched on
    for (const k of ['sablonlarim', 'konsultasyonlar']) assert.ok(!acik.includes(k), k)
    assert.ok(!('hekimSablonlari' in CA_PAKETI.ozellikler) && !('konsultasyon' in CA_PAKETI.ozellikler))
  })
})

describe('ca tools 3: what a national source states, and what is deliberately not stated', () => {
  /**
   * HEARING. Statistics Canada, Health Fact Sheets, "Hearing loss of Canadians, 2012 to 2015" (Canadian Health
   * Measures Survey), https://www150.statcan.gc.ca/n1/pub/82-625-x/2016001/article/14658-eng.htm, read 2026-10-10:
   * a speech-frequency pure-tone average over 0.5, 1, 2 and 4 kHz; an average "greater than 15 decibels (dB)" is at
   * least slight hearing loss, for adults and for children and youth.
   * Fact sheet on the Canadian Academy of Audiology's site, "Degree of hearing loss",
   * https://canadianaudiology.ca/wp-content/uploads/fact-sheets/DegreeOfLoss.pdf, read 2026-10-10: seven degrees,
   * 0 to 15, 16 to 25, 26 to 40, 41 to 55, 56 to 70, 71 to 90, 91 dB and above (written about children).
   */
  it('HEARING: the four frequencies Statistics Canada averages, and the seven grades of the Canadian sheet, are stated as this country\'s own', () => {
    const u = CA_GIRDI.araclar.uyarlama!['odyometri-pta']
    assert.deepEqual(u.alanlar, { frekans: ['e05', 'e1', 'e2', 'e4'] })
    assert.deepEqual(u.bantlar!.satirlar.map((s) => [s.ust, s.bant]), [[15, 'normal'], [25, 'hafifce'], [40, 'hafif'], [55, 'orta'], [70, 'orta_ileri'], [90, 'ileri'], [null, 'cok_ileri']])
    for (const s of u.bantlar!.satirlar.slice(0, -1)) assert.equal(s.dahil, true, 'each printed upper limit belongs to its own grade')
    const esik = (db: string) => calistir('odyometri-pta', { e05: db, e1: db, e2: db, e4: db })
    // BEFORE the tools were corrected: all four thresholds at 20 dB read "Within normal limits (up to 25 dB)"
    assert.equal(esik('20').bant, 'hafifce')
    assert.equal(metin('odyometri-pta').bantlar!.hafifce[D], 'Slight hearing loss (16 to 25 dB)')
    for (const [db, bant] of [['0', 'normal'], ['15', 'normal'], ['16', 'hafifce'], ['25', 'hafifce'], ['26', 'hafif'], ['40', 'hafif'], ['41', 'orta'], ['55', 'orta'], ['56', 'orta_ileri'], ['70', 'orta_ileri'], ['71', 'ileri'], ['90', 'ileri'], ['91', 'cok_ileri'], ['120', 'cok_ileri']] as const) assert.equal(esik(db).bant, bant, `${db} dB`)
    // the average is over the four frequencies: 10, 20, 30 and 40 dB average 25 dB
    assert.equal(calistir('odyometri-pta', { e05: '10', e1: '20', e2: '30', e4: '40' }).sayilar.find((x) => x.anahtar === 'pta')?.deger, 25)
    // an average between two printed ranges is in the higher grade
    assert.equal(calistir('odyometri-pta', { e05: '15', e1: '15', e2: '16', e4: '16' }).bant, 'hafifce')
    // every grade has a name on the screen, and no other field of a frequency is offered
    for (const s of u.bantlar!.satirlar) assert.ok(metin('odyometri-pta').bantlar![s.bant]?.[D]?.trim(), s.bant)
    assert.deepEqual(Object.keys(metin('odyometri-pta').alanlar).filter((k) => /^e\d/.test(k)), ['e05', 'e1', 'e2', 'e4'])
  })

  it('HEARING: NO CANADIAN RULE for a difference between the ears was found, so none is stated: the kit\'s own stands (more than 15 dB)', () => {
    assert.equal(CA_GIRDI.araclar.parametreler, undefined)
    const fark = (karsi: string) => calistir('odyometri-pta', { e05: '30', e1: '30', e2: '30', e4: '30', karsi_pta: karsi }).uyarilar
    assert.ok(!fark('15').includes('asimetri'), 'exactly 15 dB apart: not flagged')
    assert.ok(fark('14').includes('asimetri'), '16 dB apart: flagged')
  })

  /**
   * PSA. Canadian Urological Association, "UPDATE – 2022 Canadian Urological Association recommendations on prostate
   * cancer screening and early diagnosis", Can Urol Assoc J. 2022;16(4):E184-96,
   * https://cuaj.ca/index.php/journal/article/download/7851/5304/40922, read 2026-10-10: PSA is written in ng/ml;
   * "The CUA does not recommend using PSAV alone for clinical decision-making in men undergoing routine screening";
   * no interval between two values is stated for a rate of change.
   */
  it('PSA: the line under the result carries the urologists\' position; the unit names both forms in use; NO number of days is stated, so the kit\'s 90 stand', () => {
    assert.equal(metin('psa-hizi').not[D], 'The Canadian Urological Association does not recommend using the rate of change alone for decisions in men having routine screening. A decision-support tool: diagnosis and treatment are the doctor\'s.')
    const s = calistir('psa-hizi', { onceki_deger: '4.5', onceki_tarih: '2026-01-01', son_deger: '5.0', son_tarih: '2026-07-02' })
    assert.equal(sayiMetni(s.sayilar.find((x) => x.anahtar === 'hiz')!, M, yazici, O), '1.00 µg/L (= ng/mL) per year')
    assert.deepEqual([...s.uyarilar], [], '182 days apart: no caution')
    // six weeks apart: the caution of the kit (its own 90 days, which have no source) still shows
    assert.deepEqual([...calistir('psa-hizi', { onceki_deger: '4.5', onceki_tarih: '2026-01-01', son_deger: '5.0', son_tarih: '2026-02-12' }).uyarilar], ['kisa_aralik'])
    // no threshold and no grade: the tool prompts no screening
    assert.equal(s.bant, null)
  })

  /**
   * RETURN TO SPORT. Parachute, Return-to-Sport Strategy of the Canadian Guideline on Concussion in Sport, 2nd edition
   * (2024), https://pedsconcussion.com/wp-content/uploads/2024/03/Parachute-Return-to-Sport-and-School-Protocols-2024.pdf,
   * read 2026-10-10: steps 1, 2A, 2B, 3, medical clearance, 4, 5, 6; at least 24 hours at each step; NO day counted
   * from the injury for any step. The kit's table holds only an earliest day after the injury.
   */
  it('RETURN TO SPORT: NO STEPS ARE STATED (the Canadian guideline gives no day counted from the injury, and its terms for a product are unsettled): the tool shows the days since the injury and no stage', () => {
    assert.equal(CA_GIRDI.araclar.tablolar, undefined)
    const s = calistir('rtp-basamak', { yaralanma: '2026-10-03' })
    assert.equal(s.tamam, true)
    assert.deepEqual(s.sayilar.map((x) => [x.anahtar, x.deger]), [['gun', 7]])
    assert.equal(s.bant, null)
    assert.deepEqual([...s.uyarilar], ['basamak_tanimsiz'])
    assert.match(metin('rtp-basamak').aciklama[D], /No steps of return to sport have been set for this country/)
  })

  it('EXPECTED HEIGHT: NO CANADIAN SOURCE STATES A RANGE, so none is stated: the tool shows the expected height alone', () => {
    // mother 160 cm, father 180 cm, a boy: (160 + 180 + 13) / 2 = 176.5 cm
    const s = calistir('hedef-boy', { cinsiyet: 'erkek', anne: '160', baba: '180' })
    assert.deepEqual(s.sayilar.map((x) => [x.anahtar, x.deger]), [['hedef', 176.5]])
  })

  it('PASI, EASI, SCORAD, DAS28: NO BANDS OF THIS COUNTRY\'S OWN are stated (no Canadian body states them; the DAS28 boundary is printed two ways): the kit\'s stand', () => {
    assert.deepEqual(Object.keys(CA_GIRDI.araclar.uyarlama ?? {}), ['odyometri-pta'])
    for (const k of ['pasi', 'easi', 'scorad', 'das28']) assert.equal(araci(k).uyarlama, undefined, k)
    // PASI shows its score and no severity word
    assert.equal(metin('pasi').bantlar, undefined)
  })

  /**
   * Choosing Wisely Canada, Anesthesiology (Canadian Anesthesiologists' Society; last updated September 2025),
   * https://choosingwiselycanada.org/?p=1518, read 2026-10-10: do not order baseline laboratory studies (item 1) or a
   * baseline chest X-ray (item 3) for patients without symptoms before low-risk surgery.
   */
  it('THE TWO PRE-OPERATIVE CHECKLISTS no longer count a routine test as an item to complete: the two items are done where nothing was indicated', () => {
    for (const k of ['genel-preop', 'cocuk-prepost-op']) {
      assert.equal(metin(k).alanlar.laboratuvar[D], 'Pre-operative laboratory tests done, or none indicated', k)
      assert.equal(metin(k).alanlar.goruntu[D], 'Pre-operative imaging and its report seen, or none indicated', k)
    }
    // every other word of the two lists is the set's
    assert.deepEqual(Object.keys(CA_GIRDI.araclar.degisen!['genel-preop']), ['alanlar'])
    assert.deepEqual(Object.keys(CA_GIRDI.araclar.degisen!['genel-preop'].alanlar!), ['laboratuvar', 'goruntu'])
  })

  it('LABORATORY UNITS: nothing new was stated (each was read for one province or one body only); the two tools that read a value keep the unit they had', () => {
    assert.deepEqual(A.labBirimleri, { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L', crp: 'mg/L', psa: 'ug/L' })
    for (const v of Object.values(A.labBirimleri)) assert.equal(typeof v, 'string', 'one unit per quantity: no unit is chosen on a screen')
    assert.match(readFileSync(join(__dirname, '../ayarlar.ts'), 'utf8'), /PROVINCIAL, AND READ FOR ONE PROVINCE OR ONE BODY EACH/)
  })
})

describe('ca tools 4: licence states', () => {
  it('"FREE" IS STATED FOR ONE PLACEHOLDER OF THE SET ONLY: the PHQ-9 with GAD-7, on the notice printed on the forms; "permission needed" for the two the owner ordered off', () => {
    // read 2026-10-10 on a copy of both forms, https://www.hhs.nd.gov/sites/www/files/documents/BH/BHC/PHQ-9-and-GAD-7.pdf:
    // "No permission required to reproduce, translate, display or distribute"
    assert.deepEqual(Object.keys(CA_GIRDI.araclar.lisanslar ?? {}).sort(), ['esi-triyaj', 'phq9-gad7', 'rapor-taslagi'])
    const phq = A.yuvalar.find((y) => y.anahtar === 'phq9-gad7')!
    assert.equal(phq.lisans?.durum, 'serbest')
    assert.match(phq.lisans?.kaynak ?? '', /read 2026-10-10/)
    // THE PLACEHOLDER STAYS A PLACEHOLDER: stating a licence switches nothing on
    assert.equal(phq.acik, false)
    assert.ok(!acik.includes('phq9-gad7'))
  })

  it('NO OTHER TOOL OR PLACEHOLDER OF THE SET STATES A LICENCE: the country is still on the list of countries that owe them', () => {
    assert.equal(A.lisansTam, undefined)
    const borc = JSON.parse(readFileSync(join(KOK, 'countries/lisans-borcu.json'), 'utf8')) as { ulkeler: string[] }
    assert.ok(borc.ulkeler.includes('ca'))
    const belirtilen = [...A.araclar.filter((p) => p.lisans).map((p) => p.anahtar), ...A.yuvalar.filter((y) => y.lisans).map((y) => y.anahtar)].sort()
    assert.deepEqual(belirtilen, [...KENDI, 'esi-triyaj', 'phq9-gad7', 'rapor-taslagi'].sort())
    // nothing that is switched on carries a state other than "free"
    for (const p of A.araclar) if (p.lisans) assert.equal(p.lisans.durum, 'serbest', p.anahtar)
  })
})
