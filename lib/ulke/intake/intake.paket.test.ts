/**
 * NOTYA-ULKE-INTAKE-01 — THE INTAKE FORM, for whatever pack is active. Runs ONCE PER PACK (scripts/ulke-test.mjs
 * sets NOTYA_COUNTRY to each folder under countries/ in turn).
 *
 * TWO LAYERS.
 *   1. THE KIT'S RULES, with QUESTIONS OF NO COUNTRY (a synthetic set built here, written in every language form of
 *      the active pack): asking for the form and giving access in one step, the invitation, save and resume, submit
 *      once, read-only afterwards, reopen, withdraw, the guardian form, units, the leak rule between roles, and
 *      isolation in every direction. Runs for every pack that brings the application and the portal — so a rule of
 *      the kit never depends on what one country chose to ask.
 *   2. THE ROUTES, with THE PACK'S OWN questions: a pack that does not switch the form on answers "not found" on
 *      every route; a pack that does is held to the same behaviour through the real handlers.
 *
 * Real handlers and real library code. The database and sign-in are stand-ins inside this process; any network
 * address fails the test. Synthetic data only.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0011'
// The server clock is NOT the country's: every day must come from the account's time zone.
process.env.TZ = 'America/Los_Angeles'

import '@/lib/ulke/testing/varlikTaklidi'
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sahteVeritabani, type Satir } from '@/lib/ulke/testing/sahteVeritabani'
import type { Cevaplar, HastaFormuIcerigi, Soru } from './tipler'

const KOK = resolve(__dirname, '../../..')
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
/** The kit's rules can run: the pack brings the application, the portal and the form's catalogue. */
let KIT = false
/** The pack switches the intake form on: its routes exist. */
let ROTA = false
let NextRequest: typeof import('next/server').NextRequest
let sifrele: (s: string) => string
let sifreCoz: (s: string) => string
let F: typeof import('./form')
let Q: typeof import('./sorular')
let D: typeof import('../arayuz/formDaveti')
let A: typeof import('../arayuz')
let S: typeof import('../portal/sabitler')
let pinMod: typeof import('../portal/pin')
let giris: typeof import('../portal/giris')
let icerikMod: typeof import('./icerik')
let rota: { hekim: Mod; hasta: Mod; portal: Mod }
let DILLER: readonly string[] = []
let ROLLER: readonly string[] = []
let SENTETIK: HastaFormuIcerigi

const DA = '10000000-0000-4000-8000-00000000000a'
const DB = '10000000-0000-4000-8000-00000000000b'
const H1 = '30000000-0000-4000-8000-000000000001' // adult patient of doctor A
const H2 = '30000000-0000-4000-8000-000000000002' // second patient of doctor A
const H3 = '30000000-0000-4000-8000-000000000003' // patient of doctor B
const HC = '30000000-0000-4000-8000-00000000000c' // a child, patient of doctor A
const YOK = '77777777-7777-4777-8777-777777777777'
const ISARET = 'QA-INTAKE-ANSWER-NEVER-IN-CLEAR-TEXT'
const AD: Record<string, string> = { [H1]: 'QA Patient One', [H2]: 'QA Patient Two', [H3]: 'QA Patient Three', [HC]: 'QA Child' }
const BASLANGIC_ANI = new Date('2026-10-12T04:00:00.000Z').getTime()

const sb = () => vt.createClient() as unknown as Sb
const tablo = (ad: string) => vt.tablo(ad)
const formlar = () => tablo('ulke_hasta_formlari')
const simdiIso = () => new Date().toISOString()
const ilerle = (ms: number) => mock.timers.tick(ms)

/** A text in every language form of the active pack, so that each form can be told apart. */
const m = (ad: string) => Object.fromEntries(DILLER.map((d) => [d, `QA ${ad} [${d}]`]))
const mv = (ad: string) => Object.fromEntries(DILLER.map((d) => [d, `QA GUARDIAN ${ad} [${d}]`]))

function sentetikIcerik(): HastaFormuIcerigi {
  const rolSorulari = (rol: string, n: number): Soru[] => [
    { anahtar: `r${n}_belirti`, tur: 'cok-secim', metin: m(`role ${rol} symptoms`), secenekler: [{ anahtar: 'a', ad: m(`role ${rol} option a`) }, { anahtar: 'b', ad: m(`role ${rol} option b`) }, { anahtar: 'yok', ad: m(`role ${rol} none`), tek: true }] },
    { anahtar: `r${n}_not`, tur: 'uzun-metin', metin: m(`role ${rol} free text`) },
  ]
  return {
    surum: 'qa-1',
    riza: { surum: 'qa-riza-1', hukukcuInceledi: false, metin: m('consent'), veliMetni: mv('consent') },
    cekirdek: {
      inceleme: { makineYazimi: true, klinisyen: null },
      bolumler: [
        { anahtar: 'dolduran', kime: 'cocuk', baslik: m('who is filling in'), sorular: [
          { anahtar: 'dolduran_yakinlik', tur: 'tek-secim', zorunlu: true, metin: m('relation'), secenekler: [{ anahtar: 'anne', ad: m('mother') }, { anahtar: 'baba', ad: m('father') }, { anahtar: 'vasi', ad: m('guardian') }] },
          { anahtar: 'ebeveyn_medeni', tur: 'tek-secim', metin: m('parents marital status'), secenekler: [{ anahtar: 'evli', ad: m('married') }, { anahtar: 'ayri', ad: m('apart') }] },
        ] },
        { anahtar: 'basvuru', baslik: m('reason'), veliBasligi: mv('reason'), sorular: [
          { anahtar: 'neden', tur: 'uzun-metin', zorunlu: true, metin: m('why are you here'), veliMetni: mv('why is your child here') },
          { anahtar: 'ne_zaman', tur: 'tarih', metin: m('since when') },
        ] },
        { anahtar: 'gecmis', baslik: m('history'), sorular: [
          { anahtar: 'ilac', tur: 'evet-hayir', zorunlu: true, metin: m('regular medicines'), ayrinti: m('which ones') },
          { anahtar: 'alerji', tur: 'evet-hayir', metin: m('allergies') },
          { anahtar: 'sigara', tur: 'tek-secim', kime: 'yetiskin', metin: m('smoking'), secenekler: [{ anahtar: 'hayir', ad: m('no') }, { anahtar: 'evet', ad: m('yes') }] },
          { anahtar: 'evde_sigara', tur: 'evet-hayir', kime: 'cocuk', metin: m('smoking at home') },
          { anahtar: 'gebelik', tur: 'tek-secim', kime: 'yetiskin', cinsiyet: 'female', metin: m('pregnancy'), secenekler: [{ anahtar: 'hayir', ad: m('not pregnant') }, { anahtar: 'evet', ad: m('pregnant') }] },
          { anahtar: 'boy', tur: 'sayi', olcu: 'boy', metin: m('height') },
          { anahtar: 'kilo', tur: 'sayi', olcu: 'agirlik', metin: m('weight') },
          { anahtar: 'ates', tur: 'sayi', olcu: 'sicaklik', metin: m('temperature') },
          { anahtar: 'hafta', tur: 'sayi', birim: m('weeks'), enAz: 0, enCok: 52, metin: m('how many weeks') },
          { anahtar: 'kisa', tur: 'kisa-metin', metin: m('short text') },
        ] },
      ],
    },
    roller: Object.fromEntries(ROLLER.slice(0, 2).map((rol, i) => [rol, { baslik: m(`role ${rol}`), inceleme: { makineYazimi: true, klinisyen: null }, sorular: rolSorulari(rol, i + 1) }])),
  }
}

