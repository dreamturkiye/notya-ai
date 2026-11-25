/**
 * ILAC-NOTU-AYRIMI (Kaan, 2026-11-25) — a medication's note is split in two:
 *   notlar  "Hastaya not" — still shown to the patient on Sağlığım › İlaçlarım (unchanged).
 *   ic_not  "İç not"      — doctor only (migration 211); it must never reach any patient payload.
 *
 * Through the REAL route handlers (in-memory Supabase stand-in, no network):
 *   1. the doctor writes both notes (POST), edits the internal one (PUT), reads both back (GET);
 *   2. the patient's Sağlığım bundle carries the "Hastaya not" and NEVER the internal note — even though the in-memory
 *      stand-in returns every column of a row whatever the select says (so this also proves the mapping drops it);
 *   3. cross-doctor isolation is unchanged: another doctor can neither read nor write the internal note;
 *   4. static guards: the portal select is an explicit list without ic_not, and `ic_not` appears only in doctor-side files;
 *   5. both doctor forms render "Hastaya not" (with the Sağlığım hint) and "İç not" (marked "yalnız siz görürsünüz").
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'
import '../../components/doktor/portal/reactGlobal'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-ilac-notu-anahtari'
process.env.PORTAL_TOKEN_SECRET = 'qa-sentetik-portal-sirri'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'

let db = new SahteVeritabani()
function sahteCreateClient(_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: { getUser: (j?: string) => c().auth.getUser(j), admin: { updateUserById: async () => ({ data: null, error: null }) } },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
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
const KOK = join(__dirname, '../..')
mock.module(pathToFileURL(join(KOK, 'lib/alarm.ts')).href, { namedExports: { kritikAlarm: async () => undefined } })
globalThis.fetch = (async (u: unknown) => { throw new Error(`no network in this test: ${String(u)}`) }) as typeof fetch

const IC_SIR = 'GIZLI-IC-NOT-uyum-dusuk-kontrolde-sor'
const HASTAYA = 'Tok karnına alın'

type Hekim = { id: string; jeton: string; hasta: string; portal: string }
let encrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest
let R: Record<string, any>

function hekimKur(harf: string, brans = 'dahiliye'): Hekim {
  const id = randomUUID()
  const jeton = `qa-ilacnot-jeton-${harf}`
  db.kullanicilar.set(jeton, { id, email: `qa-ilacnot-${harf}@ornek.test` })
  db.ekle('users', { id, full_name: `Dr. İlaç ${harf}`, email: `qa-ilacnot-${harf}@ornek.test`, specialty: brans, subscription_tier: 'pro', role: 'doktor' })
  const hasta = db.ekle('patients', { doctor_id: id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: `İlaç Hasta ${harf}` })), dob_encrypted: encrypt('1975-03-01'), gender_encrypted: encrypt('male') }).id as string
  const portal = `qa-ilacnot-portal-${harf}`
  db.ekle('hasta_portal_tokens', { token_hash: portal, doctor_id: id, patient_id: hasta, expires_at: new Date(Date.now() + 30 * 86400e3).toISOString(), pin_hash: 'sentetik' })
  return { id, jeton, hasta, portal }
}
async function cerez(token: string) {
  const { setUnlockCookie, UNLOCK_COOKIE } = await import('./pinAuth')
  const { NextResponse } = await import('next/server')
  const res = NextResponse.json({})
  setUnlockCookie(res, token)
  return `${UNLOCK_COOKIE}=${res.cookies.get(UNLOCK_COOKIE)?.value}`
}
function iste(yontem: string, yol: string, o: { jeton?: string; cerez?: string; govde?: unknown } = {}) {
  const h: Record<string, string> = {}
  if (o.jeton) h.authorization = `Bearer ${o.jeton}`
  if (o.cerez) h.cookie = o.cerez
  if (o.govde !== undefined) h['content-type'] = 'application/json'
  return new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: h, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
const prm = <T extends object>(p: T) => ({ params: Object.assign(Promise.resolve(p), p) })
async function yanit(r: Response | Promise<Response>) { const y = await r; const metin = await y.text(); let j: any = {}; try { j = JSON.parse(metin) } catch { /* not json */ } return { status: y.status, metin, j } }

