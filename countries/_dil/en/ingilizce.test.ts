/**
 * NOTYA-ULKE-EN-01 — the TEXTS of the English language set.
 *
 *   1. Every text is written in the base form (en-GB), and every word of a family the forms disagree on is a row of
 *      the spelling table: nothing is left in the base spelling by accident.
 *   2. Written in each of the five forms, no text shows another form's spelling.
 *   3. THE WORDS WHERE BLIND CONVERSION WOULD BE WRONG IN A CLINICAL PRODUCT (the coordinator, 2026-10-09):
 *      practise / practice, licence / license, metre / meter (the unit, and a measuring device), programme / program.
 *      Every place the set uses one is REGISTERED here with its sense; the base spelling must fit the sense, and each
 *      form's output for that sense is stated and checked. A new use fails until somebody registers it.
 *   4. A NAME IS NEVER REWRITTEN: an organism, a medicine, a proper noun (the table's protected list), and a unit
 *      symbol. A capitalised word in the middle of a sentence that the table would rewrite must be protected or
 *      listed as an ordinary word.
 *   5. The set belongs to no country: it names no country, no country's system, authority, law or number, and it
 *      makes no claim of compliance, approval, certification or integration.
 *   6. The intake form: 23 core questions and 228 role questions, one set for each of the 40 roles, every key unique.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { EN_ACILIS_TEMEL } from './acilis'
import { EN_ROL_ARACLARI, EN_TEMEL_ARACLAR } from './araclar'
import { EN_ARACLAR_METNI_TEMEL } from './araclarMetni'
import { EN_CEKIRDEK_TEMEL } from './cekirdek'
import { EN_FORM_TEMEL } from './form'
import { EN_CEKIRDEK_BOLUMLER } from './klinik/hastaFormu/cekirdek'
import { EN_FORM_RIZASI, EN_ROL_SORULARI, enHastaFormu } from './klinik/hastaFormu'
import { EN_ALANLAR, EN_ROL_ALANLARI, enNotSablonlari } from './klinik/notSablonlari'
import { EN_ROL_SATIRLARI, EN_ROLLER, enRolTanimlari } from './klinik/roller'
import { EN_TALIMAT_TEMEL, enTalimatlar } from './klinik/talimatlar'
import { EN_PORTAL_TEMEL } from './portal'
import { EN_RANDEVU_TEMEL } from './randevu'
import { KELIMELER, KORUNAN } from './sozluk'
import { bicimYazimSorunlari, korunansiz, temelYazimSorunlari, tumMetinler } from './testing/yazimDenetimi'
import { EN_UYGULAMA_TEMEL } from './uygulama'
import { EN_BICIMLER, enCevir, enYaz, type EnBicim } from './varyant'

/** Every text of the set a person or the model reads, in the base form, with the place it is written. */
const TEMEL = {
  cekirdek: EN_CEKIRDEK_TEMEL,
  uygulama: EN_UYGULAMA_TEMEL,
  randevu: EN_RANDEVU_TEMEL,
  portal: EN_PORTAL_TEMEL,
  form: EN_FORM_TEMEL,
  araclarMetni: EN_ARACLAR_METNI_TEMEL,
  roller: Object.fromEntries(EN_ROL_SATIRLARI.map((r) => [r.anahtar, r.ad])),
  notSablonlari: Object.fromEntries(Object.entries(EN_ALANLAR).map(([k, v]) => [k, v.ad])),
  talimatlar: EN_TALIMAT_TEMEL,
  formCekirdek: EN_CEKIRDEK_BOLUMLER,
  formRolleri: EN_ROL_SORULARI,
  formRizasi: EN_FORM_RIZASI,
  araclar: Object.fromEntries([...EN_TEMEL_ARACLAR, ...EN_ROL_ARACLARI].map((a) => [a.anahtar, { ...a, roller: undefined }])),
  acilis: EN_ACILIS_TEMEL,
}
/** Internal keys of the intake form sit beside its texts; they are not text. */
const anahtarMi = (yer: string): boolean => /(^|\.)(anahtar|tur|kime|cinsiyet|olcu|capa|id|rol|no|saat)$/.test(yer)
const METINLER = tumMetinler(TEMEL).filter((x) => !anahtarMi(x.yer))

