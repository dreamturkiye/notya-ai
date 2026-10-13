/**
 * NOTYA-ULKE-UYGULA-CA — Canada: ITS OWN ROLE LIST, as the audit of 2026-10-10 decided it
 * (docs/araclar-denetim/CA.md, Part 3; ca-kararlar.json → `specialties`, `clinicSpecialties`).
 *
 *   BEFORE  40 roles: 30 doctor specialties, 5 clinic doctors, 5 allied professions (the shared English set).
 *   AFTER   47 roles: 36 doctor specialties, 5 clinic doctors, 6 professions.
 *           kept 26 specialties and 7 clinic roles · renamed 4 specialties and 3 clinic roles · removed none ·
 *           added 6 specialties (one of them the second half of a SPLIT) and 1 profession.
 *           NOT added, waiting on the kit: the nurse practitioner.
 *
 * Also held here: every added role says which shared role it behaves like and finds a note template and intake
 * questions there; a profession is never addressed as a senior doctor; A STORED ACCOUNT STILL LOADS (no shared key
 * was taken out, the split role included); the role the kit cannot hold is not half-added; and none of it reaches
 * another English-speaking country.
 *
 * THE NAMES. Each renamed or added name below is as its source wrote it on 2026-10-10: the Royal College of Physicians
 * and Surgeons of Canada, "Information by discipline",
 * https://www.royalcollege.ca/en/standards-and-accreditation/information-by-discipline.html (the doctor disciplines),
 * and the Canadian Institute for Health Information, "Health Workforce in Canada, 2019 to 2023: Overview —
 * Methodology Notes" (2025), Table 1,
 * https://www.cihi.ca/sites/default/files/document/health-workforce-canada-2019-2023-overview-meth-notes-en.pdf
 * (the professions, which it writes in the plural).
 */
// FIRST: this process is a build of Canada (the kit reads an account's role against the ACTIVE pack).
import './testing/caDerlemesi'
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
import { CA_ARAYUZ } from './arayuz'
import { CA_GIRDI, CA_HEKIMLER } from './ayarlar'
import { CA_PAKETI } from './index'
import { CA_KLINIK } from './klinik'
import { CA_EKLENMEYEN_MESLEKLER, CA_ROL_GOCU, CA_ROLLER, CA_YENIDEN_ADLANANLAR, caRolunuCoz } from './roller'

const D = 'en-CA'
const KOK = resolve(__dirname, '../..')
const ROLLER = CA_PAKETI.uygulama!.roller!
const tanim = (k: string) => CA_ARAYUZ.roller.find((r) => r.anahtar === k)
const ad = (k: string) => tanim(k)?.ad[D]

/** The six disciplines and the one profession added, each with the name the body cited writes and the shared role it behaves like. */
const EKLENEN_HEKIMLIKLER: readonly (readonly [string, string, string])[] = [
  ['vascular-surgery', 'Vascular Surgery', 'cardiovascular-surgery'],
  ['clinical-immunology-allergy', 'Clinical Immunology and Allergy', 'internal-medicine'],
  ['geriatric-medicine', 'Geriatric Medicine', 'internal-medicine'],
  ['hematology', 'Hematology', 'internal-medicine'],
  ['pain-medicine', 'Pain Medicine', 'rehabilitation-medicine'],
  ['reproductive-endocrinology', 'Gynecologic Reproductive Endocrinology and Infertility', 'obstetrics-gynaecology'],
]
const EKLENEN_MESLEKLER: readonly (readonly [string, string, string])[] = [
  ['psychotherapy', 'Psychotherapist / counselling therapist', 'clinical-psychology'],
]

