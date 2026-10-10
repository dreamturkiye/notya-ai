/**
 * NOTYA-ULKE-UYGULA-US — United States: WHO SEES WHICH TOOL, THE NUMBERS A NATIONAL SOURCE STATES, AND THE LICENCE
 * STATES — as the audit of 2026-10-10 decided them (us-kararlar.json on the branch araclar-denetim/us), applied to
 * this country only.
 *
 *   1. NO TOOL OF THE SHARED SET IS SWITCHED ON OR OFF by this job: the same ones are on as before, and the five that
 *      were off stay off. Beyond the set, the seven tools of this country's own are on (./yeniAraclar.test.ts).
 *   2. WHO SEES A TOOL: ten tools of the set are shown to more roles here; every other tool to the set's roles.
 *   3. COUNTRY DATA, each number beside the source it was read from on 2026-10-10: the range of the expected height;
 *      the hearing grades; the DAS28 bands. And what is deliberately NOT stated, with what the tool then shows.
 *   4. LICENCES: "free" only where the rights holder's own notice was read; the others stated as before.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { type BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { girdiyiCoz } from '@/lib/ulke/araclar/girdi'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { aracCalistir, hesabinAraclari, paketinAraci, sayiMetni, type Yazici } from '@/lib/ulke/araclar/paket'
import { ptaBandi } from '@/lib/ulke/araclar/tanimlar/kalpKbb'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { bantBul } from '@/lib/ulke/araclar/uyarlama'
import { ORNEK_BUGUN, ornekGirdiler } from '@/lib/ulke/testing/aracOrnekleri'
import { EN_ROL_ARACLARI } from '../../_dil/en/araclar'
import { US_ARAYUZ } from '../arayuz'
import { US_GIRDI } from '../ayarlar'
import { US_PAKETI } from '../index'
import { US_ONAY_BEKLEYEN_ANAHTARLAR as KENDI } from './onayBekleyen'

const D = 'en-US'
const KOK = resolve(__dirname, '../../..')
const A = US_ARAYUZ.araclar as UlkeAraclari
const ROLLER = US_PAKETI.uygulama!.roller!
const O: BirimOrtami = { birimler: US_PAKETI.uygulama!.birimler, lab: A.labBirimleri, sayi: US_PAKETI.bicim }
const BUGUN = '2026-10-10'
const yazici: Yazici = { sayi: (deger, ondalik) => deger.toFixed(ondalik), tarih: (iso) => iso, birim: (kod) => A.birimler[kod]?.[D] ?? `?${kod}?` }
const acik = A.araclar.map((p) => p.anahtar)
const araci = (k: string) => A.araclar.find((p) => p.anahtar === k)!
/** The tools on a role's grid, by key, in the order shown. */
const izgara = (rol: string | null): string[] => { const x = hesabinAraclari(A, rol); return [...x.temel, ...x.rol].map((y) => y.tanim.anahtar) }
const calistir = (k: string, ham: Record<string, string | boolean>) => { const x = paketinAraci(A, k)!; return aracCalistir(x, girdiyiCoz(x.tanim.alanlar, ham, O), BUGUN, A) }

/**
 * The five tools of the set that are off here: four by the owner's order of 2026-10-10 (ESI triage, the report
 * outline, both kidney tools), and the dose calculator by this pack's own, earlier decision (weight is in pounds).
 */
const EMIRLE_KAPALI = ['doz-hesabi', 'esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi']
/** The six tools of this country's own that every doctor role sees (the seventh, the ECOG grade, is for three specialties). */
const CEKIRDEK = ['us-bmi', 'us-egfr-ckd-epi-2021', 'us-pack-years', 'us-blood-sugar-ranges', 'us-fall-risk-screen', 'us-phq-9']

/** WHO SEES A TOOL OF THE SET HERE, where the audit's decision differs from the set: the set's role(s) first, then the roles the audit adds. */
const GORENLER: Readonly<Record<string, readonly string[]>> = {
  'rtp-basamak': ['sports-medicine', 'emergency-medicine', 'family-medicine', 'neurology', 'paediatrics'],
  'hedef-boy': ['paediatrics', 'family-medicine'],
  'inhaler-teknik': ['respiratory-medicine', 'family-medicine', 'paediatrics', 'allergy-immunology'],
  'kalp-damar-preop': ['cardiovascular-surgery', 'thoracic-surgery'],
  'genel-preop': ['general-surgery', 'colon-rectal-surgery'],
  'yara-dren-izlem': ['paediatric-surgery', 'general-surgery', 'colon-rectal-surgery'],
  'kur-sayaci': ['oncology', 'radiation-oncology'],
  'toksisite-listesi': ['oncology', 'radiation-oncology'],
  'plastik-yara-greft': ['plastic-surgery', 'aesthetic-surgery'],
  'odyometri-pta': ['otolaryngology', 'audiology'],
}

