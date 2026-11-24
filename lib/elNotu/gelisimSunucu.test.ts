/**
 * ESNEK-GELISIM — the El Notu improvement loop on the server, against the fake database (lib/security/testing/sahteSupabase.ts):
 * the consent gate (default OFF; nothing enters without it; withdrawal deletes exactly his pages), completion only on the
 * DOCTOR's approval with no identity in the set, CROSS-DOCTOR ISOLATION, the weekly re-read (numbers only, masking proven
 * first, recordings kept for the guard), branş lexicon growth (3 independent doctors, founder/test accounts never count,
 * never-learned excluded, founder decision), the weekly handwriting line, and the founder dashboard route (404 for anyone
 * else). Synthetic QA data only.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-gelisim-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
delete process.env.FOUNDER_EMAILS

let db = new SahteVeritabani()
let rpcSatirlari: Record<string, unknown>[] = []
function sahteCreateClient(_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    storage: c().storage,
    rpc: async (ad: string) => (ad === 'el_notu_kalite_haftalik' ? { data: rpcSatirlari, error: null } : { data: null, error: { message: 'unknown function' } }),
    auth: { getUser: async (jwt?: string) => c().auth.getUser(jwt) },
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}

type Sb = never
let encrypt: (s: string) => string
let reg: typeof import('./regresyon')
let soz: typeof import('./bransSozluk')
let gece: typeof import('@/lib/esnek/gece')
let ornek: typeof import('@/core/elNotu/testing/regresyonOrnek')
let ROTA: Record<string, any>
let NextRequestSinifi: typeof import('next/server').NextRequest

before(async () => {
  ;({ encrypt } = await import('@/lib/security/encryption'))
  reg = await import('./regresyon'); soz = await import('./bransSozluk'); gece = await import('@/lib/esnek/gece')
  ornek = await import('@/core/elNotu/testing/regresyonOrnek')
  ROTA = await import('../../app/api/kurucu/el-notu-kalite/route')
  NextRequestSinifi = (await import('next/server')).NextRequest
})
beforeEach(() => { db = new SahteVeritabani(); rpcSatirlari = []; soz.bransOnbellegiTemizle() })

const KANIT_GECER = () => true
function hekim(harf: string, brans = 'kulak-burun-bogaz', email?: string) {
  const id = randomUUID()
  db.ekle('users', { id, full_name: `QA Hekim ${harf}`, specialty: brans, email: email || `qa-${harf.toLowerCase()}@ornek.test` })
  const hasta = db.ekle('patients', { doctor_id: id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: `Gizem${harf} Sentetik` })) }).id as string
  return { id, hasta, harf }
}
const onayVer = (h: { id: string }, acik: boolean) => db.ekle('esnek_muayene_ayarlari', { doctor_id: h.id, gelistirme_onayi: acik })
const paket = () => ornek.ornekSet()[0].paket
const GORSEL = { mime: 'image/jpeg', base64: 'U0VOVEVUSUstTUFTS0VMSQ==' }

/** A visit: session + hand-note source (one confirmed page) + the draft note linked to it. */
function ziyaret(h: { id: string; hasta: string; harf: string }) {
  const sessionId = db.ekle('sessions', { doctor_id: h.id, patient_id: h.hasta, archived_at: null, duration_seconds: 0 }).id as string
  const noteId = db.ekle('notes', { session_id: sessionId, doctor_id: h.id, patient_id: h.hasta, approved_at: null }).id as string
  const okuma = { sayfalar: [{ sayfa: 1, satirlar: [{ normal: 'KZ doğal' }, { normal: 'Tonsil hipertrofik' }, { normal: 'Septum sağa deviye' }, { normal: 'Odyometri istendi' }], cizimler: [] }] }
  const kaynakId = db.ekle('muayene_kaynaklari', { doctor_id: h.id, patient_id: h.hasta, session_id: sessionId, note_id: noteId, tur: 'el_notu', durum: 'okundu', okuma, acik_dogrula: 0, isleme_anahtari: randomUUID().replace(/-/g, '') }).id as string
  return { sessionId, noteId, kaynakId }
}
const SON = (harf: string) => ({ content_objektif: `KZ doğal. Tonsil hipertrofik. Septum sağa deviye. Hasta Gizem${harf} Sentetik.`, content_plan: 'Odyometri istendi.' })