describe('ca roles: the list before and after', () => {
  it('BEFORE 40 (30 + 5 + 5); AFTER 47 (36 doctor specialties, 5 clinic doctors, 6 professions)', () => {
    assert.equal(EN_ROLLER.length, 40)
    assert.equal(ROLLER.length, 47)
    assert.deepEqual([...ROLLER], [...enRolAnahtarlari(CA_ROLLER)])
    assert.deepEqual(CA_ARAYUZ.roller.map((r) => r.anahtar), [...ROLLER])
    const say = (taraf: string) => CA_ARAYUZ.roller.filter((r) => r.taraf === taraf).length
    assert.deepEqual([say('doktor'), say('klinik-hekim'), say('klinik-muttefik')], [36, 5, 6])
    // the three kinds stay together, in the order the picker shows them
    assert.deepEqual([...new Set(CA_ARAYUZ.roller.map((r) => r.taraf))], ['doktor', 'klinik-hekim', 'klinik-muttefik'])
    assert.equal(new Set(ROLLER).size, ROLLER.length)
  })

  it('REMOVED: none. Every one of the shared forty keys is still a role here', () => {
    assert.deepEqual([...(CA_ROLLER.cikar ?? [])], [])
    for (const k of EN_ROLLER) assert.ok(ROLLER.includes(k), k)
  })

  it('RENAMED 7, each exactly as the body cited writes it: four specialties (the Royal College\'s list) and three clinic roles; the keys stay', () => {
    assert.deepEqual({ ...CA_YENIDEN_ADLANANLAR }, {
      'internal-medicine': 'Internal Medicine',
      'cardiovascular-surgery': 'Cardiac Surgery',
      otolaryngology: 'Otolaryngology-Head and Neck Surgery',
      oncology: 'Medical Oncology',
      'clinic-dermatology': 'Dermatology',
      longevity: 'Longevity medicine',
      'clinical-psychology': 'Psychologist',
    })
    for (const [k, v] of Object.entries(CA_YENIDEN_ADLANANLAR)) { assert.ok(ROLLER.includes(k), k); assert.equal(ad(k), v) }
    // the names they had are gone from the role list
    const adlar = CA_ARAYUZ.roller.map((r) => r.ad[D])
    for (const eski of ['General internal medicine', 'Cardiac and vascular surgery', 'Otolaryngology, head and neck surgery', 'Otolaryngology (ENT)', 'Oncology', 'Dermatology (clinic)', 'Preventive and longevity medicine', 'Clinical psychologist']) assert.ok(!adlar.includes(eski), eski)
    // "General internal medicine" is a subspecialty there and names no role; no role name says "preventive"
    for (const r of CA_ARAYUZ.roller) { assert.doesNotMatch(r.ad[D] ?? '', /general internal medicine/i, r.anahtar); assert.doesNotMatch(r.ad[D] ?? '', /preventive/i, r.anahtar) }
  })

  it('"Dermatology" is one specialty under two headings: the specialty role and the clinic role carry the same name and are told apart by their kind', () => {
    assert.equal(ad('dermatology'), 'Dermatology')
    assert.equal(ad('clinic-dermatology'), 'Dermatology')
    assert.equal(tanim('dermatology')?.taraf, 'doktor')
    assert.equal(tanim('clinic-dermatology')?.taraf, 'klinik-hekim')
    // no other name is carried by two roles
    const adlar = CA_ARAYUZ.roller.map((r) => r.ad[D])
    assert.deepEqual(adlar.filter((x, i) => adlar.indexOf(x) !== i), ['Dermatology'])
  })

  it('KEPT 26 specialties and 7 clinic roles: the same key and the same name as before this job', () => {
    const once: Readonly<Record<string, string>> = {
      'emergency-medicine': 'Emergency medicine', 'family-medicine': 'Family medicine', anaesthesia: 'Anesthesiology', neurosurgery: 'Neurosurgery', 'paediatric-surgery': 'Pediatric surgery',
      dermatology: 'Dermatology', endocrinology: 'Endocrinology and metabolism', 'infectious-diseases': 'Infectious diseases', gastroenterology: 'Gastroenterology', 'general-surgery': 'General surgery',
      'thoracic-surgery': 'Thoracic surgery', 'respiratory-medicine': 'Respirology', ophthalmology: 'Ophthalmology', 'obstetrics-gynaecology': 'Obstetrics and gynecology', cardiology: 'Cardiology',
      nephrology: 'Nephrology', neurology: 'Neurology', orthopaedics: 'Orthopedic surgery', paediatrics: 'Pediatrics', 'plastic-surgery': 'Plastic surgery', psychiatry: 'Psychiatry',
      radiology: 'Diagnostic radiology', rheumatology: 'Rheumatology', urology: 'Urology', 'sports-medicine': 'Sport and exercise medicine', 'rehabilitation-medicine': 'Physical medicine and rehabilitation',
      'hair-transplant': 'Hair transplantation', 'aesthetic-surgery': 'Cosmetic surgery', 'aesthetic-medicine': 'Aesthetic medicine',
      physiotherapy: 'Physiotherapist', dietetics: 'Dietitian', 'occupational-therapy': 'Occupational therapist', audiology: 'Audiologist',
    }
    assert.equal(Object.keys(once).length, 26 + 7)
    for (const [k, v] of Object.entries(once)) assert.equal(ad(k), v, k)
    // 33 kept + 7 renamed = the shared forty
    assert.deepEqual([...Object.keys(once), ...Object.keys(CA_YENIDEN_ADLANANLAR)].sort(), [...EN_ROLLER].sort())
  })

  it('ADDED 6 disciplines, each named as the Royal College\'s list writes it, each a doctor role', () => {
    for (const [k, v, gibi] of EKLENEN_HEKIMLIKLER) {
      assert.equal(tanim(k)?.taraf, 'doktor', k)
      assert.equal(ad(k), v, k)
      assert.equal(tanim(k)?.gibi, gibi, k)
    }
    const hekimlikler = CA_ARAYUZ.roller.filter((r) => r.taraf === 'doktor').map((r) => r.anahtar)
    assert.equal(hekimlikler.length, 36)
    // the other five are last of their kind, in the order written
    assert.deepEqual(hekimlikler.slice(31), EKLENEN_HEKIMLIKLER.slice(1).map((x) => x[0]))
  })

  it('THE SPLIT: "Cardiac and vascular surgery" is now "Cardiac Surgery" (the shared key) and "Vascular Surgery" (a new role right after it); both write with the same template', () => {
    assert.equal(ad('cardiovascular-surgery'), 'Cardiac Surgery')
    assert.equal(ad('vascular-surgery'), 'Vascular Surgery')
    assert.equal(ROLLER.indexOf('vascular-surgery'), ROLLER.indexOf('cardiovascular-surgery') + 1)
    assert.equal(ROLLER[ROLLER.indexOf('vascular-surgery') + 1], 'cardiology')
    const v = CA_ARAYUZ.notSablonlari
    assert.deepEqual([...rolSablonAlanlari(v, CA_ARAYUZ.roller, 'vascular-surgery')], [...rolSablonAlanlari(v, CA_ARAYUZ.roller, 'cardiovascular-surgery')])
  })

  it('ADDED 1 profession of a clinic, beside a profession the set already has and framed the same way', () => {
    for (const [k, v, gibi] of EKLENEN_MESLEKLER) {
      assert.equal(tanim(k)?.taraf, 'klinik-muttefik', k)
      assert.equal(ad(k), v, k)
      assert.equal(tanim(k)?.gibi, gibi, k)
    }
    assert.deepEqual(ROLLER.slice(-1), EKLENEN_MESLEKLER.map((x) => x[0]))
    // NO ROLE THAT IS NOT A PHYSICIAN'S BEHAVES LIKE A PHYSICIAN'S ROLE: the instruction for such a role would name a field its note does not have
    for (const r of CA_ARAYUZ.roller) if (r.taraf === 'klinik-muttefik' && r.gibi) assert.equal(CA_ARAYUZ.roller.find((x) => x.anahtar === r.gibi)?.taraf, 'klinik-muttefik', `${r.anahtar} behaves like ${r.gibi}`)
  })

  it('NOT ADDED, waiting on the kit: the nurse practitioner (neither opening of the instruction to the model describes the profession)', () => {
    assert.deepEqual([...CA_EKLENMEYEN_MESLEKLER], ['nurse-practitioner'])
    for (const k of CA_EKLENMEYEN_MESLEKLER) assert.ok(!ROLLER.includes(k), `${k} is half-added`)
    assert.doesNotMatch(JSON.stringify(CA_ARAYUZ.roller), /nurse practitioner/i)
    // no tool and no placeholder is given to the role either
    for (const p of CA_ARAYUZ.araclar!.araclar) for (const r of p.roller ?? []) assert.ok(!CA_EKLENMEYEN_MESLEKLER.includes(r), `${p.anahtar}: ${r}`)
    for (const y of CA_ARAYUZ.araclar!.yuvalar) for (const r of y.roller ?? []) assert.ok(!CA_EKLENMEYEN_MESLEKLER.includes(r), `${y.anahtar}: ${r}`)
  })

  it('every key is one the database can keep: lower-case words joined by hyphens, at most 60 characters', () => {
    for (const k of ROLLER) { assert.match(k, /^[a-z]+(-[a-z]+)*$/, k); assert.ok(k.length <= ROL_ANAHTARI_AZAMI, k) }
  })
})