before(async () => {
  encrypt = (await import('../security/encryption')).encrypt
  NextRequestSinifi = (await import('next/server')).NextRequest
  const ice = (y: string) => import(`../../${y}`)
  R = {
    portal: await ice('app/api/portal/hasta/[token]/route'),
    ilaclar: await ice('app/api/doktor/ilaclar/route'),
    ilac: await ice('app/api/doktor/ilaclar/[id]/route'),
  }
})

describe('ILAC-NOTU-AYRIMI — "Hastaya not" reaches Sağlığım, "İç not" never does', () => {
  // Core change: one table and one İlaçlar tab for every branş — exercised for a medical branş and an Özel Branş doctor.
  for (const brans of ['dahiliye', 'fizyoterapi']) {
    it(`${brans}: doctor writes both notes → doctor reads both → patient bundle has only the "Hastaya not"`, async () => {
      db = new SahteVeritabani()
      const A = hekimKur('A', brans)
      const ekle = await yanit(R.ilaclar.POST(iste('POST', '/api/doktor/ilaclar', { jeton: A.jeton, govde: { hastaId: A.hasta, ad: 'Metformin 1000 mg', etkenMadde: 'metformin', doz: '1000 mg', kullanim_sikli: '2x1', baslangic_tarihi: '2026-11-01', notlar: HASTAYA, ic_not: `  ${IC_SIR}  ` } })))
      assert.equal(ekle.status, 200, ekle.metin.slice(0, 300))
      const satir = db.tablo('hasta_ilaclar').find((r) => r.patient_id === A.hasta)!
      assert.equal(satir.notlar, HASTAYA)
      assert.equal(satir.ic_not, IC_SIR, 'İç not stored trimmed')
      // the row is visible on the portal (approved by default) — the realistic case for a leak
      satir.onay_durumu = 'onayli'

      const liste = await yanit(R.ilaclar.GET(iste('GET', `/api/doktor/ilaclar?hastaId=${A.hasta}`, { jeton: A.jeton })))
      assert.equal(liste.status, 200)
      assert.equal(liste.j[0].ic_not, IC_SIR, 'the doctor sees the internal note')
      assert.equal(liste.j[0].notlar, HASTAYA)

      const p = await yanit(R.portal.GET(iste('GET', `/api/portal/hasta/${A.portal}`, { cerez: await cerez(A.portal) }), prm({ token: A.portal })))
      assert.equal(p.status, 200, p.metin.slice(0, 300))
      const ilac = (p.j.medications || []).find((m: { ad: string }) => m.ad === 'Metformin 1000 mg')
      assert.ok(ilac, 'the medication is on İlaçlarım')
      assert.equal(ilac.not, HASTAYA, '"Hastaya not" still shown to the patient')
      assert.ok(!p.metin.includes(IC_SIR), 'İç not leaked into the patient bundle')
      assert.ok(!p.metin.includes('GIZLI-IC-NOT'), 'İç not leaked into the patient bundle')
      assert.ok(!/"ic_?not"|"icNot"/.test(p.metin), 'an ic_not key is in the patient bundle')
    })
  }

  it('edit: İç not changes and clears via PUT; "Hastaya not" is untouched; existing notlar keep showing to the patient', async () => {
    db = new SahteVeritabani()
    const A = hekimKur('A')
    // a pre-211 row: only notlar, no ic_not — it must stay exactly as it was (no silent change)
    const eski = db.ekle('hasta_ilaclar', { doctor_id: A.id, patient_id: A.hasta, ilac_adi: 'Eski İlaç', etken_madde: 'x', doz: '5 mg', kullanim_sikli: '1x1', baslangic_tarihi: '2026-09-01', aktif: true, onay_durumu: 'onayli', notlar: 'Eski not, hastaya açık' }).id as string
    const u = await yanit(R.ilac.PUT(iste('PUT', `/api/doktor/ilaclar/${eski}`, { jeton: A.jeton, govde: { ic_not: IC_SIR } }), prm({ id: eski })))
    assert.equal(u.status, 200, u.metin.slice(0, 300))
    const r = db.tablo('hasta_ilaclar').find((x) => x.id === eski)!
    assert.equal(r.ic_not, IC_SIR)
    assert.equal(r.notlar, 'Eski not, hastaya açık', 'PUT of ic_not leaves "Hastaya not" alone')

    const p = await yanit(R.portal.GET(iste('GET', `/api/portal/hasta/${A.portal}`, { cerez: await cerez(A.portal) }), prm({ token: A.portal })))
    assert.ok(p.metin.includes('Eski not, hastaya açık'), 'existing notlar still visible to the patient')
    assert.ok(!p.metin.includes(IC_SIR))

    const sil = await yanit(R.ilac.PUT(iste('PUT', `/api/doktor/ilaclar/${eski}`, { jeton: A.jeton, govde: { ic_not: '   ' } }), prm({ id: eski })))
    assert.equal(sil.status, 200)
    assert.equal(db.tablo('hasta_ilaclar').find((x) => x.id === eski)!.ic_not, null, 'blank İç not clears it')

    // an add without İç not never names the column (works before migration 211 is applied)
    await yanit(R.ilaclar.POST(iste('POST', '/api/doktor/ilaclar', { jeton: A.jeton, govde: { hastaId: A.hasta, ad: 'Yeni', etkenMadde: 'y', doz: '1', kullanim_sikli: '1x1', baslangic_tarihi: '2026-11-02' } })))
    assert.ok(!('ic_not' in db.tablo('hasta_ilaclar').find((x) => x.ilac_adi === 'Yeni')!))
  })

  it('cross-doctor isolation unchanged: another doctor cannot read, write or plant an internal note', async () => {
    db = new SahteVeritabani()
    const A = hekimKur('A'), B = hekimKur('B')
    const id = db.ekle('hasta_ilaclar', { doctor_id: A.id, patient_id: A.hasta, ilac_adi: 'A ilacı', etken_madde: 'x', doz: '1', kullanim_sikli: '1x1', baslangic_tarihi: '2026-09-01', aktif: true, onay_durumu: 'onayli', ic_not: IC_SIR }).id as string

    const bOku = await yanit(R.ilaclar.GET(iste('GET', `/api/doktor/ilaclar?hastaId=${A.hasta}`, { jeton: B.jeton })))
    assert.ok(!bOku.metin.includes(IC_SIR), 'B read A\'s internal note')

    const bYaz = await yanit(R.ilac.PUT(iste('PUT', `/api/doktor/ilaclar/${id}`, { jeton: B.jeton, govde: { ic_not: 'B yazdı' } }), prm({ id })))
    assert.notEqual(bYaz.status, 200)
    assert.equal(db.tablo('hasta_ilaclar').find((x) => x.id === id)!.ic_not, IC_SIR, 'B changed A\'s internal note')

    const bEkle = await yanit(R.ilaclar.POST(iste('POST', '/api/doktor/ilaclar', { jeton: B.jeton, govde: { hastaId: A.hasta, ad: 'B ilacı', etkenMadde: 'x', doz: '1', kullanim_sikli: '1x1', baslangic_tarihi: '2026-11-01', ic_not: 'B iç not' } })))
    assert.equal(bEkle.status, 404)
    assert.ok(!db.tablo('hasta_ilaclar').some((x) => x.ilac_adi === 'B ilacı'))

    const anon = await yanit(R.ilaclar.GET(iste('GET', `/api/doktor/ilaclar?hastaId=${A.hasta}`)))
    assert.equal(anon.status, 401)
    assert.ok(!anon.metin.includes(IC_SIR))
  })
})