describe('us tools 1: no tool of the shared set is switched on or off by this job', () => {
  it('the same tools of the set are on as before: every one but the five that were off, the patient\'s page and the follow-up list; beyond the set, the seven of this country\'s own', () => {
    const setten = ['hasta-portali', ...EN_ROL_ARACLARI.map((a) => a.anahtar).filter((k) => !EMIRLE_KAPALI.includes(k))]
    assert.deepEqual(acik, [...setten, ...KENDI, 'takip-paneli'])
    assert.equal(setten.length + 1, 41, 'the 41 that were on before this job')
    assert.equal(acik.length, 41 + 7)
    for (const k of acik) assert.equal(Boolean(kitAraci(k)), !KENDI.includes(k), `${k}: a tool of the kit, or one of the seven of this country's own`)
  })

  it('THE FIVE THAT WERE OFF STAY OFF: the dose calculator (this pack\'s own decision), and by the owner\'s order ESI triage, the report outline and both kidney tools', () => {
    for (const k of EMIRLE_KAPALI) {
      assert.ok(!acik.includes(k), `${k} is switched on`)
      assert.equal(A.yuvalar.find((y) => y.anahtar === k)?.acik, false, k)
      for (const rol of [null, ...ROLLER]) assert.ok(!izgara(rol).includes(k), `${k} is on the grid of ${rol}`)
    }
    assert.deepEqual(Object.keys(US_GIRDI.araclar.kapali).sort(), [...EMIRLE_KAPALI].sort())
  })

  it('the one tool the audit marks "remove" (ESI triage) is off', () => {
    assert.ok(!acik.includes('esi-triyaj'))
  })
})

