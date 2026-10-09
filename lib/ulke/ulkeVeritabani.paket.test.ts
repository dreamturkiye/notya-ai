/**
 * NOTYA-ULKE-SABLON-01 — THE SECOND WALL: THE COUNTRY ON EVERY ROW. Since 2026-10-09 every country has a DATABASE OF ITS
 * OWN (Kaan: "We had issues with common databases before. Keep seperation between the two and any other future
 * country versions"); that is the first wall, and it is a setting of each deployment. What this file proves was
 * written when every country was going to share one database, and all of it is kept: even inside one database no
 * row of one country can be reached from another. Runs ONCE PER PACK (scripts/ulke-test.mjs sets NOTYA_COUNTRY
 * to each folder under countries/ in turn), so it is always exercised for at least two different country codes, and a
 * new country gets it without anyone writing a test.
 *
 * Kaan, 2026-10-08: "use the same database as what we are using for notya turkiye". What that must never cost:
 *
 *   1. WALL. Country code reaches the database through ONE door (lib/ulke/uygulama/tablolar.ts) and touches country
 *      tables only — never a table Türkiye uses.
 *   2. BINDING. Through that door every statement is bound to the build's own country. A row of ANOTHER country is
 *      not read, not changed and not removed, even with a valid id and even when the doctor's id matches; a row
 *      cannot be written for another country, nor moved to one.
 *   3. THE LIBRARY on top of the door behaves the same: patients, visits, notes, appointments, roles, language
 *      choices, the working pattern and note approval do not see or change another country's rows.
 *   4. STORAGE. A recording lies under `<country>/<account id>/`; a path under another country's folder is refused.
 *   5. ACCOUNTS. An account belongs to one country: the build refuses a session stamped with another country, and an
 *      account whose row belongs to another country.
 *   6. THE MIGRATIONS say the same in SQL: every country table has `ulke` with no default, the country in its
 *      foreign key, row-level security bound to the session's country; none of them touches a table of Türkiye.
 *
 * The database is the stand-in (lib/ulke/testing/sahteVeritabani.ts), which THROWS on any statement that reaches a
 * country table without the country. The real PostgreSQL proof of the keys and row-level rules is
 * scripts/ulke-goc-kaniti.mjs. Synthetic data only.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ENCRYPTION_MASTER_KEY = 'yalniz-test-icin-sentetik-anahtar-0001'

import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ORTAK_ALTYAPI_TABLOLARI, sahteVeritabani } from '@/lib/ulke/testing/sahteVeritabani'

const KOK = resolve(__dirname, '../..')
/** The country migrations, in order: the one list every script and test reads (lib/db/ulke/gocler.json). */
const GOCLER = (JSON.parse(readFileSync(join(KOK, 'lib/db/ulke/gocler.json'), 'utf8')) as { gocler: string[] }).gocler
const vt = sahteVeritabani()
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: vt.createClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`this test may not use the network: ${String(g)}`) }) as typeof fetch

type Sb = Parameters<typeof import('./uygulama/tablolar').ulkeTablosu>[0]
let T: typeof import('./uygulama/tablolar')
let BU = ''
/** Two countries that are not this build's. One of them is always a real pack's code. */
let YABANCI: string[] = []
const sb = () => vt.createClient() as unknown as Sb

const D = '10000000-0000-4000-8000-00000000000a' // one doctor id, used for the rows of EVERY country on purpose
const TURKIYE_TABLOLARI = ['users', 'patients', 'sessions', 'notes', 'ai_kullanim', 'randevular', 'doktor_calisma_saatleri']

function sifirla() {
  for (const k of Object.keys(vt.tablolar)) delete vt.tablolar[k]
  for (const k of Object.keys(vt.hesaplar)) delete vt.hesaplar[k]
  vt.sorgular.length = 0; vt.islevCagrilari.length = 0; vt.depo.clear()
  vt.boz.yaz.clear(); vt.boz.oku.clear()
}