describe('regression set — consent gate (default OFF)', () => {
  it('without consent (no row, or the default) nothing is stored; with consent the masked package is stored under a random name, no patient id', async () => {
    const A = hekim('A'); const v = ziyaret(A)
    const g = { doktorId: A.id, kaynakId: v.kaynakId, brans: 'kulak-burun-bogaz', paket: paket(), maskeliSayfa: GORSEL, maskeKaniti: KANIT_GECER }
    assert.equal(await reg.regresyonAdayiYaz(db.istemci() as Sb, g), 'onay_yok')
    db.ekle('esnek_muayene_ayarlari', { doctor_id: A.id })
    assert.equal(await reg.regresyonAdayiYaz(db.istemci() as Sb, g), 'onay_yok', 'a settings row without the flag is OFF')
    assert.equal(db.tablo('el_notu_regresyon_sayfalari').length, 0)
    assert.equal(db.depolama.get(reg.REGRESYON_KOVASI)?.size ?? 0, 0)
    db.tablo('esnek_muayene_ayarlari')[0].gelistirme_onayi = true
    assert.equal(await reg.regresyonAdayiYaz(db.istemci() as Sb, { ...g, maskeKaniti: () => false }), 'maske', 'masking not proven → not stored')
    assert.equal(db.tablo('el_notu_regresyon_sayfalari').length, 0)
    assert.equal(await reg.regresyonAdayiYaz(db.istemci() as Sb, g), 'yazildi')
    const [r] = db.tablo('el_notu_regresyon_sayfalari')
    assert.match(r.depo_yolu, /^[0-9a-f-]{36}\.json$/)
    assert.equal(r.durum, 'bekliyor'); assert.equal(r.patient_id, undefined)
    assert.ok(!r.depo_yolu.includes(A.id) && !r.depo_yolu.includes(A.hasta))
    // a retake replaces the pending package (one row, the old object removed)
    assert.equal(await reg.regresyonAdayiYaz(db.istemci() as Sb, g), 'yazildi')
    assert.equal(db.tablo('el_notu_regresyon_sayfalari').length, 1)
    assert.equal(db.depolama.get(reg.REGRESYON_KOVASI)!.size, 1)
  })

  it('completion only on the DOCTOR\'s approval: facts derived, link cut, no name of the patient; a secretary\'s finalization completes nothing', async () => {
    const A = hekim('A'); onayVer(A, true); const v = ziyaret(A)
    await reg.regresyonAdayiYaz(db.istemci() as Sb, { doktorId: A.id, kaynakId: v.kaynakId, brans: 'kulak-burun-bogaz', paket: paket(), maskeliSayfa: GORSEL, maskeKaniti: KANIT_GECER })
    assert.deepEqual(await reg.regresyonuTamamla(db.istemci() as Sb, { doktorId: A.id, noteId: v.noteId, hekim: false, son: SON('A') }), { hazir: 0, silinen: 0 })
    assert.equal(db.tablo('el_notu_regresyon_sayfalari')[0].durum, 'bekliyor')
    const r = await reg.regresyonuTamamla(db.istemci() as Sb, { doktorId: A.id, noteId: v.noteId, hekim: true, son: SON('A') })
    assert.equal(r.hazir, 1)
    const [s] = db.tablo('el_notu_regresyon_sayfalari')
    assert.equal(s.durum, 'hazir'); assert.equal(s.kaynak_id, null)
    assert.ok(s.gercek_sayisi >= 3)
    assert.ok(!/GizemA|Sentetik/.test(JSON.stringify(s.gercekler)), 'the patient\'s name never enters the set')
  })

  it('ISOLATION: doctor B approving with A\'s note id completes nothing of A; B\'s consent never stores A\'s source', async () => {
    const A = hekim('A'); const B = hekim('B'); onayVer(A, true); onayVer(B, true); const v = ziyaret(A)
    await reg.regresyonAdayiYaz(db.istemci() as Sb, { doktorId: A.id, kaynakId: v.kaynakId, brans: null, paket: paket(), maskeliSayfa: GORSEL, maskeKaniti: KANIT_GECER })
    assert.deepEqual(await reg.regresyonuTamamla(db.istemci() as Sb, { doktorId: B.id, noteId: v.noteId, hekim: true, son: SON('A') }), { hazir: 0, silinen: 0 })
    assert.equal(db.tablo('el_notu_regresyon_sayfalari')[0].durum, 'bekliyor')
    // withdrawing B's consent deletes only B's pages
    await reg.regresyonAdayiYaz(db.istemci() as Sb, { doktorId: B.id, kaynakId: ziyaret(B).kaynakId, brans: null, paket: paket(), maskeliSayfa: GORSEL, maskeKaniti: KANIT_GECER })
    assert.equal(await reg.gelistirmeOnayiniGeriCek(db.istemci() as Sb, B.id), 1)
    assert.deepEqual(db.tablo('el_notu_regresyon_sayfalari').map((r) => r.doctor_id), [A.id])
    assert.equal(db.depolama.get(reg.REGRESYON_KOVASI)!.size, 1)
  })

  it('consent withdrawn before the approval → the pending page is deleted, not completed', async () => {
    const A = hekim('A'); const ayar = onayVer(A, true); const v = ziyaret(A)
    await reg.regresyonAdayiYaz(db.istemci() as Sb, { doktorId: A.id, kaynakId: v.kaynakId, brans: null, paket: paket(), maskeliSayfa: GORSEL, maskeKaniti: KANIT_GECER })
    ayar.gelistirme_onayi = false
    assert.deepEqual(await reg.regresyonuTamamla(db.istemci() as Sb, { doktorId: A.id, noteId: v.noteId, hekim: true, son: SON('A') }), { hazir: 0, silinen: 1 })
    assert.equal(db.tablo('el_notu_regresyon_sayfalari').length, 0)
    assert.equal(db.depolama.get(reg.REGRESYON_KOVASI)!.size, 0)
  })
})

