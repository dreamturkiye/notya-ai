/**
 * NOTYA-ULKE-UYGULA-US — United States: ITS OWN ROLE LIST, as the audit of 2026-10-10 decided it
 * (docs/araclar-denetim/US.md, Part 3; us-kararlar.json on the branch araclar-denetim/us).
 *
 *   BEFORE  40 roles: 30 doctor specialties, 5 clinic doctors, 5 allied professions (the shared English set).
 *   AFTER   55 roles: 40 doctor specialties, 4 clinic doctors, 11 professions.
 *           kept 25 specialties and 9 clinic roles · renamed 5 · removed 1 · added 10 specialties and 6 professions.
 *
 * Also held here: every added role says which shared role it behaves like and finds a note template and intake
 * questions there; a profession is never addressed as a senior doctor; AN ACCOUNT STORED WITH A KEY THIS COUNTRY TOOK
 * OUT STILL LOADS, and the country says which remaining role it belongs to; the two roles the kit cannot hold are
 * not half-added; and none of it reaches another English-speaking country.
 */
// FIRST: this process is a build of the United States (the kit reads an account's role against the ACTIVE pack).
import './testing/usDerlemesi'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { hekimRolleri } from '@/lib/ulke/araclar/paket'
import { icerikAnahtari, ROL_ANAHTARI_AZAMI } from '@/lib/ulke/arayuz/rolIcerigi'
import { rolSablonAlanlari, sablonMu, veliYasindaMi } from '@/lib/ulke/arayuz/notSablonu'
import { paketiDenetle } from '@/lib/ulke/paketDenetimi'
import { hekimRolunuOku, uygulamaRoluMu } from '@/lib/ulke/uygulama/rol'
import { rolTablosunuOku, rolTablosuSorunlari } from '@/lib/ulke/testing/rolTablosu'
import { EN_ROL_ALANLARI } from '../_dil/en/klinik/notSablonlari'
import { EN_ROLLER, enRolAnahtarlari } from '../_dil/en/klinik/roller'
import { US_ARAYUZ } from './arayuz'
import { US_GIRDI, US_HEKIMLER } from './ayarlar'
import { US_PAKETI } from './index'
import { US_KLINIK } from './klinik'
import { US_EKLENMEYEN_MESLEKLER, US_ROL_GOCU, US_ROLLER, US_YENIDEN_ADLANANLAR, usRolunuCoz } from './roller'

const D = 'en-US'
const KOK = resolve(__dirname, '../..')
const ROLLER = US_PAKETI.uygulama!.roller!
const tanim = (k: string) => US_ARAYUZ.roller.find((r) => r.anahtar === k)
const ad = (k: string) => tanim(k)?.ad[D]

/** The ten specialties and six professions the audit adds, each with the name the body cited writes and the shared role it behaves like. */
const EKLENEN_HEKIMLIKLER: readonly (readonly [string, string, string])[] = [
  ['allergy-immunology', 'Allergy and Immunology', 'internal-medicine'],
  ['geriatric-medicine', 'Geriatric Medicine', 'internal-medicine'],
  ['pain-medicine', 'Pain Medicine', 'rehabilitation-medicine'],
  ['sleep-medicine', 'Sleep Medicine', 'respiratory-medicine'],
  ['colon-rectal-surgery', 'Colon and Rectal Surgery', 'general-surgery'],
  ['radiation-oncology', 'Radiation Oncology', 'oncology'],
  ['child-adolescent-psychiatry', 'Child and Adolescent Psychiatry', 'psychiatry'],
  ['addiction-medicine', 'Addiction Medicine', 'psychiatry'],
  ['hospice-palliative-medicine', 'Hospice and Palliative Medicine', 'internal-medicine'],
  ['reproductive-endocrinology-infertility', 'Reproductive Endocrinology and Infertility', 'obstetrics-gynaecology'],
]
const EKLENEN_MESLEKLER: readonly (readonly [string, string, string])[] = [
  ['speech-language-pathology', 'Speech-Language Pathologist', 'occupational-therapy'],
  ['clinical-social-work', 'Licensed Clinical Social Worker', 'clinical-psychology'],
  ['podiatry', 'Podiatry', 'orthopaedics'],
  ['optometry', 'Optometry', 'ophthalmology'],
  ['chiropractic', 'Chiropractic', 'physiotherapy'],
  ['nurse-midwifery', 'Nurse Midwife', 'obstetrics-gynaecology'],
]

