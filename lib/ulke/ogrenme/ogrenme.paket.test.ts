/**
 * AYSE-OGRENME-V3f — LEARNING MOMENTUM IN A COUNTRY BUILD, for whatever pack is active. Runs ONCE PER PACK.
 *
 *   1. THE COUNT (./duzeltme.ts): what a correction is, and that an untouched draft counts 0.
 *   2. THE LEARNING STEP (./kayit.ts) and THE APPROVE ROUTE: the draft kept until approval, the correction count, the
 *      edit log; no draft = no measurement (no invented zero); the other language's draft = no measurement; the step
 *      runs after the answer and nothing that fails in it reaches the doctor; the tables not on the database yet
 *      (migration 198 not applied) change nothing for the doctor.
 *   3. THE ROUTES (app/api/ulke/hafiza/ivme, klinik-uslup): sign-in, the country switch, empty state, and ISOLATION —
 *      doctor A→B and B→A, another country's rows, no id taken from the request, no foreign note or patient text in an answer.
 *   4. THE CLINIC (./klinikUslup.ts): membership from ulke_klinik_uyeleri, the role from hekim_rolu; consent is refused
 *      while the country has nothing to share; leaving removes only the caller's own rows.
 *   5. THE WORDS and the card (components/ulke/uygulama/AyseHafizasi.tsx): every form that has them has them all.
 *
 * Real handlers and real library code. The database and sign-in are stand-ins inside this process; any network
 * address fails the test. Synthetic data only.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0011'

import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { sahteVeritabani, type Satir } from '@/lib/ulke/testing/sahteVeritabani'

;(require as unknown as { extensions: Record<string, (m: { exports: unknown }) => void> }).extensions['.css'] = (m) => { m.exports = {} }

const vt = sahteVeritabani()
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: vt.createClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`this test may not use the network: ${String(g)}`) }) as typeof fetch

type Mod = Record<string, (req: unknown) => Promise<Response>>
type Paket = import('../tipler').UlkePaketi
type Sb = import('@supabase/supabase-js').SupabaseClient
let paket: Paket
let BU = ''
let KIT = false
let KLINIK = false
/** A language and a role of THIS pack: the kit refuses a note in a language, or a role, the pack does not have. */
let DIL = 'xx'
let ROL = 'role-a'
const ANDERE = 'yy'
let NextRequest: typeof import('next/server').NextRequest
let D: typeof import('./duzeltme')
let K: typeof import('./kayit')
let U: typeof import('./klinikUslup')
let ivmeRota: Mod
let klinikRota: Mod
let onaylaRota: Mod