describe('regression set — weekly re-read', () => {
  it('numbers only, the masking proven before any model call, recordings kept for the guard; a page is read once per week', async () => {
    const sb = db.istemci() as never as import('@supabase/supabase-js').SupabaseClient
    const set = ornek.ornekSet()
    for (const s of set) {
      const yol = `${randomUUID()}.json`
      await (sb as any).storage.from(reg.REGRESYON_KOVASI).upload(yol, Buffer.from(JSON.stringify({ paket: s.paket, maskeliSayfa: s.maskeliSayfa })))
      db.ekle('el_notu_regresyon_sayfalari', { doctor_id: randomUUID(), kaynak_id: null, sayfa: 1, brans: s.brans, depo_yolu: yol, gercekler: s.gercekler, gercek_sayisi: 3, durum: 'hazir', hazir_at: new Date().toISOString() })
    }
    let cagri = 0, sira = 0
    const adlar = set.map((s) => s.ad)
    const girdi = (kanit: boolean) => ({
      butceMs: 60_000, surum: 'abcdef1234', maskeKaniti: () => kanit, ortam: ornek.ornekOrtam(),
      // one model per page, in the set's order (the synthetic "production model" answers by page)
      model: () => { const m = ornek.canliModel(adlar[sira++ % adlar.length]); return { async gorselJson(o: any) { cagri++; return m.gorselJson(o) }, metinJson: (o: any) => m.metinJson(o) } as never },
    })
    const kotu = await reg.haftalikRegresyon(sb, { ...girdi(false), simdi: new Date('2026-11-23T02:00:00Z') })
    assert.deepEqual({ olculen: kotu.olculen, hata: kotu.hata }, { olculen: 0, hata: 2 })
    assert.equal(cagri, 0, 'no model call when the masking is not proven')
    assert.ok(db.tablo('el_notu_regresyon_olcumleri').every((r) => r.hata === 'maske'))
    const r = await reg.haftalikRegresyon(sb, { ...girdi(true), simdi: new Date('2026-11-30T02:00:00Z') })
    assert.equal(r.hafta, '2026-11-30'); assert.equal(r.olculen, 2)
    const olcum = db.tablo('el_notu_regresyon_olcumleri').filter((x) => x.hafta === '2026-11-30')
    assert.equal(olcum.length, 2)
    const izinli = new Set(['id', 'created_at', 'hafta', 'sayfa_id', 'brans', 'okuyucu_surumu', 'ms', 'gercek', 'kesin', 'dogrulamada', 'adayda', 'isaretli', 'kacan', 'dogrula', 'korumali_soru', 'korumali_gercek', 'korumali_dogrula_ile', 'uydurma', 'hata'])
    for (const o of olcum) for (const k of Object.keys(o)) assert.ok(izinli.has(k), `metric column ${k}`)
    assert.ok(olcum.every((o) => typeof o.gercek === 'number' && o.gercek === 3))
    const kayitlar = [...db.depolama.get(reg.REGRESYON_KOVASI)!.keys()].filter((k) => k.startsWith('kayit/'))
    assert.equal(kayitlar.length, 2)
    const once = cagri
    const tekrar = await reg.haftalikRegresyon(sb, { ...girdi(true), simdi: new Date('2026-12-01T02:00:00Z') })
    assert.equal(tekrar.olculen, 0); assert.equal(cagri, once, 'the same week is not read twice')
    const oz = await reg.regresyonOzeti(sb, 520)
    const h = oz.haftalar.find((x) => x.hafta === '2026-11-30')!
    assert.equal(h.sayfa, 2); assert.equal(h.toplam.gercek, 6)
    assert.equal(oz.set.hazir, 2)
  })
})