describe('us roles: the list before and after', () => {
  it('BEFORE 40 (30 + 5 + 5); AFTER 55 (40 doctor specialties, 4 clinic doctors, 11 professions)', () => {
    assert.equal(EN_ROLLER.length, 40)
    assert.equal(ROLLER.length, 55)
    assert.deepEqual([...ROLLER], [...enRolAnahtarlari(US_ROLLER)])
    assert.deepEqual(US_ARAYUZ.roller.map((r) => r.anahtar), [...ROLLER])
    const say = (taraf: string) => US_ARAYUZ.roller.filter((r) => r.taraf === taraf).length
    assert.deepEqual([say('doktor'), say('klinik-hekim'), say('klinik-muttefik')], [40, 4, 11])
    // the three kinds stay together, in the order the picker shows them
    assert.deepEqual([...new Set(US_ARAYUZ.roller.map((r) => r.taraf))], ['doktor', 'klinik-hekim', 'klinik-muttefik'])
    assert.equal(new Set(ROLLER).size, ROLLER.length)
  })

  it('REMOVED 1: "Dermatology (clinic)" — one specialty, and the doctor role carries it', () => {
    assert.deepEqual([...(US_ROLLER.cikar ?? [])], ['clinic-dermatology'])
    assert.ok(!ROLLER.includes('clinic-dermatology'))
    assert.ok(ROLLER.includes('dermatology'))
    assert.equal(ad('dermatology'), 'Dermatology')
    // its template and its questions left with it: no role behaves like it
    assert.ok(!('clinic-dermatology' in US_ARAYUZ.notSablonlari.rolAlanlari))
    assert.ok(!('clinic-dermatology' in US_KLINIK.hastaFormu!.roller))
  })

  it('RENAMED 5, each exactly as the body cited writes it (ABMS certificates; CMS for oncology): the keys stay', () => {
    assert.deepEqual({ ...US_YENIDEN_ADLANANLAR }, {
      'thoracic-surgery': 'Thoracic and Cardiac Surgery',
      'respiratory-medicine': 'Pulmonary Disease',
      'cardiovascular-surgery': 'Vascular Surgery',
      oncology: 'Hematology/Oncology',
      radiology: 'Diagnostic Radiology',
    })
    for (const [k, v] of Object.entries(US_YENIDEN_ADLANANLAR)) { assert.ok(ROLLER.includes(k), k); assert.equal(ad(k), v) }
    // the names they had are gone from the role list
    const adlar = US_ARAYUZ.roller.map((r) => r.ad[D])
    for (const eski of ['Thoracic surgery', 'Pulmonology', 'Cardiac and vascular surgery', 'Oncology', 'Radiology']) assert.ok(!adlar.includes(eski), eski)
  })

  it('KEPT 25 specialties and 9 clinic roles: the same key and the same name as before this job', () => {
    const once: Readonly<Record<string, string>> = {
      'emergency-medicine': 'Emergency medicine', 'family-medicine': 'Family medicine', anaesthesia: 'Anesthesiology', neurosurgery: 'Neurosurgery', 'paediatric-surgery': 'Pediatric surgery',
      'internal-medicine': 'Internal medicine', dermatology: 'Dermatology', endocrinology: 'Endocrinology', 'infectious-diseases': 'Infectious disease', gastroenterology: 'Gastroenterology',
      'general-surgery': 'General surgery', ophthalmology: 'Ophthalmology', 'obstetrics-gynaecology': 'Obstetrics and gynecology', cardiology: 'Cardiology', otolaryngology: 'Otolaryngology (ENT)',
      nephrology: 'Nephrology', neurology: 'Neurology', orthopaedics: 'Orthopedic surgery', paediatrics: 'Pediatrics', 'plastic-surgery': 'Plastic surgery', psychiatry: 'Psychiatry',
      rheumatology: 'Rheumatology', urology: 'Urology', 'sports-medicine': 'Sports medicine', 'rehabilitation-medicine': 'Physical medicine and rehabilitation',
      'hair-transplant': 'Hair transplantation', 'aesthetic-surgery': 'Cosmetic surgery', 'aesthetic-medicine': 'Aesthetic medicine', longevity: 'Preventive and longevity medicine',
      physiotherapy: 'Physical therapist', 'clinical-psychology': 'Clinical psychologist', dietetics: 'Dietitian', 'occupational-therapy': 'Occupational therapist', audiology: 'Audiologist',
    }
    assert.equal(Object.keys(once).length, 25 + 9)
    for (const [k, v] of Object.entries(once)) assert.equal(ad(k), v, k)
    // 34 kept + 5 renamed + 1 removed = the shared forty
    assert.deepEqual([...Object.keys(once), ...Object.keys(US_YENIDEN_ADLANANLAR), 'clinic-dermatology'].sort(), [...EN_ROLLER].sort())
  })

  it('ADDED 10 specialties, each named as its ABMS certificate, each a doctor role, last of its kind in the order written', () => {
    for (const [k, v, gibi] of EKLENEN_HEKIMLIKLER) {
      assert.equal(tanim(k)?.taraf, 'doktor', k)
      assert.equal(ad(k), v, k)
      assert.equal(tanim(k)?.gibi, gibi, k)
    }
    const hekimlikler = US_ARAYUZ.roller.filter((r) => r.taraf === 'doktor').map((r) => r.anahtar)
    assert.deepEqual(hekimlikler.slice(30), EKLENEN_HEKIMLIKLER.map((x) => x[0]))
    assert.deepEqual(hekimlikler.slice(0, 30), EN_ROLLER.slice(0, 30))
  })

  it('ADDED 6 professions of a clinic, each an allied profession (the kit\'s one kind for a professional who is not a physician)', () => {
    for (const [k, v, gibi] of EKLENEN_MESLEKLER) {
      assert.equal(tanim(k)?.taraf, 'klinik-muttefik', k)
      assert.equal(ad(k), v, k)
      assert.equal(tanim(k)?.gibi, gibi, k)
    }
    assert.deepEqual(ROLLER.slice(-6), EKLENEN_MESLEKLER.map((x) => x[0]))
  })

  it('NOT ADDED: nurse practitioner and physician assistant — the kit has one role per account and cannot hold a profession beside a specialty', () => {
    assert.deepEqual([...US_EKLENMEYEN_MESLEKLER], ['nurse-practitioner', 'physician-assistant'])
    for (const k of US_EKLENMEYEN_MESLEKLER) assert.ok(!ROLLER.includes(k), `${k} is half-added`)
    assert.doesNotMatch(JSON.stringify(US_ARAYUZ.roller), /nurse practitioner|physician assistant/i)
  })

  it('every key is one the database can keep: lower-case words joined by hyphens, at most 60 characters', () => {
    for (const k of ROLLER) { assert.match(k, /^[a-z]+(-[a-z]+)*$/, k); assert.ok(k.length <= ROL_ANAHTARI_AZAMI, k) }
  })
})