describe('ILAC-NOTU-AYRIMI — static guards', () => {
  it('the portal bundle selects medications with an explicit column list that has no ic_not', () => {
    const src = readFileSync(join(KOK, 'app/api/portal/hasta/[token]/route.ts'), 'utf8')
    const m = src.match(/arsivsizIlaclar\(sb,\s*'([^']+)'\)/)
    assert.ok(m, 'portal medication select not found')
    assert.notEqual(m![1].trim(), '*', 'portal must never select * from hasta_ilaclar')
    assert.ok(!/\bic_not\b/.test(m![1]))
    assert.ok(/\bnotlar\b/.test(m![1]), '"Hastaya not" stays on Sağlığım')
  })

  it('`ic_not` appears only in doctor-side files (never portal, PDF, export, share or patient-facing Ayşe code)', () => {
    const IZINLI = new Set([
      'app/api/doktor/ilaclar/route.ts',
      'app/api/doktor/ilaclar/[id]/route.ts',
      'app/api/portal/hasta/[token]/route.ts', // the "never selected here" comment only (asserted above)
      'app/dashboard/doktor/ilaclar/page.tsx',
      'components/doktor/HastaIlaclar.tsx',
      'lib/doktor/ilacNotu.ts',
    ])
    const bulunan: string[] = []
    const gez = (d: string) => {
      for (const ad of readdirSync(d)) {
        if (ad === 'node_modules' || ad.startsWith('.') || ad === 'docs') continue
        const y = join(d, ad)
        const st = statSync(y)
        if (st.isDirectory()) gez(y)
        else if (/\.(ts|tsx|mts)$/.test(ad) && !/\.test\.tsx?$/.test(ad) && /\bic_not\b/.test(readFileSync(y, 'utf8'))) bulunan.push(relative(KOK, y))
      }
    }
    for (const kok of ['app', 'components', 'lib', 'core', 'specialties']) gez(join(KOK, kok))
    const yabanci = bulunan.filter((f) => !IZINLI.has(f))
    assert.deepEqual(yabanci, [], `ic_not used outside the doctor-side allow-list — check it never reaches a patient: ${yabanci.join(', ')}`)
    const portalSrc = readFileSync(join(KOK, 'app/api/portal/hasta/[token]/route.ts'), 'utf8')
    assert.ok(!/\bm\.ic_not\b|ic_not\s*:/.test(portalSrc), 'the portal route maps ic_not')
  })
})

