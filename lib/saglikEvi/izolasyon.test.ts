/**
 * HASTA-PORTALI-GUNLUK × HASTA-İZOLASYON — the REAL route handlers of the daily health home against the stand-in
 * database (lib/security/testing/sahteSupabase.ts), two synthetic doctors A and B, each with a synthetic patient, a
 * PIN-unlocked portal token, a dose plan, readings, an alert and a push subscription.
 * Every case: positive control (own data reachable — proves the harness really ran the route) + A→B + B→A, and the
 * victim's rows unchanged. Also: PIN required on every portal route, KVKK consent gates the doctor's view, the Fısıltı
 * item stays with its own doctor, KVKK delete removes only the caller's rows.
 * Synthetic QA data only.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-saglik-evi-anahtari'
process.env.PORTAL_TOKEN_SECRET = 'qa-sentetik-portal-sirri'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NOTYA_VAPID_PUBLIC_KEY = ''

let db = new SahteVeritabani()
function sahteCreateClient(_u?: string, _k?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return { from: (t: string) => c().from(t), auth: { getUser: (j?: string) => c().auth.getUser(j) }, storage: { from: (k: string) => c().storage.from(k) }, rpc: (a: string, b: Record<string, string>) => c().rpc(a, b) }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}

type Hekim = { harf: 'A' | 'B'; id: string; jwt: string; hasta: string; token: string; plan: string; olcum: string; uyari: string; endpoint: string }
let NextRequestSinifi: typeof import('next/server').NextRequest
let R: Record<string, any>
let encrypt: (s: string) => string

const isaret = (h: string) => `GIZLI-${h}-7Q`

function hekimKur(harf: 'A' | 'B', onay: boolean): Hekim {
  const id = `00000000-0000-4000-8000-00000000000${harf === 'A' ? 1 : 2}`
  const jwt = `jwt-${harf}`
  db.kullanicilar.set(jwt, { id })
  const hasta = db.ekle('patients', { doctor_id: id, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta', soyad: isaret(harf) })), dob_encrypted: encrypt('1960-01-01') }).id
  const token = `qa-saglik-evi-${harf}`
  db.ekle('hasta_portal_tokens', { token_hash: token, doctor_id: id, patient_id: hasta, expires_at: new Date(Date.now() + 86400e3).toISOString(), pin_hash: 'sentetik' })
  db.ekle('users', { id, specialty: 'dahiliye' })
  const plan = db.ekle('ev_ilac_planlari', { doctor_id: id, patient_id: hasta, ad: `Ilac ${isaret(harf)}`, doz: null, saatler: ['08:00', '20:00'], gerektikce: false, kaynak: 'hekim', kritik: false, aktif: true }).id
  const olcum = db.ekle('ev_olcumleri', { doctor_id: id, patient_id: hasta, tip: 'kb', deger: harf === 'A' ? 131 : 147, deger2: 83, baglam: null, olcum_at: new Date(Date.now() - 3600e3).toISOString(), kaynak: 'portal' }).id
  const uyari = db.ekle('ev_uyarilar', { doctor_id: id, patient_id: hasta, kural: 'yuksek_bildir', anahtar: 'yuksek_bildir:kb', duzey: 'hekime_bildir', metrik: 'kb', hasta_metni: `Hasta notu ${isaret(harf)}`, hekim_metni: `Hekim notu ${isaret(harf)}`, veri: {}, olusturma_at: new Date().toISOString(), hasta_gordu_at: null, hekim_gordu_at: null }).id
  const endpoint = `https://fcm.googleapis.com/fcm/send/${harf}`
  db.ekle('ev_push_abonelikleri', { doctor_id: id, patient_id: hasta, endpoint, p256dh: 'x', auth: 'y' })
  db.ekle('ev_sorular', { doctor_id: id, patient_id: hasta, metin: `Soru ${isaret(harf)}`, kapandi_at: null })
  if (onay) db.ekle('ev_tercihler', { doctor_id: id, patient_id: hasta, paylasim_onayi: true, onay_at: new Date().toISOString(), sessiz_bas: '23:00', sessiz_bit: '07:00', hatirlatma_acik: true })
  return { harf, id, jwt, hasta, token, plan, olcum, uyari, endpoint }
}

async function cerez(token: string) {
  const { setUnlockCookie, UNLOCK_COOKIE } = await import('@/lib/portal/pinAuth')
  const { NextResponse } = await import('next/server')
  const res = NextResponse.json({})
  setUnlockCookie(res, token)
  return `${UNLOCK_COOKIE}=${res.cookies.get(UNLOCK_COOKIE)?.value}`
}
function iste(yontem: string, yol: string, o: { cerez?: string; jwt?: string; govde?: unknown } = {}) {
  const h: Record<string, string> = {}
  if (o.cerez) h.cookie = o.cerez
  if (o.jwt) h.authorization = `Bearer ${o.jwt}`
  if (o.govde !== undefined) h['content-type'] = 'application/json'
  return new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: h, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
const prm = <T extends object>(p: T) => ({ params: p })
async function coz(r: Response | Promise<Response>) { const y = await r; return { status: y.status, metin: await y.text() } }
const satir = (t: string, id: string) => JSON.stringify(db.tablo(t).find((x) => x.id === id))

describe('HASTA-PORTALI-GUNLUK: Sağlığım günlük rotaları hasta / hekim sınırını aşmaz', () => {
  before(async () => {
    ;({ encrypt } = await import('@/lib/security/encryption'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    const ice = (y: string) => import(`../../${y}`)
    R = {
      gunluk: await ice('app/api/portal/hasta/[token]/gunluk/route'),
      veri: await ice('app/api/portal/hasta/[token]/gunluk/veri/route'),
      push: await ice('app/api/portal/hasta/[token]/gunluk/push/route'),
      foto: await ice('app/api/portal/hasta/[token]/gunluk/foto/route'),
      manifest: await ice('app/api/portal/hasta/[token]/manifest/route'),
      evVerisi: await ice('app/api/doktor/hastalar/[id]/ev-verisi/route'),
    }
  })
  let A: Hekim, B: Hekim
  beforeEach(() => { db = new SahteVeritabani(); A = hekimKur('A', true); B = hekimKur('B', true) })

  it('PIN unlock is required on every portal route (no cookie → 401)', async () => {
    const yol = `/api/portal/hasta/${A.token}/gunluk`
    assert.equal((await coz(R.gunluk.GET(iste('GET', yol), prm({ token: A.token })))).status, 401)
    assert.equal((await coz(R.gunluk.POST(iste('POST', yol, { govde: { islem: 'olcum', tip: 'kb', deger: 120, deger2: 80 } }), prm({ token: A.token })))).status, 401)
    assert.equal((await coz(R.veri.GET(iste('GET', `${yol}/veri`), prm({ token: A.token })))).status, 401)
    assert.equal((await coz(R.push.POST(iste('POST', `${yol}/push`, { govde: {} }), prm({ token: A.token })))).status, 401)
    assert.equal((await coz(R.foto.POST(iste('POST', `${yol}/foto`, { govde: {} }), prm({ token: A.token })))).status, 401)
    assert.equal(db.tablo('ev_olcumleri').length, 2)
  })

  for (const [hh, dd] of [['A', 'B'], ['B', 'A']] as const) {
    it(`${hh} hastasının Bugün'ü: kendi ilacı ve ölçümü var, ${dd} hastasının hiçbir şeyi yok`, async () => {
      const h = hh === 'A' ? A : B
      const r = await coz(R.gunluk.GET(iste('GET', `/api/portal/hasta/${h.token}/gunluk`, { cerez: await cerez(h.token) }), prm({ token: h.token })))
      assert.equal(r.status, 200, r.metin.slice(0, 300))
      assert.ok(r.metin.includes(`Ilac ${isaret(hh)}`) && r.metin.includes(`Hasta notu ${isaret(hh)}`) && r.metin.includes(`Soru ${isaret(hh)}`), 'positive control')
      assert.ok(!r.metin.includes(isaret(dd)), 'foreign marker leaked')
      assert.ok(!r.metin.includes(`Hekim notu ${isaret(hh)}`), 'doctor text reached the patient')
    })

    it(`${hh} token'ı ${dd}'nin plan / ölçüm / uyarı / soru / abonelik kimliğiyle hiçbir şeyi değiştiremez`, async () => {
      const h = hh === 'A' ? A : B, v = hh === 'A' ? B : A
      const c = await cerez(h.token)
      const yol = `/api/portal/hasta/${h.token}/gunluk`
      const once = { plan: satir('ev_ilac_planlari', v.plan), olcum: satir('ev_olcumleri', v.olcum), uyari: satir('ev_uyarilar', v.uyari), dozlar: db.tablo('ev_doz_kayitlari').length }
      const bugun08 = (await import('./zaman')).trSaatAni((await import('./zaman')).trGun(Date.now()), '08:00')
      // positive control: own plan can be marked
      assert.equal((await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'doz', planIds: [h.plan], planlananAt: bugun08, durum: 'alindi' } }), prm({ token: h.token })))).status, 200)
      const dozlarSonra = db.tablo('ev_doz_kayitlari').length
      assert.equal(dozlarSonra, once.dozlar + 1)
      assert.equal((await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'doz', planIds: [v.plan], planlananAt: bugun08, durum: 'alindi' } }), prm({ token: h.token })))).status, 404)
      assert.equal((await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'doz', planIds: [h.plan, v.plan], planlananAt: bugun08, durum: 'alindi' } }), prm({ token: h.token })))).status, 404)
      assert.equal((await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'olcum-sil', id: v.olcum } }), prm({ token: h.token })))).status, 404)
      assert.equal((await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'plan', tur: 'saat', planId: v.plan, saatler: ['03:00'] } }), prm({ token: h.token })))).status, 404)
      await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'uyari-goruldu', idler: [v.uyari] } }), prm({ token: h.token })))
      await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'soru-sil', id: db.tablo('ev_sorular').find((s) => s.patient_id === v.hasta)!.id } }), prm({ token: h.token })))
      await coz(R.push.DELETE(iste('DELETE', `${yol}/push`, { cerez: c, govde: { endpoint: v.endpoint } }), prm({ token: h.token })))
      assert.equal(db.tablo('ev_doz_kayitlari').length, dozlarSonra, 'a foreign dose mark was written')
      assert.equal(satir('ev_ilac_planlari', v.plan), once.plan); assert.equal(satir('ev_olcumleri', v.olcum), once.olcum); assert.equal(satir('ev_uyarilar', v.uyari), once.uyari)
      assert.ok(db.tablo('ev_sorular').some((s) => s.patient_id === v.hasta)); assert.ok(db.tablo('ev_push_abonelikleri').some((s) => s.endpoint === v.endpoint))
    })

    it(`${hh} hastasının KVKK dışa aktarımı ve silmesi yalnız kendi satırları`, async () => {
      const h = hh === 'A' ? A : B, v = hh === 'A' ? B : A
      const c = await cerez(h.token)
      const yol = `/api/portal/hasta/${h.token}/gunluk/veri`
      const j = await coz(R.veri.GET(iste('GET', yol, { cerez: c }), prm({ token: h.token })))
      assert.equal(j.status, 200); assert.ok(j.metin.includes(isaret(hh))); assert.ok(!j.metin.includes(isaret(v.harf))); assert.ok(!j.metin.includes(h.id), 'doctor id in export')
      const csv = await coz(R.veri.GET(iste('GET', `${yol}?bicim=csv`, { cerez: c }), prm({ token: h.token })))
      assert.ok(csv.metin.includes('kb;')); assert.ok(!csv.metin.includes(String(v.harf === 'A' ? 131 : 147)))
      assert.equal((await coz(R.veri.DELETE(iste('DELETE', yol, { cerez: c, govde: {} }), prm({ token: h.token })))).status, 422)
      assert.equal((await coz(R.veri.DELETE(iste('DELETE', yol, { cerez: c, govde: { onay: 'SIL' } }), prm({ token: h.token })))).status, 200)
      assert.ok(!db.tablo('ev_olcumleri').some((x) => x.patient_id === h.hasta)); assert.ok(db.tablo('ev_olcumleri').some((x) => x.patient_id === v.hasta))
      assert.ok(db.tablo('ev_uyarilar').some((x) => x.patient_id === v.hasta)); assert.ok(db.tablo('ev_push_abonelikleri').some((x) => x.patient_id === v.hasta))
      assert.ok(db.tablo('ev_ilac_planlari').some((x) => x.patient_id === h.hasta), "the doctor's plan stays (doctor data)")
    })

    it(`${hh} hekimi Ev verisi kartında yalnız kendi hastasını görür ve değiştirir`, async () => {
      const h = hh === 'A' ? A : B, v = hh === 'A' ? B : A
      const kendi = `/api/doktor/hastalar/${h.hasta}/ev-verisi`, yabanci = `/api/doktor/hastalar/${v.hasta}/ev-verisi`
      const ok = await coz(R.evVerisi.GET(iste('GET', kendi, { jwt: h.jwt }), prm({ id: h.hasta })))
      assert.equal(ok.status, 200, ok.metin.slice(0, 200)); assert.ok(ok.metin.includes(`Hekim notu ${isaret(hh)}`) && ok.metin.includes(`Ilac ${isaret(hh)}`)); assert.ok(!ok.metin.includes(isaret(v.harf)))
      const y = await coz(R.evVerisi.GET(iste('GET', yabanci, { jwt: h.jwt }), prm({ id: v.hasta })))
      assert.equal(y.status, 404); assert.ok(!y.metin.includes(isaret(v.harf)))
      const once = { plan: satir('ev_ilac_planlari', v.plan), uyari: satir('ev_uyarilar', v.uyari), hedef: db.tablo('ev_hedefler').length }
      assert.equal((await coz(R.evVerisi.POST(iste('POST', yabanci, { jwt: h.jwt, govde: { islem: 'gordum' } }), prm({ id: v.hasta })))).status, 404)
      assert.equal((await coz(R.evVerisi.PATCH(iste('PATCH', yabanci, { jwt: h.jwt, govde: { ayarlar: { esikler: { kb: { hedefMax: 99 } } } } }), prm({ id: v.hasta })))).status, 404)
      // a foreign plan id on the doctor's OWN patient path: no row matches (id AND doctor_id AND patient_id)
      assert.equal((await coz(R.evVerisi.PATCH(iste('PATCH', kendi, { jwt: h.jwt, govde: { plan: { planId: v.plan, kritik: true } } }), prm({ id: h.hasta })))).status, 404)
      assert.equal(satir('ev_ilac_planlari', v.plan), once.plan); assert.equal(satir('ev_uyarilar', v.uyari), once.uyari); assert.equal(db.tablo('ev_hedefler').length, once.hedef)
      // positive control: own acknowledgement works
      assert.equal((await coz(R.evVerisi.POST(iste('POST', kendi, { jwt: h.jwt, govde: { islem: 'gordum' } }), prm({ id: h.hasta })))).status, 200)
      assert.ok(db.tablo('ev_uyarilar').find((u) => u.id === h.uyari)!.hekim_gordu_at)
      assert.equal(db.tablo('ev_uyarilar').find((u) => u.id === v.uyari)!.hekim_gordu_at, null)
    })
  }

  // HASTA-MODULLERI — the doctor's per-patient module switches (PATCH { modul }) and the patient's own module choice.
  for (const [hh, dd] of [['A', 'B'], ['B', 'A']] as const) {
    it(`${hh} hekimi modül anahtarını yalnız kendi hastasında değiştirir (${dd} hastası 404, satırı değişmez)`, async () => {
      const h = hh === 'A' ? A : B, v = hh === 'A' ? B : A
      const kendi = `/api/doktor/hastalar/${h.hasta}/ev-verisi`, yabanci = `/api/doktor/hastalar/${v.hasta}/ev-verisi`
      db.ekle('ev_hedefler', { doctor_id: v.id, patient_id: v.hasta, ayarlar: { moduller: { acik: ['spo2'], kapali: [] } }, updated_by: v.id, updated_at: new Date().toISOString() })
      const once = JSON.stringify(db.tablo('ev_hedefler').filter((x) => x.patient_id === v.hasta))
      for (const govde of [{ modul: { anahtar: 'glukoz', durum: 'kapali' } }, { modul: { anahtar: 'spo2', durum: 'otomatik' } }]) {
        assert.equal((await coz(R.evVerisi.PATCH(iste('PATCH', yabanci, { jwt: h.jwt, govde }), prm({ id: v.hasta })))).status, 404)
      }
      assert.equal(JSON.stringify(db.tablo('ev_hedefler').filter((x) => x.patient_id === v.hasta)), once, 'victim row changed')
      // positive control: own patient — switch glucose off, the card follows, the row carries both own ids
      const ok = await coz(R.evVerisi.PATCH(iste('PATCH', kendi, { jwt: h.jwt, govde: { modul: { anahtar: 'glukoz', durum: 'kapali' } } }), prm({ id: h.hasta })))
      assert.equal(ok.status, 200, ok.metin)
      const sat = db.tablo('ev_hedefler').filter((x) => x.patient_id === h.hasta)
      assert.deepEqual(sat.map((x) => [x.doctor_id, (x.ayarlar as Record<string, any>).moduller.kapali]), [[h.id, ['glukoz']]])
      const kart = JSON.parse((await coz(R.evVerisi.GET(iste('GET', kendi, { jwt: h.jwt }), prm({ id: h.hasta })))).metin)
      assert.ok(!kart.olcumTipleri.includes('glukoz') && kart.olcumTipleri.includes('kb'))
      assert.equal(kart.moduller.find((m: { anahtar: string }) => m.anahtar === 'glukoz').hekimSecimi, 'kapali')
      // the patient's Bugün follows the doctor's switch
      const bugun = JSON.parse((await coz(R.gunluk.GET(iste('GET', `/api/portal/hasta/${h.token}/gunluk`, { cerez: await cerez(h.token) }), prm({ token: h.token })))).metin)
      assert.ok(!bugun.olcumKartlari.some((k: { tip: string }) => k.tip === 'glukoz'))
      // the thresholds panel does not wipe the switches
      assert.equal((await coz(R.evVerisi.PATCH(iste('PATCH', kendi, { jwt: h.jwt, govde: { ayarlar: { esikler: { kb: { hedefMax: 125 } } } } }), prm({ id: h.hasta })))).status, 200)
      assert.deepEqual((db.tablo('ev_hedefler').find((x) => x.patient_id === h.hasta)!.ayarlar as Record<string, any>).moduller.kapali, ['glukoz'])
      assert.equal((await coz(R.evVerisi.PATCH(iste('PATCH', kendi, { jwt: h.jwt, govde: { modul: { anahtar: 'xx', durum: 'acik' } } }), prm({ id: h.hasta })))).status, 422)
    })

    it(`${hh} hastasının modül tercihi yalnız kendi kapsamına yazılır; hekim / tanı modülünü kapatamaz`, async () => {
      const h = hh === 'A' ? A : B, v = hh === 'A' ? B : A
      const c = await cerez(h.token)
      const yol = `/api/portal/hasta/${h.token}/gunluk`
      const onceV = satir('ev_tercihler', db.tablo('ev_tercihler').find((x) => x.patient_id === v.hasta)!.id)
      assert.equal((await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'tercih', modul: { anahtar: 'su', acik: true } } }), prm({ token: h.token })))).status, 200)
      assert.equal((await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'tercih', modul: { anahtar: 'nabiz', acik: false } } }), prm({ token: h.token })))).status, 200)
      assert.equal((await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'tercih', modul: { anahtar: 'zz', acik: true } } }), prm({ token: h.token })))).status, 422)
      const t = db.tablo('ev_tercihler').filter((x) => x.patient_id === h.hasta)
      assert.deepEqual(t.map((x) => [x.doctor_id, x.moduller]), [[h.id, { eklenen: ['su'], cikarilan: ['nabiz'] }]])
      assert.equal(satir('ev_tercihler', db.tablo('ev_tercihler').find((x) => x.patient_id === v.hasta)!.id), onceV, "the other patient's preferences changed")
      // a diagnosis on the file: BP comes from the file and the patient's "off" for it has no effect
      db.tablo('patients').find((x) => x.id === h.hasta)!.notes_encrypted = encrypt(JSON.stringify({ kronikHastaliklar: ['Hipertansiyon'] }))
      await coz(R.gunluk.POST(iste('POST', yol, { cerez: c, govde: { islem: 'tercih', modul: { anahtar: 'kb', acik: false } } }), prm({ token: h.token })))
      const d = JSON.parse((await coz(R.gunluk.GET(iste('GET', yol, { cerez: c }), prm({ token: h.token })))).metin)
      assert.deepEqual(d.olcumKartlari.map((k: { tip: string }) => k.tip), ['kb', 'su'])
      assert.ok(d.moduller.aktif.find((x: { anahtar: string }) => x.anahtar === 'kb').hekimTakip)
      assert.ok(!JSON.stringify(d).includes('Hipertansiyon'), 'the diagnosis name never reaches the patient')
    })

    it(`${hh} hastasının modülleri ${dd} hekiminin notlarındaki tanıdan etkilenmez`, async () => {
      const h = hh === 'A' ? A : B, v = hh === 'A' ? B : A
      db.tablo('patients').find((x) => x.id === h.hasta)!.notes_encrypted = encrypt(JSON.stringify({ kronikHastaliklar: ['Hipertansiyon'] }))
      // an approved note of the OTHER doctor carrying E11 on a session that names this patient (dirty row): ignored
      const ses = db.ekle('sessions', { doctor_id: v.id, patient_id: h.hasta, archived_at: null }).id
      db.ekle('notes', { doctor_id: v.id, session_id: ses, approved_at: new Date().toISOString(), created_at: new Date().toISOString(), icd10_codes: [{ code: 'E11.9' }] })
      const d = JSON.parse((await coz(R.gunluk.GET(iste('GET', `/api/portal/hasta/${h.token}/gunluk`, { cerez: await cerez(h.token) }), prm({ token: h.token })))).metin)
      assert.deepEqual(d.olcumKartlari.map((k: { tip: string }) => k.tip), ['kb'])
      // positive control: the same note by this patient's OWN doctor does turn glucose on
      const ses2 = db.ekle('sessions', { doctor_id: h.id, patient_id: h.hasta, archived_at: null }).id
      db.ekle('notes', { doctor_id: h.id, session_id: ses2, approved_at: new Date().toISOString(), created_at: new Date().toISOString(), icd10_codes: [{ code: 'E11.9' }] })
      const d2 = JSON.parse((await coz(R.gunluk.GET(iste('GET', `/api/portal/hasta/${h.token}/gunluk`, { cerez: await cerez(h.token) }), prm({ token: h.token })))).metin)
      assert.deepEqual(d2.olcumKartlari.map((k: { tip: string }) => k.tip), ['kb', 'glukoz'])
    })
  }

  it('KVKK: without the patient\'s consent the doctor sees no values, alerts or questions', async () => {
    db = new SahteVeritabani(); A = hekimKur('A', false); B = hekimKur('B', true)
    const r = await coz(R.evVerisi.GET(iste('GET', `/api/doktor/hastalar/${A.hasta}/ev-verisi`, { jwt: A.jwt }), prm({ id: A.hasta })))
    assert.equal(r.status, 200)
    const j = JSON.parse(r.metin)
    assert.equal(j.onay, false); assert.equal(j.kullaniyor, true); assert.deepEqual([j.metrikler.length, j.uyarilar.length, j.sorular.length], [0, 0, 0])
    assert.ok(!r.metin.includes('Hekim notu') && !r.metin.includes('Soru '))
  })

  it('Fısıltı: one item per own consented patient, never the other doctor\'s', async () => {
    const { evFisiltiOgeleri } = await import('./hekimSunucu')
    const a = await evFisiltiOgeleri(db.istemci() as never, A.id, 'dahiliye')
    assert.deepEqual(a.map((x) => x.patientId), [A.hasta]); assert.equal(a[0].kaynak, 'ev'); assert.ok(a[0].ad.includes(isaret('A')))
    assert.ok(!JSON.stringify(a).includes(isaret('B')))
    db.tablo('ev_tercihler').find((t) => t.patient_id === A.hasta)!.paylasim_onayi = false
    assert.deepEqual(await evFisiltiOgeleri(db.istemci() as never, A.id, 'dahiliye'), [])
  })

  it('a new reading runs the rules inside the token scope only', async () => {
    const c = await cerez(A.token)
    const r = await coz(R.gunluk.POST(iste('POST', `/api/portal/hasta/${A.token}/gunluk`, { cerez: c, govde: { islem: 'olcum', tip: 'kb', deger: 185, deger2: 100 } }), prm({ token: A.token })))
    assert.equal(r.status, 200, r.metin); assert.match(r.metin, /112/)
    const yeni = db.tablo('ev_olcumleri').filter((x) => x.deger === 185)
    assert.deepEqual(yeni.map((x) => [x.doctor_id, x.patient_id]), [[A.id, A.hasta]])
    const u = db.tablo('ev_uyarilar').filter((x) => x.kural === 'cok_yuksek')
    assert.deepEqual(u.map((x) => [x.doctor_id, x.patient_id, x.duzey]), [[A.id, A.hasta, 'acil']])
  })

  it('the install manifest carries only the patient\'s own link', async () => {
    const r = await coz(R.manifest.GET(iste('GET', `/api/portal/hasta/${A.token}/manifest`), prm({ token: A.token })))
    const j = JSON.parse(r.metin)
    assert.equal(j.start_url, `/portal/hasta/${A.token}`); assert.ok(!r.metin.includes(isaret('A')))
  })
})
