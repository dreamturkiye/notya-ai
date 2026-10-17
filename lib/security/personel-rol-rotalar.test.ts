/**
 * MOBIL-PERSONEL-01 — role enforcement on the REAL route handlers, against the in-memory Supabase stand-in
 * (lib/security/testing/sahteSupabase.ts). Two synthetic doctors (A, B), each with a patient, a signed note, a
 * draft note and an appointment; staff of A in every role, staff of B (asistan).
 *
 * What is proven here (and what is NOT): application-level enforcement only. RLS is not emulated, nothing runs
 * against a real Supabase project, and no real device or session is involved.
 *
 *   npm test
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from './testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-personel-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'

let db = new SahteVeritabani()
const KOK = resolve(__dirname, '../..')
const yerel = (yol: string) => pathToFileURL(join(KOK, yol)).href

function sahteCreateClient(_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: {
      getUser: (j?: string) => c().auth.getUser(j),
      admin: { updateUserById: async () => ({ data: null, error: null }), signOut: async () => ({ error: null }), createUser: async () => ({ data: null, error: null }) },
    },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
mock.module(yerel('lib/alarm.ts'), { namedExports: { kritikAlarm: async () => undefined } })
globalThis.fetch = (async (girdi: unknown) => { throw new Error(`personel-rol testi ağ erişimi yapamaz: ${String(girdi)}`) }) as typeof fetch

let NextRequestSinifi: typeof import('next/server').NextRequest
let encrypt: (s: string) => string
function iste(yontem: string, yol: string, o: { token?: string; govde?: unknown } = {}) {
  const basliklar: Record<string, string> = {}
  if (o.token) basliklar.authorization = `Bearer ${o.token}`
  if (o.govde !== undefined) basliklar['content-type'] = 'application/json'
  return new NextRequestSinifi(`http://localhost${yol}`, {
    method: yontem, headers: basliklar, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined,
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
const ARALIK = `baslangic=${encodeURIComponent(new Date(Date.now() - 86400e3).toISOString())}&bitis=${encodeURIComponent(new Date(Date.now() + 3 * 86400e3).toISOString())}`
const prm = <T extends object>(p: T) => ({ params: Object.assign(Promise.resolve(p), p) })
async function coz(r: Response | Promise<Response>) {
  const y = await r
  const metin = await y.text()
  return { status: y.status, metin }
}

type Rotalar = Record<string, any>
let R: Rotalar

type Hekim = { harf: 'A' | 'B'; id: string; token: string; hasta: string; not: string; taslakNot: string; randevu: string }
type Personel = { token: string; userId: string; personelId: string }
let A: Hekim, B: Hekim
let sekreterA: Personel, asistanA: Personel, danismanA: Personel, asistanB: Personel

const GIZLI = (h: string) => `GIZLI-${h}-7Q`
const KRONIK = (h: string) => `KRONIK-${h}-9X`

function hekimKur(harf: 'A' | 'B'): Hekim {
  const id = randomUUID()
  const token = `qa-hekim-token-${harf}`
  db.kullanicilar.set(token, { id, email: `qa-hekim-${harf}@ornek.test` })
  db.ekle('users', { id, full_name: `QA Hekim ${harf}`, specialty: 'pediatri' })
  const hasta = db.ekle('patients', {
    doctor_id: id, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: `QA Hasta ${GIZLI(harf)}` })),
    dob_encrypted: encrypt('2019-03-01'), gender_encrypted: encrypt('female'),
    phone_encrypted: encrypt(harf === 'A' ? '05550000001' : '05550000002'),
    email_encrypted: encrypt(`qa-hasta-${harf}@ornek.test`),
    notes_encrypted: encrypt(JSON.stringify({ sehir: `Sehir ${harf}`, kronikHastaliklar: [KRONIK(harf)], alerjiler: `Alerji ${KRONIK(harf)}` })),
  }).id
  const seans = db.ekle('sessions', { doctor_id: id, patient_id: hasta, specialty: 'pediatri', status: 'completed' }).id
  const not = db.ekle('notes', { session_id: seans, doctor_id: id, note_type: 'soap', approved_at: new Date().toISOString(), content_plan: `Plan ${GIZLI(harf)}`, content_ilaclar: [], vitaller: {} }).id
  const seans2 = db.ekle('sessions', { doctor_id: id, patient_id: hasta, specialty: 'pediatri', status: 'completed' }).id
  const taslakNot = db.ekle('notes', { session_id: seans2, doctor_id: id, note_type: 'soap', approved_at: null, content_plan: `Taslak ${GIZLI(harf)}`, content_ilaclar: [], vitaller: {} }).id
  const bas = new Date(Date.now() + 3600e3).toISOString()
  const randevu = db.ekle('randevular', { doktor_id: id, patient_id: hasta, baslangic: bas, bitis: new Date(Date.now() + 2 * 3600e3).toISOString(), durum: 'planlandi', tur: 'muayene', notlar: `Randevu ${GIZLI(harf)}` }).id
  return { harf, id, token, hasta, not, taslakNot, randevu }
}
function personelKur(h: Hekim, rol: string | undefined, ad: string, aktif = true): Personel {
  const userId = randomUUID()
  const token = `qa-personel-token-${ad}`
  db.kullanicilar.set(token, { id: userId, email: `${ad}@ornek.test` })
  const satir: Record<string, unknown> = { doktor_id: h.id, user_id: userId, ad_soyad: `QA ${ad}`, email: `${ad}@ornek.test`, aktif, davet_kabul_edildi_at: new Date().toISOString() }
  if (rol !== undefined) satir.rol = rol
  const personelId = db.ekle('personel', satir).id
  return { token, userId, personelId }
}
function sahneKur() {
  db = new SahteVeritabani()
  A = hekimKur('A')
  B = hekimKur('B')
  sekreterA = personelKur(A, 'sekreter', 'sekreterA')
  asistanA = personelKur(A, 'asistan', 'asistanA')
  danismanA = personelKur(A, 'hasta_danismani', 'danismanA')
  asistanB = personelKur(B, 'asistan', 'asistanB')
}

describe('personel rolleri — gerçek route handler\'ları', () => {
  before(async () => {
    ;({ encrypt } = await import('../security/encryption'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    const ice = (y: string) => import(`../../${y}`)
    R = {
      hastalar: await ice('app/api/doktor/hastalar/route'),
      hasta: await ice('app/api/doktor/hastalar/[id]/route'),
      olcumler: await ice('app/api/doktor/hastalar/[id]/olcumler/route'),
      notDetay: await ice('app/api/notes/[id]/route'),
      notOnay: await ice('app/api/notes/[id]/approve/route'),
      randevular: await ice('app/api/doktor/randevular/route'),
      randevu: await ice('app/api/doktor/randevular/[id]/route'),
      personel: await ice('app/api/doktor/personel/route'),
      personelId: await ice('app/api/doktor/personel/[id]/route'),
      me: await ice('app/api/personel/me/route'),
      oturum: await ice('app/api/doktor/hesap/oturum/route'),
      muhasebe: await ice('app/api/accounting/reports/route'),
      gelen: await ice('app/api/doktor/gelen-belgeler/route'),
      belgeler: await ice('app/api/doktor/documents/route'),
    }
  })
  beforeEach(() => sahneKur())

  describe('hasta izolasyonu — personel yalnız kendi hekiminin hastasını görür', () => {
    for (const [ad, secici] of [['sekreter', () => sekreterA], ['asistan', () => asistanA]] as const) {
      it(`${ad} (A) A'nın hastasını okur, B'nin hastasını okuyamaz (404, B işareti yok)`, async () => {
        const k = secici()
        const kendi = await coz(R.hasta.GET(iste('GET', `/api/doktor/hastalar/${A.hasta}`, { token: k.token }), prm({ id: A.hasta })))
        assert.equal(kendi.status, 200)
        assert.ok(kendi.metin.includes(GIZLI('A')), 'pozitif kontrol: kendi hekiminin hastası görünmeli')
        const yabanci = await coz(R.hasta.GET(iste('GET', `/api/doktor/hastalar/${B.hasta}`, { token: k.token }), prm({ id: B.hasta })))
        assert.equal(yabanci.status, 404)
        assert.ok(!yabanci.metin.includes(GIZLI('B')))
      })
    }

    it('B\'nin asistanı A\'nın hastasını / notunu / listesini göremez', async () => {
      const h = await coz(R.hasta.GET(iste('GET', `/api/doktor/hastalar/${A.hasta}`, { token: asistanB.token }), prm({ id: A.hasta })))
      assert.equal(h.status, 404); assert.ok(!h.metin.includes(GIZLI('A')))
      const n = await coz(R.notDetay.GET(iste('GET', `/api/notes/${A.not}`, { token: asistanB.token }), prm({ id: A.not })))
      assert.equal(n.status, 404); assert.ok(!n.metin.includes(GIZLI('A')))
      const liste = await coz(R.hastalar.GET(iste('GET', '/api/doktor/hastalar', { token: asistanB.token })))
      assert.equal(liste.status, 200)
      assert.ok(!liste.metin.includes(GIZLI('A')), 'B personelinin listesinde A hastası olmamalı')
      assert.ok(liste.metin.includes(GIZLI('B')))
    })

    it('hasta danışmanı yabancı hastanın randevusunu / ölçümünü göremez ya da yazamaz', async () => {
      const liste = await coz(R.randevular.GET(iste('GET', `/api/doktor/randevular?${ARALIK}`, { token: danismanA.token })))
      assert.equal(liste.status, 200)
      assert.ok(liste.metin.includes(GIZLI('A')) && !liste.metin.includes(GIZLI('B')))
      const once = db.tablo('cihaz_olcumleri').length
      const y = await coz(R.olcumler.POST(iste('POST', `/api/doktor/hastalar/${B.hasta}/olcumler`, { token: asistanA.token, govde: { tur: 'ates', deger: '38' } }), prm({ id: B.hasta })))
      assert.equal(y.status, 404)
      assert.equal(db.tablo('cihaz_olcumleri').length, once, 'yabancı hastaya satır yazılmamalı')
    })

    it('personelin işi bırakılmış (aktif=false) hesabı A\'nın verisine ulaşamaz', async () => {
      const eski = personelKur(A, 'asistan', 'eskiAsistan', false)
      const r = await coz(R.hasta.GET(iste('GET', `/api/doktor/hastalar/${A.hasta}`, { token: eski.token }), prm({ id: A.hasta })))
      assert.equal(r.status, 404); assert.ok(!r.metin.includes(GIZLI('A')))
    })

    it('tanınmayan rol değeri 403 ile reddedilir', async () => {
      const garip = personelKur(A, 'yonetici', 'garip')
      const r = await coz(R.hasta.GET(iste('GET', `/api/doktor/hastalar/${A.hasta}`, { token: garip.token }), prm({ id: A.hasta })))
      assert.equal(r.status, 403)
    })
  })

  describe('hasta danışmanı — klinik içerik yok', () => {
    it('hasta kartında yalnız kimlik + iletişim döner (kronik hastalık / alerji / klinik özet yok)', async () => {
      const r = await coz(R.hasta.GET(iste('GET', `/api/doktor/hastalar/${A.hasta}`, { token: danismanA.token }), prm({ id: A.hasta })))
      assert.equal(r.status, 200)
      assert.ok(r.metin.includes(GIZLI('A')) && r.metin.includes('05550000001'), 'ad + telefon görünmeli')
      assert.ok(!r.metin.includes(KRONIK('A')), 'kronik hastalık / alerji sızmamalı')
      assert.ok(!r.metin.includes('genel_ozet') && !r.metin.includes('anne_boy_cm'))
    })
    it('doktor ve sekreter aynı kartta klinik alanları görmeye devam eder (davranış değişmedi)', async () => {
      for (const token of [A.token, sekreterA.token, asistanA.token]) {
        const r = await coz(R.hasta.GET(iste('GET', `/api/doktor/hastalar/${A.hasta}`, { token }), prm({ id: A.hasta })))
        assert.equal(r.status, 200)
        assert.ok(r.metin.includes(KRONIK('A')), `klinik alan görünmeli (${token})`)
      }
    })
    it('not içeriğini okuyamaz (403, içerik yok)', async () => {
      const r = await coz(R.notDetay.GET(iste('GET', `/api/notes/${A.not}`, { token: danismanA.token }), prm({ id: A.not })))
      assert.equal(r.status, 403)
      assert.ok(!r.metin.includes(GIZLI('A')))
    })
    it('hasta düzenlemede klinik alan yazamaz, iletişim alanını yazabilir', async () => {
      const r = await coz(R.hasta.PUT(iste('PUT', `/api/doktor/hastalar/${A.hasta}`, { token: danismanA.token, govde: { telefon: '05559998877', alerjiler: 'HILELI-ALERJI' } }), prm({ id: A.hasta })))
      assert.equal(r.status, 200)
      const satir = db.tablo('patients').find((p) => p.id === A.hasta)!
      const { decrypt } = await import('../security/encryption')
      assert.equal(decrypt(satir.phone_encrypted), '05559998877')
      assert.ok(!decrypt(satir.notes_encrypted).includes('HILELI-ALERJI'), 'klinik alan değişmemeli')
    })
    it('randevuyu yönetebilir; fatura, gelen belge, ölçüm ve ek reddedilir', async () => {
      const yeni = await coz(R.randevular.POST(iste('POST', '/api/doktor/randevular', { token: danismanA.token, govde: { patientId: A.hasta, baslangic: new Date(Date.now() + 5 * 3600e3).toISOString(), bitis: new Date(Date.now() + 6 * 3600e3).toISOString(), tur: 'muayene' } })))
      assert.notEqual(yeni.status, 403, 'randevu oluşturma rol tarafından engellenmemeli')
      for (const c of [
        R.muhasebe.GET(iste('GET', '/api/accounting/reports', { token: danismanA.token })),
        R.gelen.GET(iste('GET', '/api/doktor/gelen-belgeler', { token: danismanA.token })),
        R.olcumler.POST(iste('POST', `/api/doktor/hastalar/${A.hasta}/olcumler`, { token: danismanA.token, govde: { tur: 'ates', deger: '37' } }), prm({ id: A.hasta })),
        R.belgeler.GET(iste('GET', `/api/doktor/documents?patientId=${A.hasta}`, { token: danismanA.token })),
      ]) assert.equal((await coz(c)).status, 403)
    })
  })

  describe('asistan — okur, ölçüm/ek ekler, onaylayamaz', () => {
    it('not içeriğini okur', async () => {
      const r = await coz(R.notDetay.GET(iste('GET', `/api/notes/${A.not}`, { token: asistanA.token }), prm({ id: A.not })))
      assert.equal(r.status, 200); assert.ok(r.metin.includes(GIZLI('A')))
    })
    it('notu ONAYLAYAMAZ (taslak onaysız kalır)', async () => {
      const r = await coz(R.notOnay.POST(iste('POST', `/api/notes/${A.taslakNot}/approve`, { token: asistanA.token, govde: {} }), prm({ id: A.taslakNot })))
      assert.notEqual(r.status, 200)
      assert.equal(db.tablo('notes').find((n) => n.id === A.taslakNot)!.approved_at, null)
    })
    it('taslak notu SİLEMEZ (403); sekreter de silemez (MOBIL-PERSONEL-04)', async () => {
      const r = await coz(R.notDetay.DELETE(iste('DELETE', `/api/notes/${A.taslakNot}`, { token: asistanA.token }), prm({ id: A.taslakNot })))
      assert.equal(r.status, 403)
      assert.ok(db.tablo('notes').some((n) => n.id === A.taslakNot))
      const s = await coz(R.notDetay.DELETE(iste('DELETE', `/api/notes/${A.taslakNot}`, { token: sekreterA.token }), prm({ id: A.taslakNot })))
      assert.equal(s.status, 403, 'MOBIL-PERSONEL-04: sekreter hiçbir notu silemez')
      assert.ok(db.tablo('notes').some((n) => n.id === A.taslakNot), 'not silinmemiş olmalı')
    })
    it('hasta kaydını / randevuyu değiştiremez, fatura ve personele erişemez', async () => {
      const once = JSON.stringify(db.tablo('randevular'))
      for (const c of [
        R.hasta.PUT(iste('PUT', `/api/doktor/hastalar/${A.hasta}`, { token: asistanA.token, govde: { telefon: '0' } }), prm({ id: A.hasta })),
        R.hastalar.POST(iste('POST', '/api/doktor/hastalar', { token: asistanA.token, govde: { adSoyad: 'Yeni' } })),
        R.randevular.POST(iste('POST', '/api/doktor/randevular', { token: asistanA.token, govde: { patientId: A.hasta } })),
        R.randevu.PATCH(iste('PATCH', `/api/doktor/randevular/${A.randevu}`, { token: asistanA.token, govde: { durum: 'iptal' } }), prm({ id: A.randevu })),
        R.muhasebe.GET(iste('GET', '/api/accounting/reports', { token: asistanA.token })),
        R.personel.GET(iste('GET', '/api/doktor/personel', { token: asistanA.token })),
        R.personel.POST(iste('POST', '/api/doktor/personel', { token: asistanA.token, govde: { ad: 'X', soyad: 'Y', email: 'x@y.zz', rol: 'sekreter' } })),
        R.gelen.GET(iste('GET', '/api/doktor/gelen-belgeler', { token: asistanA.token })),
      ]) assert.equal((await coz(c)).status, 403)
      assert.equal(JSON.stringify(db.tablo('randevular')), once, 'randevular değişmemeli')
    })
    it('randevuları görür (yalnız kendi hekiminin)', async () => {
      const r = await coz(R.randevular.GET(iste('GET', `/api/doktor/randevular?${ARALIK}`, { token: asistanA.token })))
      assert.equal(r.status, 200); assert.ok(r.metin.includes(GIZLI('A')) && !r.metin.includes(GIZLI('B')))
    })
    it('ölçüm ekler: satır doktor_id = hekim, onaylandi=false, kaydeden asistan; geçersiz değer 400', async () => {
      const r = await coz(R.olcumler.POST(iste('POST', `/api/doktor/hastalar/${A.hasta}/olcumler`, { token: asistanA.token, govde: { tur: 'ates', deger: '38,4' } }), prm({ id: A.hasta })))
      assert.equal(r.status, 201)
      const satir = db.tablo('cihaz_olcumleri')[0]
      assert.equal(satir.doctor_id, A.id); assert.equal(satir.patient_id, A.hasta)
      assert.equal(satir.deger, '38.4'); assert.equal(satir.onaylandi, false); assert.equal(satir.note_id, null)
      assert.equal(satir.ayrinti.kaydeden.rol, 'asistan'); assert.equal(satir.ayrinti.kaydeden.personelId, asistanA.personelId)
      const kotu = await coz(R.olcumler.POST(iste('POST', `/api/doktor/hastalar/${A.hasta}/olcumler`, { token: asistanA.token, govde: { tur: 'ates', deger: '99' } }), prm({ id: A.hasta })))
      assert.equal(kotu.status, 400)
      const tansiyon = await coz(R.olcumler.POST(iste('POST', `/api/doktor/hastalar/${A.hasta}/olcumler`, { token: asistanA.token, govde: { tur: 'tansiyon', deger: '120', ikinci: '80' } }), prm({ id: A.hasta })))
      assert.equal(tansiyon.status, 201)
    })
    it('sekreter ölçüm ekleyemez (yeni yetki kazanmadı); doktor ekleyebilir', async () => {
      const s = await coz(R.olcumler.POST(iste('POST', `/api/doktor/hastalar/${A.hasta}/olcumler`, { token: sekreterA.token, govde: { tur: 'ates', deger: '37' } }), prm({ id: A.hasta })))
      assert.equal(s.status, 403)
      const d = await coz(R.olcumler.POST(iste('POST', `/api/doktor/hastalar/${A.hasta}/olcumler`, { token: A.token, govde: { tur: 'nabiz', deger: '90' } }), prm({ id: A.hasta })))
      assert.equal(d.status, 201)
    })
    it('ek (belge) listeler: asistan evet, sekreter hayır (eskiden de erişemiyordu)', async () => {
      const a = await coz(R.belgeler.GET(iste('GET', `/api/doktor/documents?patientId=${A.hasta}`, { token: asistanA.token })))
      assert.notEqual(a.status, 403)
      const s = await coz(R.belgeler.GET(iste('GET', `/api/doktor/documents?patientId=${A.hasta}`, { token: sekreterA.token })))
      assert.equal(s.status, 403)
    })
  })

  describe('sekreter — değişmedi', () => {
    it('hasta, randevu okur; muayene notunu OKUYAMAZ (403); hasta düzenler; randevu oluşturur', async () => {
      const t = sekreterA.token
      assert.equal((await coz(R.hasta.GET(iste('GET', `/api/doktor/hastalar/${A.hasta}`, { token: t }), prm({ id: A.hasta })))).status, 200)
      assert.equal((await coz(R.notDetay.GET(iste('GET', `/api/notes/${A.not}`, { token: t }), prm({ id: A.not })))).status, 403)
      assert.equal((await coz(R.randevular.GET(iste('GET', `/api/doktor/randevular?${ARALIK}`, { token: t })))).status, 200)
      assert.equal((await coz(R.hasta.PUT(iste('PUT', `/api/doktor/hastalar/${A.hasta}`, { token: t, govde: { sehir: 'Ankara' } }), prm({ id: A.hasta })))).status, 200)
    })
    it('personel yönetimine ve (yeni) derin kısıtlara dokunmaz: personel listesi 403 (sadeceDoktor)', async () => {
      assert.equal((await coz(R.personel.GET(iste('GET', '/api/doktor/personel', { token: sekreterA.token })))).status, 403)
    })
    it('rol sütunu olmayan eski satır sekreter sayılır', async () => {
      const eski = personelKur(A, undefined, 'eskiSekreter')
      const r = await coz(R.hasta.GET(iste('GET', `/api/doktor/hastalar/${A.hasta}`, { token: eski.token }), prm({ id: A.hasta })))
      assert.equal(r.status, 200)
      const me = await coz(R.me.GET(iste('GET', '/api/personel/me', { token: eski.token })))
      assert.equal(JSON.parse(me.metin).rol, 'sekreter')
    })
  })

  describe('personel yönetimi — yalnız doktor, yalnız kendi personeli', () => {
    it('davet: rol belirtilmezse sekreter; asistan / hasta_danismani kabul; geçersiz rol 400', async () => {
      const govde = (rol?: string) => ({ ad: 'Ayşe', soyad: 'Test', email: `yeni${Math.random()}@ornek.test`, ...(rol ? { rol } : {}) })
      const d = await coz(R.personel.POST(iste('POST', '/api/doktor/personel', { token: A.token, govde: govde() })))
      assert.equal(d.status, 200); assert.equal(JSON.parse(d.metin).personel.rol, 'sekreter')
      const a = await coz(R.personel.POST(iste('POST', '/api/doktor/personel', { token: A.token, govde: govde('asistan') })))
      assert.equal(JSON.parse(a.metin).personel.rol, 'asistan')
      const h = await coz(R.personel.POST(iste('POST', '/api/doktor/personel', { token: A.token, govde: govde('hasta_danismani') })))
      assert.equal(JSON.parse(h.metin).personel.rol, 'hasta_danismani')
      const k = await coz(R.personel.POST(iste('POST', '/api/doktor/personel', { token: A.token, govde: govde('doktor') })))
      assert.equal(k.status, 400)
      const roller = db.tablo('personel').filter((p) => p.doktor_id === A.id).map((p) => p.rol)
      assert.ok(roller.includes('asistan') && roller.includes('hasta_danismani'))
      assert.equal(db.tablo('personel_rol_gecmisi').filter((g) => g.olay === 'davet').length, 3, 'her davet günlüğe yazılır')
    })
    it('doktor rolü değiştirir + günlüğe yazılır; yeni rol anında geçerli (asistan → not siler=hayır, danışman → not okuyamaz)', async () => {
      const r = await coz(R.personelId.PATCH(iste('PATCH', `/api/doktor/personel/${asistanA.personelId}`, { token: A.token, govde: { rol: 'hasta_danismani' } }), prm({ id: asistanA.personelId })))
      assert.equal(r.status, 200)
      const g = db.tablo('personel_rol_gecmisi')
      assert.equal(g.length, 1)
      assert.equal(g[0].olay, 'rol_degisti'); assert.equal(g[0].eski_rol, 'asistan'); assert.equal(g[0].yeni_rol, 'hasta_danismani'); assert.equal(g[0].yapan_id, A.id)
      const not = await coz(R.notDetay.GET(iste('GET', `/api/notes/${A.not}`, { token: asistanA.token }), prm({ id: A.not })))
      assert.equal(not.status, 403, 'rol değişikliği bir sonraki istekte geçerli')
    })
    it('doktor erişimi kapatır (aktif=false) ve kaldırır; ikisi de günlükte', async () => {
      await coz(R.personelId.PATCH(iste('PATCH', `/api/doktor/personel/${asistanA.personelId}`, { token: A.token, govde: { aktif: false } }), prm({ id: asistanA.personelId })))
      const r = await coz(R.hasta.GET(iste('GET', `/api/doktor/hastalar/${A.hasta}`, { token: asistanA.token }), prm({ id: A.hasta })))
      assert.equal(r.status, 404, 'kapatılan personel hekimin verisini göremez')
      await coz(R.personelId.DELETE(iste('DELETE', `/api/doktor/personel/${asistanA.personelId}`, { token: A.token }), prm({ id: asistanA.personelId })))
      assert.ok(!db.tablo('personel').some((p) => p.id === asistanA.personelId))
      assert.deepEqual(db.tablo('personel_rol_gecmisi').map((g) => g.olay), ['aktiflik_degisti', 'kaldirildi'])
    })
    it('doktor B, A\'nın personelinin rolünü değiştiremez / silemez (404, satır aynı)', async () => {
      const once = JSON.stringify(db.tablo('personel'))
      const p = await coz(R.personelId.PATCH(iste('PATCH', `/api/doktor/personel/${asistanA.personelId}`, { token: B.token, govde: { rol: 'sekreter' } }), prm({ id: asistanA.personelId })))
      assert.equal(p.status, 404)
      const d = await coz(R.personelId.DELETE(iste('DELETE', `/api/doktor/personel/${asistanA.personelId}`, { token: B.token }), prm({ id: asistanA.personelId })))
      assert.equal(d.status, 404)
      assert.equal(JSON.stringify(db.tablo('personel')), once)
    })
    it('personel (hiçbir rol) kendi rolünü yükseltemez', async () => {
      for (const p of [sekreterA, asistanA, danismanA]) {
        const r = await coz(R.personelId.PATCH(iste('PATCH', `/api/doktor/personel/${p.personelId}`, { token: p.token, govde: { rol: 'sekreter' } }), prm({ id: p.personelId })))
        assert.equal(r.status, 403)
      }
      assert.equal(db.tablo('personel').find((x) => x.id === asistanA.personelId)!.rol, 'asistan')
    })
    it('PATCH geçersiz rol / boş gövde 400', async () => {
      assert.equal((await coz(R.personelId.PATCH(iste('PATCH', `/api/doktor/personel/${asistanA.personelId}`, { token: A.token, govde: { rol: 'admin' } }), prm({ id: asistanA.personelId })))).status, 400)
      assert.equal((await coz(R.personelId.PATCH(iste('PATCH', `/api/doktor/personel/${asistanA.personelId}`, { token: A.token, govde: {} }), prm({ id: asistanA.personelId })))).status, 400)
    })
    it('GET /api/personel/me gerçek rolü döner (üç rol)', async () => {
      for (const [p, rol] of [[sekreterA, 'sekreter'], [asistanA, 'asistan'], [danismanA, 'hasta_danismani']] as const) {
        const me = await coz(R.me.GET(iste('GET', '/api/personel/me', { token: p.token })))
        assert.equal(me.status, 200); assert.equal(JSON.parse(me.metin).rol, rol)
      }
    })
  })

  describe('Oturumlar (c)', () => {
    it('GET kendi son girişini ve cihaz etiketini döner; DELETE tüm oturumları kapatır (her rol, yalnız kendi hesabı)', async () => {
      for (const t of [A.token, sekreterA.token, asistanA.token, danismanA.token]) {
        const g = await coz(R.oturum.GET(iste('GET', '/api/doktor/hesap/oturum', { token: t })))
        assert.equal(g.status, 200); assert.ok('buCihaz' in JSON.parse(g.metin))
        const d = await coz(R.oturum.DELETE(iste('DELETE', '/api/doktor/hesap/oturum', { token: t })))
        assert.equal(d.status, 200)
      }
      assert.equal((await coz(R.oturum.DELETE(iste('DELETE', '/api/doktor/hesap/oturum')))).status, 401)
    })
  })
})