function hastaEkle(id: string, doktor: string, s: { dogum?: string; cinsiyet?: string; dil?: string; ulke?: string } = {}) {
  const ulke = s.ulke ?? BU
  tablo('ulke_hastalar').push({ id, ulke, doctor_id: doktor, name_encrypted: sifrele(JSON.stringify({ ad: AD[id] ?? 'QA Foreign' })), dob_encrypted: sifrele(s.dogum ?? '1990-05-05'), gender_encrypted: s.cinsiyet ? sifrele(s.cinsiyet) : null, phone_encrypted: null, is_active: true, created_at: simdiIso() })
  tablo('hasta_ulke_bilgisi').push({ patient_id: id, ulke, doctor_id: doktor, dil: s.dil ?? paket.uygulama?.hastaDilleri[0] ?? '', ota_ismi_encrypted: null, ulusal_kimlik_encrypted: null })
}
const rolYaz = (doktor: string, rol: string | null) => {
  vt.tablolar.hekim_rolu = tablo('hekim_rolu').filter((x) => x.doctor_id !== doktor)
  if (rol) tablo('hekim_rolu').push({ ulke: BU, doctor_id: doktor, rol })
}
function randevuEkle(id: string, doktor: string, hasta: string) {
  tablo('ulke_randevulari').push({ id, ulke: BU, doctor_id: doktor, patient_id: hasta, baslangic: '2026-10-14T05:00:00.000Z', bitis: '2026-10-14T05:30:00.000Z', durum: 'planlandi', neden_encrypted: null, mesai_disi: false, session_id: null, created_at: simdiIso() })
}

function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.depo.clear(); vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.boz.yaz.clear(); vt.boz.oku.clear()
  Object.assign(vt.hesaplar, {
    'jeton-a': { id: DA, email: 'qa-a@notya.test', app_metadata: { country: BU } },
    'jeton-b': { id: DB, email: 'qa-b@notya.test', app_metadata: { country: BU } },
  })
  const d = paket.uygulama?.diller[0] ?? paket.varsayilanDil
  tablo('ulke_hesaplari').push({ id: DA, full_name: 'QA Doctor A', ulke: BU, ui_language: d }, { id: DB, full_name: 'QA Doctor B', ulke: BU, ui_language: d })
  tablo('hekim_dil_tercihleri').push({ ulke: BU, doctor_id: DA, not_dili: d, soruldu_at: 'x' }, { ulke: BU, doctor_id: DB, not_dili: d, soruldu_at: 'x' })
  if (ROLLER[0]) { rolYaz(DA, ROLLER[0]); rolYaz(DB, ROLLER[0]) }
  hastaEkle(H1, DA, { cinsiyet: 'female' }); hastaEkle(H2, DA, { cinsiyet: 'male' }); hastaEkle(H3, DB); hastaEkle(HC, DA, { dogum: '2019-03-03' })
}

/** The doctor asks for the form with the synthetic questions. */
const iste = (doktor: string, hasta: string, ek: { randevuId?: string | null; yeniBaglanti?: boolean } = {}, icerik = SENTETIK) => F.formIste(sb(), doktor, { hastaId: hasta, ...ek }, icerik)
/** A portal session of the patient a link belongs to: who the server says the session is. */
async function oturum(yol: string, pin: string) {
  const r = await giris.portalGiris(sb(), yol.split('#')[1], pin)
  assert.equal(r.tamam, true, JSON.stringify(r))
  const kim = await giris.portalOturumuCoz(sb(), (r as { oturumAnahtari: string }).oturumAnahtari)
  assert.ok(kim, 'the session must resolve')
  return { kim: kim!, anahtar: (r as { oturumAnahtari: string }).oturumAnahtari }
}
/** Asks for the form and signs the patient in. */
async function hastaOturumu(doktor: string, hasta: string) {
  const r = await iste(doktor, hasta)
  assert.equal(r.tamam, true, JSON.stringify(r))
  const t = r as Extract<typeof r, { tamam: true }>
  assert.equal(t.erisim, 'yeni')
  return { ...(await oturum(t.yol!, t.pin!)), formId: t.formId, yol: t.yol!, pin: t.pin! }
}
const TAM: Cevaplar = { neden: `${ISARET} cough for a week`, ilac: { e: true, a: `${ISARET} one tablet` }, sigara: 'hayir' }
const satir = (id: string) => formlar().find((x) => x.id === id) as Satir

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  BU = paket.kod
  const arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  KIT = paket.ozellikler.cekirdekMuayene === true && paket.ozellikler.hastaPortali === true && Boolean(arayuz?.formMetinleri)
  DILLER = paket.uygulama?.diller ?? []
  ROLLER = paket.uygulama?.roller ?? []
  NextRequest = (await import('next/server')).NextRequest
  const sifre = await import('@/lib/security/encryption')
  sifrele = sifre.encrypt; sifreCoz = sifre.decrypt
  Q = await import('./sorular')
  S = await import('../portal/sabitler')
  pinMod = await import('../portal/pin')
  giris = await import('../portal/giris')
  icerikMod = await import('./icerik')
  ROTA = icerikMod.formAcik()
  if (KIT) { F = await import('./form'); D = await import('../arayuz/formDaveti'); A = await import('../arayuz'); SENTETIK = sentetikIcerik() }
  rota = {
    hekim: (await import('../../../app/api/ulke/hasta-formu/route.ulke')) as unknown as Mod,
    hasta: (await import('../../../app/api/ulke/portal/form/route.ulke')) as unknown as Mod,
    portal: (await import('../../../app/api/ulke/portal/route.ulke')) as unknown as Mod,
  }
  mock.timers.enable({ apis: ['Date'], now: new Date(BASLANGIC_ANI) })
})
beforeEach(() => { mock.timers.setTime(BASLANGIC_ANI); if (paket.ozellikler.cekirdekMuayene) sifirla() })

type Secenek = { jeton?: string; cerez?: string; baglanti?: string; govde?: unknown; portal?: boolean }
async function cagir(mod: Mod, yontem: string, yol: string, s: Secenek = {}): Promise<{ status: number; govde: any; res: Response }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const basliklar: Record<string, string> = { host: 'notya.test' }
  if (s.jeton) basliklar.authorization = `Bearer ${s.jeton}`
  if (s.cerez) basliklar.cookie = `${S.PORTAL_CEREZI}=${s.cerez}`
  if (s.baglanti) basliklar[S.PORTAL_BAGLANTI_BASLIGI] = pinMod.anahtarHash(s.baglanti)
  if (s.govde !== undefined) basliklar['content-type'] = 'application/json'
  if (s.portal) { basliklar[S.PORTAL_ISTEK_BASLIGI] = '1'; basliklar['content-type'] = 'application/json' }
  const req = new NextRequest(`https://notya.test${yol}`, { method: yontem, headers: basliklar, ...(s.govde !== undefined ? { body: JSON.stringify(s.govde) } : s.portal && yontem !== 'GET' ? { body: '{}' } : {}) })
  const res = await mod[yontem](req)
  const metin = await res.clone().text()
  let govde: unknown = null
  try { govde = JSON.parse(metin) } catch { govde = metin }
  return { status: res.status, govde, res }
}

// ═════════════════════════ 1. the kit's rules, with questions of no country ═════════════════════════