describe('us roles: an added role behaves like a shared role, under its own key and its own name', () => {
  const v = US_ARAYUZ.notSablonlari
  const hepsi = [...EKLENEN_HEKIMLIKLER, ...EKLENEN_MESLEKLER]

  it('its notes are written with that role\'s template; one profession brings fields of its own', () => {
    for (const [k, , gibi] of hepsi) {
      assert.equal(sablonMu(v, US_ARAYUZ.roller, k), true, k)
      if (k === 'speech-language-pathology') continue
      assert.equal(icerikAnahtari(US_ARAYUZ.roller, k, v.rolAlanlari), gibi, k)
      assert.deepEqual([...rolSablonAlanlari(v, US_ARAYUZ.roller, k)], [...EN_ROL_ALANLARI[gibi as keyof typeof EN_ROL_ALANLARI]], k)
    }
    // the speech-language pathologist: the occupational therapist's fields that are not about the hand or the home
    assert.equal(icerikAnahtari(US_ARAYUZ.roller, 'speech-language-pathology', v.rolAlanlari), 'speech-language-pathology')
    const kendi = [...rolSablonAlanlari(v, US_ARAYUZ.roller, 'speech-language-pathology')]
    assert.deepEqual(kendi, ['referral_diagnosis', 'functional_status', 'daily_activities', 'session_content', 'assistive_devices', 'rehab_goals'])
    for (const alan of kendi) assert.ok(EN_ROL_ALANLARI['occupational-therapy'].includes(alan as never), `${alan} is not a field of the role it behaves like`)
    // every field of every template has a name on the screen
    for (const [k] of hepsi) for (const alan of rolSablonAlanlari(v, US_ARAYUZ.roller, k)) assert.ok(v.alanlar[alan]?.ad[D]?.trim(), `${k}.${alan}`)
  })

  it('its intake form asks that role\'s questions', () => {
    const f = US_KLINIK.hastaFormu!
    for (const [k, , gibi] of hepsi) {
      assert.equal(icerikAnahtari(US_ARAYUZ.roller, k, f.roller), gibi, k)
      assert.ok(f.roller[gibi].sorular.length > 0, gibi)
    }
  })

  it('the instruction to the model: a specialty opens with the senior-doctor line and names the specialty; A PROFESSION IS NEVER ADDRESSED AS A SENIOR DOCTOR', () => {
    for (const [k, v2] of EKLENEN_HEKIMLIKLER) {
      const t = US_KLINIK.notTalimati(D, k) ?? ''
      assert.ok(t.startsWith('You are an experienced attending physician.'), k)
      assert.ok(t.includes(v2), `${k}: the instruction does not name "${v2}"`)
    }
    for (const [k, v2] of EKLENEN_MESLEKLER) {
      const t = US_KLINIK.notTalimati(D, k) ?? ''
      assert.ok(t.startsWith(`Your colleague is a health professional and not a doctor: their profession is "${v2}".`), k)
      assert.doesNotMatch(t, /attending physician|You are an experienced/, k)
    }
  })

  it('CHILD AND ADOLESCENT PSYCHIATRY is a role whose patients are children: an unknown age gets the guardian wording, as in pediatrics', () => {
    assert.ok(v.cocukRolleri.includes('child-adolescent-psychiatry'))
    assert.deepEqual([...v.cocukRolleri].sort(), ['child-adolescent-psychiatry', 'paediatric-surgery', 'paediatrics'])
    assert.equal(veliYasindaMi(v, US_PAKETI.uygulama!.veliYasi, 'child-adolescent-psychiatry', null, null), true)
    assert.equal(veliYasindaMi(v, US_PAKETI.uygulama!.veliYasi, 'psychiatry', null, null), false)
    assert.equal(veliYasindaMi(v, US_PAKETI.uygulama!.veliYasi, 'addiction-medicine', null, null), false)
  })

  it('"every doctor role" of this country: the 40 specialties and the 4 clinic doctors, none of the 11 professions', () => {
    assert.deepEqual([...US_HEKIMLER], hekimRolleri(US_ARAYUZ.roller))
    assert.equal(US_HEKIMLER.length, 44)
    for (const [k] of EKLENEN_HEKIMLIKLER) assert.ok(US_HEKIMLER.includes(k), k)
    for (const [k] of EKLENEN_MESLEKLER) assert.ok(!US_HEKIMLER.includes(k), k)
  })
})

