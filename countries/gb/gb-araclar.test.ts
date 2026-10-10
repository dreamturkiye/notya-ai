/**
 * NOTYA-ULKE-UYGULA (gb) — United Kingdom: THE TOOLS as the audited decisions state them
 * (docs/araclar-denetim/gb-kararlar.json; docs/araclar-denetim/GB.md, "Second pass" first).
 *
 *   A. WHO SEES WHICH TOOL        every role's grid, held to the decisions file role by role
 *   B. THE COUNTRY'S OWN NUMBERS  each with the source it was taken from, opened on 2026-10-10, and a before and after
 *   C. THE TOOLS ONLY THIS COUNTRY HAS   tested with their source's own worked examples; all switched on; the list
 *                                 of tools switched on without a clinician's sign-off matches the pack exactly
 *   D. WHAT STAYS OFF             the four tools the owner keeps off, and every tool the decisions mark "remove"
 *   E. LICENCES                   "free" only where the rights holder's own notice was opened
 *   F. NICE                       the list of NICE-derived items matches the marks in the folder
 *
 * EVERY NUMBER ASSERTED HERE WAS READ IN ITS SOURCE ON 2026-10-10 (the address stands in the test's name or beside
 * the assertion, and beside the number in ./araclar.ts and ./kendiAraclari.ts). None was written from memory.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { EN_ROL_ARACLARI } from '../_dil/en/araclar'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { aracCalistir, aracOzeti, hekimRolleri, hesabinAraci, hesabinAraclari, lisansBildirimi, paketinTanimi, sayiMetni } from '@/lib/ulke/araclar/paket'
import { LISANS_ACIK, type AracGirdisi } from '@/lib/ulke/araclar/tipler'
import { ulkeyeOzelAnahtarlar } from '@/lib/ulke/araclar/ulkeyeOzel'
import { bantBul, bantSinirlari } from '@/lib/ulke/araclar/uyarlama'
import { disAdresGecerliMi } from '@/lib/ulke/araclar/denetim'
import { paketiDenetle } from '@/lib/ulke/paketDenetimi'
import { GB_ARACLAR, GB_HEKIM_ROLLERI } from './araclar'
import { GB_ARAYUZ } from './arayuz'
import { GB_PAKETI } from './index'
import { GB_4AT_PUANLARI, GB_FOUR_AT, GB_FRAX_ADRESI, GB_KENDI_ARACLARI, GB_KENDI_TANIMLARI, GB_OZEL_ANAHTARLAR, GB_VALPROATE } from './kendiAraclari'
import { GB_KLINIK } from './klinik'

const D = 'en-GB'
const KOK = resolve(__dirname, '../..')
const A = GB_ARAYUZ.araclar!
const ROLLER = GB_PAKETI.uygulama!.roller!
const BUGUN = '2026-10-10'
const oku = <T>(yol: string): T => JSON.parse(readFileSync(join(KOK, yol), 'utf8')) as T

type Karar = { key: string; verdict: string; kind?: string; tools?: string[]; toolsOnToday?: string[] }
const KARARLAR = oku<{
  tools: { key: string; state: string; verdict: string; proposedSpecialties: string | string[] | null }[]
  specialties: Karar[]
  clinicSpecialties: Karar[]
}>('docs/araclar-denetim/gb-kararlar.json')

/** The keys of the tools a role sees, in the grid's order. null = an account without a role. */
const gorulen = (rol: string | null): string[] => { const { temel, rol: kendi } = hesabinAraclari(A, rol); return [...temel, ...kendi].map((x) => x.tanim.anahtar) }
/** The roles that see a tool, in the pack's order. */
const goren = (anahtar: string): string[] => ROLLER.filter((r) => hesabinAraci(A, r, anahtar) !== null)
const ad = (anahtar: string) => A.araclar.find((p) => p.anahtar === anahtar)?.metin.ad[D]
/** A tool run as the screen and the server run it, for the first role that sees it. */
const calistir = (anahtar: string, g: AracGirdisi, bugun = BUGUN) => { const x = hesabinAraci(A, goren(anahtar)[0], anahtar); assert.ok(x, `${anahtar} is switched on`); return aracCalistir(x, g, bugun, A) }
const sayi = (s: ReturnType<typeof calistir>, k: string) => s.sayilar.find((x) => x.anahtar === k)?.deger
const DOKTORLAR = GB_ARAYUZ.roller.filter((r) => r.taraf !== 'klinik-muttefik').map((r) => r.anahtar)
const MUTTEFIKLER = GB_ARAYUZ.roller.filter((r) => r.taraf === 'klinik-muttefik').map((r) => r.anahtar)