describe('intake form — asking for it: the form and the patient\'s access in one step', () => {
  it('a patient without access: the form is created, and a link and a PIN are made in the same step and answered once', async () => {
    if (!KIT) return
    const r = await iste(DA, H1)
    assert.equal(r.tamam, true, JSON.stringify(r))
    const t = r as Extract<typeof r, { tamam: true }>
    assert.deepEqual([t.yeniForm, t.erisim], [true, 'yeni'])
    assert.match(t.yol!, new RegExp(`^${S.PORTAL_SAYFASI}\\?dil=[^#]+#[A-Za-z0-9_-]{43}$`))
    assert.match(t.pin!, /^\d{6}$/)
    const f = satir(t.formId)
    assert.deepEqual([f.ulke, f.doctor_id, f.patient_id, f.durum, f.rol, f.soru_surumu, f.veli, f.cevaplar_encrypted], [BU, DA, H1, 'bekliyor', ROLLER[0] ?? null, 'qa-1', false, null])
    // Only hashes are stored: neither the token nor the PIN is anywhere in the database.
    const hepsi = JSON.stringify(vt.tablolar)
    assert.ok(!hepsi.includes(t.yol!.split('#')[1]) && !hepsi.includes(`"${t.pin}"`), 'the token or the PIN is stored')
    assert.deepEqual(tablo('ulke_portal_kayitlari').map((k) => [k.patient_id, k.olay]), [[H1, 'erisim']])
    // …and the link works: the patient signs in with it.
    assert.equal((await oturum(t.yol!, t.pin!)).kim.hastaId, H1)
  })

  it('asked again: the open form is kept, the working link is left alone and is NOT answered again', async () => {
    if (!KIT) return
    const ilk = (await iste(DA, H1)) as { tamam: true; formId: string; yol: string; pin: string }
    const r = (await iste(DA, H1)) as { tamam: true; formId: string; yeniForm: boolean; erisim: string; yol?: string; pin?: string }
    assert.deepEqual([r.tamam, r.formId, r.yeniForm, r.erisim, r.yol, r.pin], [true, ilk.formId, false, 'var', undefined, undefined])
    assert.equal(formlar().length, 1)
    assert.equal(tablo('ulke_portal_erisimleri').length, 1, 'no second link')
    assert.equal((await oturum(ilk.yol, ilk.pin)).kim.hastaId, H1, 'the link the patient has still works')
  })

  it('"a new link": the link before it stops at once, its sessions end, and the new one is answered once', async () => {
    if (!KIT) return
    const ilk = (await iste(DA, H1)) as { tamam: true; formId: string; yol: string; pin: string }
    const eski = await oturum(ilk.yol, ilk.pin)
    const r = (await iste(DA, H1, { yeniBaglanti: true })) as { tamam: true; formId: string; yeniForm: boolean; erisim: string; yol: string; pin: string }
    assert.deepEqual([r.formId, r.yeniForm, r.erisim], [ilk.formId, false, 'yeni'])
    assert.notEqual(r.yol, ilk.yol)
    assert.equal(await giris.portalOturumuCoz(sb(), eski.anahtar), null, 'the old link\'s session is still open')
    ilerle(3000)
    assert.deepEqual(await giris.portalGiris(sb(), ilk.yol.split('#')[1], ilk.pin), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal((await oturum(r.yol, r.pin)).kim.hastaId, H1)
  })

  it('a link that is locked or has ended does not count as access: a new one is made', async () => {
    if (!KIT) return
    for (const bozuk of [{ kilitlendi_at: simdiIso() }, { son_gecerlilik: '2026-10-01T00:00:00.000Z' }]) {
      sifirla()
      await iste(DA, H1)
      Object.assign(tablo('ulke_portal_erisimleri')[0], bozuk)
      const r = (await iste(DA, H1)) as { tamam: true; erisim: string; yol?: string }
      assert.deepEqual([r.tamam, r.erisim, typeof r.yol], [true, 'yeni', 'string'], JSON.stringify(bozuk))
    }
  })

  it('from an appointment: it must be THIS patient\'s appointment; anything else is "not found" and nothing is written', async () => {
    if (!KIT) return
    const R1 = '60000000-0000-4000-8000-000000000001', R2 = '60000000-0000-4000-8000-000000000002', R3 = '60000000-0000-4000-8000-000000000003'
    randevuEkle(R1, DA, H1); randevuEkle(R2, DA, H2); randevuEkle(R3, DB, H3)
    for (const yabanci of [R2, R3, YOK]) {
      assert.deepEqual(await iste(DA, H1, { randevuId: yabanci }), { tamam: false, kod: 'NOT_FOUND' })
      assert.deepEqual([formlar().length, tablo('ulke_portal_erisimleri').length], [0, 0])
    }
    const r = (await iste(DA, H1, { randevuId: R1 })) as { tamam: true; formId: string }
    assert.equal(satir(r.formId).randevu_id, R1)
  })

  it('all or nothing: if giving access fails inside the step, no form is left behind either', async () => {
    if (!KIT) return
    vt.boz.yaz.add('ulke_portal_erisimleri')
    assert.deepEqual(await iste(DA, H1), { tamam: false, kod: 'BASARISIZ' })
    assert.deepEqual([formlar().length, tablo('ulke_portal_erisimleri').length, tablo('ulke_portal_kayitlari').length], [0, 0, 0])
  })

  it('the function is called for this build\'s country, with the doctor and the patient, and never with a clear token or PIN', async () => {
    if (!KIT) return
    const r = (await iste(DA, H1)) as { tamam: true; yol: string; pin: string }
    const c = vt.islevCagrilari.find((x) => x.ad === 'ulke_hasta_formu_iste')!
    assert.deepEqual([c.arg.p_ulke, c.arg.p_doctor_id, c.arg.p_patient_id], [BU, DA, H1])
    assert.match(String(c.arg.p_token_hash), /^[0-9a-f]{64}$/)
    assert.ok(!JSON.stringify(c.arg).includes(r.yol.split('#')[1]) && c.arg.p_pin_hash !== r.pin)
  })
})

describe('intake form — the invitation the doctor copies', () => {
  it('is written in the PATIENT\'s language form, carries the address only when a link was made, and never the PIN', async () => {
    if (!KIT) return
    for (const hastaDili of paket.uygulama!.hastaDilleri) {
      sifirla()
      vt.tablolar.hasta_ulke_bilgisi = tablo('hasta_ulke_bilgisi').map((x) => (x.patient_id === H1 ? { ...x, dil: hastaDili } : x))
      const r = (await iste(DA, H1)) as { tamam: true; davetDili: string; yol: string; pin: string }
      assert.equal(A.temelDil(r.davetDili), hastaDili, 'the invitation is not in the patient\'s language')
      assert.ok(r.yol.includes(`dil=${encodeURIComponent(r.davetDili)}`), 'the page would open in another form than the invitation')
      const adres = `https://notya.test${r.yol}`
      const katalog = A.formMetni(r.davetDili).davet
      const dolu = D.formDavetMetni({ dil: r.davetDili as never, hekimAd: 'QA Doctor A', adres })
      assert.equal(dolu.metin, katalog.metin.replace('%1', 'QA Doctor A').replace('%2', adres))
      assert.ok(dolu.metin.endsWith(adres), 'the address must be the last thing in the text')
      assert.ok(!dolu.metin.includes(r.pin), 'the PIN is in the invitation')
      assert.equal(D.formDavetMetni({ dil: r.davetDili as never, hekimAd: '', adres }).metin, katalog.metinAdsiz.replace('%', adres))
      // A patient who already has a link: no address can be written, and none is.
      const ikinci = (await iste(DA, H1)) as { tamam: true; erisim: string; davetDili: string }
      assert.equal(ikinci.erisim, 'var')
      const bos = D.formDavetMetni({ dil: ikinci.davetDili as never, hekimAd: 'QA Doctor A', adres: null })
      assert.equal(bos.metin, katalog.baglantisiz.replace('%', 'QA Doctor A'))
      assert.ok(!/https?:|#/.test(bos.metin) && !/%\d?/.test(bos.metin))
      assert.equal(D.formDavetMetni({ dil: ikinci.davetDili as never, hekimAd: ' ', adres: null }).metin, katalog.baglantisizAdsiz)
      // A name is written as it is: nothing in it is read as a placeholder.
      assert.ok(D.formDavetMetni({ dil: r.davetDili as never, hekimAd: 'QA %2 $& Name', adres }).metin.includes('QA %2 $& Name'))
    }
  })
})

describe('intake form — the patient fills it in: consent, save and resume, submit once, read-only afterwards', () => {
  it('the form waits on the patient\'s page with the core questions and the questions of the doctor\'s role, in the patient\'s form', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    const f = (await F.hastaFormuOku(sb(), o.kim, SENTETIK))!
    assert.deepEqual([f.id, f.durum, f.veli, f.riza.kabul, f.gonderildi], [o.formId, 'bekliyor', false, false, null])
    assert.equal(f.riza.metin, `QA consent [${f.dil}]`)
    assert.deepEqual(f.bolumler.map((b) => b.anahtar), ['basvuru', 'gecmis', ...(ROLLER[0] ? ['rol'] : [])])
    assert.ok(f.bolumler.every((b) => b.baslik.endsWith(`[${f.dil}]`) && b.sorular.every((q) => q.metin.endsWith(`[${f.dil}]`))), 'a text is not in the patient\'s form')
    assert.deepEqual(f.cevaplar, {})
    assert.deepEqual(await F.hastaFormuOzeti(sb(), o.kim), { durum: 'bekliyor', veli: false, gonderildi: null, yenidenAcildi: false })
  })

  it('nothing is saved before the consent sentence is accepted; with it, answers are saved as a draft and found again', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    assert.deepEqual(await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: undefined, gonder: false }, SENTETIK), { tamam: false, kod: 'RIZA_GEREKLI' })
    assert.equal(satir(o.formId).cevaplar_encrypted, null)
    const k = await F.hastaFormuYaz(sb(), o.kim, { cevaplar: { neden: `${ISARET} cough` }, riza: true, gonder: false }, SENTETIK)
    assert.equal(k.tamam, true, JSON.stringify(k))
    const s = satir(o.formId)
    assert.deepEqual([s.durum, s.riza_surumu, Boolean(s.riza_at), s.gonderildi_at ?? null], ['taslak', 'qa-riza-1', true, null])
    // RESUME: a later visit to the page (a new read) finds the answers, and consent is not asked again.
    ilerle(60_000)
    const f = (await F.hastaFormuOku(sb(), o.kim, SENTETIK))!
    assert.deepEqual([f.durum, f.riza.kabul, f.cevaplar], ['taslak', true, { neden: `${ISARET} cough` }])
    const k2 = await F.hastaFormuYaz(sb(), o.kim, { cevaplar: { ...f.cevaplar, alerji: { e: false } }, riza: undefined, gonder: false }, SENTETIK)
    assert.equal(k2.tamam, true)
    assert.deepEqual((await F.hastaFormuOku(sb(), o.kim, SENTETIK))!.cevaplar, { neden: `${ISARET} cough`, alerji: { e: false } })
  })

  it('a form with a required question unanswered is not submitted, and says which', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    assert.deepEqual(await F.hastaFormuYaz(sb(), o.kim, { cevaplar: { neden: 'x' }, riza: true, gonder: true }, SENTETIK), { tamam: false, kod: 'EKSIK', eksik: ['ilac'] })
    assert.equal(satir(o.formId).durum, 'bekliyor')
  })

  it('submitted ONCE: afterwards the patient reads the answers and can change nothing — not by saving, not by submitting again', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    const g = await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: true, gonder: true }, SENTETIK)
    assert.equal(g.tamam, true, JSON.stringify(g))
    const once = JSON.stringify(satir(o.formId))
    assert.equal(satir(o.formId).durum, 'gonderildi')
    for (const gonder of [false, true]) assert.deepEqual(await F.hastaFormuYaz(sb(), o.kim, { cevaplar: { ...TAM, neden: 'changed' }, riza: true, gonder }, SENTETIK), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(JSON.stringify(satir(o.formId)), once, 'a submitted form changed')
    const f = (await F.hastaFormuOku(sb(), o.kim, SENTETIK))!
    assert.deepEqual([f.durum, f.cevaplar, typeof f.gonderildi], ['gonderildi', TAM, 'string'])
    // The database holds the same rule by itself: a statement that reaches the row is refused.
    const { error } = await (await import('../uygulama/tablolar')).ulkeTablosu(sb(), 'ulke_hasta_formlari').update({ cevaplar_encrypted: sifrele('{}') }).eq('id', o.formId).eq('doctor_id', DA)
    assert.equal((error as { code?: string } | null)?.code, '23514')
  })

  it('the stored answers are one encrypted value: no answer is readable in the database, and the value names its own country, doctor and patient', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: true, gonder: true }, SENTETIK)
    assert.ok(!JSON.stringify(vt.tablolar).includes(ISARET), 'an answer is stored in clear text')
    const z = JSON.parse(sifreCoz(String(satir(o.formId).cevaplar_encrypted))) as Record<string, unknown>
    assert.deepEqual([z.u, z.d, z.h], [BU, DA, H1])
    assert.deepEqual(z.c, TAM)
  })

  it('answers that are not answers are dropped: an unknown key, an unknown option, a wrong shape, a text that is too long', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    const r = await F.hastaFormuYaz(sb(), o.kim, { cevaplar: { neden: 'x'.repeat(5000), ilac: 'yes', sigara: 'belki', uydurma: 'x', ne_zaman: '2026-02-31', kisa: '  ok  ', alerji: { e: false, a: 'ignored: the question asks for no detail' }, __proto__: { kirli: 1 } }, riza: true, gonder: false }, SENTETIK)
    assert.equal(r.tamam, true)
    const c = (r as { form: { cevaplar: Cevaplar } }).form.cevaplar
    assert.deepEqual(Object.keys(c).sort(), ['alerji', 'kisa', 'neden'])
    assert.deepEqual([String(c.neden).length, c.kisa, c.alerji], [Q.UZUN_METIN_AZAMI, 'ok', { e: false }])
  })
})