describe('branş lexicon growth on the server', () => {
  const ekle = (h: { id: string }, kisaltma: string, anlam: string, kaynak = 'dogrulama', brans: string | null = 'kardiyoloji') =>
    db.ekle('hekim_el_sozlugu', { doctor_id: h.id, kisaltma, kisaltma_anahtar: kisaltma.toLocaleLowerCase('tr'), anlam, kaynak, brans })

  it('3 independent doctors of the branş → one proposal (pair + count only); founder / test accounts never count; never-learned excluded', async () => {
    const [A, B, C] = ['A', 'B', 'C'].map((x) => hekim(x, 'kardiyoloji'))
    const kaan = hekim('K', 'kardiyoloji', 'kaanari@mac.com')
    for (const h of [A, B, kaan]) { ekle(h, 'PAH', 'pulmoner arter hipertansiyonu'); ekle(h, 'sğ', 'sağ') }
    const sb = db.istemci() as Sb
    assert.equal((await soz.bransOnerileriniGuncelle(sb)).oneri, 0, 'the test account is not a third doctor')
    ekle(C, 'PAH', 'pulmoner arter hipertansiyonu', 'elle', null) // an older row: the doctor's registered branş
    ekle(C, 'sğ', 'sağ')
    assert.deepEqual((await soz.bransOnerileriniGuncelle(sb)).yeni, 1)
    const rows = db.tablo('brans_sozluk_onerileri')
    assert.equal(rows.length, 1)
    assert.deepEqual({ brans: rows[0].brans, kisaltma: rows[0].kisaltma, anlam: rows[0].anlam, n: rows[0].doktor_sayisi, durum: rows[0].durum }, { brans: 'kardiyoloji', kisaltma: 'PAH', anlam: 'pulmoner arter hipertansiyonu', n: 3, durum: 'oneri' })
    for (const k of Object.keys(rows[0])) assert.ok(!['doctor_id', 'patient_id'].includes(k))
    // an "ice_aktarim" (imported) entry is not an independent confirmation
    db.tablo('hekim_el_sozlugu').filter((r) => r.doctor_id === C.id && r.kisaltma === 'PAH')[0].kaynak = 'ice_aktarim'
    assert.equal((await soz.bransOnerileriniGuncelle(sb)).silinen, 1, 'support fell below 3 → the undecided proposal is withdrawn')
  })

  it('the founder\'s approval feeds every reader of the branş; a second meaning is refused; a decided row is never reopened by the night run', async () => {
    const hs = ['A', 'B', 'C'].map((x) => hekim(x, 'kardiyoloji'))
    for (const h of hs) { ekle(h, 'PAH', 'pulmoner arter hipertansiyonu'); ekle(h, 'Pah', 'periyodik akut hipotansiyon') }
    const sb = db.istemci() as Sb
    await soz.bransOnerileriniGuncelle(sb)
    const [p1, p2] = db.tablo('brans_sozluk_onerileri').sort((a, b) => a.anlam.localeCompare(b.anlam))
    assert.deepEqual(await soz.bransOneriKarari(sb, { id: 'x', karar: 'onayli', userId: 'u' }), { hata: 'invalid id', durum: 400 })
    assert.deepEqual(await soz.bransOneriKarari(sb, { id: p2.id, karar: 'onayli', userId: 'u' }), { ok: true })
    assert.equal((await soz.bransOneriKarari(sb, { id: p1.id, karar: 'onayli', userId: 'u' }) as { durum: number }).durum, 409)
    const t = await soz.bransTohumu(sb, 'kardiyoloji')
    assert.ok(t.brans.some((x) => x.kisaltma === 'PAH' && x.anlam === 'pulmoner arter hipertansiyonu'))
    assert.equal((await soz.bransTohumu(sb, 'nefroloji')).brans.length, 0, 'another branş is untouched')
    for (const h of hs) db.tablo('hekim_el_sozlugu').filter((r) => r.doctor_id === h.id).forEach((r) => { r.kaynak = 'ice_aktarim' })
    await soz.bransOnerileriniGuncelle(sb)
    assert.equal(db.tablo('brans_sozluk_onerileri').find((r) => r.id === p2.id)?.durum, 'onayli', 'the founder\'s decision stays')
  })
})