describe('us tools 2: who sees which tool', () => {
  it('TEN TOOLS OF THE SET ARE SHOWN TO MORE ROLES HERE, as the audit lists them (two more wait on roles that are not added yet)', () => {
    assert.deepEqual(Object.keys(US_GIRDI.araclar.gorenler ?? {}).sort(), Object.keys(GORENLER).sort())
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
    assert.equal(araci('hasta-portali').roller, null, 'the patient\'s page is the one base tool: every role')
  })

  it('WHAT A DOCTOR SEES ON THE GRID, before and after — three examples', () => {
    // FAMILY MEDICINE: before, the patient's page and nothing else
    assert.deepEqual(izgara('family-medicine'), ['hasta-portali', 'inhaler-teknik', 'hedef-boy', 'rtp-basamak', ...CEKIRDEK, 'takip-paneli'])
    // THE AUDIOLOGIST: before, the patient's page and nothing else
    assert.deepEqual(izgara('audiology'), ['hasta-portali', 'odyometri-pta', 'takip-paneli'])
    // THORACIC AND CARDIAC SURGERY: the checklist before a heart operation is new, and the six of every doctor role
    assert.deepEqual(izgara('thoracic-surgery'), ['hasta-portali', 'toraks-preop', 'toraks-tup-yara', 'kalp-damar-preop', ...CEKIRDEK, 'takip-paneli'])
    // a specialty the audit adds: radiation oncology, with the two oncology lists of the set and the ECOG grade
    assert.deepEqual(izgara('radiation-oncology'), ['hasta-portali', 'kur-sayaci', 'toksisite-listesi', ...CEKIRDEK, 'us-ecog-performance-status', 'takip-paneli'])
    // CARDIOLOGY and PSYCHIATRY: before, the patient's page and nothing else; now the six of every doctor role
    for (const rol of ['cardiology', 'psychiatry', 'geriatric-medicine', 'sleep-medicine', 'longevity']) assert.deepEqual(izgara(rol), ['hasta-portali', ...CEKIRDEK, 'takip-paneli'], rol)
    // the professions: only what was named for each
    assert.deepEqual(izgara('dietetics'), ['hasta-portali', 'us-bmi', 'us-blood-sugar-ranges', 'takip-paneli'])
    assert.deepEqual(izgara('clinical-social-work'), ['hasta-portali', 'us-phq-9', 'takip-paneli'])
    assert.deepEqual(izgara('physiotherapy'), ['hasta-portali', 'us-fall-risk-screen', 'takip-paneli'])
    assert.deepEqual(izgara('speech-language-pathology'), ['hasta-portali'])
    // an account without a role: the base tool only
    assert.deepEqual(izgara(null), ['hasta-portali'])
  })

  it('THE CORE SET, WITH THE TOOLS THAT EXIST TODAY: the patient\'s page for every role; the follow-up list for every role that has a tool whose result can be kept', () => {
    for (const rol of ROLLER) assert.ok(izgara(rol).includes('hasta-portali'), rol)
    const tasiyan = ROLLER.filter((r) => A.araclar.some((p) => p.anahtar !== 'takip-paneli' && p.roller?.includes(r)))
    assert.deepEqual([...(araci('takip-paneli').roller ?? [])], tasiyan)
    // 22 roles had it before this job; now every role but one has a tool whose result can be kept
    assert.deepEqual(ROLLER.filter((r) => !tasiyan.includes(r)), ['speech-language-pathology'])
    assert.equal(tasiyan.length, 50)
  })

  it('ONE WORD, the audit\'s decision: the two surgical checklists say "anesthesiologist" here (the set\'s "anesthetist" usually means a nurse anesthetist in the United States)', () => {
    for (const k of ['cocuk-prepost-op', 'genel-preop']) assert.equal(araci(k).metin.alanlar.anestezi_not[D], 'The anesthesiologist\'s note is in the patient\'s documents', k)
    for (const p of A.araclar) assert.doesNotMatch(JSON.stringify(p.metin), /an(a)?esthetist/i, p.anahtar)
  })

  it('no tool is given to a role this country does not have', () => {
    for (const p of A.araclar) for (const r of p.roller ?? []) assert.ok(ROLLER.includes(r), `${p.anahtar}: ${r}`)
    for (const y of A.yuvalar) for (const r of y.roller ?? []) assert.ok(ROLLER.includes(r), `placeholder ${y.anahtar}: ${r}`)
  })
})