describe('gb A: who sees which tool (decisions: `proposedSpecialties`; GB.md, "Which tools each role should see")', () => {
  it('the pack check finds nothing', () => assert.deepEqual(paketiDenetle(GB_PAKETI, GB_ARAYUZ, GB_KLINIK), []))

  it('THE CORE of every doctor role, from existing tools: the patient\'s page, the antibiotic course counter and the follow-up list', () => {
    assert.equal(DOKTORLAR.length, 46)
    assert.deepEqual([...GB_HEKIM_ROLLERI], hekimRolleri(GB_ARAYUZ.roller), 'the class "every doctor role" is the kit\'s own list')
    for (const r of DOKTORLAR) for (const k of ['hasta-portali', 'antibiyotik-sure', 'takip-paneli']) assert.ok(gorulen(r).includes(k), `${r}: ${k}`)
    // BEFORE: the antibiotic counter was a tool of infectious diseases alone
    assert.deepEqual(EN_ROL_ARACLARI.find((a) => a.anahtar === 'antibiyotik-sure')!.roller, ['infectious-diseases'])
    assert.deepEqual(goren('antibiyotik-sure'), DOKTORLAR)
    assert.equal(A.araclar.find((p) => p.anahtar === 'antibiyotik-sure')?.sinif, 'hekimler')
    // an allied profession and an account without a role do not see a doctor's tool
    for (const r of [...MUTTEFIKLER, null]) assert.ok(!gorulen(r).includes('antibiyotik-sure'), String(r))
    assert.deepEqual(gorulen(null), ['hasta-portali'], 'an account without a role: the base tool only')
  })

  it('GENERAL PRACTICE had the patient\'s page and nothing else; now it has ten tools', () => {
    // BEFORE (the shared set): no tool names family medicine
    assert.ok(!EN_ROL_ARACLARI.some((a) => a.roller?.includes('family-medicine')))
    assert.deepEqual(gorulen('family-medicine'), ['hasta-portali', 'antibiyotik-sure', 'inhaler-teknik', 'antikoagulan-vadeleri', 'otoskopi-notu', 'vertigo-notu', 'rtp-basamak', 'gb-four-at', 'gb-fracture-risk-link', 'gb-valproate-forms', 'takip-paneli'].filter((k) => gorulen('family-medicine').includes(k)))
    assert.deepEqual([...gorulen('family-medicine')].sort(), ['antibiyotik-sure', 'antikoagulan-vadeleri', 'gb-four-at', 'gb-fracture-risk-link', 'gb-valproate-forms', 'hasta-portali', 'inhaler-teknik', 'otoskopi-notu', 'rtp-basamak', 'takip-paneli', 'vertigo-notu'])
  })

  it('two more examples: cardio-thoracic surgery takes the heart operations; the audiologist gets the hearing tools', () => {
    assert.deepEqual(goren('kalp-damar-preop'), ['thoracic-surgery', 'cardiovascular-surgery'])
    assert.ok(gorulen('thoracic-surgery').includes('toraks-preop') && gorulen('thoracic-surgery').includes('kalp-damar-preop'))
    assert.deepEqual(gorulen('audiology').sort(), ['hasta-portali', 'odyometri-pta', 'otoskopi-notu', 'takip-paneli', 'vertigo-notu'])
    // the other allied professions: the patient's page only
    for (const r of MUTTEFIKLER.filter((x) => x !== 'audiology')) assert.deepEqual(gorulen(r), ['hasta-portali'], r)
  })

  it('every tool whose roles this country restates is seen by exactly the roles it names', () => {
    const beklenen: Record<string, string[]> = {
      'inhaler-teknik': ['family-medicine', 'respiratory-medicine', 'paediatrics'],
      'antikoagulan-vadeleri': ['family-medicine', 'internal-medicine', 'cardiovascular-surgery', 'cardiology', 'geriatric-medicine', 'haematology'],
      'rtp-basamak': ['emergency-medicine', 'family-medicine', 'sports-medicine'],
      'odyometri-pta': ['otolaryngology', 'audio-vestibular-medicine', 'audiology'],
      'otoskopi-notu': ['family-medicine', 'otolaryngology', 'audio-vestibular-medicine', 'audiology'],
      'vertigo-notu': ['emergency-medicine', 'family-medicine', 'otolaryngology', 'neurology', 'audio-vestibular-medicine', 'audiology'],
      'kalp-damar-preop': ['thoracic-surgery', 'cardiovascular-surgery'],
      'kur-sayaci': ['oncology', 'clinical-oncology', 'haematology'],
      'toksisite-listesi': ['oncology', 'clinical-oncology'],
      'genel-preop': ['general-surgery', 'oral-maxillofacial-surgery'],
      'yara-dren-izlem': ['paediatric-surgery', 'general-surgery', 'oral-maxillofacial-surgery'],
    }
    assert.deepEqual(Object.keys(GB_ARACLAR.gorenler ?? {}).sort(), [...Object.keys(beklenen), 'antibiyotik-sure'].sort())
    for (const [k, roller] of Object.entries(beklenen)) assert.deepEqual(goren(k).sort(), [...roller].sort(), k)
    // a paediatric tool stays with paediatrics: never cardiology, never general practice
    assert.deepEqual(goren('hedef-boy'), ['paediatrics'])
    assert.deepEqual(goren('doz-hesabi'), ['paediatrics'])
  })

  it('ROLE BY ROLE, THE GRID IS THE DECISIONS FILE\'S: every existing tool the file gives a role, and no other', () => {
    for (const s of [...KARARLAR.specialties, ...KARARLAR.clinicSpecialties]) {
      if (s.verdict === 'remove') continue
      const kit = gorulen(s.key).filter((k) => !k.startsWith('gb-')).sort()
      // A role that exists today: the file's `toolsOnToday`. A role this country ADDS has no "today": the file lists
      // what it should see under `tools` (existing tools, placeholders and proposals together), of which the existing,
      // switched-on ones count here — with the antibiotic counter, which the file's core set gives to EVERY doctor role
      // and leaves off the lists of the twelve added specialties.
      const acikKit = new Set(A.araclar.map((p) => p.anahtar).filter((k) => !k.startsWith('gb-')))
      const beklenen = new Set(s.verdict === 'add' ? (s.tools ?? []).filter((k) => acikKit.has(k)) : s.toolsOnToday ?? [])
      if (s.verdict === 'add' && DOKTORLAR.includes(s.key)) beklenen.add('antibiyotik-sure')
      // THE FOLLOW-UP LIST follows the kit's rule, not the file: it goes to every role that has a tool whose result
      // can be kept. The file gives it to doctors only; the audiologist has three such tools and therefore has it too.
      if (kit.some((k) => k !== 'hasta-portali' && k !== 'takip-paneli')) beklenen.add('takip-paneli'); else beklenen.delete('takip-paneli')
      assert.deepEqual(kit, [...beklenen].sort(), s.key)
    }
  })

  it('the follow-up list: every doctor role and the audiologist — exactly the roles that have a tool whose result can be kept', () => {
    assert.deepEqual(goren('takip-paneli'), [...DOKTORLAR, 'audiology'])
  })
})

