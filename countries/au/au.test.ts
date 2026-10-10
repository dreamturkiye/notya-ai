/**
 * NOTYA-ULKE-EN-01 — Australia (`au`): the pack's own tests. The tests every English-speaking pack runs on itself
 * (countries/_dil/en/testing/paketSinamasi.ts), with what is Australia's: Australian spelling (the British base, with
 * "program"), SI units, several time zones, the tools it keeps as slots, and the words of the other English-speaking
 * countries that must not show here.
 *
 * NOTYA-ULKE-UYGULA-AU (2026-10-10) — and what the decisions of the tools audit changed for Australia alone
 * (docs/araclar-denetim/AU.md): its own role list, who sees which tool, the country's numbers with their sources,
 * and the tools only it has. Their arithmetic, against each source's own worked example: ./araclar/araclar.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { girdiyiCoz } from '@/lib/ulke/araclar/girdi'
import type { BirimOrtami } from '@/lib/ulke/araclar/birimler'
import { aracCalistir, hekimRolleri, hesabinAraci, hesabinAraclari, paketinAraci } from '@/lib/ulke/araclar/paket'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { ulkeyeOzelAnahtarlar } from '@/lib/ulke/araclar/ulkeyeOzel'
import { rolSablonAlanlari, sablonMu } from '@/lib/ulke/arayuz/notSablonu'
import { icerikAnahtari } from '@/lib/ulke/arayuz/rolIcerigi'
import { EN_ROL_ALANLARI } from '../_dil/en/klinik/notSablonlari'
import { EN_ROLLER, enRolAnahtarlari } from '../_dil/en/klinik/roller'
import { ingilizcePaketSinamasi, kaynakOku } from '../_dil/en/testing/paketSinamasi'
import { enYaz } from '../_dil/en/varyant'
import { AU_ONAYSIZ_ACIK_ANAHTARLAR, AU_ONAYSIZ_ACIK_ARACLAR } from './araclar/onaysizAciklar'
import { AU_ARAYUZ } from './arayuz'
import { AU_GIRDI } from './ayarlar'
import derleme from './derleme.mjs'
import { AU_PAKETI } from './index'
import { AU_KLINIK } from './klinik'
import { AU_KENDI_FORMLU_ROLLER, AU_ROLLER } from './klinik/roller'
import { AU_CIKAN_ROLLER, AU_EK_ROLLER, AU_ESKI_ROL_ESLEMESI, AU_ROL_LISTESI } from './klinik/rolListesi'
import { AU_SIZINTI_TERIMLERI } from './sizintiTerimleri'

const D = 'en-AU'
const LAB = { albuminKreatinin: 'mg/mmol', hemoglobin: 'g/L', kreatinin: 'umol/L', glukoz: 'mmol/L', kolesterol: 'mmol/L', crp: 'mg/L', psa: 'ug/L', hba1c: ['%', 'mmol/mol'] } as const
/** The tools only Australia has: every one switched on by the owner's order of 2026-10-10. */
const KENDI_ARACLARI = ['au-body-size', 'au-mental-health-screen', 'au-oncology-grading']

ingilizcePaketSinamasi({
  paket: AU_PAKETI,
  arayuz: AU_ARAYUZ,
  klinik: AU_KLINIK,
  bicim: D,
  ayarlarKaynagi: kaynakOku(join(__dirname, 'ayarlar.ts')),
  // United Kingdom, United States, Canada, New Zealand: their systems, identifiers, currencies, names, usage
  yabanci: /\b(NHS|NHI|GBP|USD|CAD|NZD|United Kingdom|United States|Canada|Canadian|provincial|Quebec|New Zealand|HIPAA|Medicaid|health card|Anaesthetics|Anesthesiology|Pulmonology|Respirology|Physical therapist|attending physician|staff physician|consultant)\b|£/,
  // off by Kaan's order of 2026-10-10 (NOTYA-ULKE-ARAC-01b): these four. The dose calculator is ON AGAIN by his later
  // order of the same day (its fault was corrected in the kit; the guard list no longer holds it).
  kapaliAraclar: ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi'],
  birimler: { agirlik: 'kg', boy: 'cm', sicaklik: 'C' },
  labBirimleri: LAB,
  kidemliHekim: 'specialist',
  // a range reserved for fiction where this job is certain of one; otherwise a shape that is no number (see ./ayarlar.ts)
  ornekTelefon: /^\+61 491 570 (006|110|15[6-9])$/,
  // NOTYA-ULKE-UYGULA-AU: Australia's own role list, and the tools it has beyond the set
  rolDegisimi: AU_ROLLER,
  ekAraclar: KENDI_ARACLARI,
})