before(async () => {
  T = await import('./uygulama/tablolar')
  BU = (await import('./ulke')).aktifUlke()
  YABANCI = ['tr', 'uz', 'zz'].filter((k) => k !== BU).slice(0, 2)
})
beforeEach(sifirla)

describe('shared database — the door: country tables only, and one door', () => {
  it('the list of country tables holds no table of Türkiye, and every name is a country table by its migration', () => {
    const sql = GOCLER.map((f) => readFileSync(join(KOK, 'lib/db/migrations', f), 'utf8')).join('\n')
    for (const t of T.ULKE_TABLOLARI) {
      assert.ok(!TURKIYE_TABLOLARI.includes(t), `${t} is a table of Türkiye`)
      assert.match(sql, new RegExp(`create table if not exists public\\.${t} \\(`), `${t}: no migration from 129 on creates it`)
    }
    assert.throws(() => T.ulkeTablosu(sb(), 'patients' as never), /not a country table/)
    assert.throws(() => T.ulkeTablosu(sb(), 'users' as never), /not a country table/)
    assert.throws(() => T.ulkeIslevi(sb(), 'exec_sql' as never, {}), /not a country function/)
  })

  it('no country code reaches the database past the door: no .from( and no .rpc( outside lib/ulke/uygulama/tablolar.ts', () => {
    const ATLA = new Set(['node_modules', '.next', 'testing'])
    const dosyalar: string[] = []
    const gez = (d: string) => {
      if (!existsSync(d)) return
      for (const ad of readdirSync(d)) {
        if (ATLA.has(ad)) continue
        const yol = join(d, ad)
        if (statSync(yol).isDirectory()) gez(yol)
        else if (/\.(ts|tsx|mjs)$/.test(ad) && !/\.test\.tsx?$/.test(ad)) dosyalar.push(yol)
      }
    }
    // Everything a country build is made of: the shared country code, every pack, and every *.ulke.* route.
    for (const d of ['lib/ulke', 'components/ulke', 'countries']) gez(join(KOK, d))
    const rotalar: string[] = []
    const rotaGez = (d: string) => { for (const ad of readdirSync(d)) { const yol = join(d, ad); if (statSync(yol).isDirectory()) rotaGez(yol); else if (/\.ulke\.tsx?$/.test(ad)) rotalar.push(yol) } }
    rotaGez(join(KOK, 'app')); rotalar.push(join(KOK, 'middleware.ulke.ts'))
    const goreli = (p: string) => relative(KOK, p).split(sep).join('/')
    // The Turkish application's own country stamp (app/api/users/profile, a pre-split route) writes Türkiye's `users`.
    // It is not part of any country build: nothing a country build is made of may import it.
    const TURKIYE_TARAFI = ['lib/ulke/hesapDamga.ts', 'countries/tr/']
    const ihlaller: string[] = []
    for (const yol of [...dosyalar, ...rotalar]) {
      const g = goreli(yol)
      const kaynak = readFileSync(yol, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
      if (/hesapDamga/.test(kaynak) && g !== 'lib/ulke/hesapDamga.ts') ihlaller.push(`${g}: imports the Turkish application's stamp helper`)
      if (g === 'lib/ulke/uygulama/tablolar.ts' || TURKIYE_TARAFI.some((t) => g.startsWith(t))) continue
      for (const m of kaynak.matchAll(/\.from\(\s*([^)]*)\)/g)) {
        const onceki = kaynak.slice(Math.max(0, m.index! - 8), m.index!)
        if (/storage$/.test(onceki) || /Array$/.test(onceki) || /Object$/.test(onceki) || /Buffer$/.test(onceki)) continue
        ihlaller.push(`${g}: .from(${m[1]}) — use ulkeTablosu`)
      }
      if (/\.rpc\(/.test(kaynak)) ihlaller.push(`${g}: .rpc( — use ulkeIslevi`)
      for (const t of TURKIYE_TABLOLARI) if (new RegExp(`ulkeTablosu\\([^,]+,\\s*'${t}'\\)`).test(kaynak)) ihlaller.push(`${g}: names Türkiye's table ${t}`)
    }
    assert.deepEqual(ihlaller, [])
    assert.ok(dosyalar.length > 40 && rotalar.length > 20, `the scan found too few files (${dosyalar.length}, ${rotalar.length}) — it is looking in the wrong place`)
  })

  it('the one table of Türkiye a country build writes to is the model gateway\'s usage log, and the list says so', () => {
    assert.deepEqual([...ORTAK_ALTYAPI_TABLOLARI], ['ai_token_kullanim'])
    assert.match(readFileSync(join(KOK, 'lib/ai/kullanim.ts'), 'utf8'), /from\('ai_token_kullanim'\)\.insert/)
  })
})

describe('shared database — binding: a row of another country is not read, changed, removed or written', () => {
  /** One row of this build's country and one of each foreign country in EVERY country table, all for the same doctor. */
  const KIMLIK: Record<string, string> = { ulke_hesaplari: 'id', hekim_dil_tercihleri: 'doctor_id', hekim_rolu: 'doctor_id', hekim_calisma_duzeni: 'doctor_id', hasta_ulke_bilgisi: 'patient_id', muayene_dil_kaydi: 'session_id', not_dil_kaydi: 'note_id', ulke_kullanim: 'kova', ulke_kullanim_olcumu: 'gorev' }
  const anahtar = (t: string) => KIMLIK[t] ?? 'id'
  // Where the key IS the account (one row per account), the "valid id" of the foreign row is the doctor's id itself.
  const kimlik = (t: string, ulke: string) => (anahtar(t) === 'doctor_id' ? D : `${t}-${ulke}`)
  const doldur = () => {
    for (const t of T.ULKE_TABLOLARI) for (const ulke of [BU, ...YABANCI]) vt.tablo(t).push({ doctor_id: D, [anahtar(t)]: kimlik(t, ulke), ulke, isaret: `asl-${ulke}` })
  }
  const yabancilar = () => JSON.stringify(Object.fromEntries(T.ULKE_TABLOLARI.map((t) => [t, vt.tablo(t).filter((s) => s.ulke !== BU)])))

  it('SELECT: with a valid id and the same doctor id, only this country\'s row comes back — from every table', async () => {
    doldur()
    for (const t of T.ULKE_TABLOLARI) {
      const { data: hepsi } = await T.ulkeTablosu(sb(), t).select('*').eq('doctor_id', D)
      assert.deepEqual((hepsi as unknown as { ulke: string }[]).map((s) => s.ulke), [BU], `${t}: a list by doctor returned another country's row`)
      for (const ulke of YABANCI) {
        const { data } = await T.ulkeTablosu(sb(), t).select('*').eq(anahtar(t), kimlik(t, ulke)).eq('doctor_id', D).maybeSingle()
        // Where the key is the account itself, the same id is also this build's own row: that one, never the foreign one.
        const beklenen = anahtar(t) === 'doctor_id' ? `asl-${BU}` : undefined
        assert.equal((data as unknown as { isaret: string } | null)?.isaret, beklenen, `${t}: the ${ulke} row was read by its id from a ${BU} build`)
      }
      const { data: kendi } = await T.ulkeTablosu(sb(), t).select('*').eq(anahtar(t), kimlik(t, BU)).maybeSingle()
      assert.equal((kendi as unknown as { isaret: string } | null)?.isaret, `asl-${BU}`, `${t}: positive control — the build's own row must be found`)
    }
  })

  it('UPDATE and DELETE: aimed at another country\'s row by its id, they change nothing', async () => {
    doldur()
    const once = yabancilar()
    for (const t of T.ULKE_TABLOLARI) {
      for (const ulke of YABANCI) {
        const { data: degisen } = await T.ulkeTablosu(sb(), t).update({ isaret: 'EZILDI' }).eq(anahtar(t), kimlik(t, ulke)).eq('doctor_id', D).select('*')
        // Where the key is the account itself the same id is also this build's own row (until the delete below removes
        // it): whatever changed, it was never a row of another country.
        const degisenUlkeler = (degisen as unknown as { ulke: string }[]).map((x) => x.ulke)
        if (anahtar(t) === 'doctor_id') assert.ok(degisenUlkeler.every((u) => u === BU), `${t}: an update reached the ${ulke} row`)
        else assert.deepEqual(degisenUlkeler, [], `${t}: an update reached the ${ulke} row`)
        await T.ulkeTablosu(sb(), t).delete().eq(anahtar(t), kimlik(t, ulke)).eq('doctor_id', D)
      }
      // Without any id at all: a statement by doctor alone still stays inside the country.
      await T.ulkeTablosu(sb(), t).update({ isaret: 'TOPLU' }).eq('doctor_id', D)
      await T.ulkeTablosu(sb(), t).delete().eq('doctor_id', D)
      assert.deepEqual(vt.tablo(t).map((s) => s.ulke).sort(), [...YABANCI].sort(), `${t}: after deleting "everything of this doctor", exactly the other countries' rows remain`)
    }
    assert.equal(yabancilar(), once, 'a row of another country changed')
  })

  it('INSERT and UPSERT: the row is stamped with this build\'s country whatever the caller passes; an update cannot move a row', async () => {
    for (const t of T.ULKE_TABLOLARI) {
      await T.ulkeTablosu(sb(), t).insert({ doctor_id: D, [anahtar(t)]: `yeni-${t}`, ulke: YABANCI[0] })
      await T.ulkeTablosu(sb(), t).upsert({ doctor_id: D, [anahtar(t)]: `yeni2-${t}`, ulke: YABANCI[1] }, { onConflict: anahtar(t) })
      assert.deepEqual(vt.tablo(t).map((s) => s.ulke), [BU, BU], `${t}: a row was written for another country`)
      await T.ulkeTablosu(sb(), t).update({ ulke: YABANCI[0], isaret: 'x' }).eq(anahtar(t), `yeni-${t}`)
      assert.deepEqual(vt.tablo(t).map((s) => [s.ulke, s.isaret ?? null]), [[BU, 'x'], [BU, null]], `${t}: an update moved a row to another country`)
    }
    // Every statement the stand-in saw named this build's country — and it throws on one that names none.
    assert.ok(vt.sorgular.length >= T.ULKE_TABLOLARI.length * 3)
    assert.deepEqual([...new Set(vt.sorgular.map((q) => q.ulke))], [BU])
  })

  it('the stand-in itself refuses a statement without the country (so no other test can pass without it)', async () => {
    const ham = vt.createClient()
    await assert.rejects(async () => { await ham.from('ulke_hastalar').select('*').eq('doctor_id', D) }, /without a country filter/)
    await assert.rejects(async () => { await ham.from('ulke_hastalar').insert({ doctor_id: D }) }, /without the country/)
    await assert.rejects(async () => { await ham.from('ulke_hastalar').update({ ulke: BU }).eq('ulke', BU).eq('doctor_id', D) }, /rewrites the country/)
    await assert.rejects(async () => ham.rpc('ulke_not_onayla', { p_note_id: 'x' }), /without the country/)
  })

  it('FUNCTIONS: p_ulke is this build\'s country and cannot be passed in', async () => {
    vt.tablo('ulke_notlar').push({ id: 'n-yabanci', ulke: YABANCI[0], doctor_id: D, session_id: 's', approved_at: null, content_plan: 'asl' })
    const { data } = await T.ulkeIslevi(sb(), 'ulke_not_onayla', { p_ulke: YABANCI[0], p_note_id: 'n-yabanci', p_doctor_id: D, p_onay_ani: '2026-10-08T10:00:00Z', p_s: 'S', p_o: 'O', p_a: 'A', p_p: 'EZILDI', p_dil_kaydi: null })
    assert.equal(data, 'NOT_FOUND')
    assert.deepEqual(vt.islevCagrilari.map((c) => c.arg.p_ulke), [BU])
    assert.deepEqual([vt.tablo('ulke_notlar')[0].approved_at, vt.tablo('ulke_notlar')[0].content_plan], [null, 'asl'])
  })
})

describe('shared database — the library: another country\'s patients, visits, notes and appointments do not exist here', () => {
  const H = '30000000-0000-4000-8000-000000000001', S = '40000000-0000-4000-8000-000000000001', N = '50000000-0000-4000-8000-000000000001', R = '60000000-0000-4000-8000-000000000001'
  /** A complete clinical record of ANOTHER country, for the same doctor id, with ids the caller knows. */
  const yabanciKayit = (ulke: string) => {
    const simdi = new Date().toISOString()
    vt.tablo('ulke_hesaplari').push({ id: D, ulke, full_name: 'QA Foreign Account', ui_language: 'ru' })
    vt.tablo('hekim_dil_tercihleri').push({ doctor_id: D, ulke, not_dili: 'ru', soruldu_at: simdi })
    vt.tablo('hekim_rolu').push({ doctor_id: D, ulke, rol: 'pediatri' })
    vt.tablo('hekim_calisma_duzeni').push({ doctor_id: D, ulke, gunler: [6, 7], baslangic_dk: 60, bitis_dk: 120, sure_dk: 30, molalar: [] })
    vt.tablo('ulke_hastalar').push({ id: H, ulke, doctor_id: D, name_encrypted: 'x', created_at: simdi })
    vt.tablo('hasta_ulke_bilgisi').push({ patient_id: H, ulke, doctor_id: D, dil: 'ru' })
    vt.tablo('ulke_muayeneler').push({ id: S, ulke, doctor_id: D, patient_id: H, started_at: simdi, created_at: simdi, specialty: 'pediatri', transcript_cleaned: 'QA FOREIGN TRANSCRIPT' })
    vt.tablo('muayene_dil_kaydi').push({ session_id: S, ulke, doctor_id: D, patient_id: H, not_dili: 'ru', sablon: 'pediatri' })
    vt.tablo('ulke_notlar').push({ id: N, ulke, doctor_id: D, session_id: S, approved_at: null, content_subjektif: 'QA FOREIGN NOTE', content_objektif: '', content_degerlendirme: '', content_plan: '' })
    vt.tablo('not_dil_kaydi').push({ note_id: N, ulke, doctor_id: D, patient_id: H, not_dili: 'ru', ikinci_dil: null })
    vt.tablo('ulke_randevulari').push({ id: R, ulke, doctor_id: D, patient_id: H, baslangic: simdi, bitis: new Date(Date.now() + 1_800_000).toISOString(), durum: 'planlandi', session_id: null, neden_encrypted: null, mesai_disi: false })
    vt.tablo('ulke_kullanim').push({ ulke, doctor_id: D, gun: '2026-10-08', kova: 'soap', sayac: 9999 })
  }

  it('reads: every list is empty and every id is "not found"', async () => {
    yabanciKayit(YABANCI[0])
    const once = JSON.stringify(vt.tablolar)
    const hastalar = await import('./uygulama/hastalar')
    const muayeneler = await import('./uygulama/muayeneler')
    const kayit = await import('./uygulama/muayeneKaydi')
    const notlar = await import('./uygulama/notlar')
    const randevular = await import('./uygulama/randevular')
    const rol = await import('./uygulama/rol')
    const dil = await import('./uygulama/dilTercihleri')
    const s = sb()
    assert.equal(await hastalar.hastaGetir(s, D, H), null)
    assert.deepEqual(await hastalar.hastalariListele(s, D), [])
    assert.deepEqual([...(await hastalar.hastaAdlari(s, D, [H]))], [])
    assert.deepEqual(await muayeneler.bugunkuMuayeneler(s, D), [])
    assert.deepEqual(await muayeneler.hastaninMuayeneleri(s, D, H), [])
    assert.equal(await kayit.muayeneGetir(s, D, S), null)
    assert.equal(await notlar.notGetir(s, D, N), null)
    assert.equal(await randevular.randevuGetir(s, D, R), null)
    assert.deepEqual(await randevular.hastaninRandevulari(s, D, H), [])
    assert.equal(await randevular.randevuMuayeneyeUygun(s, D, R, H), false)
    assert.equal(await rol.hekimRolunuOku(s, D), null)
    assert.equal((await dil.dilTercihleriniOku(s, D, null)).soruldu, false)
    assert.equal(JSON.stringify(vt.tablolar), once, 'a read changed a row')
    assert.doesNotMatch(JSON.stringify(vt.sorgular.map((q) => q.ulke)), new RegExp(`"${YABANCI[0]}"`))
  })

  it('writes: saving, approving, rewriting, moving, cancelling, linking — all "not found", nothing changed', async () => {
    yabanciKayit(YABANCI[0])
    const once = JSON.stringify(vt.tablolar)
    const notlar = await import('./uygulama/notlar')
    const randevular = await import('./uygulama/randevular')
    const s = sb()
    const icerik = { s: 'EZILDI', o: 'EZILDI', a: 'EZILDI', p: 'EZILDI' }
    assert.deepEqual(await notlar.notKaydet(s, D, N, 'ru', icerik), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await notlar.notOnayla(s, D, N, 'ru', icerik), { tamam: false, kod: 'NOT_FOUND' })
    // (a country without a clinical half answers "not ready" before it looks; either way nothing is touched)
    assert.equal((await notlar.notYenidenYaz(s, D, N)).tamam, false)
    assert.equal((await notlar.notYaz(s, D, S)).tamam, false)
    assert.deepEqual(await randevular.randevuDurumDegistir(s, D, R, 'iptal'), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await randevular.randevuTasi(s, D, R, { gun: '2027-01-04', saatDk: 600, sureDk: 30, yineDe: true }), { tamam: false, kod: 'NOT_FOUND' })
    assert.deepEqual(await randevular.randevuOlustur(s, D, { hastaId: H, neden: '', gun: '2027-01-04', saatDk: 600, sureDk: 30, yineDe: true }), { tamam: false, kod: 'NOT_FOUND' })
    assert.equal(await randevular.randevuyuMuayeneyeBagla(s, D, R, H, S), false)
    assert.equal(JSON.stringify(vt.tablolar), once, 'a write reached another country\'s row')
  })

  it('the daily counter of another country is not this build\'s counter', async () => {
    yabanciKayit(YABANCI[0])
    const { muayeneKotasiKullan } = await import('./uygulama/kota')
    assert.equal(await muayeneKotasiKullan(sb(), D, 200), true, 'the foreign counter (9999) must not count here')
    assert.deepEqual(vt.tablo('ulke_kullanim').map((k) => [k.ulke, k.sayac]).sort(), [[BU, 1], [YABANCI[0], 9999]].sort())
  })
})

describe('shared database — storage: recordings are kept apart per country', () => {
  it('the folder is <country>/<account id>; any other country, no country, or a climb is refused as text', () => {
    assert.equal(T.sesKlasoru(D), `${BU}/${D}`)
    assert.equal(T.sesYoluGecerli(D, `${BU}/${D}/kayit-1.webm`), true)
    for (const yol of [
      ...YABANCI.map((u) => `${u}/${D}/kayit-1.webm`),
      `${D}/kayit-1.webm`, `/${BU}/${D}/kayit-1.webm`, `${BU.toUpperCase()}/${D}/kayit-1.webm`,
      `${BU}/../${YABANCI[0]}/${D}/kayit-1.webm`, `${BU}/${D}/../../${YABANCI[0]}/${D}/kayit-1.webm`, `${BU}/${D}/alt/kayit-1.webm`,
      `${BU}/10000000-0000-4000-8000-00000000000b/kayit-1.webm`, `${BU}/${D}/`, `${BU}/${D}`, '', null, 7,
    ]) assert.equal(T.sesYoluGecerli(D, yol), false, String(yol))
  })

  it('the upload rule of the bucket checks the country folder against the session\'s country, then the account folder', () => {
    const sql = readFileSync(join(KOK, 'lib/db/migrations/132_muayene_dil_kaydi.sql'), 'utf8')
    const kural = sql.slice(sql.indexOf('create policy "muayene_sesleri_ulke_ve_kendi_klasorune_yukle"'), sql.indexOf('insert into schema_migrations'))
    assert.match(kural, /for insert to authenticated/)
    assert.match(kural, /bucket_id = 'muayene-sesleri'/)
    assert.match(kural, /public\.ulke_oturum_ulkesi\(\) <> ''/, 'an account without a country stamp (every account of Türkiye) must not be able to upload')
    assert.match(kural, /\(storage\.foldername\(name\)\)\[1\] = public\.ulke_oturum_ulkesi\(\)/)
    assert.match(kural, /\(storage\.foldername\(name\)\)\[2\] = auth\.uid\(\)::text/)
    // Created only when missing: a second run takes no lock on storage.objects, a table Türkiye uses.
    assert.match(sql, /if not exists \(select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'muayene_sesleri_ulke_ve_kendi_klasorune_yukle'\)/)
    assert.doesNotMatch(sql.replace(/--[^\n]*/g, ''), /drop policy[^;]*on storage\.objects/i)
  })
})

describe('shared database — accounts: one country per account', () => {
  it('a session stamped with another country is no session; an account row of another country is refused', async () => {
    const { hesapBuUlkedeMi } = await import('./hesapUlkesi')
    assert.equal(hesapBuUlkedeMi({ app_metadata: { country: BU } }), true)
    for (const u of YABANCI) assert.equal(hesapBuUlkedeMi({ app_metadata: { country: u } }), false, u)
    const { NextRequest } = await import('next/server')
    const rota = await import('../../app/api/ulke/hesap/route.ulke')
    const iste = (jeton: string) => rota.GET(new NextRequest('https://notya.test/api/ulke/hesap', { headers: { authorization: `Bearer ${jeton}` } }))
    const E = '10000000-0000-4000-8000-0000000000e1', F = '10000000-0000-4000-8000-0000000000f1', G = '10000000-0000-4000-8000-0000000000a1'
    Object.assign(vt.hesaplar, {
      'jeton-yabanci': { id: E, email: 'qa-e@notya.test', app_metadata: { country: YABANCI[0] } },
      // Stamped for THIS country on the session, but its row says another country (cannot happen through sign-up).
      'jeton-satir-yabanci': { id: F, email: 'qa-f@notya.test', app_metadata: { country: BU } },
      'jeton-kendi': { id: G, email: 'qa-g@notya.test', app_metadata: { country: BU } },
    })
    vt.tablo('ulke_hesaplari').push({ id: E, ulke: YABANCI[0], full_name: 'QA E', ui_language: 'ru' }, { id: F, ulke: YABANCI[0], full_name: 'QA F', ui_language: 'ru' }, { id: G, ulke: BU, full_name: 'QA G', ui_language: 'ru' })
    assert.deepEqual([(await iste('jeton-yabanci')).status, (await iste('jeton-satir-yabanci')).status, (await iste('jeton-kendi')).status], [401, 403, 200])
    assert.equal((await (await iste('jeton-kendi')).json()).ulke, BU)
  })
})

describe('shared database — the migrations hold the same rules in SQL', () => {
  const oku = (f: string) => readFileSync(join(KOK, 'lib/db/migrations', f), 'utf8')
  const dosyalar = () => GOCLER
  const yorumsuz = (s: string) => s.replace(/--[^\n]*/g, '')

  it('every country table: `ulke` NOT NULL with a format check and NO default, the country in its foreign key, row-level security on', () => {
    const sql = dosyalar().map(oku).join('\n')
    for (const t of T.ULKE_TABLOLARI) {
      const m = new RegExp(`create table if not exists public\\.${t} \\(([\\s\\S]*?)\\n\\);`).exec(sql)
      assert.ok(m, `${t}: definition not found`)
      const govde = yorumsuz(m![1])
      assert.match(govde, /\bulke text not null check \(ulke ~ '\^\[a-z\]\{2\}\$'\)/, `${t}: ulke column`)
      assert.doesNotMatch(govde, /\bulke text[^,\n]*default/i, `${t}: the country must never have a default`)
      if (t === 'ulke_hesaplari') assert.match(govde, /unique \(ulke, id\)/)
      else assert.match(govde, /foreign key \(ulke, doctor_id(, \w+)*\) references public\.ulke_\w+ \(ulke, (doctor_id, )?(patient_id, )?id\)/, `${t}: its foreign key must carry the country`)
      assert.match(sql, new RegExp(`alter table public\\.${t} enable row level security;`), `${t}: row-level security`)
      assert.match(sql, new RegExp(`revoke all on table public\\.${t} from anon, authenticated;`), `${t}: browser privileges`)
      // A SERVER-ONLY table has no rule at all: no browser session reads it, not even its own rows.
      if ((T.YALNIZ_SUNUCU_TABLOLARI as readonly string[]).includes(t)) assert.doesNotMatch(yorumsuz(sql), new RegExp(`create policy [^;]*\\bon public\\.${t}\\b`), `${t}: a server-only table must have no row-level rule`)
      else assert.match(sql, new RegExp(`on public\\.${t}\\s+for select to authenticated using \\((doctor_id|id) = auth\\.uid\\(\\) and ulke = public\\.ulke_oturum_ulkesi\\(\\)\\)`), `${t}: the read rule must name the session's country`)
    }
    assert.match(sql, /before update of ulke on public\.ulke_hesaplari/, 'an account must not be able to change country')
  })

  it('from 129 on, no migration reads, writes or alters a table of Türkiye; all are one transaction with a lock timeout', () => {
    for (const f of dosyalar()) {
      const s = yorumsuz(oku(f))
      assert.doesNotMatch(s, /\bpublic\.(users|patients|sessions|notes|ai_kullanim|randevular)\b/, `${f}: names a table of Türkiye`)
      assert.doesNotMatch(s, /alter table (?!public\.(ulke_|hekim_|hasta_ulke_bilgisi|muayene_dil_kaydi|not_dil_kaydi|davet_kodlari))/i, `${f}: alters a table that is not a country table`)
      assert.match(s, /^\s*begin;\s*set local lock_timeout = '4s';/, `${f}: must open one transaction with a lock timeout`)
      assert.match(s, /commit;\s*$/, `${f}: must end by committing its one transaction`)
      assert.ok(existsSync(join(KOK, 'lib/db/migrations/geri-al', f.replace(/\.sql$/, '.geri-al.sql'))), `${f}: no rollback script`)
    }
    // The only references to objects Türkiye uses, by name: one foreign key to auth.users, one bucket row, one storage policy.
    const hepsi = dosyalar().map((f) => yorumsuz(oku(f))).join('\n')
    assert.equal(hepsi.match(/references auth\.users/g)?.length, 1)
    assert.equal(hepsi.match(/on storage\.objects/g)?.length, 1)
    assert.equal(hepsi.match(/insert into storage\.buckets/g)?.length, 1)
  })

  it('128 is the one migration that changes a table of Türkiye, and no country code depends on it', () => {
    const s = oku('128_hesap_ulke_dil.sql')
    assert.match(s, /NO COUNTRY BUILD NEEDS IT/)
    assert.match(yorumsuz(s), /alter table public\.users add column if not exists country text not null default 'tr';/)
    for (const f of ['app/api/ulke/hesap/route.ulke.ts', 'app/api/ulke/kayit/route.ulke.ts', 'lib/ulke/uygulama/dilTercihleri.ts', 'lib/ulke/uygulama/muayeneKaydi.ts']) {
      assert.doesNotMatch(readFileSync(join(KOK, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), /'users'|users\.country|\.country\b/, `${f}: still reads Türkiye's account table`)
    }
  })
})