describe('intake form — the doctor reads it: the patient\'s own words, marked as such by the screen; reopen; withdraw', () => {
  it('an open form shows NO answer to the doctor; a submitted one shows them as text in the doctor\'s own form', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: true, gonder: false }, SENTETIK)
    let l = (await F.hastaninFormlari(sb(), DA, H1, SENTETIK))!
    assert.deepEqual(l.map((x) => [x.id, x.durum, x.bolumler]), [[o.formId, 'taslak', null]])
    await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: undefined, gonder: true }, SENTETIK)
    l = (await F.hastaninFormlari(sb(), DA, H1, SENTETIK))!
    const d = paket.uygulama!.diller[0]
    const fm = A.formMetni(d)
    assert.deepEqual([l[0].durum, l[0].veli, l[0].surumFarkli, typeof l[0].gonderildi], ['gonderildi', false, false, 'string'])
    assert.deepEqual(l[0].bolumler, [
      { baslik: `QA reason [${d}]`, satirlar: [{ soru: `QA why are you here [${d}]`, cevap: TAM.neden }] },
      { baslik: `QA history [${d}]`, satirlar: [{ soru: `QA regular medicines [${d}]`, cevap: `${fm.hasta.evet}: ${ISARET} one tablet` }, { soru: `QA smoking [${d}]`, cevap: `QA no [${d}]` }] },
    ])
  })

  it('REOPEN: only a submitted form, only by its own doctor; the patient may change the answers and must submit again', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    assert.deepEqual(await F.formYenidenAc(sb(), DA, o.formId), { tamam: false, kod: 'DURUM' })
    await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: true, gonder: true }, SENTETIK)
    assert.deepEqual(await F.formYenidenAc(sb(), DA, o.formId), { tamam: true })
    const s = satir(o.formId)
    assert.deepEqual([s.durum, s.gonderildi_at, Boolean(s.yeniden_acildi_at)], ['taslak', null, true])
    assert.deepEqual(await F.hastaFormuOzeti(sb(), o.kim), { durum: 'taslak', veli: false, gonderildi: null, yenidenAcildi: true })
    // The answers are still there, the doctor no longer sees them as submitted, and the patient changes one.
    assert.equal((await F.hastaninFormlari(sb(), DA, H1, SENTETIK))![0].bolumler, null)
    const f = (await F.hastaFormuOku(sb(), o.kim, SENTETIK))!
    assert.deepEqual([f.durum, f.cevaplar, f.riza.kabul], ['taslak', TAM, true])
    const g = await F.hastaFormuYaz(sb(), o.kim, { cevaplar: { ...TAM, sigara: 'evet' }, riza: undefined, gonder: true }, SENTETIK)
    assert.equal(g.tamam, true)
    assert.equal((await F.hastaninFormlari(sb(), DA, H1, SENTETIK))![0].bolumler![1].satirlar[1].cevap, `QA yes [${paket.uygulama!.diller[0]}]`)
  })

  it('WITHDRAW: only a form that was not submitted; it leaves the patient\'s page; a submitted form is never withdrawn', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    assert.deepEqual(await F.formGeriCek(sb(), DA, o.formId), { tamam: true })
    assert.deepEqual([await F.hastaFormuOku(sb(), o.kim, SENTETIK), await F.hastaFormuOzeti(sb(), o.kim), (await F.hastaninFormlari(sb(), DA, H1, SENTETIK))!.length], [null, null, 0])
    assert.deepEqual(await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: true, gonder: true }, SENTETIK), { tamam: false, kod: 'NOT_FOUND' })
    // A new form can be asked for afterwards; once submitted it cannot be withdrawn.
    const yeni = (await iste(DA, H1)) as { tamam: true; formId: string; yeniForm: boolean; erisim: string }
    assert.deepEqual([yeni.yeniForm, yeni.erisim], [true, 'var'])
    await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: true, gonder: true }, SENTETIK)
    assert.deepEqual(await F.formGeriCek(sb(), DA, yeni.formId), { tamam: false, kod: 'DURUM' })
    assert.equal(satir(yeni.formId).durum, 'gonderildi')
  })

  it('a second form after a submitted one: both are on the file, newest first; reopening the old one while a new one is open is refused', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: true, gonder: true }, SENTETIK)
    ilerle(86_400_000)
    const ikinci = (await iste(DA, H1)) as { tamam: true; formId: string; yeniForm: boolean }
    assert.equal(ikinci.yeniForm, true)
    assert.deepEqual((await F.hastaninFormlari(sb(), DA, H1, SENTETIK))!.map((x) => [x.id, x.durum]), [[ikinci.formId, 'bekliyor'], [o.formId, 'gonderildi']])
    assert.deepEqual(await F.formYenidenAc(sb(), DA, o.formId), { tamam: false, kod: 'ACIK_VAR' })
    assert.equal(satir(o.formId).durum, 'gonderildi')
  })
})