describe('us tools 3: the numbers a national source states — each read on 2026-10-10', () => {
  /**
   * EXPECTED HEIGHT. Barstow C, Rerucha C. Evaluation of Short and Tall Stature in Children. Am Fam Physician.
   * 2015;92(1):43-50, https://www.aafp.org/afp/2015/0701/p43.pdf (read 2026-10-10): the midparental height is
   * (father + mother + 13 cm) / 2 for a boy and (father + mother − 13 cm) / 2 for a girl; most children end up
   * "within 10 cm (4 in), or two standard deviations" of it.
   */
  it('EXPECTED HEIGHT: the range is 10 cm either side (AAFP 2015). BEFORE: "69.6 in" alone. NOW: "69.6 in", from 65.6 in to 73.5 in', () => {
    assert.deepEqual(araci('hedef-boy').parametreler, { aralik_cm: 10 })
    // the audit's example: a boy, mother 64 in, father 70 in
    const s = calistir('hedef-boy', { cinsiyet: 'erkek', anne: '64', baba: '70' })
    assert.equal(s.tamam, true)
    assert.deepEqual(s.sayilar.map((x) => [x.anahtar, x.deger]), [['hedef', 176.7], ['alt', 166.7], ['ust', 186.7]])
    assert.deepEqual(s.sayilar.map((x) => sayiMetni(x, A.metinler[D]!, yazici, O)), ['69.6 in', '65.6 in', '73.5 in'])
    // a girl of the same parents: 13 cm the other way, the same 10 cm either side
    const k = calistir('hedef-boy', { cinsiyet: 'kiz', anne: '64', baba: '70' })
    assert.deepEqual(k.sayilar.map((x) => x.deger), [163.7, 153.7, 173.7])
    // the kit by itself states no range: the number is this country's
    const kit = kitAraci('hedef-boy')!
    assert.deepEqual(kit.hesapla(girdiyiCoz(kit.alanlar, { cinsiyet: 'erkek', anne: '64', baba: '70' }, O), { bugun: BUGUN, p: {} }).sayilar.map((x) => x.anahtar), ['hedef'])
  })

  /**
   * HEARING: DEGREE OF LOSS. American Speech-Language-Hearing Association, "Degree of Hearing Loss",
   * https://asha.org/public/hearing/degree-of-hearing-loss (read 2026-10-10): Normal –10 to 15; Slight 16 to 25;
   * Mild 26 to 40; Moderate 41 to 55; Moderately severe 56 to 70; Severe 71 to 90; Profound 91+ (dB HL).
   */
  it('HEARING AVERAGE: the seven grades of the ASHA table, stated as this country\'s own — limit for limit what the kit shows by itself', () => {
    const b = araci('odyometri-pta').uyarlama!.bantlar!
    assert.equal(b.sayi, 'pta')
    assert.deepEqual(b.satirlar.map((x) => [x.ust, x.dahil ?? false, x.bant]), [[15, true, 'normal'], [25, true, 'hafifce'], [40, true, 'hafif'], [55, true, 'orta'], [70, true, 'orta_ileri'], [90, true, 'ileri'], [null, false, 'cok_ileri']])
    const sinirlar = b.satirlar.map((x) => x.ust)
    // the two ends of every range the table prints
    for (const [db, bant] of [[-10, 'normal'], [15, 'normal'], [16, 'hafifce'], [25, 'hafifce'], [26, 'hafif'], [40, 'hafif'], [41, 'orta'], [55, 'orta'], [56, 'orta_ileri'], [70, 'orta_ileri'], [71, 'ileri'], [90, 'ileri'], [91, 'cok_ileri'], [120, 'cok_ileri']] as const) assert.equal(bantBul(b, sinirlar, db), bant, `${db} dB`)
    // NOTHING CHANGES ON A SCREEN: over the whole range a threshold can be typed in, the country's table and the kit's own agree
    for (let db = -10; db <= 130; db += 0.1) { const x = Math.round(db * 10) / 10; assert.equal(bantBul(b, sinirlar, x), ptaBandi(x), `${x} dB`) }
    // through the tool: all four thresholds at 20 dB is a slight loss (the fault the audit found: it read "within normal limits")
    const s = calistir('odyometri-pta', { e05: '20', e1: '20', e2: '20', e4: '20' })
    assert.equal(s.bant, 'hafifce')
    assert.equal(araci('odyometri-pta').metin.bantlar!.hafifce[D], 'Slight hearing loss (16 to 25 dB)')
    assert.deepEqual(Object.keys(araci('odyometri-pta').metin.bantlar!), ['normal', 'hafifce', 'hafif', 'orta', 'orta_ileri', 'ileri', 'cok_ileri'])
  })

  it('HEARING AVERAGE, NOT STATED: the frequencies (the kit\'s four) and the rule for a difference between the ears (the kit\'s: more than 15 dB)', () => {
    const p = araci('odyometri-pta')
    assert.equal(p.uyarlama?.alanlar, undefined, 'the frequencies are a choice for a US audiologist: none is stated')
    assert.equal(p.parametreler, undefined, 'no asymmetry rule is stated: the kit\'s own stands')
    assert.deepEqual(paketinAraci(A, 'odyometri-pta')!.tanim.alanlar.filter((a) => /^e\d/.test(a.anahtar)).map((a) => a.anahtar), ['e05', 'e1', 'e2', 'e4'])
    const esik = { e05: '30', e1: '30', e2: '30', e4: '30' }
    assert.deepEqual(calistir('odyometri-pta', { ...esik, karsi_pta: '15' }).uyarilar, [], 'a difference of exactly 15 dB is not flagged')
    assert.deepEqual(calistir('odyometri-pta', { ...esik, karsi_pta: '14' }).uyarilar, ['asimetri'], 'a difference of 16 dB is flagged')
  })

  /**
   * DAS28. England BR, Tiong BK, Bergman MJ, et al. 2019 Update of the American College of Rheumatology Recommended
   * Rheumatoid Arthritis Disease Activity Measures. Arthritis Care Res. 2019;71(12):1540-1555, Table 1,
   * https://rheumatology.org/api/asset/blt65fc8b2649e03455 (read 2026-10-10): remission <2.6; low disease activity
   * 2.6 to <3.2; moderate 3.2 to ≤5.1; high >5.1.
   */
  it('DAS28: the four bands of the American College of Rheumatology\'s 2019 table, stated as this country\'s own', () => {
    const b = araci('das28').uyarlama!.bantlar!
    assert.equal(b.sayi, 'das28')
    const sinirlar = b.satirlar.map((x) => x.ust)
    for (const [skor, bant] of [[0, 'remisyon'], [2.59, 'remisyon'], [2.6, 'dusuk'], [3.19, 'dusuk'], [3.2, 'orta'], [5.1, 'orta'], [5.11, 'yuksek'], [9.4, 'yuksek']] as const) assert.equal(bantBul(b, sinirlar, skor), bant, String(skor))
    assert.deepEqual(Object.keys(araci('das28').metin.bantlar!), ['remisyon', 'dusuk', 'orta', 'yuksek'])
    // NOTHING CHANGES ON A SCREEN: for every sample input, the tool of this pack answers as the kit's own does
    const kit = kitAraci('das28')!, x = paketinAraci(A, 'das28')!
    let karsilastirilan = 0
    for (const g of ornekGirdiler(kit, 60)) {
      const beklenen = kit.hesapla(g, { bugun: ORNEK_BUGUN, p: {} })
      assert.deepEqual(aracCalistir(x, g, ORNEK_BUGUN, A), beklenen, JSON.stringify(g))
      if (beklenen.tamam) karsilastirilan++
    }
    assert.ok(karsilastirilan > 10, `${karsilastirilan} results compared`)
    // the audit's example: 4 tender and 2 swollen joints, global score 50, CRP 10 mg/L = 4.04, moderate
    const s = calistir('das28', { varyant: 'crp', tjc: '4', sjc: '2', pga: '50', crp: '10', 'crp.birim': 'mg/L' })
    assert.equal(s.sayilar[0].deger, 4.04)
    assert.equal(s.bant, 'orta')
  })

  /**
   * PSA. National Cancer Institute, "Prostate-Specific Antigen (PSA) Test" (updated January 31, 2025),
   * https://www.cancer.gov/types/prostate/psa-fact-sheet (read 2026-10-10): results are given in nanograms per
   * milliliter (ng/mL). The same page describes a repeat test 6 to 8 weeks after an abnormal result.
   */
  it('PSA: the unit is ng/mL (National Cancer Institute); NO NUMBER OF DAYS IS STATED for the caution, so the kit\'s own 90 days stand', () => {
    assert.equal(A.labBirimleri.psa, 'ng/mL')
    assert.equal(araci('psa-hizi').parametreler, undefined)
    const s = (son: string) => calistir('psa-hizi', { onceki_deger: '4.5', onceki_tarih: '2026-01-01', son_deger: '5.0', son_tarih: son })
    assert.deepEqual(s('2026-03-31').uyarilar, ['kisa_aralik'], '89 days apart: the caution shows')
    assert.deepEqual(s('2026-04-01').uyarilar, [], '90 days apart: it does not')
    // FOR A US UROLOGIST: a repeat 6 to 8 weeks later, which the institute's page describes, raises the caution
    assert.deepEqual(s('2026-02-19').uyarilar, ['kisa_aralik'], '7 weeks apart')
    assert.equal(sayiMetni(s('2026-04-01').sayilar[0], A.metinler[D]!, yazici, O), '2.03 ng/mL per year')
  })

  /**
   * RETURN TO SPORT. CDC HEADS UP, "Returning to Sports" (updated September 15, 2025),
   * https://www.cdc.gov/heads-up/guidelines/returning-to-sports.html (read 2026-10-10): six steps, each of at least
   * 24 hours, begun with a health care provider's approval. NO DAY COUNTED FROM THE INJURY is stated for any step,
   * and the kit's table holds nothing else: so no table is supplied, and no step is shown.
   */
  it('RETURN TO SPORT: no steps are stated (the national page read gives no day counted from the injury): the tool shows the days since the injury and no step', () => {
    assert.equal(araci('rtp-basamak').tablolar, undefined)
    const s = calistir('rtp-basamak', { yaralanma: '2026-10-07' })
    assert.equal(s.tamam, true)
    assert.deepEqual(s.sayilar.map((x) => [x.anahtar, x.deger]), [['gun', 3]])
    assert.equal(s.bant, null)
    assert.deepEqual(s.uyarilar, ['basamak_tanimsiz'])
    assert.deepEqual(s.tarihler, [])
    assert.ok(!paketinAraci(A, 'rtp-basamak')!.tanim.alanlar.find((a) => a.anahtar === 'basamak')?.secenekler?.length, 'a step can be chosen')
  })

  it('PASI, EASI, SCORAD: no band of this country\'s own (no US national body read states one): PASI shows its score and no severity word', () => {
    for (const k of ['pasi', 'easi', 'scorad']) assert.equal(araci(k).uyarlama, undefined, k)
    const kit = kitAraci('pasi')!
    for (const g of ornekGirdiler(kit, 30)) { const s = aracCalistir(paketinAraci(A, 'pasi')!, g, ORNEK_BUGUN, A); if (s.tamam) assert.equal(s.bant, null) }
  })

  it('only the two grade tables and the one range are this country\'s own: no other number, table or band is stated for any tool', () => {
    assert.deepEqual(A.araclar.filter((p) => p.parametreler).map((p) => p.anahtar), ['hedef-boy'])
    assert.deepEqual(A.araclar.filter((p) => p.uyarlama).map((p) => p.anahtar).sort(), ['das28', 'odyometri-pta'])
    assert.deepEqual(A.araclar.filter((p) => p.tablolar).map((p) => p.anahtar), [])
    // a tool held back by the patient's age: three of the country's own, none of the set
    assert.deepEqual(A.araclar.filter((p) => p.hasta).map((p) => p.anahtar), ['us-bmi', 'us-egfr-ckd-epi-2021', 'us-fall-risk-screen'])
  })

  it('EVERY NUMBER STATED HERE STANDS BESIDE ITS SOURCE IN THE PACK: the address, the title and the day it was read', () => {
    const kaynak = readFileSync(join(KOK, 'countries/us/ayarlar.ts'), 'utf8')
    for (const adres of ['https://www.aafp.org/afp/2015/0701/p43.pdf', 'https://asha.org/public/hearing/degree-of-hearing-loss', 'https://rheumatology.org/api/asset/blt65fc8b2649e03455', 'https://www.cancer.gov/types/prostate/psa-fact-sheet', 'https://www.cdc.gov/heads-up/guidelines/returning-to-sports.html']) assert.ok(kaynak.includes(adres), adres)
    for (const baslik of ['Evaluation of Short and Tall Stature in', 'Degree of Hearing Loss', '2019 Update of the American College of', 'Prostate-Specific Antigen', 'Returning to Sports']) assert.ok(kaynak.includes(baslik), baslik)
    assert.match(kaynak, /Each was read on 2026-10-10/)
  })
})