const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const KL = '20000000-0000-4000-8000-00000000000a'
const KL2 = '20000000-0000-4000-8000-00000000000b'
const YABANCI = 'zz'
const GIZLI = 'QA-NOTE-TEXT-NEVER-IN-AN-ANSWER'
const SB = (n: number) => `30000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const HASTA = '40000000-0000-4000-8000-00000000000a'

const sb = () => vt.createClient() as unknown as Sb
const tablo = (ad: string) => vt.tablo(ad)
const aktar = async () => { for (let i = 0; i < 25; i++) await new Promise((r) => setImmediate(r)) }
const sessiz = async <T>(is: () => Promise<T>): Promise<T> => {
  const e = console.error
  console.error = () => {}
  try { return await is() } finally { console.error = e }
}

const TASLAK = { s: 'Fever for three days, cough and a blocked nose.', o: 'Throat red, chest clear.', a: 'Viral upper respiratory infection.', p: 'Paracetamol, review in three days.' }
const DUZELTILMIS = { s: TASLAK.s, o: 'Throat mildly red, chest clear, no wheeze.', a: 'Viral upper respiratory tract infection.', p: 'Fluids and rest. Return if the fever lasts beyond five days.' }

function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: DA, email: 'qa-a@notya.test', app_metadata: { country: BU } },
    'jeton-b': { id: DB, email: 'qa-b@notya.test', app_metadata: { country: BU } },
  })
  const dil = paket.uygulama?.diller[0] ?? paket.varsayilanDil
  tablo('ulke_hesaplari').push({ id: DA, full_name: 'QA Doctor A', ulke: BU, ui_language: dil }, { id: DB, full_name: 'QA Doctor B', ulke: BU, ui_language: dil })
}

/** A draft note of `doktor` (ulke_notlar + not_dil_kaydi), the way the kit writes it. */
function notEkle(doktor: string, id: string, ulke = BU, dil = DIL) {
  tablo('ulke_notlar').push({ id, ulke, doctor_id: doktor, session_id: SB(900), content_subjektif: TASLAK.s, content_objektif: TASLAK.o, content_degerlendirme: TASLAK.a, content_plan: TASLAK.p, approved_at: null, created_at: new Date().toISOString() })
  tablo('not_dil_kaydi').push({ note_id: id, ulke, doctor_id: doktor, patient_id: HASTA, not_dili: dil, ikinci_dil: null })
}
const metrik = (doktor?: string) => tablo('ulke_ogrenme_metrik').filter((m) => !doktor || m.doctor_id === doktor)

async function cagir(m: Mod, yontem: string, yol: string, s: { jeton?: string; govde?: unknown } = {}): Promise<{ status: number; govde: any; ham: string }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const basliklar: Record<string, string> = { host: 'notya.test' }
  if (s.jeton) basliklar.authorization = `Bearer ${s.jeton}`
  if (s.govde !== undefined) basliklar['content-type'] = 'application/json'
  const req = new NextRequest(`https://notya.test${yol}`, { method: yontem, headers: basliklar, ...(s.govde !== undefined ? { body: JSON.stringify(s.govde) } : {}) })
  const res = await m[yontem](req)
  const ham = await res.clone().text()
  let govde: unknown = null
  try { govde = JSON.parse(ham) } catch { /* not JSON */ }
  return { status: res.status, govde, ham }
}
const ivme = (jeton?: string) => cagir(ivmeRota, 'GET', '/api/ulke/hafiza/ivme', { jeton })
const klinikDurum = (jeton?: string) => cagir(klinikRota, 'GET', '/api/ulke/hafiza/klinik-uslup', { jeton })
const klinikAc = (jeton: string, ac: unknown) => cagir(klinikRota, 'POST', '/api/ulke/hafiza/klinik-uslup', { jeton, govde: { ac } })
const onayla = (jeton: string, g: Record<string, unknown>) => cagir(onaylaRota, 'POST', '/api/ulke/not/onayla', { jeton, govde: g })

/** Measurements of one doctor: `sayilar[i]` corrections, one per day, oldest first, ending today. */
function olcumEkle(doktor: string, sayilar: number[], ulke = BU) {
  const gun = 86_400_000
  sayilar.forEach((n, i) => tablo('ulke_ogrenme_metrik').push({ ulke, doctor_id: doktor, note_id: SB(1000 + i + (ulke === BU ? 0 : 500)), duzeltme_sayisi: n, onay_at: new Date(Date.now() - (sayilar.length - 1 - i) * gun).toISOString() }))
}

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  KIT = paket.ozellikler.cekirdekMuayene === true
  KLINIK = (await import('../klinikHesabi/klinik')).klinikAyarlari() !== null
  DIL = paket.uygulama?.diller[0] ?? paket.varsayilanDil
  ROL = paket.uygulama?.roller?.[0] ?? 'role-a'
  NextRequest = (await import('next/server')).NextRequest
  D = await import('./duzeltme'); K = await import('./kayit'); U = await import('./klinikUslup')
  ivmeRota = (await import('../../../app/api/ulke/hafiza/ivme/route.ulke')) as unknown as Mod
  klinikRota = (await import('../../../app/api/ulke/hafiza/klinik-uslup/route.ulke')) as unknown as Mod
  onaylaRota = (await import('../../../app/api/ulke/not/onayla/route.ulke')) as unknown as Mod
})
beforeEach(() => { if (KIT) sifirla() })