describe('ILAC-NOTU-AYRIMI — doctor forms render both fields', () => {
  it('İlaçlar tab (HastaIlaclar): add form, edit fields and list rows', async () => {
    const React = (await import('react')).default
    const { renderToStaticMarkup } = await import('react-dom/server')
    const mod = await import('../../components/doktor/HastaIlaclar')
    const ekle = renderToStaticMarkup(React.createElement(mod.default, { patientId: randomUUID() }))
    for (const t of ['Hastaya not', 'Hastanın Sağlığım&#x27;ında görünür', 'Tok karnına alın', 'İç not', 'Yalnız siz görürsünüz', 'data-alan="hastaya-not"', 'data-alan="ic-not"']) {
      assert.ok(ekle.includes(t), `add form misses: ${t}`)
    }
    assert.ok(!/>Not<\/label>/.test(ekle), 'the old ambiguous "Not" label is gone')

    const duzen = renderToStaticMarkup(React.createElement(mod.NotAlanlari, { kimlik: 'duzen-x', hastaya: HASTAYA, ic: IC_SIR, hastayaDegisti: () => {}, icDegisti: () => {} }))
    assert.ok(duzen.includes(`value="${HASTAYA}"`) && duzen.includes(`value="${IC_SIR}"`), 'edit fields carry both values')

    const satir = renderToStaticMarkup(React.createElement(mod.IlacNotlari, { i: { notlar: HASTAYA, ic_not: IC_SIR } }))
    assert.match(satir, /data-not="hastaya"[^]*Hastaya not/)
    assert.match(satir, /data-not="ic"[^]*İç not[^]*yalnız siz görürsünüz[^]*GIZLI-IC-NOT/)
    const yalnizHastaya = renderToStaticMarkup(React.createElement(mod.IlacNotlari, { i: { notlar: HASTAYA, ic_not: null } }))
    assert.ok(!yalnizHastaya.includes('data-not="ic"'))
  })

  it('İlaçlarım page (/dashboard/doktor/ilaclar): add and edit forms label both notes', () => {
    const src = readFileSync(join(KOK, 'app/dashboard/doktor/ilaclar/page.tsx'), 'utf8')
    assert.equal((src.match(/data-alan="hastaya-not"/g) || []).length, 2, 'add + edit "Hastaya not"')
    assert.equal((src.match(/data-alan="ic-not"/g) || []).length, 2, 'add + edit "İç not"')
    assert.ok(src.includes('NM.hastayaIpucu') && src.includes('NM.icIpucu'))
    assert.ok(!/>Notlar<\/label>/.test(src), 'the old ambiguous "Notlar" label is gone')
  })
})