describe('ca roles: an added role behaves like a shared role, under its own key and its own name', () => {
  const v = CA_ARAYUZ.notSablonlari
  const hepsi = [...EKLENEN_HEKIMLIKLER, ...EKLENEN_MESLEKLER]

  it('its notes are written with that role\'s template', () => {
    for (const [k, , gibi] of hepsi) {
      assert.equal(sablonMu(v, CA_ARAYUZ.roller, k), true, k)
      assert.equal(icerikAnahtari(CA_ARAYUZ.roller, k, v.rolAlanlari), gibi, k)
      assert.deepEqual([...rolSablonAlanlari(v, CA_ARAYUZ.roller, k)], [...EN_ROL_ALANLARI[gibi as keyof typeof EN_ROL_ALANLARI]], k)
      // every field of the template has a name on the screen
      for (const alan of rolSablonAlanlari(v, CA_ARAYUZ.roller, k)) assert.ok(v.alanlar[alan]?.ad[D]?.trim(), `${k}.${alan}`)
    }
  })

  it('its intake form asks that role\'s questions', () => {
    const f = CA_KLINIK.hastaFormu!
    for (const [k, , gibi] of hepsi) {
      assert.equal(icerikAnahtari(CA_ARAYUZ.roller, k, f.roller), gibi, k)
      assert.ok(f.roller[gibi].sorular.length > 0, gibi)
    }
  })

  it('the instruction to the model: a discipline opens with the senior-doctor line and names the discipline; A PROFESSION IS NEVER ADDRESSED AS A SENIOR DOCTOR', () => {
    for (const [k, v2] of EKLENEN_HEKIMLIKLER) {
      const t = CA_KLINIK.notTalimati(D, k) ?? ''
      assert.ok(t.startsWith('You are an experienced staff physician.'), k)
      assert.ok(t.includes(v2), `${k}: the instruction does not name "${v2}"`)
    }
    for (const [k, v2] of EKLENEN_MESLEKLER) {
      const t = CA_KLINIK.notTalimati(D, k) ?? ''
      assert.ok(t.startsWith(`Your colleague is a health professional and not a doctor: their profession is "${v2}".`), k)
      assert.doesNotMatch(t, /staff physician|You are an experienced/, k)
      assert.match(t, /Make no medical diagnosis/, k)
    }
    // the renamed profession is framed under its new name
    assert.ok((CA_KLINIK.notTalimati(D, 'clinical-psychology') ?? '').startsWith('Your colleague is a health professional and not a doctor: their profession is "Psychologist".'))
  })

  it('no added role is a role whose patients are children: the two children\'s roles are the set\'s', () => {
    assert.deepEqual([...v.cocukRolleri].sort(), ['paediatric-surgery', 'paediatrics'])
    for (const [k] of hepsi) assert.equal(veliYasindaMi(v, CA_PAKETI.uygulama!.veliYasi, k, null, null), false, k)
  })

  it('"every doctor role" of this country: the 36 specialties and the 5 clinic doctors, none of the 6 professions', () => {
    assert.deepEqual([...CA_HEKIMLER], hekimRolleri(CA_ARAYUZ.roller))
    assert.equal(CA_HEKIMLER.length, 41)
    for (const [k] of EKLENEN_HEKIMLIKLER) assert.ok(CA_HEKIMLER.includes(k), k)
    for (const [k] of EKLENEN_MESLEKLER) assert.ok(!CA_HEKIMLER.includes(k), k)
  })
})