const A = AU_ARAYUZ.araclar as UlkeAraclari
const ROLLER = AU_PAKETI.uygulama!.roller!
const O: BirimOrtami = { birimler: AU_PAKETI.uygulama!.birimler, lab: A.labBirimleri, sayi: AU_PAKETI.bicim }
const BUGUN = '2026-10-10'
const ad = (rol: string) => AU_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]
const tanim = (rol: string) => AU_ARAYUZ.roller.find((r) => r.anahtar === rol)
/** Who sees a tool: every role (and the account without one) whose grid and address open it. */
const goren = (k: string): string[] => [null, ...ROLLER].filter((r) => hesabinAraci(A, r, k) !== null).map((r) => r ?? '(no role)')
const sonuc = (k: string, ham: Record<string, string | boolean>) => { const x = paketinAraci(A, k)!; return aracCalistir(x, girdiyiCoz(x.tanim.alanlar, ham, O), BUGUN, A) }
const sayi = (r: ReturnType<typeof sonuc>, k: string) => r.sayilar.find((x) => x.anahtar === k)?.deger

describe('au: what is Australia\'s', () => {
  it('code au, served at /au; day first; week from Monday; 12-hour clock; SI units; Australian dollars', () => {
    assert.equal(AU_PAKETI.kod, 'au')
    assert.equal(AU_PAKETI.yolOnEki, '/au')
    assert.equal(derleme.yolOnEki, '/au')
    assert.equal(derleme.saatDilimi, AU_PAKETI.saatDilimi)
    assert.equal(AU_PAKETI.bicim.tarihDeseni, 'DD/MM/YYYY')
    assert.equal(AU_PAKETI.bicim.haftaBasi, 1)
    assert.equal(AU_PAKETI.uygulama!.saatBicimi, 12)
    assert.equal(AU_PAKETI.paraBirimi.kod, 'AUD')
    assert.equal(AU_ARAYUZ.randevuMetinleri![D]!.form.tarihOrnek, 'DD/MM/YYYY')
  })

  it('several time zones: the default is one of them, an account is asked, and the calendar names no single zone', () => {
    const dilimler = [...AU_PAKETI.uygulama!.saatDilimleri]
    assert.deepEqual(dilimler, ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Perth', 'Australia/Hobart'])
    assert.ok(dilimler.includes(AU_PAKETI.saatDilimi))
    assert.equal(AU_ARAYUZ.metinler[D]!.ayarlar.saatDilimi, 'Time zone')
    assert.equal(AU_ARAYUZ.randevuMetinleri![D]!.duzen.saatDilimi, 'Times are shown in the time zone set for your account.')
  })

  it('Australian spelling on the screens — the British base, with "program" — and the country\'s own names for its specialties', () => {
    assert.equal(ad('paediatric-surgery'), 'Paediatric surgery')
    assert.equal(ad('anaesthesia'), 'Anaesthesia')
    assert.equal(ad('family-medicine'), 'General practice')
    assert.equal(ad('internal-medicine'), 'General medicine')
    assert.equal(ad('respiratory-medicine'), 'Respiratory and sleep medicine')
    assert.equal(AU_ARAYUZ.randevuMetinleri![D]!.durum.iptal, 'Cancelled')
    assert.equal(enYaz('a rehabilitation programme', D), 'a rehabilitation program')
    assert.equal(enYaz('a rehabilitation programme', 'en-GB'), 'a rehabilitation programme')
    assert.match(AU_KLINIK.notTalimati(D, 'general') ?? '', /You are an experienced specialist\.[\s\S]*in Australian spelling/)
  })

  it('the patient identifier is labelled "Medicare card number", the national data element\'s name; the guardian age is the pack\'s setting in both halves', () => {
    assert.equal(AU_PAKETI.ulusalKimlik?.ad, 'Medicare card number')
    assert.equal(AU_GIRDI.sozler.kimlikEtiketi, 'Medicare card number')
    assert.equal(AU_ARAYUZ.metinler[D]!.yeniHasta.ulusalKimlik, 'Medicare card number')
    assert.equal(AU_PAKETI.uygulama!.veliYasi, AU_GIRDI.veliYasi)
    assert.equal(AU_PAKETI.uygulama!.veliYasi, 16)
  })

  it('prostate-specific antigen is written in µg/L; the consent stamp is Australia\'s own draft', () => {
    assert.equal(A.labBirimleri.psa, 'ug/L')
    assert.equal(A.birimler['ug/L'][D], 'µg/L')
    assert.equal(A.birimler['ug/L/yil'][D], 'µg/L per year')
    assert.ok(!('ng/mL' in A.birimler), 'no tool shows ng/mL here')
    assert.equal(AU_KLINIK.riza.surum, 'au-draft-2026-10-09')
    assert.equal(AU_ARAYUZ.metinler[D]!.muayene.riza, AU_GIRDI.sozler.kayitRizasi)
  })
})

/**
 * NOTYA-ULKE-AUDIT-AU — what the localisation audit of 2026-10-09 (branch audit/au) checked against Australia's own
 * sources and holds here. The source of each rule is beside it in that branch's docs/COUNTRY-AUDIT-AUSTRALIA.md.
 */
describe('au: held by the localisation audit against Australian sources', () => {
  it('no role name is a title ("surgeon" is protected by law), and no name of another country\'s usage is shown', () => {
    for (const r of AU_ARAYUZ.roller) {
      assert.doesNotMatch(r.ad[D] ?? '', /surgeon/i, r.anahtar)
      assert.doesNotMatch(r.ad[D] ?? '', /Family medicine|Internal medicine|Pulmonology|\(ENT\)|Aesthetic medicine|Cosmetic medicine/, r.anahtar)
    }
  })

  it('numbers and money: a point for decimals, a comma for thousands, dollars with two decimal places', () => {
    assert.deepEqual({ o: AU_PAKETI.bicim.ondalikAyraci, b: AU_PAKETI.bicim.binlikAyraci }, { o: '.', b: ',' })
    assert.deepEqual(AU_PAKETI.paraBirimi, { kod: 'AUD', simge: '$', ondalikHane: 2 })
    assert.equal(AU_GIRDI.acilis.aylikTutarKalibi, '$% a month')
  })

  it('the emergency number is 000, as it is dialled; a mobile is +61 and nine digits beginning with 4, in the blocks the Style Manual gives', () => {
    assert.equal(AU_PAKETI.uygulama!.portal!.acilNumara, '000')
    assert.equal(AU_PAKETI.telefon.ulkeOnEki, '+61')
    assert.equal(AU_PAKETI.telefon.ulusalHane, 9)
    assert.match(AU_PAKETI.telefon.ornek, /^\+61 4\d{2} \d{3} \d{3}$/)
    assert.equal(AU_GIRDI.acilis.telefonOrnegi, AU_PAKETI.telefon.ornek)
    for (const yazim of ['0491 570 006', '+61 491 570 006', '61491570006', '0061 491 570 006', '(0491) 570-006']) assert.equal(AU_PAKETI.telefon.cepGecerliMi(yazim), true, yazim)
    for (const yazim of ['02 5550 1234', '491 570 00', '+61 391 570 006', '000', '']) assert.equal(AU_PAKETI.telefon.cepGecerliMi(yazim), false, yazim)
  })

  it('the time zones are the three standard times with and without daylight saving, each a zone the platform knows', () => {
    const ofset = (dilim: string, an: string) => new Intl.DateTimeFormat('en-AU', { timeZone: dilim, timeZoneName: 'longOffset' }).formatToParts(new Date(an)).find((p) => p.type === 'timeZoneName')?.value
    const kis = '2026-07-01T00:00:00Z', yaz = '2027-01-01T00:00:00Z'
    // [in July, in January]: daylight saving in New South Wales, Victoria, Tasmania and South Australia; none in Queensland, the Northern Territory and Western Australia
    const beklenen: Record<string, [string, string]> = {
      'Australia/Sydney': ['GMT+10:00', 'GMT+11:00'], 'Australia/Melbourne': ['GMT+10:00', 'GMT+11:00'], 'Australia/Hobart': ['GMT+10:00', 'GMT+11:00'],
      'Australia/Brisbane': ['GMT+10:00', 'GMT+10:00'], 'Australia/Adelaide': ['GMT+09:30', 'GMT+10:30'], 'Australia/Darwin': ['GMT+09:30', 'GMT+09:30'],
      'Australia/Perth': ['GMT+08:00', 'GMT+08:00'],
    }
    assert.deepEqual([...AU_PAKETI.uygulama!.saatDilimleri].sort(), Object.keys(beklenen).sort())
    for (const [dilim, [k, y]] of Object.entries(beklenen)) assert.deepEqual([ofset(dilim, kis), ofset(dilim, yaz)], [k, y], dilim)
  })

  it('a time of day reads the way the Australian Government Style Manual writes it: "2:30 pm"', () => {
    const saat = new Intl.DateTimeFormat(AU_PAKETI.bicim.yerel, { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(Date.UTC(2000, 0, 1, 14, 30)))
    assert.match(saat, /^2:30[\s  ]pm$/)
  })

  it('no text asks for an identifier this product must not hold: no healthcare identifier, no tax file number', () => {
    const tum = JSON.stringify({ a: AU_ARAYUZ.metinler, p: AU_ARAYUZ.portalMetinleri, f: AU_ARAYUZ.formMetinleri, k: AU_KLINIK.hastaFormu })
    assert.doesNotMatch(tum, /healthcare identifier|\bIHI\b|tax file number|\bTFN\b/i)
  })

  it('the leak list hunts the regulator\'s name in both of its spellings', () => {
    const terimler = AU_SIZINTI_TERIMLERI.map((t) => t.terim)
    assert.ok(terimler.includes('AHPRA') && terimler.includes('Ahpra'))
  })
})

/**
 * NOTYA-ULKE-UYGULA-AU — SPECIALTIES AND CLINIC ROLES, as the audit decided them (docs/araclar-denetim/au-kararlar.json).
 * THE NAMES ARE THE REGULATOR'S. Source opened 2026-10-10: Medical Board of Australia, "List of specialties, fields of
 * specialty practice and related specialist titles" (effective 22 September 2025),
 * https://www.ahpra.gov.au/documents/default.aspx?record=WD10%2f106&dbid=AP&chksum=07LyDUkqqYa5O5LXuqbSzg%3d%3d
 */
describe('au: its own role list — the Medical Board\'s wording, a split, one removal, seven additions', () => {
  it('46 roles: the shared forty without three, with nine of its own — 35 doctor specialties, 4 clinic doctors, 7 allied professions', () => {
    assert.equal(ROLLER.length, 40 - 3 + 9)
    assert.deepEqual([...ROLLER], [...enRolAnahtarlari(AU_ROLLER)])
    // the light list the settings file reads and the full list the two halves read name the same roles in the same order
    assert.deepEqual([...enRolAnahtarlari(AU_ROL_LISTESI)], [...enRolAnahtarlari(AU_ROLLER)])
    assert.deepEqual(AU_ARAYUZ.roller.map((r) => r.anahtar), [...ROLLER])
    const say = (taraf: string) => AU_ARAYUZ.roller.filter((r) => r.taraf === taraf).length
    assert.deepEqual([say('doktor'), say('klinik-hekim'), say('klinik-muttefik')], [35, 4, 7])
    for (const k of AU_CIKAN_ROLLER) assert.ok(!ROLLER.includes(k), `${k} was taken out`)
    for (const r of AU_EK_ROLLER) assert.ok(ROLLER.includes(r.anahtar), `${r.anahtar} was added`)
    // every other shared role is still there
    for (const k of EN_ROLLER) if (!(AU_CIKAN_ROLLER as readonly string[]).includes(k)) assert.ok(ROLLER.includes(k), k)
  })

  it('every doctor specialty carries the wording of the Medical Board of Australia\'s list', () => {
    const resmi: Record<string, string> = {
      'emergency-medicine': 'Emergency medicine', 'family-medicine': 'General practice', anaesthesia: 'Anaesthesia', neurosurgery: 'Neurosurgery',
      'paediatric-surgery': 'Paediatric surgery', 'internal-medicine': 'General medicine', dermatology: 'Dermatology', endocrinology: 'Endocrinology',
      'infectious-diseases': 'Infectious diseases', gastroenterology: 'Gastroenterology and hepatology', 'general-surgery': 'General surgery',
      'cardio-thoracic-surgery': 'Cardio-thoracic surgery', 'respiratory-medicine': 'Respiratory and sleep medicine', ophthalmology: 'Ophthalmology',
      'obstetrics-gynaecology': 'Obstetrics and gynaecology', 'vascular-surgery': 'Vascular surgery', cardiology: 'Cardiology',
      otolaryngology: 'Otolaryngology – head and neck surgery', nephrology: 'Nephrology', neurology: 'Neurology', oncology: 'Medical oncology',
      'radiation-oncology': 'Radiation oncology', orthopaedics: 'Orthopaedic surgery', paediatrics: 'Paediatrics and child health',
      'plastic-surgery': 'Plastic surgery', psychiatry: 'Psychiatry', radiology: 'Radiology', rheumatology: 'Rheumatology', urology: 'Urology',
      'sports-medicine': 'Sport and exercise medicine', 'rehabilitation-medicine': 'Rehabilitation medicine', 'geriatric-medicine': 'Geriatric medicine',
      'immunology-and-allergy': 'Immunology and allergy', haematology: 'Haematology', 'pain-medicine': 'Pain medicine',
    }
    assert.deepEqual(AU_ARAYUZ.roller.filter((r) => r.taraf === 'doktor').map((r) => r.anahtar), Object.keys(resmi), 'the 35, in the order they are offered')
    for (const [rol, isim] of Object.entries(resmi)) assert.equal(ad(rol), isim, rol)
    // the names the list does not have are gone from the screens
    for (const r of AU_ARAYUZ.roller) assert.doesNotMatch(r.ad[D] ?? '', /^(Thoracic surgery|Cardiac and vascular surgery|Oncology|Paediatrics|Gastroenterology|Dermatology \(clinic\))$/, r.anahtar)
  })

  it('the clinic roles: an area of work in the regulator\'s words, never a specialty; the allied professions named as the profession', () => {
    assert.deepEqual(AU_ARAYUZ.roller.filter((r) => r.taraf === 'klinik-hekim').map((r) => [r.anahtar, r.ad[D]]), [
      ['hair-transplant', 'Hair transplantation'], ['aesthetic-surgery', 'Cosmetic surgery'], ['aesthetic-medicine', 'Non-surgical cosmetic procedures'], ['longevity', 'Preventive and longevity medicine'],
    ])
    assert.deepEqual(AU_ARAYUZ.roller.filter((r) => r.taraf === 'klinik-muttefik').map((r) => [r.anahtar, r.ad[D]]), [
      ['physiotherapy', 'Physiotherapist'], ['clinical-psychology', 'Psychologist'], ['dietetics', 'Dietitian'], ['occupational-therapy', 'Occupational therapist'],
      ['audiology', 'Audiologist'], ['podiatry', 'Podiatrist'], ['speech-pathology', 'Speech pathologist'],
    ])
    assert.equal(AU_GIRDI.kidemliHekim, 'specialist')
  })

  it('EVERY ROLE AUSTRALIA ADDS SAYS WHICH SHARED ROLE IT BEHAVES LIKE, and finds a note template and intake questions', () => {
    const gibi = Object.fromEntries(AU_ARAYUZ.roller.filter((r) => r.gibi).map((r) => [r.anahtar, r.gibi]))
    assert.deepEqual(gibi, {
      'cardio-thoracic-surgery': 'thoracic-surgery', 'vascular-surgery': 'cardiovascular-surgery', 'radiation-oncology': 'oncology',
      'geriatric-medicine': 'internal-medicine', 'immunology-and-allergy': 'internal-medicine', haematology: 'internal-medicine', 'pain-medicine': 'rehabilitation-medicine',
      podiatry: 'physiotherapy', 'speech-pathology': 'occupational-therapy',
    })
    const v = AU_ARAYUZ.notSablonlari
    for (const r of AU_EK_ROLLER) {
      assert.equal(sablonMu(v, AU_ARAYUZ.roller, r.anahtar), true, `${r.anahtar}: its notes are written with a template`)
      assert.ok(rolSablonAlanlari(v, AU_ARAYUZ.roller, r.anahtar).length > 0, `${r.anahtar}: the template has fields`)
      assert.ok(icerikAnahtari(AU_ARAYUZ.roller, r.anahtar, AU_KLINIK.hastaFormu!.roller) !== null, `${r.anahtar}: its form has questions`)
      // the instruction to the model names the role by its own name
      assert.ok((AU_KLINIK.notTalimati(D, r.anahtar) ?? '').toUpperCase().includes(r.ad.toUpperCase()), `${r.anahtar}: the instruction names "${r.ad}"`)
    }
  })

  it('THE SPLIT moves the content with the work: heart surgery\'s note fields and questions sit with chest surgery; vascular surgery keeps the heart-and-vessel note', () => {
    const v = AU_ARAYUZ.notSablonlari
    const kt = rolSablonAlanlari(v, AU_ARAYUZ.roller, 'cardio-thoracic-surgery')
    // every field of the shared chest-surgery note, with the two that heart surgery had
    for (const alan of EN_ROL_ALANLARI['thoracic-surgery']) assert.ok(kt.includes(alan), alan)
    for (const alan of ['cardiac_exam', 'anticoagulation']) assert.ok(kt.includes(alan), alan)
    assert.equal(kt.length, EN_ROL_ALANLARI['thoracic-surgery'].length + 2)
    assert.deepEqual([...rolSablonAlanlari(v, AU_ARAYUZ.roller, 'vascular-surgery')], [...EN_ROL_ALANLARI['cardiovascular-surgery']])
    // no field of the split roles is new: each is a field of the shared set
    for (const alan of kt) assert.ok(alan in v.alanlar, alan)
    // what the PATIENT reads names the right specialty
    const f = AU_KLINIK.hastaFormu!.roller
    assert.equal(f['cardio-thoracic-surgery'].baslik[D], 'For the heart and chest surgeon')
    assert.equal(f['vascular-surgery'].baslik[D], 'For the vascular surgeon')
    assert.doesNotMatch(JSON.stringify(f['vascular-surgery']), /Chest pain|Shortness of breath|heart and blood vessel surgeon/)
  })

  it('NO PATIENT READS ANOTHER SPECIALTY\'S NAME: a new role whose shared role names itself in the form\'s heading brings its own heading', () => {
    const f = AU_KLINIK.hastaFormu!.roller
    assert.deepEqual([...AU_KENDI_FORMLU_ROLLER].sort(), ['cardio-thoracic-surgery', 'geriatric-medicine', 'haematology', 'immunology-and-allergy', 'pain-medicine', 'podiatry', 'speech-pathology', 'vascular-surgery'])
    assert.deepEqual(AU_KENDI_FORMLU_ROLLER.map((r) => f[r].baslik[D]).sort(), ['Before podiatry', 'Before speech pathology', 'For the geriatric medicine doctor', 'For the haematologist', 'For the heart and chest surgeon', 'For the immunology and allergy doctor', 'For the pain medicine doctor', 'For the vascular surgeon'])
    // radiation oncology asks the oncologist's questions under the oncologist's heading, which is true of it
    assert.equal(icerikAnahtari(AU_ARAYUZ.roller, 'radiation-oncology', f), 'oncology')
    // every question key is unique in the pack, and each set says it was written by a machine and read by nobody
    const anahtarlar = [...AU_KLINIK.hastaFormu!.cekirdek.bolumler.flatMap((b) => b.sorular), ...Object.values(f).flatMap((r) => r.sorular)].map((q) => q.anahtar)
    assert.equal(new Set(anahtarlar).size, anahtarlar.length)
    for (const r of AU_KENDI_FORMLU_ROLLER) assert.deepEqual(f[r].inceleme, { makineYazimi: true, klinisyen: null }, r)
  })

  it('A ROLE THAT IS GONE IS GONE — "Dermatology (clinic)" leaves nothing behind; the two split roles live on only as the content of their halves', () => {
    const v = AU_ARAYUZ.notSablonlari, f = AU_KLINIK.hastaFormu!.roller
    assert.ok(!('clinic-dermatology' in v.rolAlanlari) && !('clinic-dermatology' in f))
    for (const k of AU_CIKAN_ROLLER) {
      assert.equal(sablonMu(v, AU_ARAYUZ.roller, k), false, k)
      assert.equal(AU_KLINIK.notTalimati(D, k), null, k)
      assert.equal(tanim(k), undefined, k)
    }
    // dermatology the specialty is untouched
    assert.equal(ad('dermatology'), 'Dermatology')
  })

  it('A STORED ACCOUNT THAT HOLDS A REMOVED OR SPLIT KEY STILL LOADS: the key is "no role" — base tools, the general template, nothing thrown — and its nearest remaining role is stated', () => {
    for (const eski of AU_CIKAN_ROLLER) {
      // what the kit's own gates answer for such a stored value (lib/ulke/uygulama/rol.ts reads the same list)
      assert.equal(ROLLER.includes(eski), false, `${eski} is not a role here: the account is asked its role once more`)
      const { temel, rol } = hesabinAraclari(A, eski)
      assert.deepEqual(rol, [], `${eski}: no role tool is shown under a key that is no role`)
      assert.ok(temel.length >= 2 && temel.every((x) => x.paket.roller === null), `${eski}: the base tools are there`)
      for (const p of A.araclar) if (p.roller !== null) assert.equal(hesabinAraci(A, eski, p.anahtar), null, `${eski} opens ${p.anahtar}`)
      assert.equal(sablonMu(AU_ARAYUZ.notSablonlari, AU_ARAYUZ.roller, eski), false)
      assert.equal(sablonMu(AU_ARAYUZ.notSablonlari, AU_ARAYUZ.roller, AU_ARAYUZ.notSablonlari.genelSablon), true, 'the general template is there to write with')
      assert.equal(AU_ARAYUZ.asistan(eski, D), null)
      // THE NEAREST REMAINING ROLE: a role of the pack, of the same kind, or — said out loud — none
      const yeni = AU_ESKI_ROL_ESLEMESI[eski]
      if (yeni !== null) { assert.ok(ROLLER.includes(yeni), `${eski} → ${yeni}`); assert.equal(tanim(yeni)!.taraf, 'doktor') }
    }
    assert.deepEqual(AU_ESKI_ROL_ESLEMESI, { 'thoracic-surgery': 'cardio-thoracic-surgery', 'cardiovascular-surgery': 'vascular-surgery', 'clinic-dermatology': null })
    // each half of the split behaves like the role its stored accounts are mapped from
    assert.equal(tanim('cardio-thoracic-surgery')!.gibi, 'thoracic-surgery')
    assert.equal(tanim('vascular-surgery')!.gibi, 'cardiovascular-surgery')
  })
})

describe('au: who sees which tool — the audit\'s decisions, with existing tools', () => {
  it('general practice and paediatrics see the inhaler check, the expected height and the dose arithmetic; cardiology and the surgeons of adults do not', () => {
    assert.deepEqual(goren('inhaler-teknik'), ['family-medicine', 'respiratory-medicine', 'paediatrics'])
    assert.deepEqual(goren('hedef-boy'), ['family-medicine', 'paediatrics'])
    assert.deepEqual(goren('doz-hesabi'), ['family-medicine', 'paediatrics'])
    for (const k of ['hedef-boy', 'doz-hesabi']) for (const r of ['cardiology', 'orthopaedics', 'general-surgery', 'physiotherapy', '(no role)']) assert.ok(!goren(k).includes(r), `${k}: ${r}`)
  })

  it('the split: the chest tools go with cardio-thoracic surgery, the graft tool with vascular surgery, the heart-and-vessel checklist with both', () => {
    assert.deepEqual(goren('toraks-preop'), ['cardio-thoracic-surgery'])
    assert.deepEqual(goren('toraks-tup-yara'), ['cardio-thoracic-surgery'])
    assert.deepEqual(goren('kalp-damar-preop'), ['cardio-thoracic-surgery', 'vascular-surgery'])
    assert.deepEqual(goren('greft-yara-izlem'), ['vascular-surgery'])
    assert.deepEqual(goren('antikoagulan-vadeleri'), ['cardio-thoracic-surgery', 'vascular-surgery', 'haematology'])
  })

  it('the roles Australia adds take the tools the audit names for them, and no other role gains one by accident', () => {
    assert.deepEqual(goren('kur-sayaci'), ['oncology', 'radiation-oncology', 'haematology'])
    assert.deepEqual(goren('toksisite-listesi'), ['oncology', 'radiation-oncology'])
    assert.deepEqual(goren('postop-agri'), ['anaesthesia', 'pain-medicine'])
    assert.deepEqual(goren('plastik-yara-greft'), ['plastic-surgery', 'aesthetic-surgery'])
    assert.deepEqual(goren('odyometri-pta'), ['otolaryngology', 'audiology'], 'the audiologist sees the hearing average; the other allied professions do not')
    // a tool the audit left where it was is seen by exactly the roles of the shared set
    assert.deepEqual(goren('pasi'), ['dermatology'])
    assert.deepEqual(goren('psa-hizi'), ['urology'])
    assert.deepEqual(goren('kritik-yol'), ['emergency-medicine'])
    // no tool is given to a role this country does not have
    for (const p of A.araclar) for (const r of p.roller ?? []) assert.ok(ROLLER.includes(r), `${p.anahtar}: ${r}`)
    for (const y of A.yuvalar) for (const r of y.roller ?? []) assert.ok(ROLLER.includes(r), `slot ${y.anahtar}: ${r}`)
  })

  it('THE CORE SET, as far as existing tools go: the patient\'s page and the follow-up list reach every role', () => {
    assert.deepEqual(goren('hasta-portali'), ['(no role)', ...ROLLER])
    // the follow-up list follows the tools whose result can be kept: Australia's own base tool gives it to every role
    assert.deepEqual(goren('takip-paneli'), [...ROLLER])
  })

  it('REMOVED FOR AUSTRALIA: the American triage scale is off, on no grid and at no address — and so are the three other tools the owner keeps off', () => {
    const acik = A.araclar.map((p) => p.anahtar)
    for (const k of ['esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi']) {
      assert.ok(!acik.includes(k), `${k} is switched on`)
      assert.deepEqual(goren(k), [], k)
      assert.ok(A.yuvalar.some((y) => y.anahtar === k && y.acik === false), `${k} is a switched-off slot`)
    }
    assert.match(A.yuvalar.find((y) => y.anahtar === 'esi-triyaj')!.eksik, /NOT AUSTRALIA'S SCALE: removed for Australia/)
    assert.equal(A.yuvalar.find((y) => y.anahtar === 'esi-triyaj')!.lisans?.durum, 'izin-gerekli')
    // the dose calculator is on again by the owner's order, and writes no zero after the last figure
    assert.ok(acik.includes('doz-hesabi'))
    assert.deepEqual(A.dozYazimi, { sondaSifir: false })
  })
})

/**
 * THE COUNTRY'S OWN NUMBERS for the tools of the shared set that are open to them. EACH IS FROM A PAGE OPENED ON
 * 2026-10-10; the page is named here and beside the number in ./ayarlar.ts. Nobody of the country has confirmed one.
 */
describe('au: country data for the shared tools — each number with the page it was read on', () => {
  it('EXPECTED HEIGHT: 8.5 cm either side — The Royal Children\'s Hospital Melbourne, "Short stature" (reviewed July 2025): "8.5 cm on either side of the calculated value"', () => {
    // Source: https://www.rch.org.au/primary-care-liaison/prereferral_guidelines/Short_stature/ (read 2026-10-10).
    assert.deepEqual(A.araclar.find((p) => p.anahtar === 'hedef-boy')!.parametreler, { aralik_cm: 8.5 })
    // BEFORE (the kit states no range): mother 160 cm, father 180 cm, a boy → 176.5 cm and nothing else. NOW: with the range.
    const r = sonuc('hedef-boy', { cinsiyet: 'erkek', anne: '160', baba: '180' })
    assert.deepEqual([sayi(r, 'hedef'), sayi(r, 'alt'), sayi(r, 'ust')], [176.5, 168, 185])
    const kiz = sonuc('hedef-boy', { cinsiyet: 'kiz', anne: '160', baba: '180' })
    assert.deepEqual([sayi(kiz, 'hedef'), sayi(kiz, 'alt'), sayi(kiz, 'ust')], [163.5, 155, 172])
  })

  it('PSA: written in µg/L, and NO caution for two results close together — the 2026 national guideline itself asks for a repeat "within 1-3 months" and names no yearly rate', () => {
    // Source: Prostate Cancer Foundation of Australia, "2026 Guidelines for the Early Detection of Prostate Cancer in
    // Australia: Summary of Recommendations" (approved 18 May 2026; read 2026-10-10),
    // https://www.prostate.org.au/wp-content/uploads/2026/08/2026-Guidelines-for-the-Early-Detection-of-Prostate-Cancer-Summary-of-Recommendations.pdf
    assert.deepEqual(A.araclar.find((p) => p.anahtar === 'psa-hizi')!.parametreler, { kisa_aralik_gun: 0 })
    // BEFORE: 4.5 then 5.0 µg/L six weeks apart raised "less than 90 days apart: read with caution". NOW: no caution.
    const r = sonuc('psa-hizi', { onceki_deger: '4.5', onceki_tarih: '2026-08-01', son_deger: '5.0', son_tarih: '2026-09-12' })
    assert.equal(r.tamam, true)
    assert.equal(sayi(r, 'gun'), 42)
    assert.deepEqual(r.uyarilar, [])
    assert.equal(r.sayilar.find((x) => x.anahtar === 'hiz')!.birim, 'ug/L/yil')
    assert.match(A.araclar.find((p) => p.anahtar === 'psa-hizi')!.metin.aciklama[D], /does not use a yearly rate of change\.$/)
  })

  it('LABORATORY UNITS as the pages opened write them: the albumin ratio in mg/mmol, haemoglobin in g/L, creatinine in µmol/L, glucose in mmol/L, CRP in mg/L, PSA in µg/L, HbA1c in per cent or mmol/mol', () => {
    // Sources (read 2026-10-10): Kidney Health Australia, CKD Management in Primary Care, 5th edition ("uACR <3.0
    // mg/mmol", "Hb 100 – 115 g/L", "6-8 mmol/L fasting"); Kidney Health Australia, eGFR calculator (µmol/L); PathWest
    // test directory, CRP (mg/L); RCPA Manual, HbA1c ("3.5 - 6.0% (15-42 mmol/mol)"); the PSA guideline above (µg/L).
    assert.deepEqual(JSON.parse(JSON.stringify(AU_GIRDI.araclar.labBirimleri)), LAB)
    // an HbA1c is never read without its unit: the doctor chooses, and the catalogue holds the sentence that asks
    assert.match(A.metinler[D]!.arac.birimSec ?? '', /Choose the unit/)
  })

  it('NOT SUPPLIED, because no usable Australian source was found: the hearing average keeps the kit\'s cited behaviour, return to sport shows no step, PASI shows no severity word', () => {
    const p = (k: string) => A.araclar.find((x) => x.anahtar === k)!
    for (const k of ['odyometri-pta', 'rtp-basamak', 'pasi', 'easi', 'scorad', 'das28']) { assert.equal(p(k).uyarlama, undefined, k); assert.equal(p(k).tablolar, undefined, k); assert.equal(p(k).parametreler, undefined, k) }
    // RETURN TO SPORT: the national framework's licence allows no commercial use, so no step is in the pack
    const rtp = sonuc('rtp-basamak', { yaralanma: '2026-10-01' })
    assert.deepEqual([rtp.tamam, rtp.bant, rtp.uyarilar, sayi(rtp, 'gun')], [true, null, ['basamak_tanimsiz'], 9])
    // PASI: the score and no severity word
    assert.equal(paketinAraci(A, 'pasi')!.tanim.cikti.bantlar.length, 0)
  })
})

describe('au: the tools only Australia has — switched on by the owner\'s order, each on the list of tools without a clinician\'s sign-off', () => {
  it('THE LIST AND THE PACK MATCH EXACTLY: every switched-on tool that carries Australia\'s code is listed, and every listed key is such a tool', () => {
    const acik = A.araclar.map((p) => p.anahtar).filter((k) => k.startsWith('au-')).sort()
    assert.deepEqual(acik, [...AU_ONAYSIZ_ACIK_ANAHTARLAR])
    assert.deepEqual(acik, [...KENDI_ARACLARI].sort())
    // everything Australia brought of its own is one of them: no placeholder, no link-out tile, no mechanism left over
    assert.deepEqual(ulkeyeOzelAnahtarlar(A, 'au'), acik)
    assert.deepEqual((A.kendiAraclari ?? []).map((t) => t.anahtar).sort(), acik)
    // nobody has signed one off yet
    for (const a of AU_ONAYSIZ_ACIK_ARACLAR) { assert.equal(a.klinisyen, null, a.anahtar); assert.ok(a.bakilacak.trim().length > 40, a.anahtar) }
    assert.deepEqual(A.inceleme, { makineYazimi: true, klinisyen: null })
  })

  it('each states a licence that is free on its rights holder\'s own notice, names the page it was read on, and shows the notice under the result', () => {
    for (const k of KENDI_ARACLARI) {
      const l = A.araclar.find((p) => p.anahtar === k)!.lisans!
      assert.equal(l.durum, 'serbest', k)
      assert.match(l.kaynak ?? '', /^https:\/\/\S+ \(read 2026-10-10\): /, k)
      assert.ok((l.bildirim?.[D] ?? '').length > 20, `${k}: the rights holder's notice`)
    }
    // no tool of the shared set has "free" written on it here: no rights holder's notice was read for one
    for (const p of A.araclar) if (!KENDI_ARACLARI.includes(p.anahtar)) assert.equal(p.lisans, undefined, p.anahtar)
  })

  it('who sees each: the body-size tool is a base tool for adults only; the K10 goes to every doctor role that treats adults and to the psychologist; the ECOG record to the two oncology roles', () => {
    assert.deepEqual(goren('au-body-size'), ['(no role)', ...ROLLER])
    const yetiskinHekimleri = hekimRolleri(AU_ARAYUZ.roller).filter((r) => r !== 'paediatrics' && r !== 'paediatric-surgery')
    assert.deepEqual(goren('au-mental-health-screen').sort(), [...yetiskinHekimleri, 'clinical-psychology'].sort())
    for (const r of ['paediatrics', 'paediatric-surgery', 'physiotherapy', 'dietetics', 'occupational-therapy', 'audiology', 'podiatry', 'speech-pathology', '(no role)']) assert.ok(!goren('au-mental-health-screen').includes(r), r)
    assert.deepEqual(goren('au-oncology-grading'), ['oncology', 'radiation-oncology'])
    for (const r of ['family-medicine', 'haematology', 'cardiology']) assert.ok(!goren('au-oncology-grading').includes(r), r)
  })

  it('the body-size tool is for adults: opened for a child, or for a patient whose age is unknown, it is not on the grid', () => {
    const p = A.araclar.find((x) => x.anahtar === 'au-body-size')!
    assert.deepEqual(p.hasta, { enAzYas: 18 })
    assert.equal(p.metin.hastaKapisi?.[D], 'This tool is for adults aged 18 and over.')
    const izgara = (dogum: string | null) => { const { temel } = hesabinAraclari(A, 'dietetics', { hasta: { dogumTarihi: dogum, cinsiyet: 'female' }, bugun: BUGUN }); return temel.map((x) => x.paket.anahtar) }
    assert.ok(izgara('1990-05-01').includes('au-body-size'), 'an adult')
    assert.ok(!izgara('2012-05-01').includes('au-body-size'), 'a child of 14')
    assert.ok(!izgara(null).includes('au-body-size'), 'an unknown birth date never opens it')
  })
})