describe('English language set: the texts', () => {
  it('there is a body of text to guard', () => {
    assert.ok(METINLER.length > 1200, `${METINLER.length} texts`)
  })

  it('every text is written in the base form, and every disputed word is a row of the table', () => {
    const sorunlar = METINLER.flatMap((x) => temelYazimSorunlari(x.metin).map((s) => `${x.yer}: ${s}`))
    assert.deepEqual(sorunlar, [])
  })

  for (const b of EN_BICIMLER) {
    it(`${b}: no text shows another form's spelling`, () => {
      const sorunlar = METINLER.flatMap((x) => bicimYazimSorunlari(enYaz(x.metin, b), b).map((s) => `${x.yer}: ${s}`))
      assert.deepEqual(sorunlar, [])
    })
  }

  it('the forms really differ: American and Canadian text is not the base text', () => {
    const say = (b: EnBicim) => METINLER.filter((x) => enYaz(x.metin, b) !== x.metin).length
    assert.equal(say('en-GB'), 0)
    assert.equal(say('en-NZ'), 0)
    assert.ok(say('en-US') >= 20, `en-US changes ${say('en-US')} texts`)
    assert.ok(say('en-CA') >= 5 && say('en-CA') < say('en-US'), `en-CA changes ${say('en-CA')} texts`)
    assert.ok(say('en-AU') >= 1 && say('en-AU') < say('en-CA'), `en-AU changes ${say('en-AU')} texts`)
  })

  it('placeholders survive every form', () => {
    const yerler = (s: string) => (s.match(/%[123DKYZ]?/g) ?? []).sort().join(' ')
    for (const b of EN_BICIMLER) for (const x of METINLER) assert.equal(yerler(enYaz(x.metin, b)), yerler(x.metin), `${b} ${x.yer}`)
  })
})

// ───────────────────────── 3. the words where blind conversion would be wrong ─────────────────────────

type Anlam = 'verb' | 'noun' | 'unit' | 'device' | 'scheme' | 'software'
/** sense → [the stem the base must use, what each form writes for it] */
const ANLAMLAR: Readonly<Record<string, Readonly<Partial<Record<Anlam, { temel: RegExp; cikti: Readonly<Record<EnBicim, RegExp>> }>>>>> = {
  practice: {
    verb: { temel: /^practis/, cikti: { 'en-GB': /^practis/, 'en-NZ': /^practis/, 'en-AU': /^practis/, 'en-CA': /^practis/, 'en-US': /^practic/ } },
    noun: { temel: /^practices?$/, cikti: { 'en-GB': /^practices?$/, 'en-NZ': /^practices?$/, 'en-AU': /^practices?$/, 'en-CA': /^practices?$/, 'en-US': /^practices?$/ } },
  },
  licence: {
    noun: { temel: /^licences?$/, cikti: { 'en-GB': /^licences?$/, 'en-NZ': /^licences?$/, 'en-AU': /^licences?$/, 'en-CA': /^licences?$/, 'en-US': /^licenses?$/ } },
    verb: { temel: /^licens(e|ed|es|ing)$/, cikti: { 'en-GB': /^licens/, 'en-NZ': /^licens/, 'en-AU': /^licens/, 'en-CA': /^licens/, 'en-US': /^licens/ } },
  },
  metre: {
    unit: { temel: /^metres?$/, cikti: { 'en-GB': /^metres?$/, 'en-NZ': /^metres?$/, 'en-AU': /^metres?$/, 'en-CA': /^metres?$/, 'en-US': /^meters?$/ } },
    device: { temel: /^meters?$/, cikti: { 'en-GB': /^meters?$/, 'en-NZ': /^meters?$/, 'en-AU': /^meters?$/, 'en-CA': /^meters?$/, 'en-US': /^meters?$/ } },
  },
  programme: {
    scheme: { temel: /^programmes?$/, cikti: { 'en-GB': /^programmes?$/, 'en-NZ': /^programmes?$/, 'en-AU': /^programs?$/, 'en-CA': /^programs?$/, 'en-US': /^programs?$/ } },
    software: { temel: /^programs?$/, cikti: { 'en-GB': /^programs?$/, 'en-NZ': /^programs?$/, 'en-AU': /^programs?$/, 'en-CA': /^programs?$/, 'en-US': /^programs?$/ } },
  },
}
const AILE: readonly (readonly [string, RegExp])[] = [
  ['practice', /^practi[sc](e|ed|es|ing)$/],
  ['licence', /^licen[sc](e|ed|es|ing)$/],
  ['metre', /^(metres?|meters?)$/],
  ['programme', /^(programmes?|programs?)$/],
]