describe('ca roles: A STORED ACCOUNT STILL LOADS — no shared key was taken out, and the split kept its key', () => {
  /** A stand-in for the country's database that holds one row: this account's stored role. */
  const veritabani = (rol: unknown): SupabaseClient => {
    const zincir: unknown = new Proxy({}, { get: (_h, ad2) => (ad2 === 'maybeSingle' ? async () => ({ data: { rol }, error: null }) : ad2 === 'then' ? undefined : () => zincir) })
    return zincir as SupabaseClient
  }

  it('the map of removed keys holds exactly the keys taken out: none', () => {
    assert.deepEqual(Object.keys(CA_ROL_GOCU).sort(), [...(CA_ROLLER.cikar ?? [])].sort())
    assert.deepEqual(Object.keys(CA_ROL_GOCU), [])
  })

  it('AN ACCOUNT STORED WITH ANY OF THE SHARED FORTY KEYS IS READ AS IT WAS STORED, the split and the renamed roles included', async () => {
    for (const k of EN_ROLLER) {
      assert.equal(uygulamaRoluMu(k), true, k)
      assert.equal(await hekimRolunuOku(veritabani(k), 'hesap-1'), k, k)
      assert.equal(caRolunuCoz(k, ROLLER), k, k)
    }
    // THE SPLIT: the account of a surgeon who chose "Cardiac and vascular surgery" holds the key that is now "Cardiac Surgery"
    assert.equal(await hekimRolunuOku(veritabani('cardiovascular-surgery'), 'hesap-1'), 'cardiovascular-surgery')
    assert.equal(ad('cardiovascular-surgery'), 'Cardiac Surgery')
    // … and may choose the other half: the kit accepts the new key when it is written
    assert.equal(uygulamaRoluMu('vascular-surgery'), true)
    assert.equal(await hekimRolunuOku(veritabani('vascular-surgery'), 'hesap-1'), 'vascular-surgery')
    // every role this country added is read back too
    for (const [k] of [...EKLENEN_HEKIMLIKLER, ...EKLENEN_MESLEKLER]) assert.equal(await hekimRolunuOku(veritabani(k), 'hesap-1'), k, k)
  })

  it('a key that is no role of this country is "no role chosen": the account loads, and no role is guessed for it', async () => {
    for (const ham of ['nurse-practitioner', 'allergy-immunology', 'acil-tip', 'not-a-role']) {
      assert.equal(uygulamaRoluMu(ham), false, ham)
      assert.equal(await hekimRolunuOku(veritabani(ham), 'hesap-1'), null, ham)
    }
    for (const ham of ['', null, undefined, 42, 'not-a-role', 'nurse-practitioner', 'acil-tip']) assert.equal(caRolunuCoz(ham, ROLLER), null, String(ham))
  })
})

