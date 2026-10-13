/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — POST / GET /api/users/profile with the REAL route handler (only the
 * database and the session are stand-ins: lib/security/testing/sahteSupabase.ts — the same setup as the other
 * route tests). Synthetic QA data only.
 *
 *   1. New doctor: every answer reaches the users row, in the column the product reads and in the spelling the
 *      constraint accepts; the metadata keys are written as before.
 *   2. Server-side validation: a missing / invalid field → 400 + Turkish message; nothing is written.
 *   3. KVKK: required when none is on record; ticked → metadata + row stamp; on record → not asked, not re-stamped.
 *   4. users.cep_telefonu missing (migration 150 not applied): the other answers are saved, telefon_kaydedildi=false.
 *   5. Other callers: non-doctor professions, an already-onboarded account, a superuser who may switch branch.
 *
 *   npm test (--experimental-test-module-mocks)
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { SUPERUSER_BRANS_IDS } from '../auth/superuserBranslar'
import { KVKK_METIN_VERSIYONU, KVKK_ONAY_HATASI, KVKK_ONAY_KODU } from './kvkkOnay'
import { DOKTOR_CEP_MESAJ } from './cepTelefonu'
import { AD_MESAJ, PROFIL_MESAJ } from './profilDogrula'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'

let db = new SahteVeritabani()
/** auth.users.user_metadata — the stand-in database does not keep it; kept here. */
let metalar = new Map<string, Record<string, unknown>>()
/** auth.admin.updateUserById calls, in order. */
let metaYazimlari: Array<{ id: string; user_metadata: Record<string, unknown> }> = []
/** insert / update payloads sent to the users table, in order. */
let satirYazimlari: Array<Record<string, unknown>> = []
/** As if migration 150 were not applied: every write that carries cep_telefonu gets the "column missing" error. */
let cepKolonuYok = false
/** The shape of the column-missing error: PostgREST schema cache or Postgres. */
let kolonHatasi: { code: string; message: string } = { code: 'PGRST204', message: "Could not find the 'cep_telefonu' column of 'users' in the schema cache" }
/** Every write to the users table gets this error (a failure that has nothing to do with the column). */
let genelYazimHatasi: { code: string; message: string } | null = null