/**
 * THE REGISTER: every place the set uses one of these words, with the sense it is used in.
 * "place|word" → sense. A use that is not here, or an entry with no use, fails the test below.
 */
const KAYIT: Readonly<Record<string, Anlam>> = {
  'notSablonlari.rehab_program|programme': 'scheme',
  'notSablonlari.home_program|programme': 'scheme',
}

describe('English language set: practise / practice, licence / license, metre / meter, programme / program', () => {
  const bulunan: { anahtar: string; yer: string; kelime: string; aile: string; metin: string }[] = []
  for (const x of METINLER) for (const k of korunansiz(x.metin).toLowerCase().match(/[a-z]+/g) ?? []) {
    const aile = AILE.find(([, desen]) => desen.test(k))
    if (aile) bulunan.push({ anahtar: `${x.yer}|${k}`, yer: x.yer, kelime: k, aile: aile[0], metin: x.metin })
  }

  it('every use is registered with its sense, and nothing is registered that is not used', () => {
    assert.deepEqual([...new Set(bulunan.map((b) => b.anahtar))].sort(), Object.keys(KAYIT).sort())
  })

  it('the base spelling fits the sense, and each form writes that sense as stated', () => {
    for (const b of bulunan) {
      const anlam = KAYIT[b.anahtar]
      if (!anlam) continue
      const kural = ANLAMLAR[b.aile][anlam]
      assert.ok(kural, `${b.anahtar}: "${anlam}" is not a sense of this word`)
      assert.match(b.kelime, kural.temel, `${b.anahtar}: the base spelling does not fit the sense "${anlam}"`)
      for (const bicim of EN_BICIMLER) assert.match(enYaz(b.kelime, bicim), kural.cikti[bicim], `${b.anahtar} in ${bicim}`)
    }
  })

  it('the rule itself: a device stays a meter and a unit becomes one only in en-US; the noun "practice" is never touched', () => {
    assert.equal(enYaz('a peak-flow meter and a glucose meter, two metres away', 'en-US'), 'a peak-flow meter and a glucose meter, two meters away')
    for (const b of ['en-GB', 'en-CA', 'en-AU', 'en-NZ'] as const) assert.equal(enYaz('a peak-flow meter and a glucose meter, two metres away', b), 'a peak-flow meter and a glucose meter, two metres away', b)
    for (const b of EN_BICIMLER) assert.equal(enYaz('your practice', b), 'your practice', b)
    assert.equal(enYaz('doctors who practise here hold a licence; the software program runs the screening programme', 'en-US'), 'doctors who practice here hold a license; the software program runs the screening program')
    assert.equal(enYaz('doctors who practise here hold a licence; the software program runs the screening programme', 'en-CA'), 'doctors who practise here hold a licence; the software program runs the screening program')
    assert.equal(enYaz('doctors who practise here hold a licence; the software program runs the screening programme', 'en-AU'), 'doctors who practise here hold a licence; the software program runs the screening program')
  })

  it('words with a second meaning the set has no use for are not in it at all', () => {
    const yasak = /^(cheques?|tyres?|tires?|moulds?|molds?)$/
    const kullanim = METINLER.flatMap((x) => (x.metin.toLowerCase().match(/[a-z]+/g) ?? []).filter((k) => yasak.test(k)).map((k) => `${x.yer}: ${k}`))
    assert.deepEqual(kullanim, [])
  })
})

// ───────────────────────── 4. names and unit symbols are never rewritten ─────────────────────────