describe('intake form — the guardian form follows the patient\'s AGE (the kit\'s one age rule)', () => {
  it('below the guardian age: addressed to the guardian, asks who is filling it in, child questions in, adult questions out — and the reverse for an adult', async () => {
    if (!KIT) return
    if (paket.uygulama!.veliYasi === null) {
      const o = await hastaOturumu(DA, HC)
      assert.equal((await F.hastaFormuOku(sb(), o.kim, SENTETIK))!.veli, false, 'a country without a guardian age has no guardian form')
      return
    }
    const c = await hastaOturumu(DA, HC)
    const cf = (await F.hastaFormuOku(sb(), c.kim, SENTETIK))!
    const anahtarlar = (f: typeof cf) => f.bolumler.flatMap((b) => b.sorular.map((q) => q.anahtar))
    assert.equal(cf.veli, true)
    assert.equal(cf.riza.metin, `QA GUARDIAN consent [${cf.dil}]`)
    assert.equal(cf.bolumler[0].anahtar, 'dolduran', 'the guardian form must begin with who is filling it in')
    assert.equal(cf.bolumler[1].baslik, `QA GUARDIAN reason [${cf.dil}]`)
    assert.equal(cf.bolumler[1].sorular[0].metin, `QA GUARDIAN why is your child here [${cf.dil}]`)
    for (const k of ['dolduran_yakinlik', 'ebeveyn_medeni', 'evde_sigara']) assert.ok(anahtarlar(cf).includes(k), `${k} missing from the guardian form`)
    for (const k of ['sigara', 'gebelik']) assert.ok(!anahtarlar(cf).includes(k), `${k} is an adult's question`)
    // Submitting needs the guardian's own required answer; an adult's answer sent with it is dropped.
    assert.deepEqual(await F.hastaFormuYaz(sb(), c.kim, { cevaplar: { neden: 'x', ilac: { e: false } }, riza: true, gonder: true }, SENTETIK), { tamam: false, kod: 'EKSIK', eksik: ['dolduran_yakinlik'] })
    const g = await F.hastaFormuYaz(sb(), c.kim, { cevaplar: { neden: 'x', ilac: { e: false }, dolduran_yakinlik: 'anne', ebeveyn_medeni: 'evli', sigara: 'evet' }, riza: true, gonder: true }, SENTETIK)
    assert.deepEqual(Object.keys((g as { form: { cevaplar: Cevaplar } }).form.cevaplar).sort(), ['dolduran_yakinlik', 'ebeveyn_medeni', 'ilac', 'neden'])
    assert.equal((await F.hastaninFormlari(sb(), DA, HC, SENTETIK))![0].veli, true)

    const a = await hastaOturumu(DA, H1)
    const af = (await F.hastaFormuOku(sb(), a.kim, SENTETIK))!
    assert.equal(af.veli, false)
    for (const k of ['dolduran_yakinlik', 'ebeveyn_medeni', 'evde_sigara']) assert.ok(!anahtarlar(af).includes(k), `${k} is on an adult's form: the parents' marital status and "who is filling in" belong to the guardian form`)
    assert.ok(anahtarlar(af).includes('sigara'))
    assert.equal(af.bolumler[0].sorular[0].metin, `QA why are you here [${af.dil}]`)
  })

  it('the day that decides is the day the form is asked for, in the account\'s own time zone, and the form keeps its shape afterwards', async () => {
    if (!KIT || paket.uygulama!.veliYasi === null) return
    const yas = paket.uygulama!.veliYasi as number
    const bugun = (await import('../uygulama/zaman')).yerelAn(Date.now(), paket.saatDilimi).gun
    const [y, a, g] = bugun.split('-').map(Number)
    const dogum = (yil: number, gun: number) => new Date(Date.UTC(yil, a - 1, gun)).toISOString().slice(0, 10)
    // Reaches the guardian age TODAY → an adult's form. Reaches it TOMORROW → still the guardian form.
    vt.tablolar.ulke_hastalar = tablo('ulke_hastalar').map((x) => (x.id === H1 ? { ...x, dob_encrypted: sifrele(dogum(y - yas, g)) } : x.id === H2 ? { ...x, dob_encrypted: sifrele(dogum(y - yas, g + 1)) } : x))
    const r1 = (await iste(DA, H1)) as { tamam: true; formId: string }, r2 = (await iste(DA, H2)) as { tamam: true; formId: string }
    assert.deepEqual([satir(r1.formId).veli, satir(r2.formId).veli], [false, true])
    // The database refuses a change of the mark; a year later the open form is still the form that was asked for.
    const { error } = await (await import('../uygulama/tablolar')).ulkeTablosu(sb(), 'ulke_hasta_formlari').update({ veli: false }).eq('id', r2.formId).eq('doctor_id', DA)
    assert.equal((error as { code?: string } | null)?.code, '23514')
  })
})