describe('the count: what a correction is', () => {
  it('a draft approved as written counts 0 and logs nothing; blanks at the ends are not a correction', () => {
    assert.equal(D.duzeltmeSayisi(TASLAK, TASLAK), 0)
    assert.equal(D.duzeltmeSayisi(TASLAK, { ...TASLAK, p: `  ${TASLAK.p}\n` }), 0)
    assert.deepEqual(D.duzenlemeleriBul(TASLAK, { ...TASLAK, p: `${TASLAK.p} ` }), [])
  })

  it('a changed section is one logged edit (draft text and approved text), and an edited note counts at least one correction', () => {
    const e = D.duzenlemeleriBul(TASLAK, DUZELTILMIS)
    assert.deepEqual(e.map((x) => x.alan), ['objektif', 'degerlendirme', 'plan'])
    assert.deepEqual(e[0], { alan: 'objektif', onceki: TASLAK.o, sonraki: DUZELTILMIS.o })
    assert.ok(D.duzeltmeSayisi(TASLAK, DUZELTILMIS) >= 1)
    assert.equal(D.duzeltmeSayisi(TASLAK, DUZELTILMIS), D.duzeltmeSayisi(TASLAK, DUZELTILMIS), 'deterministic')
  })

  it('the log keeps at most the column\'s own limit of a section', () => {
    const uzun = 'x'.repeat(D.KAYIT_AZAMI + 500)
    assert.equal(D.duzenlemeleriBul(TASLAK, { ...TASLAK, p: uzun })[0].sonraki.length, D.KAYIT_AZAMI)
  })
})

describe('the learning step after an approval', () => {
  it('NO DRAFT ON RECORD: nothing is measured and no zero is written', async () => {
    if (!KIT) return
    notEkle(DA, SB(1))
    assert.equal(await K.onayiOgren(sb(), DA, SB(1), DIL, TASLAK), null)
    assert.deepEqual([metrik().length, tablo('ulke_not_duzenlemeleri').length], [0, 0])
  })

  it('APPROVED WITHOUT A CHANGE: a measurement of 0, no edit log, the draft is gone', async () => {
    if (!KIT) return
    notEkle(DA, SB(1)); await K.taslakKaydet(sb(), DA, SB(1), DIL, TASLAK)
    assert.deepEqual({ ulke: tablo('ulke_not_taslaklari')[0].ulke, d: tablo('ulke_not_taslaklari')[0].doctor_id, dil: tablo('ulke_not_taslaklari')[0].dil }, { ulke: BU, d: DA, dil: DIL })
    assert.equal(await K.onayiOgren(sb(), DA, SB(1), DIL, TASLAK), 0)
    assert.deepEqual(metrik().map((m) => [m.ulke, m.doctor_id, m.note_id, m.duzeltme_sayisi]), [[BU, DA, SB(1), 0]])
    assert.equal(tablo('ulke_not_duzenlemeleri').length, 0)
    assert.equal(tablo('ulke_not_taslaklari').length, 0, 'the draft is kept only until the approval')
  })

  it('EDITED: the count is the shared analysis\' count, the edit log holds the changed sections only, the draft is gone', async () => {
    if (!KIT) return
    notEkle(DA, SB(1)); await K.taslakKaydet(sb(), DA, SB(1), DIL, TASLAK)
    const n = await K.onayiOgren(sb(), DA, SB(1), DIL, DUZELTILMIS)
    assert.equal(n, D.duzeltmeSayisi(TASLAK, DUZELTILMIS))
    assert.equal(metrik()[0].duzeltme_sayisi, n)
    assert.deepEqual(tablo('ulke_not_duzenlemeleri').map((x) => [x.ulke, x.doctor_id, x.note_id, x.alan]), ['objektif', 'degerlendirme', 'plan'].map((a) => [BU, DA, SB(1), a]))
    assert.equal(tablo('ulke_not_taslaklari').length, 0)
  })

  it('THE OTHER LANGUAGE\'S DRAFT: not comparable, so not measured — and the kept draft is dropped', async () => {
    if (!KIT) return
    notEkle(DA, SB(1)); await K.taslakKaydet(sb(), DA, SB(1), DIL, TASLAK)
    assert.equal(await K.onayiOgren(sb(), DA, SB(1), ANDERE, DUZELTILMIS), null)
    assert.deepEqual([metrik().length, tablo('ulke_not_duzenlemeleri').length, tablo('ulke_not_taslaklari').length], [0, 0, 0])
  })

  it('RUN TWICE: one measurement and one log row per section (keyed), never a second', async () => {
    if (!KIT) return
    notEkle(DA, SB(1)); await K.taslakKaydet(sb(), DA, SB(1), DIL, TASLAK)
    await K.onayiOgren(sb(), DA, SB(1), DIL, DUZELTILMIS)
    await K.taslakKaydet(sb(), DA, SB(1), DIL, TASLAK)
    await K.onayiOgren(sb(), DA, SB(1), DIL, DUZELTILMIS)
    assert.deepEqual([metrik().length, tablo('ulke_not_duzenlemeleri').length], [1, 3])
  })

  it('THE TABLES ARE NOT THERE YET (migration 198 not applied): no throw, no data, no change to the doctor', async () => {
    if (!KIT) return
    for (const t of ['ulke_not_taslaklari', 'ulke_ogrenme_metrik', 'ulke_not_duzenlemeleri']) { vt.boz.yaz.add(t); vt.boz.oku.add(t) }
    const r = await sessiz(async () => {
      await K.taslakKaydet(sb(), DA, SB(1), DIL, TASLAK)
      return [await K.onayiOgren(sb(), DA, SB(1), DIL, DUZELTILMIS), await K.onayMetrikleriniOku(sb(), DA)] as const
    })
    assert.deepEqual(r, [null, []])
  })
})

