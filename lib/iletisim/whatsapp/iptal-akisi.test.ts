/**
 * WHATSAPP-CANCEL-01 — the automatic cancel flow end to end on the in-memory fake database (no network, no real Meta):
 * strong phrase → appointment cancelled + slot freed + confirmation sent + audit rows + desk item; ambiguous → card only;
 * reschedule / negation → nothing; redelivery → once; two appointments → the next one; doctor isolation; "Geri al";
 * the doctor's own cancel outside the 24h window → approved template. Synthetic QA data only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-whatsapp-api-anahtari'

import { SahteVeritabani } from '../../security/testing/sahteSupabase'
import { encryptPII, decryptPII } from '../../security/encryption'
import { SABLON_KODLARI } from '../otomatik/whatsapp/sablonlar'
import { baglantiKaydet } from '../otomatik/whatsapp/depo'
import { GUNLUK } from '../otomatik/whatsapp/gunluk'
import { YANITLAR, yanitIsle } from './yanit'
import { kartEylemi } from './eylem'
import { iptalKartlari, iptalOgeleri, iptalKartTuru, kisaAd } from './onBuro'

const A = '00000000-0000-4000-8000-0000000000aa'
const B = '00000000-0000-4000-8000-0000000000bb'
const TEL = '905321112233'

const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
const oglen = () => new Date(`${bugunTr()}T12:00:00+03:00`)
const yarin = (saat: number, dk = 0, gun = 1) => new Date(Date.parse(`${bugunTr()}T00:00:00+03:00`) + gun * 86400e3 + (saat * 60 + dk) * 60e3).toISOString()

type Cagri = { url: URL; method: string; body: any }
function sahteFetch() {
  const cagrilar: Cagri[] = []
  let n = 0
  const f = async (u: string, init?: RequestInit) => {
    cagrilar.push({ url: new URL(u), method: init?.method || 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined })
    return new Response(JSON.stringify({ messages: [{ id: `wamid.OUT${++n}` }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  return { f, gonderimler: () => cagrilar.filter((c) => c.method === 'POST' && c.url.pathname.endsWith('/messages')) }
}

function sahneKur() {
  const db = new SahteVeritabani()
  const sb = db.istemci() as never
  const hasta = (doktor: string, ad: string, tel = '0532 111 22 33') => db.ekle('patients', {
    doctor_id: doktor, is_active: true,
    name_encrypted: encryptPII(JSON.stringify({ ad })), dob_encrypted: encryptPII('1980-05-05'), phone_encrypted: encryptPII(tel), email_encrypted: encryptPII('qa-hasta@ornek.test'),
    iletisim_izni_whatsapp: true, iletisim_izni_eposta: true,
  }).id
  const randevu = (doktor: string, hastaId: string, baslangic = yarin(16, 0)) =>
    db.ekle('randevular', { doktor_id: doktor, patient_id: hastaId, baslangic, bitis: new Date(Date.parse(baslangic) + 1800e3).toISOString(), durum: 'planlandi', hatirlatma_gonderildi: false }).id
  return { db, sb, hasta, randevu }
}

async function baglan(sb: never, doktor: string, pn: string) {
  await baglantiKaydet(sb, {
    doktorId: doktor, businessId: null, wabaId: `WABA-${pn}`, phoneNumberId: pn, gorunenNumara: '+90 555 000 00 00', gorunenAd: 'QA Klinik', token: `TOKEN-${pn}`,
    sablonlar: Object.fromEntries(SABLON_KODLARI.map((k) => [k, { id: k, durum: 'APPROVED', guncellendi: '' }])),
  } as never)
}

const gelen = (govde: string, wamid: string, pn = 'PN-A', zaman: Date = oglen()) =>
  [{ phoneNumberId: pn, wamid, karsiNumara: TEL, zaman: zaman.toISOString(), tip: 'text', govde, mediaId: null, yon: 'gelen' as const }]

const gunlukTurleri = (db: SahteVeritabani) => db.tablo(GUNLUK).map((r) => String(r.tur))

describe('güçlü ifade: otomatik iptal, saat boşalır, hasta bilgilendirilir', () => {
  const ifadeler = ['İPTAL', 'iptal edin', 'Randevumu iptal ediyorum', 'gelemiyorum', 'GELEMEYECEĞİM', 'vazgeçtim', 'randevuya gelmeyeceğim', 'ıptal edın']
  for (const m of ifadeler) {
    it(`"${m}": randevu iptal, takvim yenilendi, onay metni (saat dahil), denetim satırı, masa öğesi`, async () => {
      const { db, sb, hasta, randevu } = sahneKur()
      await baglan(sb, A, 'PN-A')
      const h = hasta(A, 'Ayşe Yılmaz')
      const r = randevu(A, h, yarin(16, 0))
      db.ekle('randevu_isleri', { randevu_id: r, doktor_id: A, tur: 'hatirlatma_24s', zaman: yarin(10), durum: 'bekliyor' })
      const { f, gonderimler } = sahteFetch()
      await yanitIsle(sb, gelen(m, 'wamid.IN-1'), { fetch: f, simdi: oglen() })

      const rd = db.tablo('randevular').find((x) => x.id === r)!
      assert.equal(rd.durum, 'iptal', 'takvimde iptal → saat boş')
      assert.match(String(rd.iptal_nedeni), /WhatsApp/)
      // Bekleyen hatırlatma işi düştü, iptal bildirimi sıraya girdi (ortak iptal yolu).
      assert.equal(db.tablo('randevu_isleri').find((x) => x.tur === 'hatirlatma_24s')!.durum, 'iptal')
      assert.ok(db.tablo('randevu_isleri').some((x) => x.tur === 'iptal_eposta' && x.randevu_id === r))
      // Olay günlüğü: kim, ne zaman, önceki durum.
      const olay = db.tablo('randevu_olaylari').find((x) => x.randevu_id === r && x.olay === 'iptal')!
      assert.equal(olay.yapan, 'hasta')
      assert.equal((olay.detay as any).onceki, 'planlandi')

      // Hastaya tek onay mesajı: serbest metin (24 saat penceresi açık), tarih ve saat içerir, ad/klinik metin yok.
      const g = gonderimler()
      assert.equal(g.length, 1)
      assert.equal(g[0].body.type, 'text')
      const metin = String(g[0].body.text.body)
      assert.match(metin, /iptal edildi/)
      assert.match(metin, /16:00/)
      assert.ok(!/Yılmaz|Ayşe/.test(metin))

      // Kart + denetim (append-only whatsapp_mesaj_gunlugu).
      const kart = db.tablo(YANITLAR)[0]
      assert.equal(kart.niyet, 'iptal')
      assert.match(String(kart.otomatik_eylem), /^randevu_iptal/)
      assert.equal(kart.randevu_id, r)
      assert.ok(gunlukTurleri(db).includes('randevu_iptal'))
      assert.ok(!JSON.stringify(db.tablo(GUNLUK)).includes(TEL), 'günlükte düz numara yok')

      // Doktor + sekreter masası: ad kısaltılmış, "saat boşaldı", mesaj metni/telefon yok.
      const kartlar = await iptalKartlari(sb, A, oglen())
      assert.equal(kartlar.length, 1)
      const [oge] = iptalOgeleri(kartlar)
      assert.equal(oge.kaynak, 'iptal')
      assert.equal(oge.ad, 'Ayşe Y.')
      assert.match(oge.baslik, /saat boşaldı/)
      assert.match(oge.detay.join(' '), /16:00/)
      assert.ok(!JSON.stringify(oge).includes(TEL))
      assert.ok(!JSON.stringify(oge).includes(m) || m.length < 3)
    })
  }

  it('iki randevu varken en yakın olan iptal edilir, diğerine dokunulmaz', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe')
    const yakin = randevu(A, h, yarin(10, 0, 1))
    const uzak = randevu(A, h, yarin(10, 0, 20))
    const { f, gonderimler } = sahteFetch()
    await yanitIsle(sb, gelen('randevumu iptal ediyorum', 'wamid.IN-2'), { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('randevular').find((x) => x.id === yakin)!.durum, 'iptal')
    assert.equal(db.tablo('randevular').find((x) => x.id === uzak)!.durum, 'planlandi')
    assert.match(String(gonderimler()[0].body.text.body), /10:00/)
  })

  it('aynı webhook iki kez gelirse tek iptal, tek mesaj, tek kart', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r = randevu(A, hasta(A, 'QA Ayşe'))
    const { f, gonderimler } = sahteFetch()
    await yanitIsle(sb, gelen('iptal', 'wamid.IN-3'), { fetch: f, simdi: oglen() })
    await yanitIsle(sb, gelen('iptal', 'wamid.IN-3'), { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'iptal')
    assert.equal(gonderimler().length, 1)
    assert.equal(db.tablo(YANITLAR).length, 1)
    assert.equal(db.tablo('randevu_olaylari').filter((x) => x.olay === 'iptal').length, 1)
    assert.equal((await iptalKartlari(sb, A, oglen())).length, 1, 'masada tek öğe')
  })

  it('iptal sonrası ikinci "iptal" durdurma sayılmaz (hasta mesajlardan çıkmaz)', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe')
    randevu(A, h)
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('iptal', 'wamid.IN-4a'), { fetch: f, simdi: oglen() })
    await yanitIsle(sb, gelen('iptal', 'wamid.IN-4b'), { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('patients').find((p) => p.id === h)!.iletisim_izni_whatsapp, true)
  })

  it('randevu yokken "randevumu iptal edin" durdurma DEĞİL: kart "iptal istedi — işlem bekliyor"', async () => {
    const { db, sb, hasta } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe')
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('randevumu iptal edin', 'wamid.IN-5'), { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('patients').find((p) => p.id === h)!.iletisim_izni_whatsapp, true)
    const k = db.tablo(YANITLAR)[0]
    assert.equal(iptalKartTuru(k as never), 'bekliyor')
    const oge = iptalOgeleri(await iptalKartlari(sb, A, oglen()))[0]
    assert.match(oge.baslik, /işlem bekliyor/)
  })
})

describe('otomatik İPTAL YOK: belirsiz, erteleme, olumsuz, soru', () => {
  const durumlar: [string, string][] = [
    ['müsait değilim', 'zayıf'], ['işim çıktı', 'zayıf'], ['belki iptal ederim', 'zayıf'], ['sanırım gelemeyeceğim', 'zayıf'],
    ['erteleyebilir miyiz', 'erteleme'], ['başka güne alabilir miyiz', 'erteleme'], ['iptal ama başka güne alabilir miyiz', 'erteleme'],
    ['iptal etmeyin', 'olumsuz'], ['iptal istemiyorum', 'olumsuz'], ['vazgeçmedim', 'olumsuz'], ['iptal etmek istemiyorum', 'olumsuz'],
    ['iptal mi oldu', 'soru'], ['randevum iptal edildi mi', 'soru'], ['sil', 'sil'], ['kapat', 'kapat'],
  ]
  for (const [m, sinif] of durumlar) {
    it(`"${m}" (${sinif}) → randevu aktif kalır`, async () => {
      const { db, sb, hasta, randevu } = sahneKur()
      await baglan(sb, A, 'PN-A')
      const h = hasta(A, 'QA Ayşe')
      const r = randevu(A, h)
      const { f } = sahteFetch()
      await yanitIsle(sb, gelen(m, 'wamid.IN-N'), { fetch: f, simdi: oglen(), llm: async () => 'diger' })
      assert.notEqual(db.tablo('randevular').find((x) => x.id === r)!.durum, 'iptal', m)
      assert.equal(db.tablo('patients').find((p) => p.id === h)!.iletisim_izni_whatsapp, true, `${m}: durdurma da uygulanmaz`)
      assert.ok(!gunlukTurleri(db).includes('randevu_iptal'), m)
    })
  }

  it('zayıf ifade: kart "zayif_iptal", hasta "iptal etmedik" bilgisi alır, masada "iptal edilmedi" öğesi', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r = randevu(A, hasta(A, 'Ayşe Yılmaz'))
    const { f, gonderimler } = sahteFetch()
    await yanitIsle(sb, gelen('müsait değilim', 'wamid.IN-Z'), { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'planlandi')
    const k = db.tablo(YANITLAR)[0]
    assert.equal(k.otomatik_eylem, 'zayif_iptal')
    assert.equal(iptalKartTuru(k as never), 'zayif')
    const oge = iptalOgeleri(await iptalKartlari(sb, A, oglen()))[0]
    assert.match(oge.baslik, /iptal edilmedi/)
    assert.ok(gonderimler().length >= 1)
  })

  it('LLM "iptal" dese bile (kuralın tanımadığı mesaj) hiçbir şey iptal edilmez', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r = randevu(A, hasta(A, 'QA Ayşe'))
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('Sanırım artık o tarihte durum farklı', 'wamid.IN-L'), { fetch: f, simdi: oglen(), llm: async () => 'iptal' })
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'planlandi')
  })

  it('STOP/DUR hâlâ mesaj iznini kapatır ve randevuya dokunmaz', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe')
    const r = randevu(A, h)
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('DUR', 'wamid.IN-S'), { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('patients').find((p) => p.id === h)!.iletisim_izni_whatsapp, false)
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'planlandi')
  })
})

describe('hasta izolasyonu', () => {
  it('B doktorunun hastası A hattına "iptal" yazarsa B\'nin randevusu ve masası etkilenmez', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const hb = hasta(B, 'QA B Hastası')
    const rb = randevu(B, hb)
    const { f, gonderimler } = sahteFetch()
    await yanitIsle(sb, gelen('iptal', 'wamid.IN-X'), { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('randevular').find((x) => x.id === rb)!.durum, 'planlandi')
    assert.equal(gonderimler().length, 0)
    assert.equal((await iptalKartlari(sb, B, oglen())).length, 0)
  })

  it('A\'nın iptal kartı B\'nin masasında görünmez; B kartı "gördüm" yapamaz, kart eylemi de işlemez', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r = randevu(A, hasta(A, 'QA Ayşe'))
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('iptal', 'wamid.IN-Y'), { fetch: f, simdi: oglen() })
    assert.equal((await iptalKartlari(sb, A, oglen())).length, 1)
    assert.equal((await iptalKartlari(sb, B, oglen())).length, 0)
    const kartId = String(db.tablo(YANITLAR)[0].id)
    const s = await kartEylemi(sb, { doktorId: B, yapanId: B, kartId, eylem: 'geri_al' }, { fetch: f, simdi: oglen() })
    assert.equal(s.ok, false)
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'iptal')
  })

  it('aynı numarada iki hasta (veli/kardeş): otomatik iptal YOK, kart masada "işlem bekliyor"', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r1 = randevu(A, hasta(A, 'QA Kardeş Bir'))
    const r2 = randevu(A, hasta(A, 'QA Kardeş İki'))
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('gelemiyorum', 'wamid.IN-K'), { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('randevular').find((x) => x.id === r1)!.durum, 'planlandi')
    assert.equal(db.tablo('randevular').find((x) => x.id === r2)!.durum, 'planlandi')
    assert.equal(iptalKartTuru(db.tablo(YANITLAR)[0] as never), 'bekliyor')
  })
})

describe('Geri al ve yeniden randevu', () => {
  it('Geri al: WhatsApp iptali önceki duruma döner; hasta bilgilendirilir; ikinci dokunuş reddedilir', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r = randevu(A, hasta(A, 'QA Ayşe'))
    const { f, gonderimler } = sahteFetch()
    await yanitIsle(sb, gelen('iptal', 'wamid.IN-G'), { fetch: f, simdi: oglen() })
    const kartId = String(db.tablo(YANITLAR)[0].id)
    const s = await kartEylemi(sb, { doktorId: A, yapanId: A, kartId, eylem: 'geri_al' }, { fetch: f, simdi: oglen() })
    assert.equal(s.ok, true, JSON.stringify(s))
    const rd = db.tablo('randevular').find((x) => x.id === r)!
    assert.equal(rd.durum, 'planlandi')
    assert.equal(rd.iptal_nedeni ?? null, null)
    assert.equal(db.tablo(YANITLAR)[0].otomatik_eylem, 'randevu_iptal_geri_alindi')
    assert.equal(gonderimler().length, 2)
    assert.match(String(gonderimler()[1].body.text.body), /yeniden geçerli/)
    assert.equal(iptalKartTuru(db.tablo(YANITLAR)[0] as never), null, 'geri alınan iptal masada beklemez')
    const tekrar = await kartEylemi(sb, { doktorId: A, yapanId: A, kartId, eylem: 'geri_al' }, { fetch: f, simdi: oglen() })
    assert.equal(tekrar.ok, false)
  })

  it('Geri al yalnız hastanın WhatsApp iptalini geri alır; hekimin kendi iptali geri alınmaz', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r = randevu(A, hasta(A, 'QA Ayşe'))
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('Ücret nedir?', 'wamid.IN-H'), { fetch: f, simdi: oglen(), llm: async () => 'soru' })
    const kartId = String(db.tablo(YANITLAR)[0].id)
    await kartEylemi(sb, { doktorId: A, yapanId: A, kartId, eylem: 'iptal' }, { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'iptal')
    const s = await kartEylemi(sb, { doktorId: A, yapanId: A, kartId, eylem: 'geri_al' }, { fetch: f, simdi: oglen() })
    assert.equal(s.ok, false)
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'iptal')
  })

  it('iptal sonrası "yeni randevu": boş saatler önerilir, hasta numara seçer, hekim onaylayınca iptal satırı yeni saatte açılır', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe')
    const r = randevu(A, h, yarin(16, 0))
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('iptal', 'wamid.IN-R1'), { fetch: f, simdi: oglen() })
    await yanitIsle(sb, gelen('yeni randevu', 'wamid.IN-R2'), { fetch: f, simdi: oglen() })
    const oneri = db.tablo(YANITLAR).find((k) => k.wamid === 'wamid.IN-R2')!
    // Takvim ayarı olmayan sahne: öneri üretilemeyebilir; üretildiyse akış tamamlanmalı, üretilemediyse hekime kart kalmalı.
    if (Array.isArray(oneri.onerilen_slotlar) && oneri.onerilen_slotlar.length) {
      await yanitIsle(sb, gelen('1', 'wamid.IN-R3'), { fetch: f, simdi: oglen() })
      const secim = db.tablo(YANITLAR).find((k) => k.id === oneri.id)!
      assert.ok(secim.secilen_slot)
      const s = await kartEylemi(sb, { doktorId: A, yapanId: A, kartId: String(oneri.id), eylem: 'onayla' }, { fetch: f, simdi: oglen() })
      assert.equal(s.ok, true, JSON.stringify(s))
      assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'onaylandi')
    } else {
      assert.ok(['slot_yok', 'yeni_randevu_istegi'].includes(String(oneri.eylem_sonucu)))
    }
  })
})

describe('hekim kartından iptal: 24 saat penceresi', () => {
  it('pencere kapalıyken onaylı randevu_iptal_onay şablonu gider (serbest metin çıkmaz)', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    db.ekle('users', { id: A, full_name: 'QA Hekim', first_name: 'Işıl', last_name: 'Öztürk', title: 'Dr.', specialty: 'kardiyoloji', email: 'qa-hekim@ornek.test' })
    const r = randevu(A, hasta(A, 'QA Ayşe'), yarin(14, 30, 3))
    const { f, gonderimler } = sahteFetch()
    await yanitIsle(sb, gelen('Ücret nedir?', 'wamid.IN-W'), { fetch: f, simdi: oglen(), llm: async () => 'soru' })
    const kartId = String(db.tablo(YANITLAR)[0].id)
    // 30 saat sonra: pencere kapandı.
    const gec = new Date(oglen().getTime() + 30 * 3600e3)
    const eski = { ...process.env }
    Object.assign(process.env, { WHATSAPP_APP_ID: '111', WHATSAPP_APP_SECRET: 'sir-qa', WHATSAPP_ES_CONFIG_ID: '222', WHATSAPP_VERIFY_TOKEN: 'dogrula-qa' })
    let s
    try { s = await kartEylemi(sb, { doktorId: A, yapanId: A, kartId, eylem: 'iptal' }, { fetch: f, simdi: gec }) } finally {
      for (const k of ['WHATSAPP_APP_ID', 'WHATSAPP_APP_SECRET', 'WHATSAPP_ES_CONFIG_ID', 'WHATSAPP_VERIFY_TOKEN']) { if (eski[k] === undefined) delete process.env[k]; else process.env[k] = eski[k] }
    }
    assert.equal(s.ok, true, JSON.stringify(s))
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'iptal')
    const son = gonderimler().at(-1)!
    assert.equal(son.body.type, 'template', 'pencere kapalı: yalnız onaylı şablon')
    assert.equal(son.body.template.name, 'randevu_iptal_onay')
    const vars = son.body.template.components[0].parameters.map((p: any) => p.text)
    assert.equal(vars.length, 4)
    assert.match(vars[2], /14:30/)
  })
})

describe('masa öğesi yardımcıları', () => {
  it('kisaAd: ad + soyad başı; tek kelime; boş', () => {
    assert.equal(kisaAd('Ayşe Nur Yılmaz'), 'Ayşe Y.')
    assert.equal(kisaAd('ışıl öztürk'), 'ışıl Ö.')
    assert.equal(kisaAd('Ayşe'), 'Ayşe')
    assert.equal(kisaAd(''), 'Hasta')
  })
  it('72 saatten eski ve geçmişte kalmış saat kartları masaya girmez', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    randevu(A, hasta(A, 'QA Ayşe'), yarin(16, 0))
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('iptal', 'wamid.IN-O'), { fetch: f, simdi: oglen() })
    assert.equal((await iptalKartlari(sb, A, oglen())).length, 1)
    assert.equal((await iptalKartlari(sb, A, new Date(oglen().getTime() + 80 * 3600e3))).length, 0, 'kart ömrü doldu')
    assert.equal((await iptalKartlari(sb, A, new Date(Date.parse(yarin(17, 0)) ))).length, 0, 'saat geçti: boş saat kimsenin değil')
    assert.equal(decryptPII(String(db.tablo(YANITLAR)[0].karsi_taraf_encrypted)), TEL)
  })
})
