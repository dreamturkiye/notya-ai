/**
 * NOTYA-ILETISIM-01 — the real route handlers against the in-memory Supabase stand-in
 * (lib/security/testing/sahteSupabase.ts): staff (sekreter) permissions enforced on the SERVER,
 * consent gating, the sender logged, the queue built by the cron without duplicates, the Sağlığım
 * notice queued once per day, and the soft fall-back while migration 095 is not applied.
 * Cross-doctor isolation of the same routes lives in lib/security/hasta-izolasyon.test.ts.
 *
 * Synthetic QA data only.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-iletisim-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.CRON_SECRET = 'qa-cron-sirri'

let db = new SahteVeritabani()
/** Tables that "do not exist yet" (migration 095 not applied) — every query on them answers 42P01. */
const eksikTablolar = new Set<string>()

function eksikTabloZinciri(): unknown {
  const sonuc = { data: null, error: { code: '42P01', message: 'relation does not exist' } }
  const z: any = new Proxy({}, { get: (_h, k) => (k === 'then' ? (coz: (v: unknown) => unknown) => Promise.resolve(sonuc).then(coz) : () => z) })
  return z
}
function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => (eksikTablolar.has(t) ? eksikTabloZinciri() : c().from(t)),
    auth: { getUser: (j?: string) => c().auth.getUser(j) },
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
globalThis.fetch = (async (g: unknown) => { throw new Error(`iletişim testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

let encrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest
type Rotalar = Record<string, any>
let R: Rotalar

/** A fixed time tomorrow in Turkey (UTC+3). */
function yarinTr(saat: number, dakika = 0): string {
  const simdiTr = new Date(Date.now() + 3 * 3600e3)
  const gunBasiUtc = Date.UTC(simdiTr.getUTCFullYear(), simdiTr.getUTCMonth(), simdiTr.getUTCDate()) - 3 * 3600e3
  return new Date(gunBasiUtc + 86400e3 + (saat * 60 + dakika) * 60e3).toISOString()
}
const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)

type Sahne = {
  doktor: { id: string; token: string }; digerDoktor: { id: string; token: string }
  sekreter: { id: string; token: string; personelId: string }
  hasta: string; izinsizHasta: string; cocuk: string
  randevu: string; iptalRandevu: string; serbestRandevu: string
  kuyrukSaglikim: string; kuyrukRandevu: string; kuyrukAsi: string; asi: string
}

function sahne(kuyruklu = true): Sahne {
  db = new SahteVeritabani()
  eksikTablolar.clear()
  const kullanici = (email: string) => { const id = randomUUID(); const token = `qa-${id}`; db.kullanicilar.set(token, { id, email }); return { id, token } }
  const doktor = kullanici('qa-hekim@ornek.test')
  const digerDoktor = kullanici('qa-hekim-2@ornek.test')
  const s = kullanici('qa-sekreter@ornek.test')
  db.ekle('users', { id: doktor.id, full_name: 'QA Hekim', first_name: 'Işıl', last_name: 'Öztürk', title: 'Dr.', specialty: 'kardiyoloji', email: 'qa-hekim@ornek.test', whatsapp_number: '0532 000 00 01' })
  db.ekle('users', { id: digerDoktor.id, full_name: 'QA Hekim 2', specialty: 'pediatri', email: 'qa-hekim-2@ornek.test' })
  const personelId = db.ekle('personel', { doktor_id: doktor.id, user_id: s.id, ad_soyad: 'QA Sekreter Şule', email: 'qa-sekreter@ornek.test', rol: 'sekreter', aktif: true }).id
  const hastaEkle = (ad: string, dob: string, izinW: boolean | null, doktorId = doktor.id) => db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt(dob),
    phone_encrypted: encrypt('0532 111 22 33'), email_encrypted: encrypt('qa-hasta@ornek.test'),
    iletisim_izni_whatsapp: izinW, iletisim_izni_eposta: null,
  }).id
  const hasta = hastaEkle('QA Ayşe Yılmaz', '1980-05-05', true)
  const izinsizHasta = hastaEkle('QA İzinsiz Hasta', '1975-01-01', null)
  const cocuk = hastaEkle('QA Çocuk Ali', '2018-02-02', true)
  const randevu = db.ekle('randevular', { doktor_id: doktor.id, patient_id: hasta, baslangic: yarinTr(10, 30), bitis: yarinTr(10, 50), durum: 'planlandi', tur: 'muayene', hatirlatma_gonderildi: false }).id
  const iptalRandevu = db.ekle('randevular', { doktor_id: doktor.id, patient_id: izinsizHasta, baslangic: yarinTr(11), bitis: yarinTr(11, 20), durum: 'iptal', tur: 'muayene', hatirlatma_gonderildi: false }).id
  const serbestRandevu = db.ekle('randevular', { doktor_id: doktor.id, patient_id: null, hasta_adi_serbest: 'Serbest', hasta_telefon_serbest: '05320000000', baslangic: yarinTr(12), bitis: yarinTr(12, 20), durum: 'planlandi', tur: 'muayene', hatirlatma_gonderildi: false }).id
  // contamination: the other doctor's booking pointing at this doctor's patient — must never be enqueued
  db.ekle('randevular', { doktor_id: digerDoktor.id, patient_id: hasta, baslangic: yarinTr(13), bitis: yarinTr(13, 20), durum: 'planlandi', tur: 'muayene', hatirlatma_gonderildi: false })
  const asi = db.ekle('asilar', { doktor_id: doktor.id, patient_id: cocuk, asi_adi: 'QA Aşı', kategori: 'pediatrik', uygulama_tarihi: '2026-01-01', sonraki_doz_tarihi: yarinTr(12).slice(0, 10), kaynak: 'kayit', hatirlatma_gonderildi: false }).id
  let kuyrukSaglikim = '', kuyrukRandevu = '', kuyrukAsi = ''
  if (kuyruklu) {
    const gun = bugunTr()
    kuyrukSaglikim = db.ekle('iletisim_kuyrugu', { doctor_id: doktor.id, patient_id: hasta, tur: 'saglikim_yeni_mesaj', planlanan_gun: gun, tekil_anahtar: 'qa-saglikim', durum: 'bekliyor' }).id
    kuyrukRandevu = db.ekle('iletisim_kuyrugu', { doctor_id: doktor.id, patient_id: hasta, tur: 'randevu_hatirlatma', randevu_id: randevu, planlanan_gun: gun, tekil_anahtar: `randevu_hatirlatma:${randevu}:${yarinTr(10, 30)}`, durum: 'bekliyor' }).id
    kuyrukAsi = db.ekle('iletisim_kuyrugu', { doctor_id: doktor.id, patient_id: cocuk, tur: 'asi_hatirlatma', asi_id: asi, planlanan_gun: gun, tekil_anahtar: `asi_hatirlatma:${asi}:${yarinTr(12).slice(0, 10)}`, durum: 'bekliyor' }).id
  }
  return { doktor, digerDoktor, sekreter: { ...s, personelId }, hasta, izinsizHasta, cocuk, randevu, iptalRandevu, serbestRandevu, kuyrukSaglikim, kuyrukRandevu, kuyrukAsi, asi }
}

function iste(yontem: string, yol: string, o: { token?: string; govde?: unknown; basliklar?: Record<string, string> } = {}) {
  const basliklar: Record<string, string> = { ...(o.basliklar || {}) }
  if (o.token) basliklar.authorization = `Bearer ${o.token}`
  if (o.govde !== undefined) basliklar['content-type'] = 'application/json'
  return new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: basliklar, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
async function coz(r: Response | Promise<Response>) { const y = await r; const metin = await y.text(); let json: any = null; try { json = JSON.parse(metin) } catch { /* */ } return { status: y.status, json, metin } }
const hazirla = (token: string, govde: unknown) => coz(R.hazirla.POST(iste('POST', '/api/doktor/iletisim/hazirla', { token, govde })))
const tablo = (ad: string) => db.tablo(ad)

before(async () => {
  ;({ encrypt } = await import('../security/encryption'))
  NextRequestSinifi = (await import('next/server')).NextRequest
  const ice = (y: string) => import(`../../${y}`)
  R = {
    hazirla: await ice('app/api/doktor/iletisim/hazirla/route'),
    kayit: await ice('app/api/doktor/iletisim/kayit/route'),
    izin: await ice('app/api/doktor/iletisim/izin/route'),
    kuyruk: await ice('app/api/doktor/iletisim/kuyruk/route'),
    ayarlar: await ice('app/api/doktor/iletisim/ayarlar/route'),
    cron: await ice('app/api/cron/randevu-hatirlatma/route'),
    bildirim: await import('../portal/notifyPatientEmail'),
  }
})

describe('hazırla: mesaj sunucuda hazırlanır', () => {
  let s: Sahne
  beforeEach(() => { s = sahne() })

  it('doktor: randevu hatırlatması — alıcı, izin, metin, imza', async () => {
    const y = await hazirla(s.doktor.token, { tur: 'randevu_hatirlatma', randevuId: s.randevu })
    assert.equal(y.status, 200, y.metin)
    assert.equal(y.json.hasta.id, s.hasta)
    assert.equal(y.json.hasta.telefon, '0532 111 22 33')
    assert.equal(y.json.hasta.izinWhatsapp, true)
    assert.equal(y.json.hasta.izinEposta, null)
    assert.match(y.json.mesaj.metin, /^Merhaba QA Ayşe Yılmaz, yarın saat 10:30 için Dr\. Işıl Öztürk ile randevunuz var\./)
    assert.equal(y.json.epostaAcilis, 'uygulama')
  })
  it('reşit olmayan hastada veli dili (branştan bağımsız — kardiyoloji hekimi)', async () => {
    const y = await hazirla(s.doktor.token, { tur: 'asi_hatirlatma', asiId: s.asi })
    assert.equal(y.status, 200, y.metin)
    assert.match(y.json.mesaj.metin, /Çocuğunuzun kayıtlı bir sonraki aşı tarihi/)
  })
  it('hasta kaydı olmayan (serbest) randevu: açık bir cümleyle 400', async () => {
    const y = await hazirla(s.doktor.token, { tur: 'randevu_hatirlatma', randevuId: s.serbestRandevu })
    assert.equal(y.status, 400)
    assert.match(y.json.error, /hasta kaydına bağlı değil/)
  })
})

describe('sekreter: yalnız randevu mesajları — sunucuda zorlanır', () => {
  let s: Sahne
  beforeEach(() => { s = sahne() })

  it('randevu hatırlatması / değişiklik / tetkik hazırlayabilir', async () => {
    for (const tur of ['randevu_hatirlatma', 'randevu_degisikligi', 'tetkik_getirin']) {
      const y = await hazirla(s.sekreter.token, { tur, randevuId: s.randevu })
      assert.equal(y.status, 200, `${tur}: ${y.metin}`)
    }
  })
  it('Sağlığım, aşı, kontrol ve serbest mesaj hazırlayamaz (403); klinik kuyruk öğesi 404', async () => {
    for (const govde of [
      { tur: 'saglikim_yeni_mesaj', patientId: s.hasta },
      { tur: 'asi_hatirlatma', asiId: s.asi },
      { tur: 'kontrol_hatirlatma', patientId: s.hasta },
      { tur: 'serbest', patientId: s.hasta, metin: 'Tahlil sonucunuz...' },
    ]) {
      const y = await hazirla(s.sekreter.token, govde)
      assert.equal(y.status, 403, JSON.stringify(govde))
      assert.ok(!y.metin.includes('0532 111 22 33'), 'telefon dönmemeli')
    }
    for (const kuyrukId of [s.kuyrukSaglikim, s.kuyrukAsi]) {
      const y = await hazirla(s.sekreter.token, { kuyrukId })
      assert.equal(y.status, 404)
    }
    assert.equal((await hazirla(s.sekreter.token, { kuyrukId: s.kuyrukRandevu })).status, 200)
  })
  it('kuyruk: sekreter yalnız randevu öğesini görür; doktor hepsini', async () => {
    const sek = await coz(R.kuyruk.GET(iste('GET', '/api/doktor/iletisim/kuyruk', { token: s.sekreter.token })))
    assert.equal(sek.status, 200)
    assert.deepEqual(sek.json.ogeler.map((o: { id: string }) => o.id), [s.kuyrukRandevu])
    const sayi = await coz(R.kuyruk.GET(iste('GET', '/api/doktor/iletisim/kuyruk?sayi=1', { token: s.sekreter.token })))
    assert.equal(sayi.json.sayi, 1)
    const dok = await coz(R.kuyruk.GET(iste('GET', '/api/doktor/iletisim/kuyruk', { token: s.doktor.token })))
    assert.deepEqual(new Set(dok.json.ogeler.map((o: { id: string }) => o.id)), new Set([s.kuyrukSaglikim, s.kuyrukRandevu, s.kuyrukAsi]))
  })
  it('kuyruk işlemi: klinik öğe 404 ve değişmez; randevu öğesi "Sonra" ile ertelenir', async () => {
    const y = await coz(R.kuyruk.PATCH(iste('PATCH', '/api/doktor/iletisim/kuyruk', { token: s.sekreter.token, govde: { id: s.kuyrukAsi, islem: 'atla' } })))
    assert.equal(y.status, 404)
    assert.equal(tablo('iletisim_kuyrugu').find((x) => x.id === s.kuyrukAsi)!.durum, 'bekliyor')
    const z = await coz(R.kuyruk.PATCH(iste('PATCH', '/api/doktor/iletisim/kuyruk', { token: s.sekreter.token, govde: { id: s.kuyrukRandevu, islem: 'sonra' } })))
    assert.equal(z.status, 200)
    const k = tablo('iletisim_kuyrugu').find((x) => x.id === s.kuyrukRandevu)!
    assert.equal(k.durum, 'bekliyor')
    assert.ok(k.ertelendi_at)
    assert.equal(k.isleyen_personel_id, s.sekreter.personelId)
  })
  it('gönderen kaydedilir: sekreterin açtığı mesajda personel kimliği; klinik tür 403', async () => {
    const y = await coz(R.kayit.POST(iste('POST', '/api/doktor/iletisim/kayit', { token: s.sekreter.token, govde: { patientId: s.hasta, kanal: 'whatsapp', tur: 'randevu_hatirlatma', randevuId: s.randevu } })))
    assert.equal(y.status, 200, y.metin)
    const r = tablo('iletisim_kayitlari').find((x) => x.id === y.json.id)!
    assert.equal(r.gonderen_personel_id, s.sekreter.personelId)
    assert.equal(r.gonderen_user_id, s.sekreter.id)
    assert.equal(r.doctor_id, s.doktor.id)
    assert.equal(r.durum, 'acildi')
    const z = await coz(R.kayit.POST(iste('POST', '/api/doktor/iletisim/kayit', { token: s.sekreter.token, govde: { patientId: s.hasta, kanal: 'whatsapp', tur: 'saglikim_yeni_mesaj' } })))
    assert.equal(z.status, 403)
  })
  it('kayıt listesi: sekreter yalnız randevu türlerini görür', async () => {
    db.ekle('iletisim_kayitlari', { doctor_id: s.doktor.id, patient_id: s.hasta, kanal: 'whatsapp', tur: 'asi_hatirlatma', durum: 'gonderildi' })
    db.ekle('iletisim_kayitlari', { doctor_id: s.doktor.id, patient_id: s.hasta, kanal: 'eposta', tur: 'randevu_iptali', durum: 'gonderildi' })
    const y = await coz(R.kayit.GET(iste('GET', '/api/doktor/iletisim/kayit', { token: s.sekreter.token })))
    assert.deepEqual(y.json.kayitlar.map((k: { tur: string }) => k.tur), ['randevu_iptali'])
    const d = await coz(R.kayit.GET(iste('GET', '/api/doktor/iletisim/kayit', { token: s.doktor.token })))
    assert.equal(d.json.kayitlar.length, 2)
  })
  it('Ayarlar › İletişim yalnız doktor', async () => {
    assert.equal((await coz(R.ayarlar.GET(iste('GET', '/api/doktor/iletisim/ayarlar', { token: s.sekreter.token })))).status, 403)
    assert.equal((await coz(R.ayarlar.PUT(iste('PUT', '/api/doktor/iletisim/ayarlar', { token: s.sekreter.token, govde: { whatsapp: '05320000000' } })))).status, 403)
  })
})

describe('iletişim izni', () => {
  let s: Sahne
  beforeEach(() => { s = sahne() })

  it('izin yok / bilinmiyor → açma kaydı reddedilir (409); "İzin alındı" işaretlenince açılır, kim + ne zaman yazılır', async () => {
    const once = await coz(R.kayit.POST(iste('POST', '/api/doktor/iletisim/kayit', { token: s.doktor.token, govde: { patientId: s.izinsizHasta, kanal: 'whatsapp', tur: 'kontrol_hatirlatma' } })))
    assert.equal(once.status, 409)
    assert.match(once.json.error, /iletişim izni vermedi/)
    assert.equal(tablo('iletisim_kayitlari').filter((x) => x.patient_id === s.izinsizHasta).length, 0)

    const izin = await coz(R.izin.POST(iste('POST', '/api/doktor/iletisim/izin', { token: s.sekreter.token, govde: { patientId: s.izinsizHasta, kanal: 'whatsapp', izin: true } })))
    assert.equal(izin.status, 200, izin.metin)
    const p = tablo('patients').find((x) => x.id === s.izinsizHasta)!
    assert.equal(p.iletisim_izni_whatsapp, true)
    assert.equal(p.iletisim_izni_guncelleyen, s.sekreter.id)
    assert.ok(p.iletisim_izni_guncelleme)
    const gecmis = tablo('iletisim_izin_kayitlari').find((x) => x.patient_id === s.izinsizHasta)!
    assert.equal(gecmis.kaynak, 'gonder_dugmesi')
    assert.equal(gecmis.kaydeden_personel_id, s.sekreter.personelId)
    assert.equal(gecmis.doctor_id, s.doktor.id)

    const sonra = await coz(R.kayit.POST(iste('POST', '/api/doktor/iletisim/kayit', { token: s.doktor.token, govde: { patientId: s.izinsizHasta, kanal: 'whatsapp', tur: 'kontrol_hatirlatma' } })))
    assert.equal(sonra.status, 200)
    // e-posta izni hâlâ bilinmiyor
    const eposta = await coz(R.kayit.POST(iste('POST', '/api/doktor/iletisim/kayit', { token: s.doktor.token, govde: { patientId: s.izinsizHasta, kanal: 'eposta', tur: 'kontrol_hatirlatma' } })))
    assert.equal(eposta.status, 409)
  })
  it('profilden geri alınabilir (false) ve GET okur', async () => {
    await coz(R.izin.POST(iste('POST', '/api/doktor/iletisim/izin', { token: s.doktor.token, govde: { patientId: s.hasta, kanal: 'whatsapp', izin: false, kaynak: 'hasta_profili' } })))
    const g = await coz(R.izin.GET(iste('GET', `/api/doktor/iletisim/izin?patientId=${s.hasta}`, { token: s.doktor.token })))
    assert.deepEqual({ w: g.json.whatsapp, e: g.json.eposta, k: g.json.kaydedilebilir }, { w: false, e: null, k: true })
    assert.equal(tablo('iletisim_izin_kayitlari').at(-1)!.kaynak, 'hasta_profili')
  })
})

describe('"Gönderildi mi? Evet"', () => {
  it('kayıt → gönderildi, kuyruk öğesi kapanır, randevu "hatırlatıldı" olur', async () => {
    const s = sahne()
    const ac = await coz(R.kayit.POST(iste('POST', '/api/doktor/iletisim/kayit', { token: s.sekreter.token, govde: { patientId: s.hasta, kanal: 'whatsapp', tur: 'randevu_hatirlatma', kuyrukId: s.kuyrukRandevu, randevuId: s.randevu } })))
    const y = await coz(R.kayit.PATCH(iste('PATCH', '/api/doktor/iletisim/kayit', { token: s.sekreter.token, govde: { id: ac.json.id, patientId: s.hasta, tur: 'randevu_hatirlatma', kuyrukId: s.kuyrukRandevu } })))
    assert.equal(y.status, 200, y.metin)
    assert.equal(tablo('iletisim_kayitlari').find((x) => x.id === ac.json.id)!.durum, 'gonderildi')
    assert.equal(tablo('iletisim_kuyrugu').find((x) => x.id === s.kuyrukRandevu)!.durum, 'gonderildi')
    assert.equal(tablo('randevular').find((x) => x.id === s.randevu)!.hatirlatma_gonderildi, true)
  })
  it('aşı öğesi (doktor) → asilar.hatirlatma_gonderildi; ertesi açılışta kuyruğa geri gelmez', async () => {
    const s = sahne(false)
    const liste = await coz(R.kuyruk.GET(iste('GET', '/api/doktor/iletisim/kuyruk', { token: s.doktor.token })))
    const asiOgesi = liste.json.ogeler.find((o: { tur: string }) => o.tur === 'asi_hatirlatma')
    assert.ok(asiOgesi, 'yaklaşan aşı kuyruğa eklenmeli (hekim açınca, cron değil)')
    await coz(R.kayit.PATCH(iste('PATCH', '/api/doktor/iletisim/kayit', { token: s.doktor.token, govde: { patientId: s.cocuk, tur: 'asi_hatirlatma', kuyrukId: asiOgesi.id } })))
    assert.equal(tablo('asilar').find((x) => x.id === s.asi)!.hatirlatma_gonderildi, true)
    const tekrar = await coz(R.kuyruk.GET(iste('GET', '/api/doktor/iletisim/kuyruk', { token: s.doktor.token })))
    assert.ok(!tekrar.json.ogeler.some((o: { tur: string }) => o.tur === 'asi_hatirlatma'))
    assert.equal(tablo('iletisim_kuyrugu').filter((x) => x.tur === 'asi_hatirlatma').length, 1, 'mükerrer öğe yok')
  })
})

describe('kuyruğu dolduranlar — mükerrer yok', () => {
  it('randevu cron\'u: yarının aktif, kayıtlı-hasta randevusu bir kez; iptal / serbest / başka hekimin satırı hiç', async () => {
    const s = sahne(false)
    const cagir = () => coz(R.cron.GET(new Request('http://localhost/api/cron/randevu-hatirlatma', { headers: { authorization: 'Bearer qa-cron-sirri' } })))
    const ilk = await cagir()
    assert.equal(ilk.status, 200, ilk.metin)
    await cagir()
    const ogeler = tablo('iletisim_kuyrugu').filter((x) => x.tur === 'randevu_hatirlatma')
    assert.deepEqual(ogeler.map((x) => [x.doctor_id, x.patient_id, x.randevu_id]), [[s.doktor.id, s.hasta, s.randevu]])
    assert.equal(ogeler[0].planlanan_gun, bugunTr())
    assert.equal(tablo('randevular').find((x) => x.id === s.randevu)!.hatirlatma_gonderildi, false, 'cron bir şey göndermez, işaretlemez')
    assert.equal((await coz(R.cron.GET(new Request('http://localhost/api/cron/randevu-hatirlatma')))).status, 401)
  })
  it('Sağlığım bildirimi: aynı konu aynı gün tek öğe', async () => {
    const s = sahne(false)
    const sb = (await import('../doktor/serverAuth')).servisSupabase()
    const konuId = randomUUID()
    for (let i = 0; i < 3; i++) await R.bildirim.notifyPatientNewPracticeMessage(sb, { doctorId: s.doktor.id, patientId: s.hasta, konuId })
    await R.bildirim.notifyPatientNewPracticeMessage(sb, { doctorId: s.doktor.id, patientId: s.hasta, konuId: randomUUID() })
    assert.equal(tablo('iletisim_kuyrugu').filter((x) => x.tur === 'saglikim_yeni_mesaj').length, 2)
  })
})

describe('Ayarlar › İletişim', () => {
  it('profilden önceden dolu; geçersiz numara 400; kaydedilir', async () => {
    const s = sahne()
    const g = await coz(R.ayarlar.GET(iste('GET', '/api/doktor/iletisim/ayarlar', { token: s.doktor.token })))
    assert.deepEqual({ w: g.json.whatsapp, e: g.json.eposta, a: g.json.epostaAcilis }, { w: '0532 000 00 01', e: 'qa-hekim@ornek.test', a: 'uygulama' })
    assert.equal((await coz(R.ayarlar.PUT(iste('PUT', '/api/doktor/iletisim/ayarlar', { token: s.doktor.token, govde: { whatsapp: '123' } })))).status, 400)
    assert.equal((await coz(R.ayarlar.PUT(iste('PUT', '/api/doktor/iletisim/ayarlar', { token: s.doktor.token, govde: { epostaAcilis: 'yahoo' } })))).status, 400)
    const p = await coz(R.ayarlar.PUT(iste('PUT', '/api/doktor/iletisim/ayarlar', { token: s.doktor.token, govde: { whatsapp: '0533 444 55 66', eposta: 'klinik@ornek.test', epostaAcilis: 'gmail' } })))
    assert.equal(p.status, 200, p.metin)
    const u = tablo('users').find((x) => x.id === s.doktor.id)!
    assert.deepEqual([u.iletisim_whatsapp, u.iletisim_eposta, u.iletisim_eposta_acilis], ['0533 444 55 66', 'klinik@ornek.test', 'gmail'])
  })
})

describe('migration 095 uygulanmadan: yumuşak düşüş', () => {
  it('kuyruk boş (0), kayıt listesi boş, açma kaydı 200 kaydedildi:false — çökme yok', async () => {
    const s = sahne()
    for (const t of ['iletisim_kuyrugu', 'iletisim_kayitlari', 'iletisim_izin_kayitlari']) eksikTablolar.add(t)
    const k = await coz(R.kuyruk.GET(iste('GET', '/api/doktor/iletisim/kuyruk', { token: s.doktor.token })))
    assert.deepEqual([k.status, k.json.ogeler], [200, []])
    const n = await coz(R.kuyruk.GET(iste('GET', '/api/doktor/iletisim/kuyruk?sayi=1', { token: s.doktor.token })))
    assert.deepEqual([n.status, n.json.sayi], [200, 0])
    const l = await coz(R.kayit.GET(iste('GET', '/api/doktor/iletisim/kayit', { token: s.doktor.token })))
    assert.deepEqual([l.status, l.json.kayitlar], [200, []])
    const a = await coz(R.kayit.POST(iste('POST', '/api/doktor/iletisim/kayit', { token: s.doktor.token, govde: { patientId: s.hasta, kanal: 'whatsapp', tur: 'kontrol_hatirlatma' } })))
    assert.deepEqual([a.status, a.json.kaydedildi], [200, false])
    const h = await hazirla(s.doktor.token, { tur: 'kontrol_hatirlatma', patientId: s.hasta })
    assert.equal(h.status, 200, h.metin)
    const c = await coz(R.cron.GET(new Request('http://localhost/api/cron/randevu-hatirlatma', { headers: { authorization: 'Bearer qa-cron-sirri' } })))
    assert.equal(c.status, 200, c.metin)
  })
})