describe('the approve route: learning runs after the answer and cannot reach the doctor', () => {
  const govde = (notId: string, icerik: Record<string, string>, dil = DIL) => ({ notId, dil, ...icerik })

  it('an approval with an edit leaves a measurement, an edit log and no draft; an approval without one leaves a 0', async () => {
    if (!KIT) return
    notEkle(DA, SB(1)); notEkle(DA, SB(2))
    await K.taslakKaydet(sb(), DA, SB(1), DIL, TASLAK); await K.taslakKaydet(sb(), DA, SB(2), DIL, TASLAK)
    assert.equal((await onayla('jeton-a', govde(SB(1), DUZELTILMIS))).status, 200)
    assert.equal((await onayla('jeton-a', govde(SB(2), TASLAK))).status, 200)
    await aktar()
    const sayilar = Object.fromEntries(metrik(DA).map((m) => [m.note_id, m.duzeltme_sayisi]))
    assert.equal(sayilar[SB(1)], D.duzeltmeSayisi(TASLAK, DUZELTILMIS))
    assert.ok((sayilar[SB(1)] as number) >= 1)
    assert.equal(sayilar[SB(2)], 0)
    assert.equal(tablo('ulke_not_taslaklari').length, 0)
  })

  it('a FAILING learning step changes nothing for the doctor: the note is approved, the answer is 200', async () => {
    if (!KIT) return
    notEkle(DA, SB(1)); await K.taslakKaydet(sb(), DA, SB(1), DIL, TASLAK)
    vt.boz.yaz.add('ulke_ogrenme_metrik'); vt.boz.oku.add('ulke_not_taslaklari')
    const r = await sessiz(() => onayla('jeton-a', govde(SB(1), DUZELTILMIS)))
    assert.equal(r.status, 200)
    await sessiz(aktar)
    assert.ok(tablo('ulke_notlar')[0].approved_at, 'the note is approved')
    assert.equal(metrik().length, 0)
  })

  it('a REFUSED approval learns nothing: an unknown note, another doctor\'s note, an already approved note', async () => {
    if (!KIT) return
    notEkle(DA, SB(1)); await K.taslakKaydet(sb(), DA, SB(1), DIL, TASLAK)
    assert.equal((await onayla('jeton-b', govde(SB(1), DUZELTILMIS))).status, 404, 'B approving A\'s note')
    assert.equal((await onayla('jeton-a', govde(SB(77), DUZELTILMIS))).status, 404)
    await aktar()
    assert.equal(metrik().length, 0)
    assert.equal(tablo('ulke_not_taslaklari').length, 1, 'A\'s draft is untouched by B\'s attempt')
    assert.equal((await onayla('jeton-a', govde(SB(1), DUZELTILMIS))).status, 200)
    await aktar()
    const once = JSON.stringify([metrik(), tablo('ulke_not_duzenlemeleri')])
    assert.equal((await onayla('jeton-a', govde(SB(1), { ...DUZELTILMIS, p: 'something else' }))).status, 409)
    await aktar()
    assert.equal(JSON.stringify([metrik(), tablo('ulke_not_duzenlemeleri')]), once, 'a second approval changes nothing')
  })

  it('another doctor\'s kept draft is never compared with this doctor\'s approval, even for the same note id', async () => {
    if (!KIT) return
    notEkle(DB, SB(5)); await K.taslakKaydet(sb(), DB, SB(5), DIL, TASLAK)
    assert.equal(await K.onayiOgren(sb(), DA, SB(5), DIL, DUZELTILMIS), null)
    assert.deepEqual([metrik().length, tablo('ulke_not_taslaklari').length], [0, 1])
  })
})