describe('gb B: the country\'s own numbers, each from a source opened on 2026-10-10', () => {
  it('HEARING — five frequencies and four descriptors: British Society of Audiology, recommended procedure for pure-tone audiometry (August 2018), section 9, https://www.thebsa.org.uk/wp-content/uploads/2024/01/Recommended-Procedure-Pure-Tone-Audiometry-2018.pdf', () => {
    const x = hesabinAraci(A, 'otolaryngology', 'odyometri-pta')!
    const esikler = x.tanim.alanlar.filter((a) => /^e\d/.test(a.anahtar)).map((a) => a.anahtar)
    assert.deepEqual(esikler, ['e025', 'e05', 'e1', 'e2', 'e4'], '250, 500, 1000, 2000 and 4000 Hz')
    assert.deepEqual(kitAraci('odyometri-pta')!.alanlar.filter((a) => /^e\d/.test(a.anahtar)).map((a) => a.anahtar), ['e05', 'e1', 'e2', 'e4'], 'the kit averages four')
    const pta = (e: number[]) => calistir('odyometri-pta', { e025: e[0], e05: e[1], e1: e[2], e2: e[3], e4: e[4] })
    // THE AUDIT'S EXAMPLE: 10 dB at 250 Hz and 15, 20, 25, 40 dB. BEFORE: four frequencies, 25.0 dB, not called a hearing loss by the kit's first tables.
    const ornek = pta([10, 15, 20, 25, 40])
    assert.equal(sayi(ornek, 'pta'), 22)
    assert.equal(ornek.bant, 'bsa_hafif', 'the British average of five is 22 dB: mild hearing loss')
    assert.equal(kitAraci('odyometri-pta')!.hesapla({ e05: 15, e1: 20, e2: 25, e4: 40 }, { bugun: BUGUN, p: {} }).bant, 'hafifce', 'the kit alone: 25 dB, "slight", a grade the British document does not have')
    // the four ranges as the document prints them: 21–40, 41–70, 71–95, in excess of 95; no descriptor at 20 or below
    const bant = (ortalama: number) => pta([ortalama, ortalama, ortalama, ortalama, ortalama]).bant
    assert.deepEqual([20, 21, 40, 41, 70, 71, 95, 96].map(bant), ['bsa_yok', 'bsa_hafif', 'bsa_hafif', 'bsa_orta', 'bsa_orta', 'bsa_ileri', 'bsa_ileri', 'bsa_cok_ileri'])
    assert.equal(bant(-10), 'bsa_yok')
    // no response at a frequency is given the value 130 dB HL: all five at 130 is profound, and the field takes 130
    assert.equal(bant(130), 'bsa_cok_ileri')
    // an average between two whole numbers goes to the HIGHER descriptor (the document does not speak of it)
    assert.equal(sayi(pta([20, 20, 20, 20, 22]), 'pta'), 20.4)
    assert.equal(pta([20, 20, 20, 20, 22]).bant, 'bsa_hafif')
    assert.equal(pta([95, 95, 95, 95, 96]).bant, 'bsa_cok_ileri', '95.2 is in excess of 95')
    // the words on the screen
    const m = x.paket.metin
    assert.equal(m.bantlar!.bsa_hafif[D], 'Mild hearing loss (21 to 40 dB HL)')
    assert.equal(m.bantlar!.bsa_orta[D], 'Moderate hearing loss (41 to 70 dB HL)')
    assert.equal(m.bantlar!.bsa_ileri[D], 'Severe hearing loss (71 to 95 dB HL)')
    assert.equal(m.bantlar!.bsa_cok_ileri[D], 'Profound hearing loss (in excess of 95 dB HL)')
    assert.match(m.bantlar!.bsa_yok[D], /names none/)
    assert.doesNotMatch(JSON.stringify(m.bantlar), /normal/i, 'the document defines no "normal", and none is invented')
    assert.equal(m.alanlar.e025[D], 'Threshold at 0.25 kHz')
    assert.match(m.aciklama[D], /0\.25, 0\.5, 1, 2 and 4 kHz/)
    assert.match(m.aciklama[D], /British Society of Audiology/)
    assert.match(m.not[D], /not to be the only ground for providing hearing support/)
  })

  it('HEARING ASYMMETRY — nothing is stated: the national rule (NICE NG98, 1.3.2, https://www.nice.org.uk/guidance/NG98/chapter/recommendations) compares adjacent frequencies, which this tool cannot hold; the screen says so', () => {
    assert.equal(GB_ARACLAR.parametreler?.['odyometri-pta'], undefined)
    // the kit's own rule stands: the averages of the two ears more than 15 dB apart
    const s = (karsi: number) => calistir('odyometri-pta', { e025: 30, e05: 30, e1: 30, e2: 30, e4: 30, karsi_pta: karsi })
    assert.deepEqual(s(15).uyarilar, [])
    assert.deepEqual(s(14).uyarilar, ['asimetri'])
    assert.match(hesabinAraci(A, 'audiology', 'odyometri-pta')!.paket.metin.aciklama[D], /NICE guideline NG98 \(recommendation 1\.3\.2\) speaks of an asymmetry of 15 dB or more at any 2 adjacent test frequencies \(0\.5, 1, 2, 4 and 8 kHz\), which this tool cannot check\./)
  })

  it('RETURN AFTER CONCUSSION — six stages, day 0 the day of the injury, stage 5 not before day 15, stage 6 not before day 21: UK Concussion Guidelines for Non-Elite (Grassroots) Sport, November 2024, https://cdn.healthiertogether.nhs.uk/docs/680f52949de2dde32c2c7a15_uk-concussion-guidelines-for-grassroots-non-elite-sport---november-2024-update-061124084139.pdf', () => {
    const x = hesabinAraci(A, 'sports-medicine', 'rtp-basamak')!
    assert.deepEqual(x.tanim.alanlar.find((a) => a.anahtar === 'basamak')!.secenekler, ['asama1', 'asama2', 'asama3', 'asama4', 'asama5', 'asama6'])
    assert.deepEqual(GB_ARACLAR.tablolar!['rtp-basamak'].basamaklar.satirlar.map((s) => s.en_erken_gun), [0, 0, 0, 0, 15, 21], 'an earliest day for stages 5 and 6 only, as the guideline sets them')
    const s = (yaralanma: string, basamak: string) => calistir('rtp-basamak', { yaralanma, basamak }, '2026-10-22')
    // BEFORE: no step at all in this country — the days since the injury and nothing else (the kit holds no staging)
    assert.deepEqual(kitAraci('rtp-basamak')!.hesapla({ yaralanma: '2026-10-12' }, { bugun: '2026-10-22', p: {} }).uyarilar, ['basamak_tanimsiz'])
    // THE AUDIT'S EXAMPLE: full training recorded on day 10. Now warned, with the earliest date.
    const gun10 = s('2026-10-12', 'asama5')
    assert.equal(sayi(gun10, 'gun'), 10)
    assert.deepEqual(gun10.uyarilar, ['erken'])
    assert.deepEqual(gun10.tarihler, [{ anahtar: 'en_erken', tarih: '2026-10-27' }], 'day 15 after 12 October')
    // THE GUIDELINE'S OWN EXAMPLE 2: concussion on Saturday 3 June, earliest return to competition on Saturday 24 June (day 21)
    assert.deepEqual(calistir('rtp-basamak', { yaralanma: '2023-06-03', basamak: 'asama6' }, '2023-06-23').tarihler, [{ anahtar: 'en_erken', tarih: '2023-06-24' }])
    assert.deepEqual(calistir('rtp-basamak', { yaralanma: '2023-06-03', basamak: 'asama6' }, '2023-06-23').uyarilar, ['erken'], 'day 20: before the earliest day')
    assert.deepEqual(calistir('rtp-basamak', { yaralanma: '2023-06-03', basamak: 'asama6' }, '2023-06-24').uyarilar, [], 'day 21')
    // stage 5 on day 14 and on day 15
    assert.deepEqual(calistir('rtp-basamak', { yaralanma: '2023-06-03', basamak: 'asama5' }, '2023-06-17').uyarilar, ['erken'])
    assert.deepEqual(calistir('rtp-basamak', { yaralanma: '2023-06-03', basamak: 'asama5' }, '2023-06-18').uyarilar, [])
    // stages 1 to 4: the guideline sets no earliest day, so none is shown and none is warned of
    for (const b of ['asama1', 'asama2', 'asama3', 'asama4']) { assert.deepEqual(s('2026-10-22', b).uyarilar, [], b); assert.deepEqual(s('2026-10-22', b).tarihler, [], b) }
    // no stage chosen: no result (the doctor chooses the stage)
    assert.equal(calistir('rtp-basamak', { yaralanma: '2026-10-12' }, '2026-10-22').tamam, false)
    const m = x.paket.metin
    assert.equal(m.ad[D], 'Return to activity and sport after concussion')
    assert.match(m.bantlar!.asama5[D], /^Stage 5: .*\(not before day 15\)$/)
    assert.match(m.bantlar!.asama6[D], /^Stage 6: .*\(not before day 21\)$/)
    assert.deepEqual(m.secenekler!.basamak, m.bantlar)
    assert.match(m.aciklama[D], /14 days free of symptoms at rest, which this tool cannot check/)
    assert.match(m.not[D], /a minimum, not a clearance/)
  })

  it('EXPECTED HEIGHT — 7 cm either side: UK growth charts 2–18 years (© RCPCH 2012), boys https://www.sign.ac.uk/media/1436/boys_2-18_years_growth_chart.pdf and girls https://www.rcpch.ac.uk/sites/default/files/Girls_2-18_years_growth_chart.pdf', () => {
    assert.deepEqual(GB_ARACLAR.parametreler!['hedef-boy'], { aralik_cm: 7 })
    // THE AUDIT'S EXAMPLE: mother 160 cm, father 180 cm, a boy. BEFORE (the kit states no range): 176.5 cm and nothing else.
    assert.deepEqual(kitAraci('hedef-boy')!.hesapla({ cinsiyet: 'erkek', anne: 160, baba: 180 }, { bugun: BUGUN, p: {} }).sayilar.map((x) => x.anahtar), ['hedef'])
    const erkek = calistir('hedef-boy', { cinsiyet: 'erkek', anne: 160, baba: 180 })
    assert.deepEqual([sayi(erkek, 'hedef'), sayi(erkek, 'alt'), sayi(erkek, 'ust')], [176.5, 169.5, 183.5])
    const kiz = calistir('hedef-boy', { cinsiyet: 'kiz', anne: 160, baba: 180 })
    assert.deepEqual([sayi(kiz, 'hedef'), sayi(kiz, 'alt'), sayi(kiz, 'ust')], [163.5, 156.5, 170.5])
    const aciklama = hesabinAraci(A, 'paediatrics', 'hedef-boy')!.paket.metin.aciklama[D]
    assert.match(aciklama, /7 cm either side/)
    assert.match(aciklama, /their target can differ from this one/, 'the charts read their target from the parents\' centiles: the screen says the two can differ')
  })

  it('DAS28 — the four bands NICE gives (technology appraisal guidance TA195, paragraph 2.10, https://www.nice.org.uk/guidance/ta195/chapter/2-clinical-need-and-practice): above 5.1 high, 3.2 to 5.1 moderate, below 3.2 low, below 2.6 remission', () => {
    const b = GB_ARACLAR.uyarlama!.das28.bantlar!
    const sinirlar = bantSinirlari(kitAraci('das28')!, b)!
    const bant = (deger: number) => bantBul(b, sinirlar, deger)
    assert.deepEqual([2.59, 2.6, 3.19, 3.2, 5.1, 5.11].map(bant), ['remisyon', 'dusuk', 'dusuk', 'orta', 'orta', 'yuksek'])
    const x = hesabinAraci(A, 'rheumatology', 'das28')!
    assert.deepEqual(x.tanim.cikti.bantlar, ['remisyon', 'dusuk', 'orta', 'yuksek'])
    assert.equal(x.paket.metin.bantlar!.orta[D], 'Moderate disease activity (3.2 to 5.1)')
    assert.match(x.paket.metin.aciklama[D], /NICE gives for DAS28 scores \(technology appraisal guidance TA195, paragraph 2\.10\)/, 'NICE is credited on the screen')
    // the tool as a doctor runs it, in this country's unit for C-reactive protein (mg/L): 4 tender, 2 swollen, global 50, CRP 10 → 4.04, moderate
    const s = calistir('das28', { varyant: 'crp', tjc: 4, sjc: 2, pga: 50, crp: 10 })
    assert.equal(Math.round(sayi(s, 'das28')! * 100) / 100, 4.04)
    assert.equal(s.bant, 'orta')
  })

  it('PSA — micrograms per litre, and nothing stated for the caution on two values close together (no national source states a number of days; the kit\'s 90 stand)', () => {
    assert.equal(GB_ARACLAR.labBirimleri.psa, 'ug/L')
    assert.equal(A.birimler['ug/L'][D], 'µg/L')
    assert.equal(GB_ARACLAR.parametreler?.['psa-hizi'], undefined)
    assert.deepEqual(calistir('psa-hizi', { onceki_deger: 4.5, onceki_tarih: '2026-08-01', son_deger: 5, son_tarih: '2026-09-12' }).uyarilar, ['kisa_aralik'])
  })

  it('SKIN SCORES — no severity band of this country\'s own: no national body\'s bands were found for PASI (NICE pairs its treatment criteria with another index), EASI or SCORAD', () => {
    for (const k of ['pasi', 'easi', 'scorad']) assert.equal(GB_ARACLAR.uyarlama?.[k], undefined, k)
    assert.deepEqual(hesabinAraci(A, 'dermatology', 'pasi')!.tanim.cikti.bantlar, [], 'PASI: the score and no severity word')
  })

  it('THE DOSE CALCULATOR IS BACK ON (the owner\'s order of 2026-10-10), for paediatrics, and writes a dose without a zero after the last figure', () => {
    assert.ok(A.araclar.some((p) => p.anahtar === 'doz-hesabi'))
    assert.ok(!A.yuvalar.some((y) => y.anahtar === 'doz-hesabi'))
    assert.deepEqual(A.dozYazimi, { sondaSifir: false })
    // the correction job's example: 16 kg at 10 mg/kg for one dose, a liquid of 160 mg in 5 mL
    const s = calistir('doz-hesabi', { kilo: 16, mg_kg: 10, mod: 'doz', doz_sayisi: 1, kons_mg: 160, kons_ml: 5 })
    assert.equal(sayi(s, 'doz_mg'), 160)
    assert.equal(sayi(s, 'doz_ml'), 5)
    // 4 kg at 2 mg/kg, 50 mg in 1 mL: 0.16 mL, not rounded to 0.2, with both cautions
    const kucuk = calistir('doz-hesabi', { kilo: 4, mg_kg: 2, mod: 'doz', doz_sayisi: 1, kons_mg: 50, kons_ml: 1 })
    assert.equal(sayi(kucuk, 'doz_ml'), 0.16)
    for (const u of ['ml_yuvarlanmadi', 'ml_kucuk']) assert.ok(kucuk.uyarilar.includes(u), u)
  })
})

