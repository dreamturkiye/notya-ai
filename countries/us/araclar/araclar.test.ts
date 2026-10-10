/**
 * NOTYA-ULKE-UYGULA-US — United States: WHO SEES WHICH TOOL, THE NUMBERS A NATIONAL SOURCE STATES, AND THE LICENCE
 * STATES — as the audit of 2026-10-10 decided them (us-kararlar.json on the branch araclar-denetim/us), applied to
 * this country only.
 *
 *   1. NOTHING IS SWITCHED ON OR OFF by this job: the same tools are on as before, and the five the owner ordered
 *      off stay off.
 *   2. WHO SEES A TOOL: eleven tools of the set are shown to more roles here; every other tool to the set's roles.
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

/** The five tools the owner ordered off in every country on 2026-10-10. */
const EMIRLE_KAPALI = ['doz-hesabi', 'esi-triyaj', 'kdigo-evre', 'kdigo-serit', 'rapor-taslagi']

/** WHO SEES A TOOL OF THE SET HERE, where the audit's decision differs from the set: the set's role(s) first, then the roles the audit adds. */
const GORENLER: Readonly<Record<string, readonly string[]>> = {
  'rtp-basamak': ['sports-medicine', 'emergency-medicine', 'family-medicine', 'neurology', 'paediatrics'],
  'hedef-boy': ['paediatrics', 'family-medicine'],
  'inhaler-teknik': ['respiratory-medicine', 'family-medicine', 'paediatrics', 'allergy-immunology'],
  'kalp-damar-preop': ['cardiovascular-surgery', 'thoracic-surgery'],
  'genel-preop': ['general-surgery', 'colon-rectal-surgery'],
  'yara-dren-izlem': ['paediatric-surgery', 'general-surgery', 'colon-rectal-surgery', 'podiatry'],
  'kur-sayaci': ['oncology', 'radiation-oncology'],
  'toksisite-listesi': ['oncology', 'radiation-oncology'],
  'plastik-yara-greft': ['plastic-surgery', 'aesthetic-surgery'],
  'odyometri-pta': ['otolaryngology', 'audiology'],
  'gorme-keskinligi': ['ophthalmology', 'optometry'],
}

describe('us tools 1: nothing is switched on or off by this job', () => {
  it('the same tools are on as before: every tool of the set but the five ordered off, the patient\'s page and the follow-up list — and nothing beyond the set', () => {
    const beklenen = ['hasta-portali', ...EN_ROL_ARACLARI.map((a) => a.anahtar).filter((k) => !EMIRLE_KAPALI.includes(k)), 'takip-paneli']
    assert.deepEqual(acik, beklenen)
    assert.equal(acik.length, 41)
    assert.equal(US_GIRDI.araclar.ek?.araclar, undefined, 'a tool beyond the set is switched on')
    for (const k of acik) assert.ok(kitAraci(k), `${k} is not a tool of the kit`)
  })

  it('THE FIVE THE OWNER ORDERED OFF STAY OFF: the dose calculator, ESI triage, the report outline and both kidney tools', () => {
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
  it('ELEVEN TOOLS OF THE SET ARE SHOWN TO MORE ROLES HERE, exactly as the audit lists them', () => {
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
    assert.deepEqual(izgara('family-medicine'), ['hasta-portali', 'inhaler-teknik', 'hedef-boy', 'rtp-basamak', 'takip-paneli'])
    // THE AUDIOLOGIST: before, the patient's page and nothing else
    assert.deepEqual(izgara('audiology'), ['hasta-portali', 'odyometri-pta', 'takip-paneli'])
    // THORACIC AND CARDIAC SURGERY: the checklist before a heart operation is new
    assert.deepEqual(izgara('thoracic-surgery'), ['hasta-portali', 'toraks-preop', 'toraks-tup-yara', 'kalp-damar-preop', 'takip-paneli'])
    // a specialty the audit adds, with tools of the set: radiation oncology
    assert.deepEqual(izgara('radiation-oncology'), ['hasta-portali', 'kur-sayaci', 'toksisite-listesi', 'takip-paneli'])
    // a role for which no existing tool was decided still sees the patient's page alone
    for (const rol of ['cardiology', 'psychiatry', 'geriatric-medicine', 'sleep-medicine', 'clinical-social-work', 'dietetics']) assert.deepEqual(izgara(rol), ['hasta-portali'], rol)
    // an account without a role: the base tool only
    assert.deepEqual(izgara(null), ['hasta-portali'])
  })

  it('THE CORE SET, WITH THE TOOLS THAT EXIST TODAY: the patient\'s page for every role; the follow-up list for every role that has a tool whose result can be kept', () => {
    for (const rol of ROLLER) assert.ok(izgara(rol).includes('hasta-portali'), rol)
    const tasiyan = ROLLER.filter((r) => A.araclar.some((p) => p.anahtar !== 'takip-paneli' && p.roller?.includes(r)))
    assert.deepEqual([...(araci('takip-paneli').roller ?? [])], tasiyan)
    // 22 roles had it before this job; the nine roles the audit gives a first tool to have it now
    assert.equal(tasiyan.length, 22 + 9)
    for (const rol of ['family-medicine', 'neurology', 'audiology', 'optometry', 'podiatry', 'aesthetic-surgery', 'allergy-immunology', 'colon-rectal-surgery', 'radiation-oncology']) assert.ok(tasiyan.includes(rol), rol)
  })

  it('no tool is given to a role this country does not have', () => {
    for (const p of A.araclar) for (const r of p.roller ?? []) assert.ok(ROLLER.includes(r), `${p.anahtar}: ${r}`)
    for (const y of A.yuvalar) for (const r of y.roller ?? []) assert.ok(ROLLER.includes(r), `placeholder ${y.anahtar}: ${r}`)
  })
})