describe('intake form — units come from the pack; a question for one sex', () => {
  it('height, weight and temperature are asked in the pack\'s own units, named by the pack\'s catalogue, and stored with the unit they were typed in', async () => {
    if (!KIT) return
    const b = paket.uygulama!.birimler
    const o = await hastaOturumu(DA, H1)
    const f = (await F.hastaFormuOku(sb(), o.kim, SENTETIK))!
    const soru = (k: string) => f.bolumler.flatMap((x) => x.sorular).find((q) => q.anahtar === k)!
    const adlar = A.formMetni(f.dil).birim
    for (const [k, kod] of [['boy', b.boy], ['kilo', b.agirlik], ['ates', b.sicaklik]] as const) {
      assert.deepEqual([soru(k).birim!.kod, soru(k).birim!.ad], [kod, adlar[kod]], `${k}: not the pack's unit`)
      assert.ok(adlar[kod], `the pack's catalogue has no name for its own unit "${kod}"`)
    }
    assert.deepEqual([soru('hafta').birim!.kod, soru('hafta').birim!.ad, soru('hafta').birim!.enCok], ['', `QA weeks [${f.dil}]`, 52])
    const orta = (kod: 'cm' | 'in' | 'kg' | 'lb' | 'C' | 'F') => Math.round((Q.BIRIM_ARALIGI[kod].enAz + Q.BIRIM_ARALIGI[kod].enCok) / 2)
    const diger = { cm: 'in', in: 'cm', kg: 'lb', lb: 'kg', C: 'F', F: 'C' } as const
    const r = await F.hastaFormuYaz(sb(), o.kim, { cevaplar: { boy: { n: orta(b.boy), b: b.boy }, kilo: { n: orta(b.agirlik), b: diger[b.agirlik] }, ates: { n: 9999, b: b.sicaklik }, hafta: { n: 6.6, b: '' } }, riza: true, gonder: false }, SENTETIK)
    // The right unit is kept; a number typed under another unit, or far outside what a person measures, is no answer.
    assert.deepEqual((r as { form: { cevaplar: Cevaplar } }).form.cevaplar, { boy: { n: orta(b.boy), b: b.boy }, hafta: { n: 7, b: '' } })
    await F.hastaFormuYaz(sb(), o.kim, { cevaplar: { neden: 'x', ilac: { e: false }, boy: { n: orta(b.boy), b: b.boy } }, riza: undefined, gonder: true }, SENTETIK)
    const satirlar = (await F.hastaninFormlari(sb(), DA, H1, SENTETIK))![0].bolumler!.flatMap((x) => x.satirlar)
    assert.equal(satirlar.find((x) => x.soru.startsWith('QA height'))!.cevap, `${orta(b.boy)} ${A.formMetni(paket.uygulama!.diller[0]).birim[b.boy]}`)
  })

  it('a question for one sex is asked of that sex and of a patient whose sex is not recorded — never of the other', async () => {
    if (!KIT) return
    const sorular = async (hasta: string) => { const o = await hastaOturumu(DA, hasta); return (await F.hastaFormuOku(sb(), o.kim, SENTETIK))!.bolumler.flatMap((b) => b.sorular.map((q) => q.anahtar)) }
    assert.ok((await sorular(H1)).includes('gebelik'), 'recorded as female')
    assert.ok(!(await sorular(H2)).includes('gebelik'), 'recorded as male')
    vt.tablolar.ulke_hastalar = tablo('ulke_hastalar').map((x) => (x.id === H2 ? { ...x, gender_encrypted: null } : x))
    vt.tablolar.ulke_hasta_formlari = []
    assert.ok((await F.hastaFormuOku(sb(), (await oturum(...(await (async () => { const r = (await iste(DA, H2, { yeniBaglanti: true })) as { yol: string; pin: string }; return [r.yol, r.pin] as const })()))).kim, SENTETIK))!.bolumler.flatMap((b) => b.sorular.map((q) => q.anahtar)).includes('gebelik'), 'sex not recorded')
  })
})

describe('intake form — LEAK RULE: a question of one role never appears for another', () => {
  it('a form carries the core questions and the questions of the ONE role it was asked with; every other role\'s questions and answers stay out', async () => {
    if (!KIT || ROLLER.length < 2) return
    const [R1, R2] = ROLLER
    const o = await hastaOturumu(DA, H1) // doctor A works as R1
    const f = (await F.hastaFormuOku(sb(), o.kim, SENTETIK))!
    const metinler = JSON.stringify(f)
    assert.ok(metinler.includes(`role ${R1} symptoms`), 'the role\'s own questions are missing')
    assert.ok(!metinler.includes(`role ${R2} `), 'a question of another role reached the patient\'s page')
    assert.deepEqual(f.bolumler[f.bolumler.length - 1].sorular.map((q) => q.anahtar), ['r1_belirti', 'r1_not'])
    // A browser that sends answers to the other role's questions: they are dropped, not stored.
    const g = await F.hastaFormuYaz(sb(), o.kim, { cevaplar: { ...TAM, r1_belirti: ['a', 'yok', 'b'], r1_not: 'own', r2_belirti: ['a'], r2_not: `${ISARET} foreign` }, riza: true, gonder: true }, SENTETIK)
    const c = (g as { form: { cevaplar: Cevaplar } }).form.cevaplar
    assert.deepEqual([c.r1_belirti, c.r1_not, c.r2_belirti, c.r2_not], [['yok'], 'own', undefined, undefined], '"none of these" must stand alone, and the other role\'s keys must be gone')
    assert.ok(!sifreCoz(String(satir(o.formId).cevaplar_encrypted)).includes('foreign'))
    // The doctor changes role afterwards: the form keeps the questions it was asked with, on both sides.
    rolYaz(DA, R2)
    const sonra = JSON.stringify([await F.hastaFormuOku(sb(), o.kim, SENTETIK), await F.hastaninFormlari(sb(), DA, H1, SENTETIK)])
    assert.ok(sonra.includes(`role ${R1} `) && !sonra.includes(`role ${R2} `), 'a later change of role rewrote an existing form')
    // …and a form asked for from now on is the new role's, with nothing of the old one.
    const yeni = await hastaOturumu(DA, H2)
    const yf = JSON.stringify(await F.hastaFormuOku(sb(), yeni.kim, SENTETIK))
    assert.ok(yf.includes(`role ${R2} `) && !yf.includes(`role ${R1} `))
  })

  it('an account without a role, and a role the pack has no questions for: the core questions only — a default never carries a role\'s content', async () => {
    if (!KIT) return
    for (const rol of [null, ...(ROLLER.length > 2 ? [ROLLER[2]] : [])]) {
      sifirla(); rolYaz(DA, rol)
      const o = await hastaOturumu(DA, H1)
      const f = (await F.hastaFormuOku(sb(), o.kim, SENTETIK))!
      assert.deepEqual(f.bolumler.map((b) => b.anahtar), ['basvuru', 'gecmis'], `role ${String(rol)}`)
      assert.ok(!JSON.stringify(f).includes('QA role '), 'a role question on a form without that role')
      assert.equal(satir(o.formId).rol, null)
    }
  })

  it('the pure rule, for every role of the synthetic set: its section holds its own questions and no key of any other', () => {
    if (!KIT) return
    const roller = Object.keys(SENTETIK.roller)
    for (const rol of roller) {
      const kendi = new Set(SENTETIK.roller[rol].sorular.map((q) => q.anahtar))
      const yabanci = roller.filter((r) => r !== rol).flatMap((r) => SENTETIK.roller[r].sorular.map((q) => q.anahtar))
      for (const veli of [false, true]) {
        const anahtarlar = Q.formSorulari(SENTETIK, { rol, veli, cinsiyet: '' }).map((q) => q.anahtar)
        for (const k of kendi) assert.ok(anahtarlar.includes(k), `${rol}: ${k} missing`)
        for (const k of yabanci) assert.ok(!anahtarlar.includes(k), `${rol}: carries ${k}`)
      }
    }
    assert.deepEqual(Q.formIcerigiSorunlari(SENTETIK, roller, DILLER), [], 'the synthetic set itself must be well-formed')
  })
})