describe('us roles: A STORED ACCOUNT THAT HOLDS A KEY THIS COUNTRY TOOK OUT STILL LOADS', () => {
  /** A stand-in for the country's database that holds one row: this account's stored role. */
  const veritabani = (rol: unknown): SupabaseClient => {
    const zincir: unknown = new Proxy({}, { get: (_h, ad2) => (ad2 === 'maybeSingle' ? async () => ({ data: { rol }, error: null }) : ad2 === 'then' ? undefined : () => zincir) })
    return zincir as SupabaseClient
  }

  it('every key taken out has a nearest remaining role, stated by the country; nothing else is on the map', () => {
    assert.deepEqual(Object.keys(US_ROL_GOCU).sort(), [...(US_ROLLER.cikar ?? [])].sort())
    for (const [eski, yeni] of Object.entries(US_ROL_GOCU)) {
      assert.ok(!ROLLER.includes(eski), `${eski} is still a role`)
      assert.ok(ROLLER.includes(yeni), `${eski} → ${yeni}, which is no role of this country`)
      assert.ok(sablonMu(US_ARAYUZ.notSablonlari, US_ARAYUZ.roller, yeni), `${yeni} has a note template`)
    }
    assert.equal(US_ROL_GOCU['clinic-dermatology'], 'dermatology')
  })

  it('THE KIT READS SUCH AN ACCOUNT AS "NO ROLE CHOSEN": it loads, it is not refused, and no role is guessed for it', async () => {
    assert.equal(uygulamaRoluMu('clinic-dermatology'), false)
    assert.equal(await hekimRolunuOku(veritabani('clinic-dermatology'), 'hesap-1'), null)
    // an account of a role this country keeps or adds is read as it was stored
    assert.equal(await hekimRolunuOku(veritabani('dermatology'), 'hesap-1'), 'dermatology')
    assert.equal(await hekimRolunuOku(veritabani('cardiovascular-surgery'), 'hesap-1'), 'cardiovascular-surgery', 'a renamed role keeps its key: nothing to move')
    assert.equal(await hekimRolunuOku(veritabani('geriatric-medicine'), 'hesap-1'), 'geriatric-medicine')
    // a key of no country is no role either
    assert.equal(await hekimRolunuOku(veritabani('nurse-practitioner'), 'hesap-1'), null)
  })

  it('THE COUNTRY\'S ANSWER for such an account: the nearest remaining role, which the kit accepts when it is written back', () => {
    assert.equal(usRolunuCoz('clinic-dermatology', ROLLER), 'dermatology')
    assert.equal(uygulamaRoluMu(usRolunuCoz('clinic-dermatology', ROLLER)), true)
    // a role of this country is its own answer; anything else has none
    for (const k of ROLLER) assert.equal(usRolunuCoz(k, ROLLER), k)
    for (const ham of ['', null, undefined, 42, 'not-a-role', 'nurse-practitioner', 'acil-tip']) assert.equal(usRolunuCoz(ham, ROLLER), null, String(ham))
    // with the map applied, every key of the shared forty still lands on a role of this country
    for (const k of EN_ROLLER) assert.ok(usRolunuCoz(k, ROLLER) !== null, `${k} would be left without a role`)
  })
})

