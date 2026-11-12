/**
 * WHATSAPP-ONBURO-01 — answers from the doctor's own practice sheet, on the in-memory fake database with an injected
 * model: a grounded answer; a missing field → holding reply; a cited key that does not exist → holding reply; the medical
 * and emergency guards fire BEFORE the model; a model failure → holding reply; the daily model budget; the reply cap;
 * opt-out wins; and the model input carries no patient data (asserted on the prompt). Synthetic QA data only.
 */
import { after, before, describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-whatsapp-api-anahtari'

import { SahteVeritabani } from '../../security/testing/sahteSupabase'
import { encryptPII, decryptPII } from '../../security/encryption'
import { SABLON_KODLARI } from '../otomatik/whatsapp/sablonlar'
import { baglantiKaydet } from '../otomatik/whatsapp/depo'
import { GUNLUK } from '../otomatik/whatsapp/gunluk'
import { YANITLAR, yanitIsle } from '../whatsapp/yanit'
import { BOS_BILGI, TABLO_AYAR, bilgiDuzle, bilgiNormalize, onBuroNormalize, type MuayenehaneBilgisi } from './ayar'
import { MODEL_SISTEM, bilgiYaniti, modelYanitiCoz, type ModelIstemi } from './bilgi'
import { TR_ON_BURO as dil } from './dil/tr'
import { OB } from './isle'
import { onBuroOnizleme } from './onizleme'
import { MODEL_GUNLUK, TUR_MODEL, TUR_ON_BURO } from './sunucu'

const A = '00000000-0000-4000-8000-0000000000aa'
const TEL = '905321112233'
const SIMDI = new Date('2026-11-16T07:00:00Z')
before(() => mock.timers.enable({ apis: ['Date'], now: SIMDI.getTime() }))
after(() => mock.timers.reset())
const sonra = (dk: number) => { const t = SIMDI.getTime() + dk * 60_000; mock.timers.setTime(t); return new Date(t) }

const BILGI: MuayenehaneBilgisi = bilgiNormalize({
  adres: 'QA Caddesi No: 12, Kat 3, Kadıköy / İstanbul',
  harita: 'https://maps.example.test/qa-klinik',
  otopark: 'Binanın altında ücretli otopark var.',
  odeme: 'Nakit ve kredi kartı geçerlidir.',
  telefon: '0216 555 00 00',
  hazirlik: { kontrol: 'Önceki tahlil raporlarınızı yanınızda getirin.' },
  sss: [{ soru: 'Refakatçi gelebilir mi?', yanit: 'Evet, bir refakatçi bekleme salonunda bekleyebilir.' }],
})

type Cagri = { url: URL; method: string; body: any }
function sahteFetch() {
  const cagrilar: Cagri[] = []
  let n = 0
  const f = async (u: string, init?: RequestInit) => {
    cagrilar.push({ url: new URL(u), method: init?.method || 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined })
    return new Response(JSON.stringify({ messages: [{ id: `wamid.OUT${++n}` }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  return { f, metinler: () => cagrilar.filter((c) => c.method === 'POST' && c.url.pathname.endsWith('/messages')).map((g) => String(g.body?.text?.body || '')) }
}

/** A model stand-in that records every prompt it is given. */
function sahteModel(yanit: string | (() => never)) {
  const istemler: ModelIstemi[] = []
  const model = async (i: ModelIstemi) => { istemler.push(i); if (typeof yanit === 'function') return yanit(); return yanit }
  return { model, istemler }
}

async function sahneKur(o: { yanitAcik?: boolean; bilgi?: MuayenehaneBilgisi; mod?: string } = {}) {
  mock.timers.setTime(SIMDI.getTime())
  const db = new SahteVeritabani()
  const sb = db.istemci() as never
  db.ekle(TABLO_AYAR, { doctor_id: A, randevu_modu: o.mod ?? 'kapali', yanit_acik: o.yanitAcik ?? true, bilgi: o.bilgi ?? BILGI })
  const hasta = db.ekle('patients', {
    doctor_id: A, is_active: true, name_encrypted: encryptPII(JSON.stringify({ ad: 'QA Gizli-Hasta Yılmaz' })), dob_encrypted: encryptPII('1980-05-05'),
    phone_encrypted: encryptPII('0532 111 22 33'), email_encrypted: encryptPII('qa-hasta@ornek.test'), iletisim_izni_whatsapp: true,
    notes_encrypted: encryptPII(JSON.stringify({ kronikHastaliklar: 'QA-TANI-GIZLI', suregenIlaclar: 'QA-ILAC-GIZLI' })),
  }).id as string
  db.ekle('randevular', { doktor_id: A, patient_id: hasta, baslangic: new Date(SIMDI.getTime() + 3 * 86400e3).toISOString(), bitis: new Date(SIMDI.getTime() + 3 * 86400e3 + 1800e3).toISOString(), durum: 'onaylandi' })
  await baglantiKaydet(sb, {
    doktorId: A, businessId: null, wabaId: 'WABA-A', phoneNumberId: 'PN-A', gorunenNumara: '+90 555 000 00 00', gorunenAd: 'QA Klinik', token: 'TOKEN-A',
    sablonlar: Object.fromEntries(SABLON_KODLARI.map((k) => [k, { id: k, durum: 'APPROVED', guncellendi: '' }])),
  } as never)
  return { db, sb, hasta }
}

let sayac = 0
const gelen = (govde: string, wamid = `wamid.Y-${++sayac}`) =>
  [{ phoneNumberId: 'PN-A', wamid, karsiNumara: TEL, zaman: SIMDI.toISOString(), tip: 'text', govde, mediaId: null, yon: 'gelen' as const }]
const sonKart = (db: SahteVeritabani) => db.tablo(YANITLAR)[db.tablo(YANITLAR).length - 1]

describe('kural yanıtı: doğrudan bilgi sayfasından', () => {
  it('adres + konum: sayfadaki metin aynen gider, model çağrılmaz, kartta “Ayşe yanıtladı” ve kaynak alanlar durur', async () => {
    const { db, sb } = await sahneKur()
    const { f, metinler } = sahteFetch()
    const m = sahteModel('{"alanlar":[],"yanit":null}')
    const ozet = await yanitIsle(sb, gelen('Adresiniz nedir, konum atar mısınız?', 'wamid.Y-ADRES'), { fetch: f, simdi: SIMDI, bilgiModeli: m.model })
    assert.equal(m.istemler.length, 0)
    assert.match(metinler()[0], /QA Caddesi No: 12/)
    assert.match(metinler()[0], /https:\/\/maps\.example\.test\/qa-klinik/)
    const k = sonKart(db)
    assert.equal(k.otomatik_eylem, OB.yanit)
    assert.equal(k.niyet, 'soru')
    assert.deepEqual(k.on_buro.alanlar, ['adres', 'harita'])
    assert.equal(k.on_buro.kaynak, 'kural')
    assert.equal(decryptPII(k.on_buro.yanit), metinler()[0])
    assert.ok(!JSON.stringify(k).includes('QA Caddesi'), 'yanıt kartta yalnız şifreli durur')
    assert.ok(ozet.yanitlananlar.has('wamid.Y-ADRES'), 'defterin sabit cümlesi susturulur')
  })

  it('çalışma saatleri boşsa randevu ayarlarındaki plandan türetilir', async () => {
    const { db, sb } = await sahneKur()
    db.ekle('doktor_calisma_saatleri', { doktor_id: A, slot_dakika: 30, gunler: { '1': { acik: true, baslangic: '09:00', bitis: '17:00' }, '6': { acik: true, baslangic: '10:00', bitis: '13:00' } } })
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('cumartesi açık mısınız'), { fetch: f, simdi: SIMDI })
    assert.match(metinler()[0], /Pazartesi 09:00–17:00, Cumartesi 10:00–13:00/)
  })

  it('eksik alan (hekim ücret yazmamış) → bekleme yanıtı + kart; model çağrılmaz, ücret uydurulmaz', async () => {
    const { db, sb } = await sahneKur()
    const { f, metinler } = sahteFetch()
    const m = sahteModel('{"alanlar":["ucretler"],"yanit":"Muayene 1500 TL"}')
    await yanitIsle(sb, gelen('muayene ücreti ne kadar'), { fetch: f, simdi: SIMDI, bilgiModeli: m.model })
    assert.equal(m.istemler.length, 0)
    assert.equal(metinler()[0], dil.metin.bekleme)
    assert.equal(sonKart(db).otomatik_eylem, OB.cevapsiz)
    assert.equal(sonKart(db).on_buro.neden, 'alan_bos')
  })
})

describe('model yanıtı: yalnız sayfadan, anahtarlar doğrulanır', () => {
  it('sayfaya dayalı yanıt gider; modele yalnız soru ve sayfa verilir — hasta verisi yok', async () => {
    const { db, sb } = await sahneKur()
    const { f, metinler } = sahteFetch()
    const m = sahteModel('{"alanlar":["sss.0"],"yanit":"Evet, bir refakatçi bekleme salonunda bekleyebilir."}')
    await yanitIsle(sb, gelen('Ben QA Gizli-Hasta Yılmaz, telefonum 0532 111 22 33. Annemle birlikte gelebilir miyim?'), { fetch: f, simdi: SIMDI, bilgiModeli: m.model })
    assert.equal(m.istemler.length, 1)
    const istem = m.istemler[0]
    assert.equal(istem.system, MODEL_SISTEM)
    const tum = istem.system + '\n' + istem.kullanici
    for (const gizli of ['Gizli-Hasta', 'Yılmaz', '0532', TEL, 'QA-TANI-GIZLI', 'QA-ILAC-GIZLI', '1980-05-05', 'qa-hasta@ornek.test']) assert.ok(!tum.includes(gizli), `modele gitti: ${gizli}`)
    assert.ok(!/randevu(lar)?["']?\s*:/.test(tum) && !tum.includes(new Date(SIMDI.getTime() + 3 * 86400e3).toISOString().slice(0, 10)), 'randevu bilgisi yok')
    assert.match(istem.kullanici, /SHEET:[\s\S]*QA Caddesi[\s\S]*QUESTION:/)
    assert.equal(metinler()[0], 'Evet, bir refakatçi bekleme salonunda bekleyebilir.')
    assert.equal(sonKart(db).otomatik_eylem, OB.yanit)
    assert.equal(sonKart(db).on_buro.kaynak, 'model')
    assert.deepEqual(sonKart(db).on_buro.alanlar, ['sss.0'])
    assert.equal(db.tablo(GUNLUK).filter((g) => g.tur === TUR_MODEL).length, 1, 'model çağrısı sayıldı')
  })

  it('model var olmayan bir anahtar gösterirse → bekleme yanıtı', async () => {
    const { db, sb } = await sahneKur()
    const { f, metinler } = sahteFetch()
    const m = sahteModel('{"alanlar":["wifi"],"yanit":"Wi-Fi şifremiz 1234."}')
    await yanitIsle(sb, gelen('wifi var mı'), { fetch: f, simdi: SIMDI, bilgiModeli: m.model })
    assert.equal(metinler()[0], dil.metin.bekleme)
    assert.equal(sonKart(db).otomatik_eylem, OB.cevapsiz)
    assert.equal(sonKart(db).on_buro.neden, 'model_gecersiz')
  })

  it('model boş bir alanı gösterirse (ücretler) → bekleme yanıtı', async () => {
    const { db, sb } = await sahneKur()
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('taksit yapıyor musunuz acaba, bilgi alabilir miyim'), { fetch: f, simdi: SIMDI, bilgiModeli: sahteModel('{"alanlar":["ucretler"],"yanit":"Taksit yapılır."}').model })
    // "taksit" is a payment-rule word → answered from the sheet's payment field by rule; the model is not needed.
    assert.match(metinler()[0], /Nakit ve kredi kartı/)
    const { f: f2, metinler: m2 } = sahteFetch()
    await yanitIsle(sb, gelen('çocuk oyun alanınız var mı'), { fetch: f2, simdi: sonra(1), bilgiModeli: sahteModel('{"alanlar":["ucretler"],"yanit":"Var."}').model })
    assert.equal(m2()[0], dil.metin.bekleme)
    assert.equal(sonKart(db).on_buro.neden, 'model_gecersiz')
  })

  it('model sayfada olmayan bir sayı / bağlantı eklerse kendi cümlesi atılır, hekimin metni aynen gider', () => {
    const alanlar = bilgiDuzle(BILGI)
    const sayi = modelYanitiCoz('{"alanlar":["otopark"],"yanit":"Otopark var, saati 250 TL."}', alanlar, dil)
    assert.equal(sayi?.metin, 'Binanın altında ücretli otopark var.')
    const link = modelYanitiCoz('{"alanlar":["adres"],"yanit":"Adres için https://evil.example/x"}', alanlar, dil)
    assert.equal(link?.metin, BILGI.adres)
    const tibbi = modelYanitiCoz('{"alanlar":["otopark"],"yanit":"Otopark var. Ateşiniz varsa ilaç alın."}', alanlar, dil)
    assert.equal(tibbi?.metin, 'Binanın altında ücretli otopark var.')
    assert.equal(modelYanitiCoz('yanıt yok', alanlar, dil), null)
    assert.equal(modelYanitiCoz('{"alanlar":[],"yanit":"Bilmiyorum"}', alanlar, dil), null)
    assert.equal(modelYanitiCoz('{"alanlar":["adres","otopark","odeme","telefon"],"yanit":"x"}', alanlar, dil), null, 'en çok üç alan')
  })

  it('model “yanıt yok” derse, hata verirse ya da zaman aşımına uğrarsa → bekleme yanıtı', async () => {
    for (const [ad, model, neden] of [
      ['cevapsiz', sahteModel('{"alanlar":[],"yanit":null}').model, 'model_cevapsiz'],
      ['hata', sahteModel(() => { throw new Error('zaman aşımı') }).model, 'model_hata'],
      ['bozuk', sahteModel('üzgünüm, bilmiyorum').model, 'model_gecersiz'],
    ] as const) {
      const { db, sb } = await sahneKur()
      const { f, metinler } = sahteFetch()
      await yanitIsle(sb, gelen('bekleme salonunuzda çay var mı'), { fetch: f, simdi: SIMDI, bilgiModeli: model })
      assert.equal(metinler()[0], dil.metin.bekleme, ad)
      assert.equal(sonKart(db).otomatik_eylem, OB.cevapsiz, ad)
      assert.equal(sonKart(db).on_buro.neden, neden, ad)
    }
  })

  it('günlük model bütçesi dolunca model sorulmaz (kurallar yanıtlamaya devam eder)', async () => {
    const { db, sb } = await sahneKur()
    for (let i = 0; i < MODEL_GUNLUK; i++) db.ekle(GUNLUK, { doctor_id: A, yon: 'olay', tur: TUR_MODEL, durum: 'olay' })
    const { f, metinler } = sahteFetch()
    const m = sahteModel('{"alanlar":["sss.0"],"yanit":"Evet."}')
    await yanitIsle(sb, gelen('refakatçi gelebilir mi'), { fetch: f, simdi: SIMDI, bilgiModeli: m.model })
    assert.equal(m.istemler.length, 0)
    assert.equal(sonKart(db).on_buro.neden, 'model_siniri')
    await yanitIsle(sb, gelen('otopark var mı'), { fetch: f, simdi: sonra(1), bilgiModeli: m.model })
    assert.match(metinler()[1], /ücretli otopark/)
  })
})

describe('tıbbi ve acil koruyucular modelden ÖNCE çalışır', () => {
  it('tıbbi soru: sabit cümle, işaretli kart, model çağrılmaz', async () => {
    const { db, sb } = await sahneKur()
    const { f, metinler } = sahteFetch()
    const m = sahteModel('{"alanlar":["otopark"],"yanit":"Parol verin."}')
    for (const soru of ['Çocuğumun ateşi 39, ne yapmalıyım?', 'antibiyotiği aç karna mı içsin', 'tahlil sonucum normal mi']) {
      await yanitIsle(sb, gelen(soru), { fetch: f, simdi: sonra(metinler().length), bilgiModeli: m.model })
      assert.equal(metinler()[metinler().length - 1], dil.metin.tibbi, soru)
      assert.equal(sonKart(db).otomatik_eylem, OB.tibbi, soru)
    }
    assert.equal(m.istemler.length, 0)
  })

  it('acil ifade: ülkenin acil numarasıyla sabit cümle, acil kart, masa öğesi; model çağrılmaz, randevu önerilmez', async () => {
    const { db, sb } = await sahneKur({ mod: 'otomatik' })
    db.tablo('randevular').length = 0
    const { f, metinler } = sahteFetch()
    const m = sahteModel('{"alanlar":["adres"],"yanit":"x"}')
    await yanitIsle(sb, gelen('göğsümde ağrı var randevu alabilir miyim'), { fetch: f, simdi: SIMDI, bilgiModeli: m.model })
    assert.equal(metinler().length, 1)
    assert.equal(metinler()[0], dil.metin.acil)
    assert.match(metinler()[0], /112/)
    assert.equal(sonKart(db).otomatik_eylem, OB.acil)
    assert.equal(m.istemler.length, 0)
    assert.equal(db.tablo('randevular').length, 0)
    const { onBuroMasaKartlari, onBuroMasaOgeleri } = await import('./fisilti')
    const [oge] = onBuroMasaOgeleri(await onBuroMasaKartlari(sb, A, sonra(1)))
    assert.equal(oge.oncelik, 0)
    assert.ok(!JSON.stringify(oge).includes('göğs'), 'masa öğesinde mesaj metni yok')
  })

  it('yanıt anahtarı kapalıyken acil / tıbbi mesajda ön büro hiçbir şey göndermez (mevcut akış sürer)', async () => {
    const { db, sb } = await sahneKur({ yanitAcik: false, mod: 'otomatik' })
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('göğsüm ağrıyor, nefesim daralıyor'), { fetch: f, simdi: SIMDI, llm: async () => 'diger' })
    await yanitIsle(sb, gelen('otopark var mı'), { fetch: f, simdi: sonra(1), llm: async () => 'soru' })
    assert.equal(metinler().length, 0)
    assert.ok(db.tablo(YANITLAR).every((k) => !String(k.otomatik_eylem || '').startsWith('ob_')))
    assert.equal(db.tablo(YANITLAR)[0].otomatik_eylem, 'acil_uyari', 'mevcut akışın acil işareti')
  })
})

describe('sınırlar, DUR ve sessiz kalınan mesajlar', () => {
  it('DUR: mesaj izni kapanır, ön büro yanıt vermez; soru olmayan sohbet mesajına yanıt gitmez', async () => {
    const { db, sb, hasta } = await sahneKur()
    const { f, metinler } = sahteFetch()
    const m = sahteModel('{"alanlar":["adres"],"yanit":"x"}')
    await yanitIsle(sb, gelen('teşekkürler iyi günler'), { fetch: f, simdi: SIMDI, bilgiModeli: m.model, llm: async () => 'diger' })
    assert.equal(metinler().length, 0)
    assert.equal(m.istemler.length, 0)
    await yanitIsle(sb, gelen('DUR'), { fetch: f, simdi: sonra(1), bilgiModeli: m.model })
    assert.equal(db.tablo('patients').find((p) => p.id === hasta)!.iletisim_izni_whatsapp, false)
    assert.equal(sonKart(db).otomatik_eylem, 'vazgec_uygulandi')
    assert.equal(db.tablo(GUNLUK).filter((g) => g.tur === TUR_ON_BURO).length, 0)
  })

  it('saatlik yanıt sınırı: sınırdan sonra aynı soruya yanıt gitmez, kart “sınır” olarak masaya kalır, defter de susar', async () => {
    const { db, sb } = await sahneKur()
    const { f, metinler } = sahteFetch()
    for (let i = 0; i < 8; i++) await yanitIsle(sb, gelen('otopark var mı'), { fetch: f, simdi: sonra(i) })
    assert.equal(metinler().length, 8)
    const ozet = await yanitIsle(sb, gelen('otopark var mı', 'wamid.Y-SINIR'), { fetch: f, simdi: sonra(9) })
    assert.equal(metinler().length, 8)
    assert.equal(sonKart(db).otomatik_eylem, OB.sinir)
    assert.ok(ozet.yanitlananlar.has('wamid.Y-SINIR'))
    // An hour later the window has moved on.
    await yanitIsle(sb, gelen('otopark var mı'), { fetch: f, simdi: sonra(75) })
    assert.equal(metinler().length, 9)
  })

  it('yeniden teslim: tek yanıt, tek kart, tek model çağrısı', async () => {
    const { db, sb } = await sahneKur()
    const { f, metinler } = sahteFetch()
    const m = sahteModel('{"alanlar":["sss.0"],"yanit":"Evet, bir refakatçi bekleme salonunda bekleyebilir."}')
    await yanitIsle(sb, gelen('refakatçi gelebilir mi', 'wamid.Y-TEK'), { fetch: f, simdi: SIMDI, bilgiModeli: m.model })
    await yanitIsle(sb, gelen('refakatçi gelebilir mi', 'wamid.Y-TEK'), { fetch: f, simdi: SIMDI, bilgiModeli: m.model })
    assert.equal(metinler().length, 1)
    assert.equal(db.tablo(YANITLAR).length, 1)
    assert.equal(m.istemler.length, 1)
  })
})

describe('ayar ve önizleme', () => {
  it('normalize: beklenmeyen değer kapalıya düşer; harita yalnız https bağlantısıdır; uzunluk ve satır sınırı', () => {
    const a = onBuroNormalize({ randevu_modu: 'herkese', yanit_acik: 'evet', bilgi: { adres: 'x'.repeat(5000), harita: 'javascript:alert(1)', sss: Array.from({ length: 40 }, (_, i) => ({ soru: `s${i}`, yanit: `y${i}` })), bilinmeyen: 'x' } })
    assert.equal(a.randevuModu, 'kapali')
    assert.equal(a.yanitAcik, false)
    assert.equal(a.bilgi.adres.length, 600)
    assert.equal(a.bilgi.harita, '')
    assert.equal(a.bilgi.sss.length, 12)
    assert.ok(!('bilinmeyen' in a.bilgi))
    assert.equal(bilgiDuzle(BOS_BILGI).size, 0)
  })

  it('önizleme canlı akışla aynı kuralları kullanır ve hiçbir şey göndermez / yazmaz', async () => {
    const { db, sb } = await sahneKur()
    const once = JSON.stringify([db.tablo(YANITLAR), db.tablo(GUNLUK), db.tablo('randevular')])
    const ayar = onBuroNormalize({ randevuModu: 'onay', yanitAcik: true, bilgi: BILGI })
    const g = { doktorId: A, ayar, dil, turetilmisSaatler: '', simdi: SIMDI }
    assert.equal((await onBuroOnizleme(sb, { ...g, metin: 'otopark var mı' })).yanit, 'Otopark: Binanın altında ücretli otopark var.')
    assert.equal((await onBuroOnizleme(sb, { ...g, metin: 'ateşi var ne yapmalıyım' })).tur, 'tibbi')
    assert.equal((await onBuroOnizleme(sb, { ...g, metin: 'nefes alamıyorum' })).yanit, dil.metin.acil)
    assert.equal((await onBuroOnizleme(sb, { ...g, metin: 'randevumu iptal ediyorum' })).tur, 'mevcut_akis')
    assert.equal((await onBuroOnizleme(sb, { ...g, metin: 'DUR' })).tur, 'mevcut_akis')
    assert.equal((await onBuroOnizleme(sb, { ...g, metin: 'teşekkürler' })).tur, 'sessiz')
    const r = await onBuroOnizleme(sb, { ...g, metin: 'randevu almak istiyorum' })
    assert.equal(r.tur, 'randevu')
    assert.match(String(r.yanit), /1\) /)
    assert.equal((await onBuroOnizleme(sb, { ...g, ayar: { ...ayar, yanitAcik: false }, metin: 'otopark var mı' })).tur, 'sessiz')
    assert.equal(JSON.stringify([db.tablo(YANITLAR), db.tablo(GUNLUK), db.tablo('randevular')]), once)
  })

  it('bilgiYaniti: soru olmayan metin ve boş sayfa modeli çağırmaz', async () => {
    const m = sahteModel('{"alanlar":["adres"],"yanit":"x"}')
    assert.equal((await bilgiYaniti({ soru: 'tamamdır', bilgi: BILGI, dil, model: m.model })).neden, 'soru_degil')
    assert.equal((await bilgiYaniti({ soru: 'wifi var mı', bilgi: BOS_BILGI, dil, model: m.model })).neden, 'model_yok')
    assert.equal(m.istemler.length, 0)
  })
})