describe('intake form — ISOLATION: between patients, between doctors, between countries, between kinds of session', () => {
  it('PATIENT ↔ PATIENT: a session reads and writes its OWN form only — there is no id to aim at another', async () => {
    if (!KIT) return
    const o1 = await hastaOturumu(DA, H1), o2 = await hastaOturumu(DA, H2)
    await F.hastaFormuYaz(sb(), o1.kim, { cevaplar: { ...TAM, neden: `${ISARET} ONE` }, riza: true, gonder: true }, SENTETIK)
    const f2 = (await F.hastaFormuOku(sb(), o2.kim, SENTETIK))!
    assert.deepEqual([f2.id, f2.durum, f2.cevaplar], [o2.formId, 'bekliyor', {}])
    assert.ok(!JSON.stringify(f2).includes('ONE'))
    await F.hastaFormuYaz(sb(), o2.kim, { cevaplar: { neden: 'two' }, riza: true, gonder: false }, SENTETIK)
    assert.equal(satir(o1.formId).durum, 'gonderildi')
    assert.ok(sifreCoz(String(satir(o1.formId).cevaplar_encrypted)).includes('ONE'), 'patient two\'s save reached patient one\'s form')
    // A session whose patient id is tampered with (it never can be: the id is the session row's) finds nothing of patient one's doctor.
    assert.equal(await F.hastaFormuOku(sb(), { doktorId: DB, hastaId: H1 }, SENTETIK), null)
    assert.deepEqual(await F.hastaFormuYaz(sb(), { doktorId: DB, hastaId: H1 }, { cevaplar: TAM, riza: true, gonder: true }, SENTETIK), { tamam: false, kod: 'NOT_FOUND' })
  })

  it('PATIENT ↔ PATIENT: an encrypted value copied from another patient\'s row is read as "no answers"', async () => {
    if (!KIT) return
    const o1 = await hastaOturumu(DA, H1), o2 = await hastaOturumu(DA, H2)
    await F.hastaFormuYaz(sb(), o1.kim, { cevaplar: { ...TAM, neden: `${ISARET} ONE` }, riza: true, gonder: true }, SENTETIK)
    // Written straight into the stand-in, as a faulty statement or a manual edit would: patient two's row gets patient one's value.
    Object.assign(satir(o2.formId), { cevaplar_encrypted: satir(o1.formId).cevaplar_encrypted, durum: 'gonderildi', gonderildi_at: simdiIso(), riza_at: simdiIso(), riza_surumu: 'qa-riza-1', dil: DILLER[0] })
    assert.deepEqual((await F.hastaFormuOku(sb(), o2.kim, SENTETIK))!.cevaplar, {})
    assert.deepEqual((await F.hastaninFormlari(sb(), DA, H2, SENTETIK))![0].bolumler, [])
  })

  it('DOCTOR ↔ DOCTOR: another doctor\'s patient and form answer exactly like ones that do not exist, and nothing changes', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: true, gonder: true }, SENTETIK)
    const once = JSON.stringify([formlar(), tablo('ulke_portal_erisimleri')])
    for (const [doktor, hasta] of [[DB, H1], [DA, H3], [DA, YOK]] as const) {
      assert.deepEqual(await iste(doktor, hasta), { tamam: false, kod: 'NOT_FOUND' })
      assert.equal(await F.hastaninFormlari(sb(), doktor, hasta, SENTETIK), null)
    }
    for (const id of [o.formId, YOK]) {
      const doktor = id === YOK ? DA : DB
      assert.deepEqual(await F.formYenidenAc(sb(), doktor, id), { tamam: false, kod: 'NOT_FOUND' })
      assert.deepEqual(await F.formGeriCek(sb(), doktor, id), { tamam: false, kod: 'NOT_FOUND' })
    }
    assert.equal(JSON.stringify([formlar(), tablo('ulke_portal_erisimleri')]), once)
    assert.deepEqual((await F.hastaninFormlari(sb(), DB, H3, SENTETIK))!, [], 'doctor B\'s own patient: positive control')
  })

  it('COUNTRY ↔ COUNTRY: a form row of another country — same doctor id, same patient id — does not exist here', async () => {
    if (!KIT) return
    const yabanci = ['tr', 'uz', 'zz'].find((k) => k !== BU)!
    formlar().push({ id: '80000000-0000-4000-8000-000000000001', ulke: yabanci, doctor_id: DA, patient_id: H1, rol: null, soru_surumu: 'qa-1', veli: false, durum: 'gonderildi', cevaplar_encrypted: sifrele(JSON.stringify({ v: 1, u: yabanci, d: DA, h: H1, c: TAM })), dil: DILLER[0], riza_surumu: 'x', riza_at: simdiIso(), gonderildi_at: simdiIso(), created_at: simdiIso() })
    assert.deepEqual(await F.hastaninFormlari(sb(), DA, H1, SENTETIK), [])
    assert.equal(await F.hastaFormuOku(sb(), { doktorId: DA, hastaId: H1 }, SENTETIK), null)
    assert.deepEqual(await F.formYenidenAc(sb(), DA, '80000000-0000-4000-8000-000000000001'), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(formlar()[0].durum, 'gonderildi')
  })

  it('every statement on the form table names the country, the doctor AND the patient (or the form\'s id with the doctor)', async () => {
    if (!KIT) return
    const o = await hastaOturumu(DA, H1)
    await F.hastaFormuYaz(sb(), o.kim, { cevaplar: TAM, riza: true, gonder: true }, SENTETIK)
    await F.hastaFormuOku(sb(), o.kim, SENTETIK); await F.hastaFormuOzeti(sb(), o.kim); await F.hastaninFormlari(sb(), DA, H1, SENTETIK)
    await F.formYenidenAc(sb(), DA, o.formId); await F.formGeriCek(sb(), DA, o.formId)
    const s = vt.sorgular.filter((x) => x.tablo === 'ulke_hasta_formlari')
    assert.ok(s.length >= 6)
    for (const x of s) {
      assert.equal(x.ulke, BU)
      assert.ok(x.filtreler.some((f) => f.startsWith('doctor_id=eq.')), `${x.islem}: no doctor in the statement`)
      assert.ok(x.filtreler.some((f) => f.startsWith('patient_id=eq.')) || (x.islem === 'select' && x.filtreler.some((f) => f.startsWith('id=eq.'))), `${x.islem}: neither the patient nor the form's id in the statement`)
    }
  })

  it('NOT GIVEN TO THE MODEL: the code that writes a note, and the pack\'s instructions to the model, never read the intake form', () => {
    for (const f of ['lib/ulke/uygulama/notlar.ts', 'lib/ulke/uygulama/notModeli.ts', 'lib/ulke/uygulama/muayeneKaydi.ts', 'lib/ulke/portal/ozet.ts']) {
      const kaynak = readFileSync(join(KOK, f), 'utf8')
      assert.doesNotMatch(kaynak, /intake|hasta_formlari|hastaFormu/i, `${f} reaches for the intake form`)
    }
    // …and the form's own server code calls no model: it imports neither the gateway nor a provider.
    for (const f of ['lib/ulke/intake/form.ts', 'lib/ulke/intake/sorular.ts', 'lib/ulke/intake/icerik.ts']) assert.doesNotMatch(readFileSync(join(KOK, f), 'utf8'), /from '@\/lib\/ai\/|openrouter|notModeli/i, `${f} can reach a model`)
  })
})

