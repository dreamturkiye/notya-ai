/**
 * NOTYA-ULKE-UYGULA (gb) — United Kingdom: THE ROLE LIST as the audited decisions state it
 * (docs/araclar-denetim/gb-kararlar.json → `specialties`, `clinicSpecialties`), and what happens to a stored account
 * that holds a key this country took out.
 *
 * The names are held to the two regulators' lists, opened on 2026-10-10 (./roller.ts has the addresses):
 *   General Medical Council, "GMC approved postgraduate curricula"
 *   Health and Care Professions Council, "The professions" (protected titles)
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { EN_ROLLER, EN_ROL_SATIRLARI } from '../_dil/en/klinik/roller'
import { EN_ROL_ALANLARI } from '../_dil/en/klinik/notSablonlari'
import { rolSablonAlanlari, sablonMu } from '@/lib/ulke/arayuz/notSablonu'
import { icerikAnahtari } from '@/lib/ulke/arayuz/rolIcerigi'
import { paketiDenetle } from '@/lib/ulke/paketDenetimi'
import { GB_ARAYUZ } from './arayuz'
import { GB_PAKETI } from './index'
import { GB_KLINIK } from './klinik'
import { GB_KALDIRILAN_ROLLER, GB_ROL_ADLARI, GB_ROLLER } from './roller'

// The two modules that ask "the active pack" (lib/ulke/uygulama/rol.ts, lib/ulke/arayuz) are loaded inside the test,
// after this line: no import above reads the country, so this process is a build of the United Kingdom for them.
process.env.NOTYA_COUNTRY = 'gb'

const D = 'en-GB'
const KOK = resolve(__dirname, '../..')
const KARARLAR = JSON.parse(readFileSync(join(KOK, 'docs/araclar-denetim/gb-kararlar.json'), 'utf8')) as {
  specialties: { key: string; verdict: string; officialName: string | null }[]
  clinicSpecialties: { key: string; verdict: string; officialName: string | null }[]
}
const ROLLER = GB_PAKETI.uygulama!.roller!
const ad = (rol: string) => GB_ARAYUZ.roller.find((r) => r.anahtar === rol)?.ad[D]
const tanim = (rol: string) => GB_ARAYUZ.roller.find((r) => r.anahtar === rol)

describe('gb: the role list of the audited decisions, shipped active', () => {
  it('53 roles: the shared forty without one clinic role, with twelve specialties and two professions of this country', () => {
    assert.equal(EN_ROLLER.length, 40)
    assert.equal(ROLLER.length, 53)
    assert.deepEqual(GB_ARAYUZ.roller.map((r) => r.anahtar), [...ROLLER], 'the picker and the server hold the same list')
    assert.equal(GB_ARAYUZ.roller.filter((r) => r.taraf === 'doktor').length, 42)
    assert.equal(GB_ARAYUZ.roller.filter((r) => r.taraf === 'klinik-hekim').length, 4)
    assert.equal(GB_ARAYUZ.roller.filter((r) => r.taraf === 'klinik-muttefik').length, 7)
    // the three kinds stay together, in the order doctor, clinic doctor, allied profession
    const sira = GB_ARAYUZ.roller.map((r) => r.taraf)
    assert.deepEqual(sira, [...sira].sort((a, b) => ['doktor', 'klinik-hekim', 'klinik-muttefik'].indexOf(a) - ['doktor', 'klinik-hekim', 'klinik-muttefik'].indexOf(b)))
    assert.equal(ROLLER[ROLLER.indexOf('oncology') + 1], 'clinical-oncology', 'the two oncology specialties stand together')
  })

  it('EVERY DECISION OF THE DATA FILE IS APPLIED: keep, rename, add, remove — and the one undecided role is left as it is', () => {
    for (const s of [...KARARLAR.specialties, ...KARARLAR.clinicSpecialties]) {
      if (s.verdict === 'remove') { assert.ok(!ROLLER.includes(s.key), `${s.key} was to be removed`); continue }
      assert.ok(ROLLER.includes(s.key), `${s.key} (${s.verdict}) is not a role of the pack`)
      // a renamed or added role carries the official name exactly as the regulator writes it
      if (s.verdict === 'rename' || s.verdict === 'add') assert.equal(ad(s.key), s.officialName, s.key)
      // a kept role that has an official name on the regulator's list shows it — but for the one spelling the decisions keep
      if (s.verdict === 'keep' && s.officialName && s.key !== 'gastroenterology') assert.equal(ad(s.key), s.officialName, s.key)
    }
    assert.equal(ad('gastroenterology'), 'Gastroenterology', 'kept without the hyphen of the regulator\'s list, as the decisions say')
    assert.equal(ad('longevity'), 'Preventive and longevity medicine', 'verdict "unverified": left as it is')
    // and nothing beyond the decisions: every role of the pack is a role the data file names
    const karardaki = new Set([...KARARLAR.specialties, ...KARARLAR.clinicSpecialties].map((s) => s.key))
    for (const r of ROLLER) assert.ok(karardaki.has(r), `${r} is a role of the pack and the decisions do not name it`)
  })

  it('the eight renames, in the regulator\'s wording (General Medical Council, list of approved curricula, opened 2026-10-10)', () => {
    assert.equal(ad('internal-medicine'), 'General (internal) medicine')
    assert.equal(ad('endocrinology'), 'Endocrinology and diabetes mellitus')
    assert.equal(ad('thoracic-surgery'), 'Cardio-thoracic surgery')
    assert.equal(ad('cardiovascular-surgery'), 'Vascular surgery')
    assert.equal(ad('otolaryngology'), 'Otolaryngology')
    assert.equal(ad('oncology'), 'Medical oncology')
    assert.equal(ad('orthopaedics'), 'Trauma and orthopaedic surgery')
    assert.equal(ad('psychiatry'), 'General psychiatry')
    // named before and kept
    assert.equal(ad('family-medicine'), 'General practice')
    assert.equal(ad('anaesthesia'), 'Anaesthetics')
    assert.equal(ad('nephrology'), 'Renal medicine')
    assert.equal(ad('radiology'), 'Clinical radiology')
    assert.equal(ad('respiratory-medicine'), 'Respiratory medicine')
    assert.equal(ad('sports-medicine'), 'Sport and exercise medicine')
    // a rename keeps its key: only shared keys are renamed
    for (const k of Object.keys(GB_ROL_ADLARI)) assert.ok((EN_ROLLER as readonly string[]).includes(k), k)
    // the same names reach the instruction the model is given
    assert.match(GB_KLINIK.notTalimati(D, 'orthopaedics') ?? '', /TRAUMA AND ORTHOPAEDIC SURGERY|Trauma and orthopaedic surgery/)
    assert.doesNotMatch(GB_KLINIK.notTalimati(D, 'cardiovascular-surgery') ?? '', /Cardiac and vascular surgery/i, 'the name that is no specialty here is gone')
  })

  it('the allied professions carry the titles the professions\' regulator protects (Health and Care Professions Council, opened 2026-10-10)', () => {
    for (const [rol, unvan] of [['physiotherapy', 'Physiotherapist'], ['dietetics', 'Dietitian'], ['occupational-therapy', 'Occupational therapist'], ['clinical-psychology', 'Clinical psychologist'], ['podiatry', 'Podiatrist'], ['speech-language-therapy', 'Speech and language therapist']] as const) assert.equal(ad(rol), unvan)
  })

  it('EVERY ADDED ROLE SAYS WHICH SHARED ROLE IT BEHAVES LIKE, and finds a note template and intake questions there', () => {
    const eklenen = GB_ROLLER.ekle ?? []
    assert.equal(eklenen.length, 14)
    for (const r of eklenen) {
      assert.ok(r.gibi !== null && (EN_ROLLER as readonly string[]).includes(r.gibi), `${r.anahtar}: behaves like a shared role`)
      assert.equal(tanim(r.anahtar)?.gibi, r.gibi, r.anahtar)
      assert.equal(tanim(r.anahtar)?.taraf, r.taraf, r.anahtar)
      // a plain key: no country code in front, the database's form
      assert.match(r.anahtar, /^[a-z]+(-[a-z]+)*$/)
      assert.ok(!(EN_ROLLER as readonly string[]).includes(r.anahtar), `${r.anahtar} is a key of the shared set`)
      // a template a note can be written with, an instruction for the model, and intake questions
      assert.equal(sablonMu(GB_ARAYUZ.notSablonlari, GB_ARAYUZ.roller, r.anahtar), true, r.anahtar)
      assert.ok((GB_KLINIK.notTalimati(D, r.anahtar) ?? '').length > 200, r.anahtar)
      assert.ok(GB_KLINIK.sablonlar.includes(r.anahtar), r.anahtar)
      assert.equal(icerikAnahtari(GB_ARAYUZ.roller, r.anahtar, GB_KLINIK.hastaFormu!.roller), r.gibi, `${r.anahtar}: asks the questions of the role it behaves like`)
      // the fields: the role's own list where it brings one, otherwise the list of the role it behaves like
      assert.deepEqual([...rolSablonAlanlari(GB_ARAYUZ.notSablonlari, GB_ARAYUZ.roller, r.anahtar)], [...(r.sablon ?? EN_ROL_ALANLARI[r.gibi!])], r.anahtar)
    }
    // the instruction names the role by its own name
    assert.match(GB_KLINIK.notTalimati(D, 'geriatric-medicine') ?? '', /GERIATRIC MEDICINE|Geriatric medicine/)
    assert.match(GB_KLINIK.notTalimati(D, 'podiatry') ?? '', /^Your colleague is a health professional and not a doctor: their profession is "Podiatrist"\./)
  })

  it('NO FIELD OF ANOTHER SPECIALTY LEAKS INTO AN ADDED ROLE: the three own field lists are made of the set\'s fields and leave the foreign one out', () => {
    const alan = (rol: string) => [...rolSablonAlanlari(GB_ARAYUZ.notSablonlari, GB_ARAYUZ.roller, rol)]
    assert.ok(!alan('oral-maxillofacial-surgery').includes('abdominal_exam'))
    for (const k of ['nose_exam', 'throat_exam']) assert.ok(!alan('audio-vestibular-medicine').includes(k), k)
    for (const k of ['hand_function', 'environment', 'assistive_devices']) assert.ok(!alan('speech-language-therapy').includes(k), k)
    // every field of an own list is a field the set already has (no new field was written)
    for (const r of GB_ROLLER.ekle ?? []) for (const k of r.sablon ?? []) assert.ok(k in GB_ARAYUZ.notSablonlari.alanlar, `${r.anahtar}: ${k}`)
    assert.equal(GB_ROLLER.alanlar, undefined)
    // children: paediatrics, paediatric surgery, and child and adolescent psychiatry
    assert.deepEqual([...GB_ARAYUZ.notSablonlari.cocukRolleri].sort(), ['child-adolescent-psychiatry', 'paediatric-surgery', 'paediatrics'])
  })

  it('the pack check finds nothing, and the role register (countries/rol-eslemesi.json) states exactly these differences', () => {
    assert.deepEqual(paketiDenetle(GB_PAKETI, GB_ARAYUZ, GB_KLINIK), [])
    const tablo = JSON.parse(readFileSync(join(KOK, 'countries/rol-eslemesi.json'), 'utf8')) as { ulkeyeOzel: Record<string, { sutun: string; cikar: string[]; ekle: { anahtar: string; taraf: string; gibi: string | null }[] }> }
    const gb = tablo.ulkeyeOzel.gb
    assert.equal(gb.sutun, 'en')
    assert.deepEqual(gb.cikar, [...(GB_ROLLER.cikar ?? [])])
    assert.deepEqual(gb.ekle, (GB_ROLLER.ekle ?? []).map((r) => ({ anahtar: r.anahtar, taraf: r.taraf, gibi: r.gibi })))
  })
})

describe('gb: A STORED ACCOUNT THAT HOLDS A KEY THIS COUNTRY TOOK OUT STILL LOADS', () => {
  it('the one role taken out has a nearest remaining role, stated by the pack: Dermatology (clinic) → Dermatology', () => {
    assert.deepEqual(Object.keys(GB_KALDIRILAN_ROLLER), [...(GB_ROLLER.cikar ?? [])], 'every role taken out is on the table, and nothing else')
    for (const [eski, yeni] of Object.entries(GB_KALDIRILAN_ROLLER)) {
      assert.ok(!ROLLER.includes(eski), eski)
      assert.ok(ROLLER.includes(yeni), `${yeni} is a role of the pack`)
      assert.equal(tanim(yeni)?.gibi, undefined, 'the nearest role stands on its own')
      assert.equal(sablonMu(GB_ARAYUZ.notSablonlari, GB_ARAYUZ.roller, yeni), true)
      assert.ok(yeni in GB_KLINIK.hastaFormu!.roller, 'it has intake questions')
    }
    assert.equal(ad('dermatology'), 'Dermatology')
    // no split and no merge took a key away: every other shared key is still a role, so every other stored account reads as before
    for (const r of EN_ROL_SATIRLARI) if (r.anahtar !== 'clinic-dermatology') assert.ok(ROLLER.includes(r.anahtar), r.anahtar)
  })

  it('the account loads: the server reads the old key as "no role chosen" (never an error), accepts the nearest role, and refuses the old key', async () => {
    const { hekimRolunuOku, hekimRolunuYaz, uygulamaRoluMu } = await import('@/lib/ulke/uygulama/rol')
    const { rolMu } = await import('@/lib/ulke/arayuz')
    assert.equal(uygulamaRoluMu('clinic-dermatology'), false)
    assert.equal(rolMu('clinic-dermatology'), false, 'the screen and the server agree')
    assert.equal(uygulamaRoluMu('dermatology'), true)
    // A STAND-IN for the one row of the account: it answers the role the database holds, and records what is written.
    const yazilan: unknown[] = []
    const sahte = (saklanan: string | null) => {
      const zincir: Record<string, unknown> = {}
      for (const k of ['select', 'eq', 'match']) zincir[k] = () => zincir
      zincir.maybeSingle = async () => ({ data: saklanan === null ? null : { rol: saklanan }, error: null })
      zincir.upsert = async (satir: unknown) => { yazilan.push(satir); return { error: null } }
      return { from: () => zincir } as never
    }
    assert.equal(await hekimRolunuOku(sahte('clinic-dermatology'), 'hesap-1'), null, 'read as "no role chosen": the shell then asks for the role once')
    assert.equal(await hekimRolunuOku(sahte('dermatology'), 'hesap-1'), 'dermatology')
    assert.equal(await hekimRolunuOku(sahte('cardiovascular-surgery'), 'hesap-1'), 'cardiovascular-surgery', 'a renamed role keeps its key and its accounts')
    // the account chooses the nearest role: accepted; the old key can no longer be written
    assert.equal(await hekimRolunuYaz(sahte(null), 'hesap-1', GB_KALDIRILAN_ROLLER['clinic-dermatology']), true)
    assert.equal(await hekimRolunuYaz(sahte(null), 'hesap-1', 'clinic-dermatology'), false)
    assert.equal(yazilan.length, 1)
  })

  it('a note written under the old key keeps loading as a note; its role fields are not drawn until the account has its new role', () => {
    assert.equal(sablonMu(GB_ARAYUZ.notSablonlari, GB_ARAYUZ.roller, 'clinic-dermatology'), false)
    assert.equal(GB_KLINIK.notTalimati(D, 'clinic-dermatology'), null)
    assert.ok(!('clinic-dermatology' in GB_ARAYUZ.notSablonlari.rolAlanlari))
    assert.ok(!('clinic-dermatology' in GB_KLINIK.hastaFormu!.roller))
  })
})