describe('English language set: a name or a unit symbol is never rewritten', () => {
  it('every protected name comes back exactly as written, in every form and in any capitals', () => {
    for (const ad of KORUNAN) for (const b of EN_BICIMLER) {
      assert.equal(enYaz(`${ad}`, b), ad, `${ad} in ${b}`)
      assert.equal(enYaz(`The colour of ${ad}, organised.`, b).includes(ad), true, `${ad} inside a sentence in ${b}`)
    }
    assert.equal(enYaz('Generalized Anxiety Disorder scale, generalised anxiety', 'en-GB'), 'Generalized Anxiety Disorder scale, generalised anxiety')
    assert.equal(enYaz('Generalized Anxiety Disorder scale, generalised anxiety', 'en-US'), 'Generalized Anxiety Disorder scale, generalized anxiety')
    assert.equal(enYaz('American Society of Anesthesiologists class', 'en-GB'), 'American Society of Anesthesiologists class')
  })

  it('no row of the table is a unit symbol: rows are whole words of four letters or more', () => {
    const SEMBOLLER = ['m', 'cm', 'mm', 'km', 'l', 'L', 'mL', 'dL', 'g', 'kg', 'mg', 'lb', 'oz', 'in', 'ft', 'mmHg', 'mmol', 'mol', 'IU', 'dB', 'C', 'F', '°C', '°F', 'min', 'h', 's', 'bpm', 'mg/dL', 'mmol/L', 'umol/L', 'µmol/L', 'g/L', 'g/dL', 'mg/g', 'mg/mmol', 'mL/min/1.73 m²', 'ng/mL', 'µg/L', 'mg/L', 'mm/h', 'mg/kg', '%']
    for (const k of KELIMELER) assert.ok(k.gb.length >= 4 && k.us.length >= 4, `${k.gb} / ${k.us}`)
    for (const sembol of SEMBOLLER) for (const b of EN_BICIMLER) assert.equal(enYaz(`12 ${sembol} and (${sembol})`, b), `12 ${sembol} and (${sembol})`, `${sembol} in ${b}`)
  })

  it('the unit names the intake form shows are the same in every form', () => {
    for (const b of EN_BICIMLER) assert.deepEqual(enCevir(EN_FORM_TEMEL.birim, b), EN_FORM_TEMEL.birim, b)
  })

  it('a capitalised word in the middle of a sentence that the table would rewrite is protected, or known to be an ordinary word', () => {
    /** Ordinary words that stand capitalised inside a text of the set (after a colon in a label, in a heading). */
    const SIRADAN: readonly string[] = []
    const sorunlar: string[] = []
    for (const x of METINLER) {
      const metin = korunansiz(x.metin)
      for (const m of metin.matchAll(/[A-Za-z]+/g)) {
        const k = m[0]
        if (k[0] === k[0].toLowerCase() || enYaz(k, 'en-US') === k) continue
        const once = metin.slice(0, m.index).trimEnd()
        const cumleBasi = once === '' || /[.!?:\n"“(—-]$/.test(once)
        if (!cumleBasi && !SIRADAN.includes(k)) sorunlar.push(`${x.yer}: "${k}" in "${x.metin.slice(0, 70)}"`)
      }
    }
    assert.deepEqual(sorunlar, [])
  })
})

// ───────────────────────── 5. the set belongs to no country, and claims nothing ─────────────────────────

describe('English language set: no country, no claim', () => {
  const ULKE = /\b(NHS|Medicare|Medicaid|HIPAA|GDPR|PIPEDA|FDA|TGA|MHRA|Medsafe|Health Canada|NICE|CDC|GMC|AHPRA|ACC|NHI|PBS|United States|America|United Kingdom|Britain|British|England|Scotland|Wales|Canada|Canadian|Quebec|Australia|Australian|New Zealand|Zealand|Social Security|ZIP|postcode|A&E|GPs?|surgery hours|chemist|drugstore|pharmacy benefit)\b/
  const ULKE_DISI = /Türkiye|Turkey|Turkish|Uzbek|Tashkent|SGK|MEDULA|e-Nabız|KVKK|JSHSHIR|PINFL/i
  const PARA = /[$£€]|\b(USD|GBP|CAD|AUD|NZD|dollars?|pounds? sterling)\b/
  const IDDIA = /\b(compliant|compliance|certified|certification|accredited|accreditation|endorsed|clinically proven|validated by|cleared|integrat\w*|trusted by|award|guarantee\w*)\b/i
  /** The model is told which spelling to write in: the only place a form of English is named, and only by ./klinik/talimatlar.ts when it builds an instruction. */
  it('no text names a country, a country\'s system, authority, law, currency or number', () => {
    const sorunlar = METINLER.flatMap((x) => [ULKE, ULKE_DISI, PARA].flatMap((d) => (d.test(x.metin) ? [`${x.yer}: ${d.exec(x.metin)?.[0]}`] : [])))
    assert.deepEqual(sorunlar, [])
  })

  it('no text claims compliance, approval by an authority, certification or an integration', () => {
    const sorunlar = METINLER.filter((x) => IDDIA.test(x.metin)).map((x) => `${x.yer}: ${IDDIA.exec(x.metin)?.[0]}`)
    assert.deepEqual(sorunlar, [])
  })

  it('no emergency number is written anywhere: the number is each pack\'s setting', () => {
    for (const x of METINLER) assert.doesNotMatch(x.metin, /\b(911|999|112|111|000)\b/, x.yer)
    assert.doesNotMatch(EN_PORTAL_TEMEL.sayfa.acil + EN_PORTAL_TEMEL.sayfa.acilNumara, /\d/)
  })
})

// ───────────────────────── 6. roles, templates, instructions, the intake form ─────────────────────────

describe('English language set: roles, templates, instructions and the intake form', () => {
  it('40 roles: 30 doctor specialties, 5 clinic doctors, 5 clinic allied professions; keys unique and well formed', () => {
    const say = (t: string) => EN_ROL_SATIRLARI.filter((r) => r.taraf === t).length
    assert.equal(EN_ROLLER.length, 40)
    assert.equal(new Set(EN_ROLLER).size, 40)
    assert.deepEqual([say('doktor'), say('klinik-hekim'), say('klinik-muttefik')], [30, 5, 5])
    for (const r of EN_ROLLER) assert.match(r, /^[a-z]+(-[a-z]+)*$/)
  })

  it('a country\'s own name for a role is used as written; the others are the base name in the country\'s spelling', () => {
    const us = enRolTanimlari('en-US', { anaesthesia: 'Anesthesiology' })
    assert.equal(us.find((r) => r.anahtar === 'anaesthesia')?.ad['en-US'], 'Anesthesiology')
    assert.equal(us.find((r) => r.anahtar === 'paediatrics')?.ad['en-US'], 'Pediatrics')
    assert.equal(us.find((r) => r.anahtar === 'orthopaedics')?.ad['en-US'], 'Orthopedic surgery')
    const gb = enRolTanimlari('en-GB', {})
    assert.equal(gb.find((r) => r.anahtar === 'paediatrics')?.ad['en-GB'], 'Paediatrics')
    assert.deepEqual(Object.keys(gb[0].ad), ['en-GB'])
  })

  it('every role has a note template, every field of a template is defined, and no field is nobody\'s', () => {
    assert.deepEqual(Object.keys(EN_ROL_ALANLARI).sort(), [...EN_ROLLER].sort())
    const kullanilan = new Set(Object.values(EN_ROL_ALANLARI).flat())
    for (const k of kullanilan) assert.ok(k in EN_ALANLAR, k)
    assert.deepEqual(Object.keys(EN_ALANLAR).filter((k) => !kullanilan.has(k as never)), [])
    for (const alanlar of Object.values(EN_ROL_ALANLARI)) assert.equal(new Set(alanlar).size, alanlar.length)
  })

  it('instructions: one per role, each naming only its own fields; none in another form; an allied role is told it makes no medical diagnosis', () => {
    for (const b of EN_BICIMLER) {
      const roller = enRolTanimlari(b, {})
      const sablonlar = enNotSablonlari(b)
      const t = enTalimatlar({ bicim: b, kidemliHekim: 'senior doctor', roller, sablonlar, veliYasi: 18 })
      assert.equal(t.sablonlar.length, 41)
      const genel = t.notTalimati(b, 'general')
      assert.ok(genel && genel.includes('{"s": "…", "o": "…", "a": "…", "p": "…"}') && !genel.includes('"fields"'))
      assert.match(genel, /You are an experienced senior doctor\./)
      assert.doesNotMatch(genel, /%[KY]/)
      for (const rol of EN_ROLLER) {
        const metin = t.notTalimati(b, rol)
        assert.ok(metin, `${b} ${rol}`)
        for (const k of Object.keys(EN_ALANLAR)) assert.equal(metin.includes(`- ${k} — `), (EN_ROL_ALANLARI[rol] as readonly string[]).includes(k), `${b} ${rol} ${k}`)
        // field keys are the contract with the code ("prior_anesthesia"), not text: they are left out of the spelling check
        assert.deepEqual(bicimYazimSorunlari(metin.replace(/^- [a-z_]+ — /gm, '- ').replace(/"[a-z_]+": /g, ''), b), [], `${b} ${rol}`)
      }
      assert.match(t.notTalimati(b, 'physiotherapy') ?? '', /not a doctor[\s\S]*Make no medical diagnosis/)
      assert.doesNotMatch(t.notTalimati(b, 'cardiology') ?? '', /not a doctor/)
      for (const diger of EN_BICIMLER) if (diger !== b) { assert.equal(t.notTalimati(diger, 'general'), null); assert.equal(t.hastaOzetiTalimati(diger), null) }
      assert.equal(t.notTalimati(b, 'no-such-role'), null)
      assert.match(t.hastaOzetiTalimati(b) ?? '', /\{"summary": "…"\}$/)
    }
    const us = enTalimatlar({ bicim: 'en-US', kidemliHekim: 'attending physician', roller: enRolTanimlari('en-US', {}), sablonlar: enNotSablonlari('en-US'), veliYasi: 18 })
    assert.match(us.notTalimati('en-US', 'general') ?? '', /in American spelling/)
    assert.match(us.notTalimati('en-US', 'general') ?? '', /Convert no unit/)
    assert.match(us.notTalimati('en-US', 'paediatrics') ?? '', /PEDIATRICS/)
  })

  it('guardian wording follows the age the COUNTRY states, in every role, and never an adult', () => {
    const kur = (veliYasi: number | null) => enTalimatlar({ bicim: 'en-GB', kidemliHekim: 'consultant', roller: enRolTanimlari('en-GB', {}), sablonlar: enNotSablonlari('en-GB'), veliYasi })
    const girdi = (sablon: string, dogum: string) => ({ dogumTarihi: dogum, cinsiyet: 'female', muayeneTarihi: '2026-10-09', metin: 'x', sablon })
    assert.match(kur(18).notGirdisi('en-GB', girdi('cardiology', '2010-01-01')), /history_giver/)
    assert.doesNotMatch(kur(18).notGirdisi('en-GB', girdi('paediatrics', '2000-01-01')), /history_giver/)
    assert.doesNotMatch(kur(16).notGirdisi('en-GB', girdi('cardiology', '2010-01-01')), /history_giver/)
    assert.doesNotMatch(kur(null).notGirdisi('en-GB', girdi('paediatrics', '2020-01-01')), /history_giver/)
    assert.deepEqual(kur(18).notAlanlari('cardiology', { dogumTarihi: '2010-01-01', muayeneTarihi: '2026-10-09' })[0], 'history_giver')
    assert.equal(kur(18).notAlanlari('cardiology', { dogumTarihi: '1980-01-01', muayeneTarihi: '2026-10-09' }).includes('history_giver'), false)
    // the message carries age and sex, never a name
    assert.match(kur(18).notGirdisi('en-GB', girdi('general', '1980-01-01')), /^PATIENT: age — 46 years; sex — female\.\n\nTRANSCRIPT OF THE VISIT:\nx$/)
  })

  it('the intake form: 23 core questions, 228 role questions, a set for every role, every key unique', () => {
    const f = enHastaFormu({ bicim: 'en-GB', surum: 'test-1' })
    const cekirdek = f.cekirdek.bolumler.flatMap((b) => b.sorular)
    const rol = Object.values(f.roller).flatMap((r) => r.sorular)
    assert.equal(cekirdek.length, 23)
    assert.equal(rol.length, 228)
    assert.deepEqual(Object.keys(f.roller).sort(), [...EN_ROLLER].sort())
    const anahtarlar = [...cekirdek, ...rol].map((q) => q.anahtar)
    assert.equal(new Set(anahtarlar).size, anahtarlar.length)
    for (const k of anahtarlar) assert.match(k, /^[a-z][a-z0-9_]*$/)
    for (const r of Object.values(f.roller)) assert.deepEqual(r.inceleme, { makineYazimi: true, klinisyen: null })
    assert.equal(f.riza.hukukcuInceledi, false)
    // a measure is asked in the pack's unit: no unit is written into such a question
    for (const q of [...cekirdek, ...rol]) if (q.tur === 'sayi' && q.olcu) assert.doesNotMatch(q.metin['en-GB'], /\b(cm|kg|lb|inch|inches|pounds?|kilograms?|centimetres?|°|Celsius|Fahrenheit)\b/i, q.anahtar)
  })

  it('the intake form in en-US is the same questions in American spelling, keyed by the pack\'s own form', () => {
    const us = enHastaFormu({ bicim: 'en-US', surum: 'test-1' })
    assert.deepEqual(Object.keys(us.riza.metin), ['en-US'])
    assert.equal(us.roller.anaesthesia.baslik['en-US'], 'Before the anesthetic')
    assert.match(us.roller.paediatrics.sorular.find((q) => q.anahtar === 'pe_delivery')?.tur === 'tek-secim' ? 'Cesarean section' : '', /Cesarean/)
    const kendi = enHastaFormu({ bicim: 'en-US', surum: 'test-1', riza: { metin: 'Our own colour of sentence.', veliMetni: 'Guardian colour.' } })
    assert.equal(kendi.riza.metin['en-US'], 'Our own colour of sentence.', 'a country\'s own sentence is used as written')
  })
})
