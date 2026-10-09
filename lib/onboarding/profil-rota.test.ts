/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — POST / GET /api/users/profile, GERÇEK route handler'ıyla (yalnız
 * veritabanı ve oturum sahte: lib/security/testing/sahteSupabase.ts — diğer rota testleriyle aynı altyapı).
 * Yalnız sentetik QA verisi.
 *
 *   1. Yeni doktor: her yanıt users satırına, ürünün okuduğu kolona ve kısıtın yazımıyla; metadata anahtarları eskisi gibi.
 *   2. Sunucu tarafı doğrulama: eksik / geçersiz alan 400 + Türkçe ileti; hiçbir şey yazılmaz.
 *   3. KVKK: kayıt yoksa zorunlu; işaretlenirse metadata + satır damgası; kayıtlıysa sorulmaz, yeniden damgalanmaz.
 *   4. users.cep_telefonu kolonu yoksa (migration 150 uygulanmamış): diğer yanıtlar kaydedilir, telefon_kaydedildi=false.
 *   5. Diğer çağıranlar: hekim dışı meslekler, onboarding'i bitmiş hesap, branş değiştirebilen süper kullanıcı.
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
/** auth.users.user_metadata — sahte veritabanı bunu tutmaz; burada tutulur. */
let metalar = new Map<string, Record<string, unknown>>()
/** auth.admin.updateUserById çağrıları, sırayla. */
let metaYazimlari: Array<{ id: string; user_metadata: Record<string, unknown> }> = []
/** users tablosuna yapılan insert / update yükleri, sırayla. */
let satirYazimlari: Array<Record<string, unknown>> = []
/** migration 150 uygulanmamış gibi: cep_telefonu taşıyan her yazım "kolon yok" hatası alır. */
let cepKolonuYok = false
/** Kolon yok hatasının biçimi: PostgREST şema önbelleği ya da Postgres. */
let kolonHatasi: { code: string; message: string } = { code: 'PGRST204', message: "Could not find the 'cep_telefonu' column of 'users' in the schema cache" }
/** users tablosuna yapılan her yazım bu hatayı alır (kolonla ilgisiz bir arıza). */
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
globalThis.fetch = (async (g: unknown) => { throw new Error(`profil testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

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

/** app/onboarding/page.tsx'in hekim için gönderdiği gövde (ekrandaki ham seçenek değerleriyle). */
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

describe('POST /api/users/profile — yeni doktor (herkese açık kayıttan gelen, rızası kayıtlı)', () => {
  it('her yanıt users satırına, ürünün okuduğu kolona ve kısıtın yazımıyla yazılır', async () => {
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
    assert.equal(s.full_name, 'Işıl Öztürk', 'full_name eskisi gibi "Ad Soyad" (unvansız)')
    assert.equal(s.first_name, 'Işıl')
    assert.equal(s.last_name, 'Öztürk')
    assert.equal(s.title, 'Uzm. Dr.', 'kısıtın yazımı (boşluklu)')
    assert.equal(s.hospital, 'QA Kliniği')
    assert.equal(s.gender, 'female')
    assert.equal(s.addressing_preference, 'named_hocam')
    assert.equal(s.cep_telefonu, '+905321234567')
    // Yazılmaması gerekenler: plan / deneme istemciden yazılmaz; unvan kolonu, muayenehane iletişim alanları, clinic_name.
    for (const k of ['plan', 'trial_start', 'metadata', 'subscription_tier', 'unvan', 'clinic_name', 'whatsapp_number', 'iletisim_whatsapp', 'iletisim_telefon_muayenehane']) assert.ok(!(k in s), k)
    // Rıza zaten kayıtlı: satıra da metadata'ya da yeniden damga basılmaz.
    assert.ok(!('kvkk_consent_at' in s) && !('kvkk_consent_version' in s))
  })

  it('dört unvan seçeneğinin dördü de kısıt ihlali olmadan yazılır', async () => {
    for (const [ekran, kolon] of [['Dr.', 'Dr.'], ['Uzm.Dr.', 'Uzm. Dr.'], ['Doç.Dr.', 'Doç. Dr.'], ['Prof.Dr.', 'Prof. Dr.']]) {
      const h = hesap({ meta: KAYIT_RIZASI })
      const { durum } = await gonder(h.token, { ...HEKIM, title: ekran })
      assert.equal(durum, 200, ekran)
      assert.equal(satir(h.id)!.title, kolon)
      assert.ok(['Dr.', 'Uzm. Dr.', 'Doç. Dr.', 'Prof. Dr.'].includes(satir(h.id)!.title))
    }
  })

  it('auth metadata: kodun bugüne kadar yazdığı anahtarlar aynı değerlerle; satır metadata\'dan ÖNCE yazılır', async () => {
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
    assert.equal(metaYazimlari[0].user_metadata.kvkk_onay_tarihi, KAYIT_RIZASI.kvkk_onay_tarihi, 'kayıtlı rıza tarihi değişmez')
  })

  it('ad ve soyad boşlukları atılarak yazılır; telefon her yazımıyla aynı biçimde saklanır', async () => {
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

  it('yönetici tarafından açılmış, satırı olan ama onboarding\'i bitmemiş hesap: update yolu, aynı sonuç', async () => {
    const h = hesap({ meta: KAYIT_RIZASI, satir: { full_name: 'qa', onboarding_completed: false } })
    const { durum } = await gonder(h.token, HEKIM)
    assert.equal(durum, 200)
    assert.equal(db.tablo('users').length, 1)
    assert.equal(satir(h.id)!.first_name, 'Işıl')
    assert.equal(satir(h.id)!.cep_telefonu, '+905321234567')
  })
})

describe('POST /api/users/profile — sunucu tarafı doğrulama', () => {
  it('oturum yoksa 401', async () => {
    assert.equal((await gonder(null, HEKIM)).durum, 401)
    assert.equal((await gonder('gecersiz', HEKIM)).durum, 401)
  })

  it('eksik ya da geçersiz alan: 400 + Türkçe ileti + alan adı; satır da metadata da YAZILMAZ', async () => {
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
      assert.ok(!/invalid|required|must be/i.test(veri.error), 'ileti Türkçe')
      assert.equal(satir(h.id), null, 'satır yazılmadı')
    }
    assert.equal(satirYazimlari.length, 0)
    assert.equal(metaYazimlari.length, 0, 'reddedilen istek hesabı "onboarding bitti" diye işaretlemez')
  })

  it('bozuk gövde 400', async () => {
    const h = hesap({ meta: KAYIT_RIZASI })
    const { durum, veri } = await gonder(h.token, undefined, '{bozuk')
    assert.equal(durum, 400)
    assert.equal(veri.error, PROFIL_MESAJ.govde)
  })

  it('users yazımı kolonla ilgisiz bir nedenle başarısızsa 500 — ve metadata İŞARETLENMEZ (hekim yeniden deneyebilir)', async () => {
    const h = hesap({ meta: KAYIT_RIZASI })
    genelYazimHatasi = { code: '23514', message: 'new row for relation "users" violates check constraint "users_title_check"' }
    const { sonuc, gunluk } = await sessiz(() => gonder(h.token, HEKIM))
    assert.equal(sonuc.durum, 500)
    assert.equal(sonuc.veri.error, 'Profil kaydedilemedi. Lütfen tekrar deneyin.')
    assert.equal(satirYazimlari.length, 1, 'kolon-yok yedeği başka hatada devreye girmez')
    assert.equal(metaYazimlari.length, 0)
    assert.ok(gunluk.some((g) => g.includes('[profile]')))
  })
})

describe('POST /api/users/profile — KVKK rızası', () => {
  it('kayıtlı rıza yok + kutu işaretli değil → 400, kod KVKK_ONAY_GEREKLI, /kayit ile aynı cümle; hiçbir şey yazılmaz', async () => {
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

  it('kayıtlı rıza yok + kutu işaretli → metadata (/kayit anahtarları) VE users satırı aynı an ve aynı sürümle damgalanır', async () => {
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
    assert.ok(an >= once - 1000 && an <= Date.now() + 1000, 'damga sunucunun saatiyle')
  })

  it('tarayıcının gönderdiği tarih / sürüm yok sayılır — damgayı sunucu basar', async () => {
    const h = hesap()
    await gonder(h.token, { ...HEKIM, kvkk_onay: true, kvkk_onay_tarihi: '1999-01-01T00:00:00.000Z', kvkk_metin_versiyonu: 'uydurma', kvkk_consent_at: '1999-01-01T00:00:00.000Z', kvkk_consent_version: 'uydurma' })
    const s = satir(h.id)!
    assert.equal(s.kvkk_consent_version, KVKK_METIN_VERSIYONU)
    assert.notEqual(s.kvkk_consent_at, '1999-01-01T00:00:00.000Z')
    assert.equal(metalar.get(h.id)!.kvkk_metin_versiyonu, KVKK_METIN_VERSIYONU)
  })

  it('rıza metadata\'da kayıtlı (/kayit) → sorulmaz; gövdede true gelse bile yeniden damgalanmaz', async () => {
    const h = hesap({ meta: KAYIT_RIZASI })
    const { durum } = await gonder(h.token, { ...HEKIM, kvkk_onay: true })
    assert.equal(durum, 200)
    assert.equal(metalar.get(h.id)!.kvkk_onay_tarihi, KAYIT_RIZASI.kvkk_onay_tarihi)
    assert.ok(!('kvkk_consent_at' in satir(h.id)!))
  })

  it('rıza users satırında kayıtlı → sorulmaz; satırdaki tarih ve sürüm değişmez, metadata\'ya rıza yazılmaz', async () => {
    const h = hesap({ satir: { full_name: 'qa', onboarding_completed: false, kvkk_consent_at: '2026-08-30T10:00:00.000Z', kvkk_consent_version: '1.0' } })
    const { durum } = await gonder(h.token, { ...HEKIM, kvkk_onay: true })
    assert.equal(durum, 200)
    assert.equal(satir(h.id)!.kvkk_consent_at, '2026-08-30T10:00:00.000Z')
    assert.equal(satir(h.id)!.kvkk_consent_version, '1.0')
    assert.ok(!('kvkk_onay' in metalar.get(h.id)!))
  })
})

describe('GET /api/users/profile — e-posta ve "rıza gerekli mi" kararı sunucudan', () => {
  it('oturum yoksa 401', async () => {
    assert.equal((await oku(null)).durum, 401)
  })
  it('giriş e-postası auth kaydından; rıza: yok → gerekli, metadata\'da → değil, satırda → değil', async () => {
    const yeni = hesap({ email: 'qa-yeni@ornek.test' })
    assert.deepEqual((await oku(yeni.token)).veri, { success: true, data: { email: 'qa-yeni@ornek.test', kvkk_onay_gerekli: true } })
    const kayitli = hesap({ meta: KAYIT_RIZASI })
    assert.equal((await oku(kayitli.token)).veri.data.kvkk_onay_gerekli, false)
    const satirda = hesap({ satir: { full_name: 'qa', kvkk_consent_at: '2026-08-30T10:00:00.000Z' } })
    assert.equal((await oku(satirda.token)).veri.data.kvkk_onay_gerekli, false)
    const yarim = hesap({ meta: { kvkk_onay: 'true' }, satir: { full_name: 'qa', kvkk_consent_at: null } })
    assert.equal((await oku(yarim.token)).veri.data.kvkk_onay_gerekli, true)
    assert.equal(satirYazimlari.length + metaYazimlari.length, 0, 'GET hiçbir şey yazmaz')
  })
})

describe('POST /api/users/profile — users.cep_telefonu kolonu yoksa (migration 150 uygulanmamış)', () => {
  for (const hata of [
    { code: 'PGRST204', message: "Could not find the 'cep_telefonu' column of 'users' in the schema cache" },
    { code: '42703', message: 'column "cep_telefonu" of relation "users" does not exist' },
  ]) {
    it(`${hata.code}: hekimin diğer yanıtları kaydedilir, telefon "kaydedilmedi" diye bildirilir ve günlüğe yazılır`, async () => {
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
      assert.equal(s.kvkk_consent_version, KVKK_METIN_VERSIYONU, 'rıza da kaybolmaz')
      assert.equal(metalar.get(h.id)!.onboarding_completed, true)
      assert.equal(satirYazimlari.length, 2, 'bir kez kolonla, bir kez kolonsuz')
      assert.ok('cep_telefonu' in satirYazimlari[0] && !('cep_telefonu' in satirYazimlari[1]))
      const satirGunlugu = gunluk.find((g) => g.includes('cep_telefonu'))
      assert.ok(satirGunlugu && satirGunlugu.includes('migration 150') && satirGunlugu.includes(h.id))
      assert.ok(!gunluk.some((g) => g.includes('5321234567') || g.includes('532 123')), 'numaranın kendisi günlüğe yazılmaz')
    })
  }

  it('satırı olan hesapta (update yolu) da aynı', async () => {
    cepKolonuYok = true
    const h = hesap({ meta: KAYIT_RIZASI, satir: { full_name: 'qa', onboarding_completed: false } })
    const { sonuc } = await sessiz(() => gonder(h.token, HEKIM))
    assert.equal(sonuc.durum, 200)
    assert.equal(sonuc.veri.telefon_kaydedildi, false)
    assert.equal(satir(h.id)!.first_name, 'Işıl')
    assert.ok(!('cep_telefonu' in satir(h.id)!))
  })
})

describe('POST /api/users/profile — diğer çağıranlar eskisi gibi çalışır', () => {
  it('hekim dışı meslekler onboarding\'i aynı adımla bitirir; unvan istenmez; uzmanlık eskisi gibi yazılır', async () => {
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
      assert.ok(!('title' in s) && !('hospital' in s), 'boş unvan / kurum yazılmaz')
      if (profession_type === 'mali') assert.equal(s.specialty, specialty)
      else if (profession_type === 'avukat') assert.ok(!('specialty' in s), 'avukat: rota yalnız `uzmanlik` alanını yazar (önceki davranış)')
      else assert.equal(s.specialty, klinikUzmanlikNorm(specialty))
      assert.equal(metalar.get(h.id)!.specialty, specialty)
    }
  })

  it('onboarding\'i bitmiş sıradan hekim: gönderdiği alan yazılır, branş DEĞİŞMEZ, eksik alan istenmez, rıza istenmez / damgalanmaz', async () => {
    const h = hesap({ satir: { full_name: 'Dr. QA Hekim', specialty: 'pediatri', profession_type: 'doktor', onboarding_completed: true } })
    const { durum, veri } = await gonder(h.token, { profession_type: 'doktor', specialty: 'kardiyoloji' })
    assert.equal(durum, 200)
    assert.ok(!('telefon_kaydedildi' in veri))
    const s = satir(h.id)!
    assert.equal(s.specialty, 'pediatri', 'branş kilidi yerinde')
    assert.equal(s.full_name, 'Dr. QA Hekim', 'ad dokunulmadan kalır')
    assert.ok(!('first_name' in s) && !('cep_telefonu' in s) && !('kvkk_consent_at' in s))
    assert.equal(metalar.get(h.id)!.specialty, 'pediatri')
    assert.ok(!('kvkk_onay' in metalar.get(h.id)!))
  })

  it('branş değiştirebilen süper kullanıcı: onboarding\'i bitmiş olsa da branşı yazılır; başka hiçbir şey istenmez', async () => {
    const h = hesap({ id: SUPERUSER_BRANS_IDS[0], satir: { full_name: 'QA Süper', specialty: 'pediatri', profession_type: 'doktor', onboarding_completed: true } })
    const { durum } = await gonder(h.token, { profession_type: 'doktor', specialty: 'kadin-dogum' })
    assert.equal(durum, 200)
    assert.equal(satir(h.id)!.specialty, 'kadin-dogum')
    assert.equal(satir(h.id)!.full_name, 'QA Süper')
    assert.equal(metalar.get(h.id)!.specialty, 'kadin-dogum')
  })

  it('eski gövde biçimi (unvan / büro_adi / sehir / full_name / uzmanlik_alani / baro / yil) onboarding\'i bitmiş hesapta eskisi gibi yazılır', async () => {
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