describe('us roles: the pack, the role table and the other countries', () => {
  it('the whole pack check finds nothing', () => {
    assert.deepEqual(paketiDenetle(US_PAKETI, US_ARAYUZ, US_KLINIK).map((x) => `${x.yer}: ${x.sorun}`), [])
  })

  it('the role table (countries/rol-eslemesi.json) states exactly these differences for "us"', () => {
    const t = rolTablosunuOku()
    assert.deepEqual(rolTablosuSorunlari(t, 'us', 'en', ROLLER, US_ARAYUZ.roller), [])
    const fark = t.ulkeyeOzel!.us
    assert.deepEqual(fark.cikar, ['clinic-dermatology'])
    assert.deepEqual(fark.ekle.map((r) => [r.anahtar, r.gibi]), [...EKLENEN_HEKIMLIKLER, ...EKLENEN_MESLEKLER].map(([k, , gibi]) => [k, gibi]))
    assert.deepEqual(fark.ekle.map((r) => r.taraf), [...EKLENEN_HEKIMLIKLER.map(() => 'doktor'), ...EKLENEN_MESLEKLER.map(() => 'klinik-muttefik')])
  })

  it('THE DIFFERENCE IS THIS COUNTRY\'S ALONE: it is written in this folder, and the shared set still has its forty', () => {
    assert.equal(US_GIRDI.roller, US_ROLLER)
    assert.equal(EN_ROLLER.length, 40)
    assert.ok((EN_ROLLER as readonly string[]).includes('clinic-dermatology'))
    for (const [k] of [...EKLENEN_HEKIMLIKLER, ...EKLENEN_MESLEKLER]) assert.ok(!(EN_ROLLER as readonly string[]).includes(k), k)
    // no other pack folder and no file of the shared English set names a role this country added
    const set = readFileSync(join(KOK, 'countries/_dil/en/klinik/roller.ts'), 'utf8')
    for (const [k] of [...EKLENEN_HEKIMLIKLER, ...EKLENEN_MESLEKLER]) assert.ok(!set.includes(`'${k}'`), `${k} is named in the shared set`)
  })
})