function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  const hataSorgusu = (hata: { code: string; message: string }) => {
    const q: Record<string, unknown> = {}
    for (const ad of ['eq', 'select', 'single', 'maybeSingle']) q[ad] = () => q
    q.then = (coz: (v: unknown) => unknown) => Promise.resolve({ data: null, error: hata }).then(coz)
    return q
  }
  return {
    from: (t: string) => {
      const q = c().from(t)
      if (t !== 'users') return q
      const yazim = (ad: 'insert' | 'update') => (yuk: Record<string, unknown>) => {
        satirYazimlari.push({ ...yuk })
        if (genelYazimHatasi) return hataSorgusu(genelYazimHatasi)
        if (cepKolonuYok && 'cep_telefonu' in yuk) return hataSorgusu(kolonHatasi)
        return q[ad](yuk)
      }
      return new Proxy(q, { get: (h, k) => (k === 'insert' || k === 'update' ? yazim(k) : h[k]) })
    },
    auth: {
      getUser: async (jwt?: string) => {
        const s = await c().auth.getUser(jwt)
        const u = s.data.user
        return u ? { data: { user: { ...u, user_metadata: { ...(metalar.get(u.id) || {}) } } }, error: null } : s
      },
      admin: {
        updateUserById: async (id: string, g: { user_metadata: Record<string, unknown> }) => {
          metaYazimlari.push({ id, user_metadata: { ...g.user_metadata } })
          metalar.set(id, { ...g.user_metadata })
          return { data: null, error: null }
        },
      },
    },
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
globalThis.fetch = (async (g: unknown) => { throw new Error(`the profile test must not reach the network: ${String(g)}`) }) as typeof fetch

let NextRequestSinifi: typeof import('next/server').NextRequest
let ROTA: Record<string, any>

before(async () => {
  NextRequestSinifi = (await import('next/server')).NextRequest
  ROTA = await import('../../app/api/users/profile/route')
})

const sessiz = async <T>(is: () => Promise<T>): Promise<{ sonuc: T; gunluk: string[] }> => {
  const gunluk: string[] = []
  const asil = console.error
  console.error = (...a: unknown[]) => { gunluk.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')) }
  try { return { sonuc: await is(), gunluk } } finally { console.error = asil }
}

function hesap(o: { id?: string; email?: string; meta?: Record<string, unknown>; satir?: Record<string, unknown> | null } = {}) {
  const id = o.id || randomUUID()
  const token = `qa-${id}`
  const email = o.email || `qa-${id.slice(0, 8)}@ornek.test`
  db.kullanicilar.set(token, { id, email })
  metalar.set(id, { ...(o.meta || {}) })
  if (o.satir) db.ekle('users', { id, email, ...o.satir })
  return { id, token, email }
}
const satir = (id: string) => db.tablo('users').find((r) => r.id === id) || null

async function gonder(token: string | null, govde?: unknown, ham?: string) {
  const istek = new NextRequestSinifi('http://localhost/api/users/profile', {
    method: 'POST',
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' },
    body: ham !== undefined ? ham : JSON.stringify(govde),
  })
  const y = await ROTA.POST(istek)
  return { durum: y.status, veri: (await y.json()) as Record<string, any> }
}
async function oku(token: string | null) {
  const y = await ROTA.GET(new NextRequestSinifi('http://localhost/api/users/profile', { method: 'GET', headers: token ? { authorization: `Bearer ${token}` } : {} }))
  return { durum: y.status, veri: (await y.json()) as Record<string, any> }
}

/** The body app/onboarding/page.tsx sends for a doctor (with the raw option values of the screen). */
const HEKIM = {
  profession_type: 'doktor', specialty: 'Kardiyoloji', title: 'Uzm.Dr.', hospital: 'QA Kliniği',
  firstName: 'Işıl', lastName: 'Öztürk', cepTelefonu: '0532 123 45 67', gender: 'Kadın', addressingPreference: '[isim] Hocam',
  trial_start: '2026-10-09T08:00:00.000Z', plan: 'professional', metadata: { agent: 'kardiyoloji' },
}
const KAYIT_RIZASI = { kvkk_onay: true, kvkk_onay_tarihi: '2026-10-01T09:00:00.000Z', kvkk_metin_versiyonu: KVKK_METIN_VERSIYONU }

beforeEach(() => {
  db = new SahteVeritabani()
  metalar = new Map()
  metaYazimlari = []
  satirYazimlari = []
  cepKolonuYok = false
  kolonHatasi = { code: 'PGRST204', message: "Could not find the 'cep_telefonu' column of 'users' in the schema cache" }
  genelYazimHatasi = null
})

describe('POST /api/users/profile: new doctor (from public sign-up, consent on record)', () => {
  it('every answer is written to the users row, in the column the product reads and the spelling the constraint accepts', async () => {
    const h = hesap({ meta: KAYIT_RIZASI })
    const { durum, veri } = await gonder(h.token, HEKIM)
    assert.equal(durum, 200)
    assert.equal(veri.success, true)
    assert.equal(veri.telefon_kaydedildi, true)
    assert.equal(veri.data.onboarding_completed, true)
    const s = satir(h.id)!
    assert.equal(s.email, h.email)
    assert.equal(s.onboarding_completed, true)
    assert.equal(s.profession_type, 'doktor')
    assert.equal(s.specialty, 'Kardiyoloji')
    assert.equal(s.full_name, 'Işıl Öztürk', 'full_name stays "First Last" (no title), as before')
    assert.equal(s.first_name, 'Işıl')
    assert.equal(s.last_name, 'Öztürk')
    assert.equal(s.title, 'Uzm. Dr.', 'the spelling of the constraint (with the space)')
    assert.equal(s.hospital, 'QA Kliniği')
    assert.equal(s.gender, 'female')
    assert.equal(s.addressing_preference, 'named_hocam')
    assert.equal(s.cep_telefonu, '+905321234567')
    // Must not be written: plan / trial never come from the client; the unvan column, the practice contact fields, clinic_name.
    for (const k of ['plan', 'trial_start', 'metadata', 'subscription_tier', 'unvan', 'clinic_name', 'whatsapp_number', 'iletisim_whatsapp', 'iletisim_telefon_muayenehane']) assert.ok(!(k in s), k)
    // Consent is already on record: neither the row nor the metadata is stamped again.
    assert.ok(!('kvkk_consent_at' in s) && !('kvkk_consent_version' in s))
  })

  it('all four title options are written without violating the constraint', async () => {
    for (const [ekran, kolon] of [['Dr.', 'Dr.'], ['Uzm.Dr.', 'Uzm. Dr.'], ['Doç.Dr.', 'Doç. Dr.'], ['Prof.Dr.', 'Prof. Dr.']]) {
      const h = hesap({ meta: KAYIT_RIZASI })
      const { durum } = await gonder(h.token, { ...HEKIM, title: ekran })
      assert.equal(durum, 200, ekran)
      assert.equal(satir(h.id)!.title, kolon)
      assert.ok(['Dr.', 'Uzm. Dr.', 'Doç. Dr.', 'Prof. Dr.'].includes(satir(h.id)!.title))
    }
  })

  it('auth metadata: the keys the code always wrote, with the same values', async () => {
    const h = hesap({ meta: { ...KAYIT_RIZASI, baska: 'korunur' } })
    await gonder(h.token, HEKIM)
    assert.equal(metaYazimlari.length, 1)
    assert.deepEqual(metaYazimlari[0], {
      id: h.id,
      user_metadata: {
        ...KAYIT_RIZASI, baska: 'korunur',
        gender: 'Kadın', addressing_preference: '[isim] Hocam', title: 'Uzm.Dr.', baro: null, yil: null,
        hospital: 'QA Kliniği', specialty: 'Kardiyoloji', profession_type: 'doktor', onboarding_completed: true,
      },
    })
    assert.equal(metaYazimlari[0].user_metadata.kvkk_onay_tarihi, KAYIT_RIZASI.kvkk_onay_tarihi, 'the recorded consent date does not change')
  })

  it('first and last name are stored trimmed; the mobile is stored in one form however it was typed', async () => {
    for (const cep of ['5321234567', '+90 532 123 45 67', '(0532) 123-45-67', '0090 532 123 45 67']) {
      const h = hesap({ meta: KAYIT_RIZASI })
      const { durum } = await gonder(h.token, { ...HEKIM, firstName: '  Ayşe   Nur ', lastName: ' Kaya-Demir  ', cepTelefonu: cep })
      assert.equal(durum, 200, cep)
      const s = satir(h.id)!
      assert.equal(s.first_name, 'Ayşe Nur')
      assert.equal(s.last_name, 'Kaya-Demir')
      assert.equal(s.full_name, 'Ayşe Nur Kaya-Demir')
      assert.equal(s.cep_telefonu, '+905321234567')
    }
  })

  it('administrator-created account with a row but onboarding not finished: update path, same result', async () => {
    const h = hesap({ meta: KAYIT_RIZASI, satir: { full_name: 'qa', onboarding_completed: false } })
    const { durum } = await gonder(h.token, HEKIM)
    assert.equal(durum, 200)
    assert.equal(db.tablo('users').length, 1)
    assert.equal(satir(h.id)!.first_name, 'Işıl')
    assert.equal(satir(h.id)!.cep_telefonu, '+905321234567')
  })
})

describe('POST /api/users/profile: server-side validation', () => {
  it('no session → 401', async () => {
    assert.equal((await gonder(null, HEKIM)).durum, 401)
    assert.equal((await gonder('gecersiz', HEKIM)).durum, 401)
  })

  it('missing or invalid field: 400 + Turkish message + field name; NEITHER the row NOR the metadata is written', async () => {
    const durumlar: Array<[Record<string, unknown>, string, string]> = [
      [{ firstName: '' }, 'firstName', AD_MESAJ.ad.bos],
      [{ firstName: 'A' }, 'firstName', AD_MESAJ.ad.kisa],
      [{ lastName: '  ' }, 'lastName', AD_MESAJ.soyad.bos],
      [{ lastName: 'Öz1' }, 'lastName', AD_MESAJ.soyad.karakter],
      [{ firstName: 'Dr. Işıl' }, 'firstName', AD_MESAJ.ad.unvan],
      [{ cepTelefonu: '' }, 'cepTelefonu', DOKTOR_CEP_MESAJ.bos],
      [{ cepTelefonu: '0212 123 45 67' }, 'cepTelefonu', DOKTOR_CEP_MESAJ.sabitHat],
      [{ cepTelefonu: '+1 202 555 0143' }, 'cepTelefonu', DOKTOR_CEP_MESAJ.yurtDisi],
      [{ cepTelefonu: '0532' }, 'cepTelefonu', DOKTOR_CEP_MESAJ.gecersiz],
      [{ title: '' }, 'title', PROFIL_MESAJ.unvan],
      [{ title: 'Op.Dr.' }, 'title', PROFIL_MESAJ.unvanGecersiz],
      [{ gender: '' }, 'gender', PROFIL_MESAJ.cinsiyet],
      [{ gender: 'x' }, 'gender', PROFIL_MESAJ.cinsiyet],
      [{ addressingPreference: '' }, 'addressingPreference', PROFIL_MESAJ.hitap],
      [{ specialty: '' }, 'specialty', PROFIL_MESAJ.uzmanlik],
      [{ profession_type: 'yonetici' }, 'profession_type', PROFIL_MESAJ.meslek],
    ]
    for (const [ek, alan, ileti] of durumlar) {
      const h = hesap({ meta: KAYIT_RIZASI })
      const { durum, veri } = await gonder(h.token, { ...HEKIM, ...ek })
      assert.equal(durum, 400, JSON.stringify(ek))
      assert.equal(veri.alan, alan)
      assert.equal(veri.error, ileti)
      assert.ok(!/invalid|required|must be/i.test(veri.error), 'the message is Turkish')
      assert.equal(satir(h.id), null, 'no row was written')
    }
    assert.equal(satirYazimlari.length, 0)
    assert.equal(metaYazimlari.length, 0, 'a refused request does not mark the account as onboarded')
  })

  it('malformed body → 400', async () => {
    const h = hesap({ meta: KAYIT_RIZASI })
    const { durum, veri } = await gonder(h.token, undefined, '{bozuk')
    assert.equal(durum, 400)
    assert.equal(veri.error, PROFIL_MESAJ.govde)
  })

  it('a users write that fails for a reason other than the column → 500, and the metadata is NOT marked (the doctor can retry)', async () => {
    const h = hesap({ meta: KAYIT_RIZASI })
    genelYazimHatasi = { code: '23514', message: 'new row for relation "users" violates check constraint "users_title_check"' }
    const { sonuc, gunluk } = await sessiz(() => gonder(h.token, HEKIM))
    assert.equal(sonuc.durum, 500)
    assert.equal(sonuc.veri.error, 'Profil kaydedilemedi. Lütfen tekrar deneyin.')
    assert.equal(satirYazimlari.length, 1, 'the column-missing fallback does not engage on another error')
    assert.equal(metaYazimlari.length, 0)
    assert.ok(gunluk.some((g) => g.includes('[profile]')))
  })
})

describe('POST /api/users/profile: KVKK consent', () => {
  it('none on record + box not ticked → 400, code KVKK_ONAY_GEREKLI, the /kayit sentence; nothing is written', async () => {
    const h = hesap()
    for (const ek of [{}, { kvkk_onay: false }, { kvkk_onay: 'true' }, { kvkk_onay: 1 }, { kvkk_gerekli: false, kvkk_onay_gerekli: false }]) {
      const { durum, veri } = await gonder(h.token, { ...HEKIM, ...ek })
      assert.equal(durum, 400, JSON.stringify(ek))
      assert.equal(veri.kod, KVKK_ONAY_KODU)
      assert.equal(veri.error, KVKK_ONAY_HATASI)
    }
    assert.equal(satir(h.id), null)
    assert.equal(metaYazimlari.length, 0)
  })

  it('none on record + box ticked → metadata (the /kayit keys) AND the users row are stamped with the same instant and version', async () => {
    const h = hesap()
    const once = Date.now()
    const { durum } = await gonder(h.token, { ...HEKIM, kvkk_onay: true })
    assert.equal(durum, 200)
    const s = satir(h.id)!
    const m = metalar.get(h.id)!
    assert.equal(m.kvkk_onay, true)
    assert.equal(m.kvkk_metin_versiyonu, '2026-08-25-v2')
    assert.equal(s.kvkk_consent_version, '2026-08-25-v2')
    assert.equal(s.kvkk_consent_at, m.kvkk_onay_tarihi)
    const an = Date.parse(String(s.kvkk_consent_at))
    assert.ok(an >= once - 1000 && an <= Date.now() + 1000, 'stamped with the server clock')
  })

  it('a date / version sent by the browser is ignored; the server stamps', async () => {
    const h = hesap()
    await gonder(h.token, { ...HEKIM, kvkk_onay: true, kvkk_onay_tarihi: '1999-01-01T00:00:00.000Z', kvkk_metin_versiyonu: 'uydurma', kvkk_consent_at: '1999-01-01T00:00:00.000Z', kvkk_consent_version: 'uydurma' })
    const s = satir(h.id)!
    assert.equal(s.kvkk_consent_version, KVKK_METIN_VERSIYONU)
    assert.notEqual(s.kvkk_consent_at, '1999-01-01T00:00:00.000Z')
    assert.equal(metalar.get(h.id)!.kvkk_metin_versiyonu, KVKK_METIN_VERSIYONU)
  })

  it('consent on record in metadata (/kayit) → not asked; not re-stamped even when the body says true', async () => {
    const h = hesap({ meta: KAYIT_RIZASI })
    const { durum } = await gonder(h.token, { ...HEKIM, kvkk_onay: true })
    assert.equal(durum, 200)
    assert.equal(metalar.get(h.id)!.kvkk_onay_tarihi, KAYIT_RIZASI.kvkk_onay_tarihi)
    assert.ok(!('kvkk_consent_at' in satir(h.id)!))
  })

  it('consent on record in the users row → not asked; its date and version do not change, nothing is added to metadata', async () => {
    const h = hesap({ satir: { full_name: 'qa', onboarding_completed: false, kvkk_consent_at: '2026-08-30T10:00:00.000Z', kvkk_consent_version: '1.0' } })
    const { durum } = await gonder(h.token, { ...HEKIM, kvkk_onay: true })
    assert.equal(durum, 200)
    assert.equal(satir(h.id)!.kvkk_consent_at, '2026-08-30T10:00:00.000Z')
    assert.equal(satir(h.id)!.kvkk_consent_version, '1.0')
    assert.ok(!('kvkk_onay' in metalar.get(h.id)!))
  })
})

describe('GET /api/users/profile: the e-mail and the "is consent needed" decision come from the server', () => {
  it('no session → 401', async () => {
    assert.equal((await oku(null)).durum, 401)
  })
  it('sign-in e-mail from the auth record; consent: none → needed, in metadata → not, in the row → not', async () => {
    const yeni = hesap({ email: 'qa-yeni@ornek.test' })
    assert.deepEqual((await oku(yeni.token)).veri, { success: true, data: { email: 'qa-yeni@ornek.test', kvkk_onay_gerekli: true } })
    const kayitli = hesap({ meta: KAYIT_RIZASI })
    assert.equal((await oku(kayitli.token)).veri.data.kvkk_onay_gerekli, false)
    const satirda = hesap({ satir: { full_name: 'qa', kvkk_consent_at: '2026-08-30T10:00:00.000Z' } })
    assert.equal((await oku(satirda.token)).veri.data.kvkk_onay_gerekli, false)
    const yarim = hesap({ meta: { kvkk_onay: 'true' }, satir: { full_name: 'qa', kvkk_consent_at: null } })
    assert.equal((await oku(yarim.token)).veri.data.kvkk_onay_gerekli, true)
    assert.equal(satirYazimlari.length + metaYazimlari.length, 0, 'GET writes nothing')
  })
})

describe('POST /api/users/profile: users.cep_telefonu missing (migration 150 not applied)', () => {
  for (const hata of [
    { code: 'PGRST204', message: "Could not find the 'cep_telefonu' column of 'users' in the schema cache" },
    { code: '42703', message: 'column "cep_telefonu" of relation "users" does not exist' },
  ]) {
    it(`${hata.code}: the doctor's other answers are saved, the mobile is reported as not saved and it is logged`, async () => {
      cepKolonuYok = true
      kolonHatasi = hata
      const h = hesap()
      const { sonuc, gunluk } = await sessiz(() => gonder(h.token, { ...HEKIM, kvkk_onay: true }))
      assert.equal(sonuc.durum, 200)
      assert.equal(sonuc.veri.success, true)
      assert.equal(sonuc.veri.telefon_kaydedildi, false)
      const s = satir(h.id)!
      assert.ok(!('cep_telefonu' in s))
      assert.equal(s.first_name, 'Işıl')
      assert.equal(s.last_name, 'Öztürk')
      assert.equal(s.full_name, 'Işıl Öztürk')
      assert.equal(s.title, 'Uzm. Dr.')
      assert.equal(s.hospital, 'QA Kliniği')
      assert.equal(s.gender, 'female')
      assert.equal(s.addressing_preference, 'named_hocam')
      assert.equal(s.specialty, 'Kardiyoloji')
      assert.equal(s.onboarding_completed, true)
      assert.equal(s.kvkk_consent_version, KVKK_METIN_VERSIYONU, 'consent is not lost either')
      assert.equal(metalar.get(h.id)!.onboarding_completed, true)
      assert.equal(satirYazimlari.length, 2, 'once with the column, once without')
      assert.ok('cep_telefonu' in satirYazimlari[0] && !('cep_telefonu' in satirYazimlari[1]))
      const satirGunlugu = gunluk.find((g) => g.includes('cep_telefonu'))
      assert.ok(satirGunlugu && satirGunlugu.includes('migration 150') && satirGunlugu.includes(h.id))
      assert.ok(!gunluk.some((g) => g.includes('5321234567') || g.includes('532 123')), 'the number itself is never logged')
    })
  }

  it('the same for an account that already has a row (update path)', async () => {
    cepKolonuYok = true
    const h = hesap({ meta: KAYIT_RIZASI, satir: { full_name: 'qa', onboarding_completed: false } })
    const { sonuc } = await sessiz(() => gonder(h.token, HEKIM))
    assert.equal(sonuc.durum, 200)
    assert.equal(sonuc.veri.telefon_kaydedildi, false)
    assert.equal(satir(h.id)!.first_name, 'Işıl')
    assert.ok(!('cep_telefonu' in satir(h.id)!))
  })
})

describe('POST /api/users/profile: other callers work as before', () => {
  it('non-doctor professions finish onboarding with the same step; no title required; specialty written as before', async () => {
    const { klinikUzmanlikNorm } = await import('../specialties/klinikDikey')
    const govdeler: Array<[string, string]> = [
      ['klinik-uzman', 'sac-ekimi'], ['saglik-uzmani', 'fizyoterapi'], ['psikolog', 'Psikoloji'],
      ['mali', 'Vergi Danışmanlığı, Muhasebe'], ['avukat', 'Ceza Hukuku'],
    ]
    for (const [profession_type, specialty] of govdeler) {
      const h = hesap({ meta: KAYIT_RIZASI })
      const { durum } = await gonder(h.token, { ...HEKIM, profession_type, specialty, title: '', hospital: '' })
      assert.equal(durum, 200, profession_type)
      const s = satir(h.id)!
      assert.equal(s.profession_type, profession_type)
      assert.equal(s.full_name, 'Işıl Öztürk')
      assert.equal(s.cep_telefonu, '+905321234567')
      assert.equal(s.gender, 'female')
      assert.ok(!('title' in s) && !('hospital' in s), 'an empty title / institution is not written')
      if (profession_type === 'mali') assert.equal(s.specialty, specialty)
      else if (profession_type === 'avukat') assert.ok(!('specialty' in s), 'avukat: the route writes only the `uzmanlik` field (previous behaviour)')
      else assert.equal(s.specialty, klinikUzmanlikNorm(specialty))
      assert.equal(metalar.get(h.id)!.specialty, specialty)
    }
  })

  it('ordinary already-onboarded doctor: branch does NOT change, no field is required, consent is neither asked nor stamped', async () => {
    const h = hesap({ satir: { full_name: 'Dr. QA Hekim', specialty: 'pediatri', profession_type: 'doktor', onboarding_completed: true } })
    const { durum, veri } = await gonder(h.token, { profession_type: 'doktor', specialty: 'kardiyoloji' })
    assert.equal(durum, 200)
    assert.ok(!('telefon_kaydedildi' in veri))
    const s = satir(h.id)!
    assert.equal(s.specialty, 'pediatri', 'the branch lock holds')
    assert.equal(s.full_name, 'Dr. QA Hekim', 'the name is left untouched')
    assert.ok(!('first_name' in s) && !('cep_telefonu' in s) && !('kvkk_consent_at' in s))
    assert.equal(metalar.get(h.id)!.specialty, 'pediatri')
    assert.ok(!('kvkk_onay' in metalar.get(h.id)!))
  })

  it('superuser who may switch branch: the branch is written although onboarding is finished; nothing else is required', async () => {
    const h = hesap({ id: SUPERUSER_BRANS_IDS[0], satir: { full_name: 'QA Süper', specialty: 'pediatri', profession_type: 'doktor', onboarding_completed: true } })
    const { durum } = await gonder(h.token, { profession_type: 'doktor', specialty: 'kadin-dogum' })
    assert.equal(durum, 200)
    assert.equal(satir(h.id)!.specialty, 'kadin-dogum')
    assert.equal(satir(h.id)!.full_name, 'QA Süper')
    assert.equal(metalar.get(h.id)!.specialty, 'kadin-dogum')
  })

  it('old body shape (unvan / büro_adi / sehir / full_name / uzmanlik_alani / baro / yil) is written as before for an already-onboarded account', async () => {
    const h = hesap({ id: SUPERUSER_BRANS_IDS[1], satir: { full_name: 'eski', profession_type: 'mali', onboarding_completed: true } })
    const { durum } = await gonder(h.token, { profession_type: 'mali', unvan: 'SMMM', büro_adi: 'QA Büro', sehir: 'İzmir', full_name: 'QA Müşavir', uzmanlik_alani: 'Muhasebe', baro: 'QA Baro', yil: '2010', gender: 'Erkek', addressing_preference: 'Hocam' })
    assert.equal(durum, 200)
    const s = satir(h.id)!
    assert.equal(s.unvan, 'SMMM')
    assert.equal(s['büro_adi'], 'QA Büro')
    assert.equal(s.sehir, 'İzmir')
    assert.equal(s.full_name, 'QA Müşavir')
    assert.equal(s.specialty, 'Muhasebe')
    assert.equal(s.gender, 'male')
    assert.equal(s.addressing_preference, 'hocam')
    const m = metalar.get(h.id)!
    assert.equal(m.baro, 'QA Baro')
    assert.equal(m.yil, '2010')
    assert.equal(m.gender, 'Erkek')
    assert.equal(m.addressing_preference, 'Hocam')
  })
})