describe('gb C: the tools only this country has', () => {
  it('three tools, each with this country\'s code, each switched on, each on the register no other country may name', () => {
    assert.deepEqual([...GB_OZEL_ANAHTARLAR], ['gb-four-at', 'gb-fracture-risk-link', 'gb-valproate-forms'])
    assert.deepEqual(GB_KENDI_ARACLARI.map((p) => p.anahtar).sort(), [...GB_OZEL_ANAHTARLAR])
    assert.deepEqual(ulkeyeOzelAnahtarlar(A, 'gb'), [...GB_OZEL_ANAHTARLAR])
    assert.deepEqual(oku<Record<string, string[]>>('countries/yasak-araclar.json').gb, [...GB_OZEL_ANAHTARLAR])
    for (const k of GB_OZEL_ANAHTARLAR) {
      assert.ok(A.araclar.some((p) => p.anahtar === k), `${k} is switched on`)
      assert.ok(!A.yuvalar.some((y) => y.anahtar === k), `${k} is not a placeholder`)
      assert.equal(kitAraci(k), null, `${k} is no tool of the kit`)
      assert.ok(goren(k).length > 0, k)
    }
    assert.deepEqual((A.kendiAraclari ?? []).map((t) => t.anahtar), GB_KENDI_TANIMLARI.map((t) => t.anahtar))
  })

  it('SWITCHED ON WITHOUT A CLINICIAN\'S SIGN-OFF: the list (./onaysiz-araclar.json) and the pack\'s own switched-on tools match exactly', () => {
    const liste = oku<{ araclar: { anahtar: string; ad: string; klinisyen: string | null; kaynak: string; lisans: string; acildi: string }[]; ayrica: { anahtar: string }[] }>('countries/gb/onaysiz-araclar.json')
    const acik = A.araclar.filter((p) => p.anahtar.startsWith('gb-')).map((p) => p.anahtar).sort()
    assert.deepEqual(liste.araclar.map((x) => x.anahtar).sort(), acik)
    for (const x of liste.araclar) {
      assert.equal(x.ad, ad(x.anahtar), `${x.anahtar}: the list names the tool as the screen does`)
      assert.equal(x.klinisyen, null, `${x.anahtar}: nobody has signed it; a signed tool leaves the list`)
      assert.match(x.kaynak, /https:\/\//)
      assert.ok(x.lisans.trim() && x.acildi === '2026-10-10')
    }
    // the shared tool switched back on by the same order is named beside the list, and is on
    assert.deepEqual(liste.ayrica.map((x) => x.anahtar), ['doz-hesabi'])
    assert.ok(A.araclar.some((p) => p.anahtar === 'doz-hesabi'))
  })

  it('4AT — the scores of the authors\' own user guide (https://www.the4at.com/userguide) and the three categories of their FAQ (https://www.the4at.com/4at-faq)', () => {
    assert.deepEqual(GB_4AT_PUANLARI, { uyaniklik: { normal: 0, anormal: 4 }, amt4: { hatasiz: 0, bir_hata: 1, iki_veya_fazla: 2 }, dikkat: { yedi_veya_fazla: 0, yediden_az: 1, test_edilemez: 2 }, akut_degisim: { hayir: 0, evet: 4 } })
    const s = (g: AracGirdisi) => calistir('gb-four-at', g)
    const temiz = { uyaniklik: 'normal', amt4: 'hatasiz', dikkat: 'yedi_veya_fazla', akut_degisim: 'hayir' }
    assert.equal(sayi(s(temiz), 'toplam'), 0)
    assert.equal(s(temiz).bant, 'olasi_degil')
    // 1 to 3, and 4 or above
    assert.equal(s({ ...temiz, amt4: 'bir_hata' }).bant, 'olasi_bilissel')
    assert.equal(sayi(s({ ...temiz, amt4: 'iki_veya_fazla', dikkat: 'yediden_az' }), 'toplam'), 3)
    assert.equal(s({ ...temiz, amt4: 'iki_veya_fazla', dikkat: 'yediden_az' }).bant, 'olasi_bilissel')
    assert.equal(s({ ...temiz, uyaniklik: 'anormal' }).bant, 'olasi_deliryum')
    // the highest total is 12, and the screen writes it "out of 12"
    const hepsi = s({ uyaniklik: 'anormal', amt4: 'iki_veya_fazla', dikkat: 'test_edilemez', akut_degisim: 'evet' })
    assert.equal(sayi(hepsi, 'toplam'), 12)
    assert.equal(hepsi.sayilar[0].enCok, 12)
    // AN ITEM LEFT EMPTY IS NEVER COUNTED AS 0: no score until all four are answered
    for (const k of Object.keys(temiz)) assert.equal(s({ ...temiz, uyaniklik: 'anormal', [k]: null }).tamam, false, k)
    assert.equal(s({ ...temiz, amt4: 'baska' }).tamam, false, 'an answer the test does not have')
    // every answer of every item is offered and named, with its score in the name
    const x = hesabinAraci(A, 'geriatric-medicine', 'gb-four-at')!
    for (const [madde, puanlar] of Object.entries(GB_4AT_PUANLARI)) for (const [secenek, puan] of Object.entries(puanlar)) assert.match(x.paket.metin.secenekler![madde][secenek][D], new RegExp(`\\(${puan}\\)$`), `${madde}.${secenek}`)
  })

  it('4AT — THE AUTHORS\' SIX WORKED CASES (https://www.the4at.com/4atcases): each item\'s score and the total, as their page gives them', () => {
    // [alertness, AMT4, months backwards, acute change] → total, and what the page says the total indicates
    const VAKALAR: readonly [string, [number, number, number, number], number, string][] = [
      ['case 1', [4, 2, 2, 4], 12, 'olasi_deliryum'],
      ['case 2', [0, 1, 1, 4], 6, 'olasi_deliryum'],
      ['case 3', [0, 2, 1, 0], 3, 'olasi_bilissel'],
      ['case 4', [0, 2, 2, 0], 4, 'olasi_deliryum'],
      ['case 5', [0, 0, 0, 4], 4, 'olasi_deliryum'],
      ['case 6', [4, 2, 1, 4], 11, 'olasi_deliryum'],
    ]
    const secenek = (madde: keyof typeof GB_4AT_PUANLARI, puan: number): string => {
      // the answer of an item that carries this score (for AMT4 and attention a score names one answer)
      const bulunan = Object.entries(GB_4AT_PUANLARI[madde]).filter(([, p]) => p === puan).map(([k]) => k)
      assert.equal(bulunan.length, 1, `${madde}: ${puan}`)
      return bulunan[0]
    }
    for (const [vaka, [u, a, d, c], toplam, bant] of VAKALAR) {
      const s = GB_FOUR_AT.hesapla({ uyaniklik: secenek('uyaniklik', u), amt4: secenek('amt4', a), dikkat: secenek('dikkat', d), akut_degisim: secenek('akut_degisim', c) }, { bugun: BUGUN, p: {} })
      assert.equal(s.tamam, true, vaka)
      assert.equal(s.sayilar[0].deger, toplam, `${vaka}: total`)
      assert.equal(s.bant, bant, vaka)
    }
  })

  it('4AT — free on its authors\' own notice (CC BY 4.0, https://www.the4at.com/attribution); the attribution of an adapted version stands under every result and in the copied summary', () => {
    const x = hesabinAraci(A, 'internal-medicine', 'gb-four-at')!
    assert.equal(x.paket.lisans?.durum, 'serbest')
    const bildirim = lisansBildirimi(x, D)
    for (const parca of ['Adapted from the 4AT © 2011–2014 Alasdair MacLullich, Tracy Ryan and Helen Cash.', 'Licensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/.', 'Official and current version: https://www.the4at.com/.', 'This version has been modified. Changes:', 'The published validation evidence for the official 4AT should not be assumed to apply to this modified version.', 'No warranty is given as to accuracy or fitness for purpose.']) assert.ok(bildirim.includes(parca), parca)
    const g = { uyaniklik: 'normal', amt4: 'bir_hata', dikkat: 'yediden_az', akut_degisim: 'evet' }
    const m = A.metinler[D]!
    const y = { sayi: (d: number, o: number) => d.toFixed(o), tarih: (iso: string) => iso, birim: (k: string) => k }
    const sonuc = aracCalistir(x, g, BUGUN, A)
    const ozet = aracOzeti(x, g, sonuc, D, m, y, { birimler: GB_PAKETI.uygulama!.birimler, lab: A.labBirimleri, sayi: GB_PAKETI.bicim })
    assert.match(ozet, /^4AT: rapid assessment test for delirium\n/)
    assert.ok(ozet.includes(`4AT score: ${sayiMetni(sonuc.sayilar[0], m, y)}`))
    assert.match(sayiMetni(sonuc.sayilar[0], m, y), /^6\D+12$/)
    assert.ok(ozet.endsWith(bildirim), 'the notice goes wherever the result goes')
    assert.deepEqual(goren('gb-four-at'), DOKTORLAR, 'every doctor role, and no allied profession')
  })

  it('VALPROATE — the form and the annual review: Medicines and Healthcare products Regulatory Agency, "Valproate – reproductive risks", last updated 23 September 2025, https://www.gov.uk/guidance/valproate-reproductive-risks', () => {
    const s = (g: AracGirdisi, bugun = BUGUN) => calistir('gb-valproate-forms', g, bugun)
    // a female patient under 55: the form at the start and at each annual review → the day one year after the last form
    const kadin = s({ hasta: 'kadin', form_tarihi: '2026-03-10' })
    assert.equal(kadin.bant, 'kadin_yillik')
    assert.deepEqual(kadin.tarihler, [{ anahtar: 'sonraki_yillik', tarih: '2027-03-10' }])
    assert.deepEqual(kadin.uyarilar, [])
    // on the day itself nothing is overdue; the day after, it is
    assert.deepEqual(s({ hasta: 'kadin', form_tarihi: '2025-10-10' }).uyarilar, [])
    assert.deepEqual(s({ hasta: 'kadin', form_tarihi: '2025-10-09' }).uyarilar, ['gozden_gecirme_gecikti'])
    // a male patient under 55: the form is completed once, at the start — no next day, no overdue warning, however long ago
    const erkek = s({ hasta: 'erkek', form_tarihi: '2020-01-01' })
    assert.equal(erkek.bant, 'erkek_baslangic')
    assert.deepEqual([erkek.tarihler, erkek.uyarilar], [[], []])
    // nothing without the patient and the date; a form dated after today has not been completed
    assert.equal(s({ hasta: 'kadin' }).tamam, false)
    assert.equal(s({ form_tarihi: '2026-03-10' }).tamam, false)
    assert.equal(s({ hasta: 'kadin', form_tarihi: '2026-10-11' }).tamam, false)
    // the tick about the Pregnancy Prevention Programme is there for a female patient only
    const x = hesabinAraci(A, 'neurology', 'gb-valproate-forms')!
    assert.deepEqual(x.tanim.alanlar.find((a) => a.anahtar === 'gebelik_onleme')!.kosul, { alan: 'hasta', degerler: ['kadin'] })
    assert.equal(GB_VALPROATE.tur, 'takvim')
    assert.deepEqual(goren('gb-valproate-forms'), ['family-medicine', 'neurology', 'psychiatry', 'child-adolescent-psychiatry'])
    // no medicine dose, and no form of the regulator, is in the tool's words
    const yazi = JSON.stringify(x.paket.metin)
    assert.doesNotMatch(yazi, /\bmg\b|\bdose of\b/i)
    assert.equal(x.paket.lisans?.durum, 'serbest')
    assert.match(lisansBildirimi(x, D), /Open Government Licence v3\.0/)
  })

  it('FRACTURE RISK — a link to the owner\'s calculator (https://www.fraxplus.org/calculation-tool) and nothing else: no field, no arithmetic, nothing kept', () => {
    const x = hesabinAraci(A, 'geriatric-medicine', 'gb-fracture-risk-link')!
    assert.equal(x.tanim.tur, 'baglanti')
    assert.deepEqual(x.tanim.alanlar, [])
    assert.equal(x.paket.baglanti?.adres, GB_FRAX_ADRESI)
    assert.equal(GB_FRAX_ADRESI, 'https://www.fraxplus.org/calculation-tool')
    assert.equal(disAdresGecerliMi(GB_FRAX_ADRESI), true, 'a fixed https address: no query, nothing of a patient can be put into it')
    assert.equal(aracCalistir(x, {}, BUGUN, A).tamam, false, 'it works nothing out')
    assert.deepEqual(goren('gb-fracture-risk-link'), DOKTORLAR)
    assert.match(x.paket.metin.aciklama[D], /nothing of the algorithm is in this product/)
    assert.match(lisansBildirimi(x, D), /registered trademarks/)
    // no mechanism of the country's own stands behind the tile
    assert.ok(!GB_KENDI_TANIMLARI.some((t) => t.anahtar === 'gb-fracture-risk-link'))
  })

  it('every mechanism of the country\'s own is the one the pack runs, and names its source', () => {
    for (const t of GB_KENDI_TANIMLARI) {
      const p = A.araclar.find((q) => q.anahtar === t.anahtar)!
      assert.equal(paketinTanimi(A, p), t, t.anahtar)
      assert.match(t.kaynak ?? '', /2026|2025/, `${t.anahtar}: the citation carries its date`)
    }
  })
})

describe('gb D: what stays off', () => {
  it('the four tools the owner keeps off are placeholders: ESI triage, the report outline, both kidney tools — and only the dose calculator came back', () => {
    const kapali = ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi']
    assert.deepEqual(Object.keys(GB_ARACLAR.kapali).sort(), kapali)
    for (const k of kapali) { assert.ok(!A.araclar.some((p) => p.anahtar === k), k); assert.ok(A.yuvalar.some((y) => y.anahtar === k), k); for (const r of [null, ...ROLLER]) assert.equal(hesabinAraci(A, r, k), null, `${k}: ${r}`) }
    // NO TOOL THAT WAS OFF IS ON, but the dose calculator: the switched-on tools are the set's tools minus the four, the two screens, and this country's three
    assert.deepEqual(A.araclar.map((p) => p.anahtar).sort(), [...EN_ROL_ARACLARI.map((a) => a.anahtar).filter((k) => !kapali.includes(k)), 'hasta-portali', 'takip-paneli', ...GB_OZEL_ANAHTARLAR].sort())
    assert.equal(A.araclar.length, 45)
  })

  it('EVERY TOOL THE DECISIONS MARK "remove" IS OFF in this country', () => {
    const kaldirilan = KARARLAR.tools.filter((t) => t.verdict === 'remove').map((t) => t.key)
    assert.deepEqual(kaldirilan.sort(), ['esi-triyaj', 'family-follow-up-panel', 'iltihap-lab-izlem', 'obstetric-follow-up-panel', 'paediatric-follow-up-panel'])
    for (const k of kaldirilan) { assert.ok(!A.araclar.some((p) => p.anahtar === k), `${k} is switched on`); for (const r of [null, ...ROLLER]) assert.equal(hesabinAraci(A, r, k), null, `${k}: ${r}`) }
  })

  it('no placeholder is given to the role this country took out', () => {
    for (const y of A.yuvalar) assert.ok(!(y.roller ?? []).includes('clinic-dermatology'), y.anahtar)
    for (const p of A.araclar) assert.ok(!(p.roller ?? []).includes('clinic-dermatology'), p.anahtar)
  })
})

describe('gb E: licence states', () => {
  it('"free" is stated for the three tools whose rights holder\'s own notice was opened, and for no other; the two that need permission say so', () => {
    const belirtilen = A.araclar.filter((p) => p.lisans !== undefined).map((p) => p.anahtar).sort()
    assert.deepEqual(belirtilen, [...GB_OZEL_ANAHTARLAR])
    for (const p of A.araclar.filter((q) => q.lisans)) { assert.ok(LISANS_ACIK.includes(p.lisans!.durum), p.anahtar); assert.match(p.lisans!.kaynak ?? '', /2026-10-10/, `${p.anahtar}: where and when the notice was read`) }
    assert.deepEqual(A.yuvalar.filter((y) => y.lisans).map((y) => [y.anahtar, y.lisans!.durum]).sort(), [['esi-triyaj', 'izin-gerekli'], ['rapor-taslagi', 'izin-gerekli']])
    assert.notEqual(A.lisansTam, true, 'this country does not yet state the licence of every shared tool (countries/lisans-borcu.json)')
    assert.ok(oku<{ ulkeler: string[] }>('countries/lisans-borcu.json').ulkeler.includes('gb'))
  })

  it('no tool of an instrument the audit found closed is built: not the tools of QRISK3, UKMEC, \'MUST\' or FRAX itself, and no risk score or level for self-harm', () => {
    const anahtarlar = { acik: A.araclar.map((p) => p.anahtar) }
    for (const yasak of [/qrisk/, /ukmec|contraception/, /\bmust\b|malnutrition/, /self-harm|suicide|safety-plan/]) assert.deepEqual(anahtarlar.acik.filter((k) => yasak.test(k)), [], String(yasak))
    // the one mention of FRAX is the link-out tile
    assert.deepEqual(anahtarlar.acik.filter((k) => /frax|fracture/.test(k)), ['gb-fracture-risk-link'])
    const metin = JSON.stringify(A.araclar.map((p) => p.metin)).toLowerCase()
    for (const kelime of ['self-harm', 'suicide', 'low risk', 'medium risk', 'high risk']) assert.ok(!metin.includes(kelime), kelime)
  })
})

describe('gb F: every NICE-derived item is on the list for the lawyer (./nice-kaynakli.json)', () => {
  it('each entry stands on the line it names, with its mark and its guidance number; no mark in the folder is without an entry', () => {
    const liste = oku<{ ogeler: { dosya: string; satir: number; kilavuz: string; adres: string; alinan: string }[] }>('countries/gb/nice-kaynakli.json')
    assert.equal(liste.ogeler.length, 4)
    for (const o of liste.ogeler) {
      const satir = readFileSync(join(KOK, o.dosya), 'utf8').split('\n')[o.satir - 1] ?? ''
      assert.match(satir, /NICE-KAYNAKLI:/, `${o.dosya}:${o.satir}`)
      for (const no of o.kilavuz.split(', ')) assert.ok(satir.includes(no), `${o.dosya}:${o.satir} names ${no}`)
      assert.match(o.adres, /^https:\/\/www\.nice\.org\.uk\//)
      assert.ok(o.alinan.trim())
    }
    const dizin = join(KOK, 'countries/gb')
    const isaretler = readdirSync(dizin, { recursive: true, encoding: 'utf8' }).filter((f) => /\.ts$/.test(f) && !/\.test\.ts$/.test(f)).flatMap((f) => readFileSync(join(dizin, f), 'utf8').split('\n').map((l, i) => ({ dosya: `countries/gb/${f}`, satir: i + 1, l })).filter((x) => /NICE-KAYNAKLI:/.test(x.l)))
    assert.deepEqual(isaretler.map((x) => `${x.dosya}:${x.satir}`).sort(), liste.ogeler.map((o) => `${o.dosya}:${o.satir}`).sort())
  })
})