describe('us tools 4: licence states', () => {
  it('"FREE" IS STATED FOR ONE PLACEHOLDER OF THE SET ONLY — PHQ-9 and GAD-7, by the permission line printed on the forms themselves — and it stays a placeholder', () => {
    const y = A.yuvalar.find((x) => x.anahtar === 'phq9-gad7')!
    assert.equal(y.lisans?.durum, 'serbest')
    assert.match(y.lisans?.kaynak ?? '', /printed on the PHQ-9 and GAD-7 forms/)
    assert.match(y.lisans?.kaynak ?? '', /read 2026-10-10/)
    assert.equal(y.acik, false)
    assert.ok(!acik.includes('phq9-gad7'))
  })

  it('the two the owner\'s order names stay "permission needed"; no other tool or placeholder of the set states a licence', () => {
    for (const k of ['esi-triyaj', 'rapor-taslagi']) assert.equal(A.yuvalar.find((y) => y.anahtar === k)?.lisans?.durum, 'izin-gerekli', k)
    assert.deepEqual(Object.keys(US_GIRDI.araclar.lisanslar ?? {}).sort(), ['esi-triyaj', 'phq9-gad7', 'rapor-taslagi'])
    // of the switched-on tools, only the seven of this country's own state a licence (each "free", by a notice that was read)
    assert.deepEqual(A.araclar.filter((p) => p.lisans).map((p) => p.anahtar), [...KENDI])
    for (const p of A.araclar.filter((x) => x.lisans)) assert.equal(p.lisans!.durum, 'serbest', p.anahtar)
    assert.notEqual(A.lisansTam, true)
  })

  it('this country is still on the list of countries that have not stated every licence (it can only shrink)', () => {
    const borc = JSON.parse(readFileSync(join(KOK, 'countries/lisans-borcu.json'), 'utf8')) as { ulkeler: string[] }
    assert.ok(borc.ulkeler.includes('us'))
  })
})