describe('"Bu hafta öğrendiklerim" — handwriting', () => {
  it('counts words confirmed this week that his memory did not hold before (protected readings excluded) and his new abbreviations — his own rows only', async () => {
    const A = hekim('A'); const B = hekim('B')
    const eski = new Date(Date.now() - 20 * 86400000).toISOString()
    const hafiza = (h: { id: string }, metin: string, created_at = new Date().toISOString(), korumali = false) => db.ekle('hekim_el_yazisi_hafizasi', { doctor_id: h.id, metin, created_at, korumali })
    hafiza(A, 'tonsil', eski)
    for (const w of ['tonsil', 'hipertrofik', 'septum deviasyonu', 'odyometri']) hafiza(A, w)
    hafiza(A, 'sağ', undefined, true)
    for (const w of ['kalp', 'üfürüm', 'ritmik']) hafiza(B, w)
    db.ekle('hekim_el_sozlugu', { doctor_id: A.id, kisaltma: 'KZ2', kisaltma_anahtar: 'kz2', anlam: 'kulak zarı', kaynak: 'dogrulama', created_at: new Date().toISOString() })
    db.ekle('hekim_el_sozlugu', { doctor_id: A.id, kisaltma: 'SD2', kisaltma_anahtar: 'sd2', anlam: 'x', kaynak: 'dogrulama', created_at: eski })
    assert.deepEqual(await gece.haftalikElYazisi(db.istemci() as Sb, A.id), { kelime: 4, kisaltma: 1 })
    const { ESNEK_TR } = await import('@/core/esnek/metinTr')
    assert.equal(ESNEK_TR.ogrenme.elYazisiKelime(14), 'Yazınızdan 14 yeni kelime öğrendim.')
  })
})

describe('founder dashboard route', () => {
  it('404 for no token, a bad token or any other account (GET and POST); 200 numbers-only for the founder', async () => {
    const istek = (yontem: string, token?: string, govde?: unknown) => new NextRequestSinifi('http://localhost/api/kurucu/el-notu-kalite', { method: yontem, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' }, ...(govde ? { body: JSON.stringify(govde) } : {}) })
    db.kullanicilar.set('qa-baska', { id: randomUUID(), email: 'baska@ornek.test' })
    db.kullanicilar.set('qa-kurucu', { id: randomUUID(), email: 'kaan@notya.io' })
    for (const t of [undefined, 'yok', 'qa-baska']) {
      assert.equal((await ROTA.GET(istek('GET', t))).status, 404, String(t))
      assert.equal((await ROTA.POST(istek('POST', t, { id: randomUUID(), karar: 'onayli' }))).status, 404, String(t))
    }
    const A = hekim('A'); hekim('K', 'kardiyoloji', 'kaanari@mac.com')
    const hafta = (await import('@/core/elNotu/regresyonSeti')).haftaBasi(new Date())
    rpcSatirlari = [{ doctor_id: A.id, hafta, sayfa: 4, dogrula: 8, kelime: 100, kabul: 80, onayli_not: 2, duzeltme: 1, golge: 0, golge_ayni: 0, dok_ms: 0, dok_hasta: 0 }]
    const y = await ROTA.GET(istek('GET', 'qa-kurucu'))
    assert.equal(y.status, 200)
    const j = await y.json()
    assert.equal(j.toplam.at(-1).dogrulaSayfaBasina, 2)
    assert.equal(j.doktorlar[0].ad, 'QA Hekim A')
    assert.ok(!JSON.stringify(j).includes(A.id) && !JSON.stringify(j).includes(A.hasta), 'no doctor or patient id leaves')
    const bad = await ROTA.POST(istek('POST', 'qa-kurucu', { id: 'x', karar: 'onayli' }))
    assert.equal(bad.status, 400)
  })
})