describe('ca roles: the pack, the role table and the other countries', () => {
  it('the whole pack check finds nothing', () => {
    assert.deepEqual(paketiDenetle(CA_PAKETI, CA_ARAYUZ, CA_KLINIK).map((x) => `${x.yer}: ${x.sorun}`), [])
  })

  it('the role table (countries/rol-eslemesi.json) states exactly these differences for "ca"', () => {
    const t = rolTablosunuOku()
    assert.deepEqual(rolTablosuSorunlari(t, 'ca', 'en', ROLLER, CA_ARAYUZ.roller), [])
    const fark = t.ulkeyeOzel!.ca
    assert.deepEqual(fark.cikar, [])
    assert.deepEqual(fark.ekle.map((r) => [r.anahtar, r.gibi]), [...EKLENEN_HEKIMLIKLER, ...EKLENEN_MESLEKLER].map(([k, , gibi]) => [k, gibi]))
    assert.deepEqual(fark.ekle.map((r) => r.taraf), [...EKLENEN_HEKIMLIKLER.map(() => 'doktor'), ...EKLENEN_MESLEKLER.map(() => 'klinik-muttefik')])
  })

  it('THE DIFFERENCE IS THIS COUNTRY\'S ALONE: it is written in this folder, and the shared set still has its forty under their own names', () => {
    assert.equal(CA_GIRDI.roller, CA_ROLLER)
    assert.equal(EN_ROLLER.length, 40)
    for (const [k] of [...EKLENEN_HEKIMLIKLER, ...EKLENEN_MESLEKLER]) assert.ok(!(EN_ROLLER as readonly string[]).includes(k), k)
    // the shared English set names no role this country added, and still writes the names this country changed
    const set = readFileSync(join(KOK, 'countries/_dil/en/klinik/roller.ts'), 'utf8')
    for (const [k] of [...EKLENEN_HEKIMLIKLER, ...EKLENEN_MESLEKLER]) assert.ok(!set.includes(`'${k}'`), `${k} is named in the shared set`)
    for (const eski of ['Cardiac and vascular surgery', 'Dermatology (clinic)', 'Preventive and longevity medicine', 'Clinical psychologist']) assert.ok(set.includes(`'${eski}'`), eski)
  })
})