describe('GET /api/ulke/hafiza/ivme', () => {
  it('a pack without the signed-in application answers "not found"; sign-in is required', async () => {
    if (!KIT) { assert.equal((await ivme('jeton-a')).status, 404); return }
    assert.equal((await ivme()).status, 401)
    assert.equal((await ivme('jeton-nope')).status, 401)
  })

  it('EMPTY STATE: fewer than three approved notes — "not enough", no direction, no invented figure', async () => {
    if (!KIT) return
    olcumEkle(DA, [4, 3])
    const r = await ivme('jeton-a')
    assert.equal(r.status, 200)
    assert.deepEqual({ yeterli: r.govde.ivme.yeterli, n: r.govde.ivme.n, seri: r.govde.ivme.seri, haftalik: r.govde.haftalik }, { yeterli: false, n: 2, seri: [], haftalik: null })
  })

  it('FIGURES: from six notes a direction; the first three against the last three; real numbers only', async () => {
    if (!KIT) return
    olcumEkle(DA, [6, 5, 6, 3, 2, 1])
    const r = await ivme('jeton-a')
    assert.deepEqual({ yeterli: r.govde.ivme.yeterli, n: r.govde.ivme.n, yon: r.govde.ivme.yon, ilk: r.govde.ivme.ilkOrtalama, son: r.govde.ivme.sonOrtalama }, { yeterli: true, n: 6, yon: 'azaliyor', ilk: 5.7, son: 2 })
    assert.equal(r.govde.haftalik.buHaftaNot >= 1, true)
  })

  it('ISOLATION: each doctor sees only their own measurements, in both directions, and no row of another country', async () => {
    if (!KIT) return
    olcumEkle(DA, [9, 9, 9]); olcumEkle(DB, [1, 1, 1, 1]); olcumEkle(DA, [0, 0, 0, 0, 0], YABANCI)
    const a = await ivme('jeton-a'), b = await ivme('jeton-b')
    assert.deepEqual([a.govde.ivme.n, a.govde.ivme.ilkOrtalama], [3, 9])
    assert.deepEqual([b.govde.ivme.n, b.govde.ivme.ilkOrtalama], [4, 1])
    for (const q of vt.sorgular.filter((x) => x.tablo === 'ulke_ogrenme_metrik')) {
      assert.equal(q.ulke, BU)
      assert.ok(q.filtreler.some((f) => f.startsWith('doctor_id=eq.')), `${q.islem}: no doctor in the statement`)
    }
  })

  it('TAKES NO ID from the request and answers numbers only — never note or patient text', async () => {
    if (!KIT) return
    notEkle(DA, SB(1)); tablo('ulke_notlar')[0].content_subjektif = GIZLI
    olcumEkle(DA, [3, 2, 1])
    const r = await cagir(ivmeRota, 'GET', `/api/ulke/hafiza/ivme?doctor_id=${DB}&doctor=${DB}`, { jeton: 'jeton-a' })
    assert.equal(r.status, 200); assert.ok(!r.ham.includes(GIZLI)); assert.equal(r.govde.ivme.n, 3)
    assert.deepEqual([...new Set(vt.sorgular.map((q) => q.tablo))], ['ulke_ogrenme_metrik'], 'only the doctor\'s own counts were read')
    const kaynak = readFileSync(join(__dirname, '../../../app/api/ulke/hafiza/ivme/route.ulke.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(kaynak, /searchParams|nextUrl|\.json\(\)/)
  })

  it('THE TABLE IS NOT THERE YET: the empty state, never an error', async () => {
    if (!KIT) return
    vt.boz.oku.add('ulke_ogrenme_metrik')
    const r = await ivme('jeton-a')
    assert.equal(r.status, 200); assert.equal(r.govde.ivme.yeterli, false)
  })
})

describe('the clinic: consent and leaving', () => {
  const uye = (doktor: string, klinik: string, konum: string, ulke = BU) => tablo('ulke_klinik_uyeleri').push({ id: `u-${doktor}-${klinik}`, ulke, klinik_id: klinik, doctor_id: doktor, konum })
  const havuz = (doktor: string, klinik = KL, anahtar = 'uzunluk-plan') => tablo('ulke_klinik_ortak_uslup').push({ id: `h-${doktor}-${anahtar}`, ulke: BU, klinik_id: klinik, doctor_id: doktor, brans: ROL, anahtar, deger: 'Keep it short' })
  const rol = (doktor: string, r: string) => tablo('hekim_rolu').push({ ulke: BU, doctor_id: doktor, rol: r })

  it('NOT A MEMBER: nothing to switch, and consent is refused', async () => {
    if (!KIT) return
    const g = await klinikDurum('jeton-a')
    assert.equal(g.status, 200); assert.deepEqual({ uye: g.govde.uye, aktif: g.govde.aktif, gelen: g.govde.gelen }, { uye: false, aktif: false, gelen: 0 })
    const p = await klinikAc('jeton-a', true)
    assert.equal(KLINIK ? p.status : 403, 403); assert.equal(tablo('ulke_klinik_uslup_katilim').length, 0)
  })

  it('A MEMBER, the country has nothing to share yet: the state says so, and consent is refused — no row is written', async () => {
    if (!KIT || !KLINIK) return
    uye(DA, KL, 'hekim'); rol(DA, ROL)
    const g = await klinikDurum('jeton-a')
    assert.deepEqual({ uye: g.govde.uye, aktif: g.govde.aktif, hazir: g.govde.hazir }, { uye: true, aktif: false, hazir: false })
    const p = await klinikAc('jeton-a', true)
    assert.deepEqual([p.status, p.govde.code], [409, 'HAZIR_DEGIL'])
    assert.equal(tablo('ulke_klinik_uslup_katilim').length, 0)
  })

  it('THE FRONT DESK shares nothing; a bad body is refused', async () => {
    if (!KIT || !KLINIK) return
    uye(DA, KL, 'on-buro')
    assert.equal((await klinikDurum('jeton-a')).govde.uye, false)
    assert.equal((await klinikAc('jeton-a', true)).status, 403)
    uye(DB, KL, 'hekim')
    for (const kotu of ['yes', 1, null, undefined]) assert.equal((await klinikAc('jeton-b', kotu)).status, 400)
  })

  it('CONSENT (the pool has a producer): needs a membership and a chosen role; written for THIS member\'s clinic; the pool is not read', async () => {
    if (!KIT || !KLINIK) return
    uye(DA, KL, 'hekim')
    assert.deepEqual(await U.klinikUslupAc(sb(), DA, true), { tamam: false, kod: 'ROL_YOK' })
    rol(DA, ROL)
    assert.deepEqual(await U.klinikUslupAc(sb(), DA, true), { tamam: true })
    assert.deepEqual(tablo('ulke_klinik_uslup_katilim').map((k) => [k.ulke, k.doctor_id, k.klinik_id, k.aktif]), [[BU, DA, KL, true]])
    assert.deepEqual(await U.klinikUslupDurumu(sb(), DA, true), { uye: true, aktif: true, gelen: 0, hazir: true })
    assert.deepEqual(await U.klinikUslupAc(sb(), DB, true), { tamam: false, kod: 'UYE_DEGIL' })
  })

  it('A CONSENT FOR ANOTHER CLINIC does not count: the member moved to a clinic they never consented for', async () => {
    if (!KIT || !KLINIK) return
    uye(DA, KL2, 'hekim')
    tablo('ulke_klinik_uslup_katilim').push({ ulke: BU, doctor_id: DA, klinik_id: KL, aktif: true })
    assert.equal((await U.klinikUslupDurumu(sb(), DA, true)).aktif, false)
  })

  it('LEAVING removes only the caller\'s own rules and switches the consent off; another member\'s rows and another country\'s are untouched', async () => {
    if (!KIT || !KLINIK) return
    uye(DA, KL, 'hekim'); uye(DB, KL, 'hekim')
    tablo('ulke_klinik_uslup_katilim').push({ ulke: BU, doctor_id: DA, klinik_id: KL, aktif: true }, { ulke: BU, doctor_id: DB, klinik_id: KL, aktif: true })
    havuz(DA); havuz(DA, KL, 'sira-plan'); havuz(DB)
    tablo('ulke_klinik_ortak_uslup').push({ id: 'yabanci', ulke: YABANCI, klinik_id: KL, doctor_id: DA, brans: ROL, anahtar: 'uzunluk-plan', deger: 'x' })
    const r = await klinikAc('jeton-a', false)
    assert.equal(r.status, 200); assert.equal(r.govde.aktif, false)
    assert.deepEqual(tablo('ulke_klinik_ortak_uslup').map((x) => x.id).sort(), ['h-' + DB + '-uzunluk-plan', 'yabanci'].sort())
    assert.deepEqual(tablo('ulke_klinik_uslup_katilim').map((k) => [k.doctor_id, k.aktif]), [[DA, false], [DB, true]])
    for (const q of vt.sorgular.filter((x) => ['ulke_klinik_ortak_uslup', 'ulke_klinik_uslup_katilim'].includes(x.tablo) && x.islem !== 'select')) {
      assert.equal(q.ulke, BU); assert.ok(q.filtreler.some((f) => f === `doctor_id=eq.${DA}`), `${q.tablo} ${q.islem}: not scoped to the caller`)
    }
  })

  it('A MEMBER LEAVING THE CLINIC takes their consent and their pool rows with them, by key; the answer never names a source doctor', async () => {
    if (!KIT || !KLINIK) return
    uye(DA, KL, 'hekim'); tablo('ulke_klinik_uslup_katilim').push({ ulke: BU, doctor_id: DA, klinik_id: KL, aktif: true }); havuz(DA)
    await sb().from('ulke_klinik_uyeleri').delete().eq('ulke', BU).eq('doctor_id', DA)
    assert.deepEqual([tablo('ulke_klinik_uslup_katilim').length, tablo('ulke_klinik_ortak_uslup').length], [0, 0])
    const g = await klinikDurum('jeton-a')
    assert.deepEqual(Object.keys(g.govde).sort(), ['aktif', 'gelen', 'hazir', 'uye'])
  })

  it('THE TABLES ARE NOT THERE YET: state and leaving answer without an error', async () => {
    if (!KIT || !KLINIK) return
    uye(DA, KL, 'hekim')
    for (const t of ['ulke_klinik_uslup_katilim', 'ulke_klinik_ortak_uslup']) { vt.boz.oku.add(t); vt.boz.yaz.add(t) }
    const g = await sessiz(() => klinikDurum('jeton-a'))
    assert.deepEqual([g.status, g.govde.uye, g.govde.aktif], [200, true, false])
    assert.equal((await sessiz(() => klinikAc('jeton-a', false))).status, 200)
  })
})

describe('the words and the card', () => {
  const SOZ = ['baslik', 'aciklama', 'ivmeBaslik', 'ivmeBos', 'ivmeErken', 'ivmeSatir', 'ivmeAzaliyor', 'ivmeSabit', 'ivmeArtiyor', 'ivmeNot', 'ivmeBirim', 'haftalik', 'haftalikOnceki', 'yuklenemedi'] as const
  const YER = { ivmeBos: ['%'], ivmeSatir: ['%1', '%2', '%3'], ivmeNot: ['%'], haftalik: ['%1', '%2'], haftalikOnceki: ['%1', '%2', '%3'] } as Record<string, string[]>

  it('every language form that carries the words carries ALL of them, with their placeholders, and no other country\'s letters; the pack has them in at least one form', async () => {
    if (!KIT) return
    const { tumMetinler } = await import('../arayuz')
    const var_ = tumMetinler().filter((x) => x.m.ayarlar.ayseHafizasi)
    assert.ok(var_.length >= 1, 'no form of this pack has the assistant\'s-memory words')
    for (const { dil, m } of var_) {
      const s = m.ayarlar.ayseHafizasi as Record<string, string>
      for (const k of SOZ) { assert.equal(typeof s[k], 'string', `${dil}.${k}`); assert.ok(s[k].trim().length > 3, `${dil}.${k} is empty`) }
      for (const [k, tutucular] of Object.entries(YER)) for (const t of tutucular) assert.ok(s[k].includes(t), `${dil}.${k} lacks ${t}`)
      assert.doesNotMatch(Object.values(s).join(' '), /Ayşe|undefined|\[object|TODO/, `${dil}: a name or a placeholder leaked`)
      if (paket.kod !== 'tr') assert.doesNotMatch(Object.values(s).join(' '), /[çğıöşüİ]/, `${dil}: Turkish letters`)
    }
  })

  it('NO RUSSIAN FORM carries them (Kaan: Uzbekistan needs no Russian copy for this)', async () => {
    if (!KIT) return
    const { tumMetinler } = await import('../arayuz')
    for (const { dil, m } of tumMetinler()) if (/^ru\b/.test(dil)) assert.equal(m.ayarlar.ayseHafizasi, undefined)
  })

  it('THE CARD: empty state, figures with direction and the weekly line, the load failure — in the pack\'s own words, never a raw key', async () => {
    if (!KIT) return
    const { tumMetinler } = await import('../arayuz')
    const { AyseHafizasiGorunumu } = await import('../../../components/ulke/uygulama/AyseHafizasi')
    const { ivmeHesapla, haftalikHesapla } = await import('@/lib/doktor/ogrenme/ivme')
    const f = tumMetinler().find((x) => x.m.ayarlar.ayseHafizasi)!
    const m = f.m.ayarlar.ayseHafizasi!
    const olc = (sayilar: number[]) => sayilar.map((n, i) => ({ note_id: `n${i}`, duzeltme_sayisi: n, onay_at: new Date(Date.now() - (sayilar.length - 1 - i) * 3_600_000).toISOString() }))
    const html = (props: Parameters<typeof AyseHafizasiGorunumu>[0]) => renderToStaticMarkup(React.createElement(AyseHafizasiGorunumu, props))
    const bos = html({ m, ivme: ivmeHesapla(olc([2])), haftalik: null, hata: false })
    assert.ok(bos.includes(m.ivmeBos.replace('%', '1')) && bos.includes('data-alan="ayse-hafizasi-bos"'))
    const veri = olc([6, 5, 6, 3, 2, 1])
    const dolu = html({ m, ivme: ivmeHesapla(veri), haftalik: haftalikHesapla(veri), hata: false })
    assert.ok(dolu.includes(m.ivmeAzaliyor) && dolu.includes('<path') && dolu.includes(m.ivmeBirim))
    assert.ok(dolu.includes(m.haftalik.replace('%1', '3.8').replace('%2', '6')) || /3[.,]8/.test(dolu), 'the weekly line')
    assert.doesNotMatch(dolu, /undefined|%1|%2|%3|NaN/)
    const hata = html({ m, ivme: null, haftalik: null, hata: true })
    assert.ok(hata.includes(m.yuklenemedi) && !hata.includes('<path'))
  })
})

describe('the kit holds to its walls', () => {
  it('the learning code reaches the database through the country door only and names no table of Türkiye', () => {
    for (const f of ['kayit.ts', 'klinikUslup.ts', 'duzeltme.ts', 'arkaPlan.ts']) {
      const k = readFileSync(join(__dirname, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
      assert.doesNotMatch(k, /\.from\(|\.rpc\(|['"](users|clinics|clinic_members|doktor_hafiza|doktor_ogrenme_metrik|not_duzenlemeleri|klinik_uslup_katilim|klinik_ortak_uslup)['"]/, f)
      assert.doesNotMatch(k, /[çğıöşüİĞŞÇÖÜ]/, `${f}: Turkish text`)
    }
  })
})