// ═════════════════════════ 2. the routes, with the pack's own questions ═════════════════════════

describe('intake form — the routes', () => {
  it('a pack that does not switch the form on has none: every route answers "not found", for a doctor, a patient and nobody alike', async () => {
    if (ROTA) return
    for (const [mod, yontemler, yol] of [[rota.hekim, ['GET', 'POST', 'PATCH'], '/api/ulke/hasta-formu?hasta=' + H1], [rota.hasta, ['GET', 'PUT', 'POST'], '/api/ulke/portal/form']] as const) {
      for (const y of yontemler) {
        const r = await cagir(mod, y, yol, { jeton: 'jeton-a', portal: true, ...(y === 'GET' ? {} : { govde: { hastaId: H1 } }) })
        assert.deepEqual([r.status, r.govde], [404, { code: 'NOT_FOUND' }], `${y} ${yol}`)
      }
    }
    assert.equal(icerikMod.aktifFormIcerigi(), null)
  })

  it('the doctor\'s route: asks, lists, reopens and withdraws for the doctor\'s own patients only; a portal cookie is no session there', async () => {
    if (!ROTA) return
    assert.equal((await cagir(rota.hekim, 'GET', `/api/ulke/hasta-formu?hasta=${H1}`)).status, 401)
    const r = await cagir(rota.hekim, 'POST', '/api/ulke/hasta-formu', { jeton: 'jeton-a', govde: { hastaId: H1 } })
    assert.equal(r.status, 200, JSON.stringify(r.govde))
    assert.deepEqual([r.govde.yeniForm, r.govde.erisim, typeof r.govde.yol, typeof r.govde.pin, typeof r.govde.davetDili], [true, 'yeni', 'string', 'string', 'string'])
    assert.equal(r.res.headers.get('cache-control'), 'no-store')
    const ikinci = await cagir(rota.hekim, 'POST', '/api/ulke/hasta-formu', { jeton: 'jeton-a', govde: { hastaId: H1 } })
    assert.deepEqual([ikinci.govde.erisim, ikinci.govde.yol, ikinci.govde.pin], ['var', undefined, undefined])
    for (const [jeton, govde] of [['jeton-b', { hastaId: H1 }], ['jeton-a', { hastaId: H3 }], ['jeton-a', { hastaId: 'x' }], ['jeton-a', { hastaId: H1, randevuId: YOK }]] as const) {
      assert.deepEqual([(await cagir(rota.hekim, 'POST', '/api/ulke/hasta-formu', { jeton, govde })).status], [404], JSON.stringify(govde))
    }
    assert.equal((await cagir(rota.hekim, 'GET', `/api/ulke/hasta-formu?hasta=${H1}`, { jeton: 'jeton-b' })).status, 404)
    const liste = await cagir(rota.hekim, 'GET', `/api/ulke/hasta-formu?hasta=${H1}`, { jeton: 'jeton-a' })
    assert.deepEqual(liste.govde.formlar.map((x: { id: string; durum: string; bolumler: unknown }) => [x.id, x.durum, x.bolumler]), [[r.govde.formId, 'bekliyor', null]])
    // The patient's own session is not a doctor's session.
    const o = await oturum(r.govde.yol, r.govde.pin)
    assert.equal((await cagir(rota.hekim, 'GET', `/api/ulke/hasta-formu?hasta=${H1}`, { cerez: o.anahtar, baglanti: r.govde.yol.split('#')[1] })).status, 401)
    assert.deepEqual([(await cagir(rota.hekim, 'PATCH', '/api/ulke/hasta-formu', { jeton: 'jeton-b', govde: { formId: r.govde.formId, islem: 'geri-cek' } })).status, (await cagir(rota.hekim, 'PATCH', '/api/ulke/hasta-formu', { jeton: 'jeton-a', govde: { formId: r.govde.formId, islem: 'sil' } })).status], [404, 400])
    assert.deepEqual((await cagir(rota.hekim, 'PATCH', '/api/ulke/hasta-formu', { jeton: 'jeton-a', govde: { formId: r.govde.formId, islem: 'yeniden-ac' } })).govde, { code: 'DURUM' })
    assert.deepEqual((await cagir(rota.hekim, 'PATCH', '/api/ulke/hasta-formu', { jeton: 'jeton-a', govde: { formId: r.govde.formId, islem: 'geri-cek' } })).govde, { ok: true })
  })

  it('the patient\'s route: the form of the session\'s own patient, with the pack\'s questions; private, never cached; a doctor\'s session is no session there', async () => {
    if (!ROTA) return
    const r = await cagir(rota.hekim, 'POST', '/api/ulke/hasta-formu', { jeton: 'jeton-a', govde: { hastaId: H1 } })
    const token = r.govde.yol.split('#')[1]
    const o = await oturum(r.govde.yol, r.govde.pin)
    const s = { cerez: o.anahtar, baglanti: token }
    assert.equal((await cagir(rota.hasta, 'GET', '/api/ulke/portal/form', { jeton: 'jeton-a' })).status, 401, 'a doctor\'s bearer token must not open a patient\'s form')
    assert.equal((await cagir(rota.hasta, 'GET', '/api/ulke/portal/form', { cerez: o.anahtar })).status, 401, 'the page must say which link it is open for')
    const g = await cagir(rota.hasta, 'GET', '/api/ulke/portal/form', s)
    assert.equal(g.status, 200, JSON.stringify(g.govde))
    assert.deepEqual([g.res.headers.get('cache-control'), g.res.headers.get('x-robots-tag')?.includes('noindex'), g.res.headers.get('referrer-policy')], ['private, no-store, max-age=0', true, 'no-referrer'])
    const icerik = icerikMod.aktifFormIcerigi()!
    const beklenen = Q.formSorulari(icerik, { rol: ROLLER[0] && icerik.roller[ROLLER[0]] ? ROLLER[0] : null, veli: false, cinsiyet: 'female' }).map((q) => q.anahtar)
    assert.deepEqual(g.govde.form.bolumler.flatMap((b: { sorular: { anahtar: string }[] }) => b.sorular.map((q) => q.anahtar)), beklenen)
    // A change must be the portal's own request (its header, JSON): a page of another site cannot make one.
    assert.equal((await cagir(rota.hasta, 'PUT', '/api/ulke/portal/form', { ...s, govde: { cevaplar: {}, riza: true } })).status, 400)
    assert.deepEqual((await cagir(rota.hasta, 'PUT', '/api/ulke/portal/form', { ...s, portal: true, govde: { cevaplar: {} } })).govde, { code: 'RIZA_GEREKLI' })
    const k = await cagir(rota.hasta, 'PUT', '/api/ulke/portal/form', { ...s, portal: true, govde: { cevaplar: {}, riza: true } })
    assert.deepEqual([k.status, k.govde.form.durum, k.govde.form.riza.kabul], [200, 'taslak', true])
    // The patient's page says a form is waiting.
    const sayfa = await cagir(rota.portal, 'GET', '/api/ulke/portal', s)
    assert.deepEqual(sayfa.govde.form, { durum: 'taslak', veli: false, gonderildi: null, yenidenAcildi: false })
    // Submitting with the required questions unanswered names them; nothing is submitted.
    const zorunlu = Q.formSorulari(icerik, { rol: null, veli: false, cinsiyet: 'female' }).filter((q) => q.zorunlu).map((q) => q.anahtar)
    const e = await cagir(rota.hasta, 'POST', '/api/ulke/portal/form', { ...s, portal: true, govde: { cevaplar: {} } })
    if (zorunlu.length) { assert.equal(e.status, 400); assert.equal(e.govde.code, 'EKSIK'); for (const z of zorunlu) assert.ok(e.govde.eksik.includes(z)) }
  })
})
