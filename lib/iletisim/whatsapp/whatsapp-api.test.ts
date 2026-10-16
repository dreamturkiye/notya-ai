/**
 * WHATSAPP-API-01 — WhatsApp Business Cloud API entegrasyonu: şablonlar, webhook imzası, niyet sınıflandırma (LLM sahte),
 * telefon normalizasyonu, doktorlar arası yalıtım, tier sınırı, e-posta yedeği, idempotency, otomatik eylemler.
 * Hiç ağ yok (fetch enjekte), veritabanı bellek içi. GERÇEK Meta ÇAĞRISI YOK — gerçek Meta ile doğrulama OPEN-COMMITMENTS'ta.
 * Veri sentetik (QA).
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-whatsapp-api-anahtari'

import { SahteVeritabani } from '../../security/testing/sahteSupabase'
import { encryptPII, decryptPII } from '../../security/encryption'
import { SABLONLAR, SABLON_KODLARI } from '../otomatik/whatsapp/sablonlar'
import { sablonMetni, sablonMesajiKur } from '../otomatik/whatsapp/gonder'
import { whatsappGondericisi } from '../otomatik/whatsapp'
import { baglantiKaydet, TABLO } from '../otomatik/whatsapp/depo'
import { BASLANGIC_LIMIT, tierLimiti, tierEtiketi, kotaAl, son24Saat, buAy, TR_UTILITY_USD } from '../otomatik/whatsapp/kota'
import { GUNLUK, karsiTarafIzi } from '../otomatik/whatsapp/gunluk'
import { imzaGecerliMi } from '../otomatik/whatsapp/webhook'
import { katla, kuralNiyeti, niyetBul, etiketCoz, slotSecimi } from './niyet'
import { numaraRakam, hastalariEslestir } from './eslestir'
import { webhookIsle, webhookDogrula, alarmSayaciniSifirla } from './webhookIsle'
import { YANITLAR, yanitIsle } from './yanit'
import { basarisizTeslimYedegi } from './yedek'
import { kartEylemi } from './eylem'
import { takilanDenemeleriKapat } from './bakim'
import { sssBul, yardimCevabi } from './yardim'
import { KVKK_ONAY_SURUM } from './kvkk'

const SIR = 'sir-wa-api-qa'
const ENV = {
  WHATSAPP_APP_ID: '111', WHATSAPP_APP_SECRET: SIR, WHATSAPP_ES_CONFIG_ID: '222', WHATSAPP_VERIFY_TOKEN: 'dogrula-qa', ENCRYPTION_MASTER_KEY: 'x',
} as unknown as NodeJS.ProcessEnv

const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
const oglen = () => new Date(`${bugunTr()}T12:00:00+03:00`)
const yarin = (saat: number, dk = 0) => new Date(Date.parse(`${bugunTr()}T00:00:00+03:00`) + 86400e3 + (saat * 60 + dk) * 60e3).toISOString()

type Cagri = { url: URL; method: string; body: any }
function sahteFetch(yanit?: (c: Cagri) => { status?: number; json: unknown } | 'ag-hatasi') {
  const cagrilar: Cagri[] = []
  let n = 0
  const f = async (u: string, init?: RequestInit) => {
    const c: Cagri = { url: new URL(u), method: init?.method || 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined }
    cagrilar.push(c)
    const y = yanit ? yanit(c) : { json: { messages: [{ id: `wamid.OUT${++n}` }] } }
    if (y === 'ag-hatasi') throw new Error('ağ yok')
    return new Response(JSON.stringify(y.json), { status: y.status ?? 200, headers: { 'Content-Type': 'application/json' } })
  }
  return { f, cagrilar, gonderimler: () => cagrilar.filter((c) => c.method === 'POST' && c.url.pathname.endsWith('/messages')) }
}

const A = '00000000-0000-4000-8000-0000000000aa'
const B = '00000000-0000-4000-8000-0000000000bb'
const TEL = '905321112233'

type Sahne = ReturnType<typeof sahneKur>
function sahneKur() {
  const db = new SahteVeritabani()
  const sb = db.istemci() as never
  const hasta = (doktor: string, ad: string, dob = '1980-05-05', tel = '0532 111 22 33') => db.ekle('patients', {
    doctor_id: doktor, is_active: true,
    name_encrypted: encryptPII(JSON.stringify({ ad })), dob_encrypted: encryptPII(dob), phone_encrypted: encryptPII(tel), email_encrypted: encryptPII('qa-hasta@ornek.test'),
    iletisim_izni_whatsapp: true, iletisim_izni_eposta: true,
  }).id
  const randevu = (doktor: string, hastaId: string, baslangic = yarin(10, 30)) =>
    db.ekle('randevular', { doktor_id: doktor, patient_id: hastaId, baslangic, bitis: new Date(Date.parse(baslangic) + 1800e3).toISOString(), durum: 'planlandi', hatirlatma_gonderildi: false }).id
  return { db, sb, hasta, randevu }
}

async function baglan(sb: never, doktor: string, pn: string, sablonDurum = 'APPROVED', ek: Record<string, unknown> = {}) {
  const d = (id: string) => ({ id, durum: sablonDurum, guncellendi: '' })
  await baglantiKaydet(sb, {
    doktorId: doktor, businessId: null, wabaId: `WABA-${pn}`, phoneNumberId: pn, gorunenNumara: '+90 555 000 00 00', gorunenAd: 'QA Klinik', token: `TOKEN-${pn}`,
    sablonlar: Object.fromEntries(SABLON_KODLARI.map((k) => [k, d(k)])), ...ek,
  } as never)
}

const mesajGovdesi = (pn: string, govde: string, wamid: string, from = TEL) => JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{ changes: [{ field: 'messages', value: { metadata: { phone_number_id: pn }, messages: [{ id: wamid, from, timestamp: String(Math.floor(oglen().getTime() / 1000)), type: 'text', text: { body: govde } }] } }] }],
})
const imzala = (ham: string, sir = SIR) => 'sha256=' + createHmac('sha256', sir).update(ham).digest('hex')

describe('şablonlar: gövde, değişkenler, KVKK', () => {
  it('randevu hatırlatması EVET ve İPTAL yönergesini içerir ve doğru doldurulur', () => {
    const g = SABLONLAR.randevu_hatirlatma.govde
    assert.match(g, /EVET/)
    assert.match(g, /İPTAL/)
    assert.equal(
      sablonMetni('randevu_hatirlatma', ['Ayşe', '12 Ekim Pazartesi', '14:30', 'Dr. Demir']),
      'Merhaba Ayşe, randevunuz 12 Ekim Pazartesi tarihinde saat 14:30’te, Dr. Demir ile. Onaylamak için EVET, iptal etmek için İPTAL yazın.',
    )
  })

  it('sonuç-hazır şablonu jenerik: tahlil/hastalık/değer adı yok, bağlantı düğmede', () => {
    const t = SABLONLAR.sonuc_hazir
    assert.ok(t.dugme && /\{\{1\}\}$/.test(t.dugme.url))
    assert.ok(!/tahlil|kan|değer|hastalık|tanı|rapor|sonuç[ıi]n/i.test(t.govde), t.govde)
    assert.equal(sablonMetni('sonuc_hazir', ['Ayşe', 'Dr. Demir', 'https://www.notya.io/portal/hasta/tok']), t.govde.replace('{{1}}', 'Ayşe').replace('{{2}}', 'Dr. Demir'))
  })

  it('hiçbir şablon klinik ayrıntı taşımaz; gövde değişkenle başlamaz/bitmez ve her değişkenin örneği vardır', () => {
    for (const kod of SABLON_KODLARI) {
      const t = SABLONLAR[kod]
      assert.ok(!/\{\{\d\}\}\s*$/.test(t.govde) && !/^\s*\{\{\d\}\}/.test(t.govde), `${kod}: Meta değişkenle başlayan/biten gövdeyi reddeder`)
      const sayi = new Set(t.govde.match(/\{\{\d+\}\}/g)).size
      assert.equal(t.ornek.length, sayi, `${kod}: örnek sayısı`)
      assert.ok(!/ilaç|teşhis|diyabet|kanser|gebelik|hiv|psikiyat/i.test(t.govde), kod)
    }
  })

  it('genel bildirim yedeği 2 değişken ister; eksik/boş değişken ve geçersiz numara reddedilir', () => {
    assert.ok('govde' in sablonMesajiKur('genel_bildirim', '05321112233', ['Ayşe', 'Dr. Demir']))
    assert.ok('hata' in sablonMesajiKur('genel_bildirim', '05321112233', ['Ayşe']))
    assert.ok('hata' in sablonMesajiKur('genel_bildirim', '123', ['Ayşe', 'Dr. Demir']))
  })
})

describe('webhook: imza (geçerli / geçersiz / eksik) ve doğrulama', () => {
  beforeEach(() => alarmSayaciniSifirla())
  const bos = JSON.stringify({ object: 'whatsapp_business_account', entry: [] })

  it('imzaGecerliMi: doğru, bozuk gövde, yanlış sır, eksik, biçimsiz', () => {
    assert.equal(imzaGecerliMi(bos, imzala(bos), SIR), true)
    assert.equal(imzaGecerliMi(bos + ' ', imzala(bos), SIR), false)
    assert.equal(imzaGecerliMi(bos, imzala(bos, 'baska'), SIR), false)
    assert.equal(imzaGecerliMi(bos, null, SIR), false)
    assert.equal(imzaGecerliMi(bos, '', SIR), false)
    assert.equal(imzaGecerliMi(bos, 'sha256=zz', SIR), false)
  })

  it('POST: geçerli → 200, geçersiz → 401 (ve admin uyarısı), eksik → 401, ortam yok → 503', async () => {
    const { sb } = sahneKur()
    const uyarilar: string[] = []
    const deps = { sb: () => sb, env: ENV, alarm: async (m: string) => { uyarilar.push(m) } }
    assert.equal((await webhookIsle(bos, imzala(bos), deps)).status, 200)
    assert.equal(uyarilar.length, 0)
    assert.equal((await webhookIsle(bos, imzala(bos, 'yanlis'), deps)).status, 401)
    assert.equal(uyarilar.length, 1)
    assert.ok(!uyarilar[0].includes(SIR))
    assert.equal((await webhookIsle(bos, null, deps)).status, 401)
    assert.equal((await webhookIsle(bos, imzala(bos), { ...deps, env: {} as NodeJS.ProcessEnv })).status, 503)
  })

  it('imzasız istek hiçbir şey yazmaz', async () => {
    const { db, sb } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const h = mesajGovdesi('PN-A', 'EVET', 'wamid.IN1')
    await webhookIsle(h, null, { sb: () => sb, env: ENV, alarm: async () => {} })
    assert.equal(db.tablo(YANITLAR).length, 0)
    assert.equal(db.tablo(GUNLUK).length, 0)
  })

  it('GET doğrulama: doğru token challenge döner, yanlış 403, ortam yok 503', () => {
    const q = (o: Record<string, string>) => new URLSearchParams({ 'hub.mode': 'subscribe', ...o })
    assert.deepEqual(webhookDogrula(q({ 'hub.verify_token': 'dogrula-qa', 'hub.challenge': 'CH123' }), { env: ENV }), { status: 200, text: 'CH123' })
    assert.equal(webhookDogrula(q({ 'hub.verify_token': 'yanlis', 'hub.challenge': 'CH123' }), { env: ENV }).status, 403)
    assert.equal(webhookDogrula(q({ 'hub.challenge': 'CH123' }), { env: ENV }).status, 403)
    assert.equal(webhookDogrula(q({ 'hub.verify_token': 'dogrula-qa', 'hub.challenge': 'CH123' }), { env: {} as NodeJS.ProcessEnv }).status, 503)
  })
})

describe('niyet: kural önce, LLM yalnız etiketler (sahte LLM)', () => {
  it('EVET / İPTAL / IPTAL / iptal! / DUR doğru; büyük-küçük harf ve noktalama fark etmez', () => {
    assert.equal(kuralNiyeti('EVET')?.niyet, 'onay')
    assert.equal(kuralNiyeti('Evet, geliyorum.')?.niyet, 'onay')
    assert.equal(kuralNiyeti('👍')?.niyet, 'onay')
    assert.equal(kuralNiyeti('İPTAL')?.niyet, 'iptal')
    assert.equal(kuralNiyeti('IPTAL')?.niyet, 'iptal')
    assert.equal(kuralNiyeti('iptal!')?.niyet, 'iptal')
    assert.equal(kuralNiyeti('Randevuyu iptal edin')?.niyet, 'iptal')
    assert.equal(kuralNiyeti('DUR')?.niyet, 'vazgec')
    assert.equal(kuralNiyeti('STOP')?.niyet, 'vazgec')
    assert.equal(katla('IPTAL'), 'iptal')
    assert.equal(katla('İPTAL'), 'iptal')
  })

  it('olumsuzlama otomatik eylemi engeller: "iptal etmek istemiyorum" iptal sayılmaz', () => {
    assert.equal(kuralNiyeti('iptal etmek istemiyorum')?.niyet, 'diger')
    assert.equal(kuralNiyeti('evet değil')?.niyet ?? 'diger', 'diger')
  })

  it('yeniden planlama kuralı', () => {
    assert.equal(kuralNiyeti('Randevuyu ertelemek istiyorum')?.niyet, 'yeniden_planla')
    assert.equal(kuralNiyeti('Başka bir gün olabilir mi')?.niyet, 'yeniden_planla')
  })

  it('niyetBul: kural eşleşirse LLM hiç çağrılmaz', async () => {
    let cagri = 0
    const llm = async () => { cagri++; return 'diger' }
    assert.equal((await niyetBul('EVET', { llm })).niyet, 'onay')
    assert.equal((await niyetBul('IPTAL', { llm })).niyet, 'iptal')
    assert.equal(cagri, 0)
  })

  it('niyetBul: kuralın tanımadığı mesaj LLM ile etiketlenir; soru ve yeniden planla', async () => {
    const soru = await niyetBul('Muayene ücreti ne kadar acaba?', { llm: async () => 'soru' })
    assert.deepEqual([soru.niyet, soru.kaynak], ['soru', 'yapay_zeka'])
    const yeni = await niyetBul('Cuma günü benim için daha rahat olur', { llm: async () => 'yeniden_planla' })
    assert.equal(yeni.niyet, 'yeniden_planla')
    assert.equal(yeni.kaynak, 'yapay_zeka')
  })

  it('LLM hata verir / saçmalar / boş mesaj → "diger", asla eylem değil', async () => {
    assert.equal((await niyetBul('merhaba nasılsınız', { llm: async () => { throw new Error('ulaşılamıyor') } })).niyet, 'diger')
    assert.equal((await niyetBul('merhaba nasılsınız', { llm: async () => 'bilmiyorum ama sanırım güzel' })).niyet, 'diger')
    assert.equal((await niyetBul('   ', { llm: async () => 'onay' })).niyet, 'diger')
    assert.equal(etiketCoz('Onay.'), 'onay')
    assert.equal(etiketCoz('???'), null)
  })

  it('slot seçimi yalnız çıplak rakam', () => {
    assert.equal(slotSecimi('2'), 2)
    assert.equal(slotSecimi('1 numara'), 1)
    assert.equal(slotSecimi('2 kişi geliyoruz'), null)
  })
})

describe('telefon normalizasyonu ve doktorlar arası yalıtım', () => {
  it('aynı numaranın yazılışları aynı rakam biçimine iner', () => {
    for (const v of ['0532 111 22 33', '+90 532 111 22 33', '905321112233', '532-111-22-33', '(0532) 111 2233']) assert.equal(numaraRakam(v), TEL, v)
    assert.equal(numaraRakam(''), '')
    assert.equal(numaraRakam(null), '')
  })

  it('eşleştirme yalnız o doktorun aktif hastalarında yapılır', async () => {
    const { db, sb, hasta } = sahneKur()
    const a = hasta(A, 'QA Ayşe')
    hasta(B, 'QA Başka Doktorun Hastası')
    db.ekle('patients', { doctor_id: A, is_active: false, name_encrypted: encryptPII(JSON.stringify({ ad: 'Pasif' })), phone_encrypted: encryptPII('0532 111 22 33') })
    const r = await hastalariEslestir(sb, A, '+905321112233')
    assert.equal(r.eslesme, 'bilinen_hasta')
    assert.deepEqual(r.hastalar.map((h) => h.id), [a])
    assert.equal((await hastalariEslestir(sb, A, '905559998877')).eslesme, 'bilinmeyen')
  })

  it('yaş 18 altı "veli", aynı numarada iki hasta "coklu"', async () => {
    const { sb, hasta } = sahneKur()
    hasta(A, 'QA Çocuk', '2018-02-02')
    assert.equal((await hastalariEslestir(sb, A, TEL)).eslesme, 'veli')
    hasta(A, 'QA Kardeş', '2020-03-03')
    assert.equal((await hastalariEslestir(sb, A, TEL)).eslesme, 'coklu')
  })

  it('B doktorunun hastası A hattına yazarsa A kendi hastasıymış gibi işlemez, B\'nin randevusuna dokunulmaz', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const bHasta = hasta(B, 'QA B Hastası')
    const bRandevu = randevu(B, bHasta)
    const { f, gonderimler } = sahteFetch()
    const o = await yanitIsle(sb, [{ phoneNumberId: 'PN-A', wamid: 'wamid.IN-X', karsiNumara: TEL, zaman: oglen().toISOString(), tip: 'text', govde: 'EVET', mediaId: null, yon: 'gelen' }], { fetch: f, simdi: oglen() })
    assert.equal(o.tekrarGerekli, false)
    assert.equal(db.tablo('randevular').find((r) => r.id === bRandevu)!.durum, 'planlandi')
    assert.equal(db.tablo('randevular').find((r) => r.id === bRandevu)!.hasta_teyit_at, undefined)
    assert.equal(gonderimler().length, 0, 'tanınmayan numaraya otomatik yanıt gitmez')
    const kart = db.tablo(YANITLAR)
    assert.equal(kart.length, 1)
    assert.equal(kart[0].doctor_id, A)
    assert.equal(kart[0].patient_id ?? null, null)
    assert.equal(kart[0].eslesme, 'bilinmeyen')
  })

  it('bilinmeyen phone_number_id bağlantısı olmayan hatta düşer: hiçbir şey yazılmaz', async () => {
    const { db, sb, hasta } = sahneKur()
    hasta(A, 'QA Ayşe')
    const o = await yanitIsle(sb, [{ phoneNumberId: 'PN-YOK', wamid: 'wamid.IN-Y', karsiNumara: TEL, zaman: oglen().toISOString(), tip: 'text', govde: 'EVET', mediaId: null, yon: 'gelen' }], { simdi: oglen() })
    assert.equal(o.islenen, 0)
    assert.equal(db.tablo(YANITLAR).length, 0)
  })

  it('kart eylemi başka doktorun kartına işlemez', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    await baglan(sb, B, 'PN-B')
    const h = hasta(A, 'QA Ayşe')
    const r = randevu(A, h)
    const { f } = sahteFetch()
    await yanitIsle(sb, [{ phoneNumberId: 'PN-A', wamid: 'wamid.IN-K', karsiNumara: TEL, zaman: oglen().toISOString(), tip: 'text', govde: 'Ücret nedir?', mediaId: null, yon: 'gelen' }], { fetch: f, simdi: oglen(), llm: async () => 'soru' })
    const kart = db.tablo(YANITLAR)[0]
    const s = await kartEylemi(sb, { doktorId: B, yapanId: B, kartId: String(kart.id), eylem: 'iptal' })
    assert.equal(s.ok, false)
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'planlandi')
  })
})

describe('tier sınırı (Meta: ilk 250 / 24 saat)', () => {
  it('varsayılan sınır 250; bilinen tier\'lar eşlenir; bilinmeyen en düşüğe düşer', () => {
    assert.equal(BASLANGIC_LIMIT, 250)
    assert.equal(tierLimiti(null), 250)
    assert.equal(tierLimiti(undefined), 250)
    assert.equal(tierLimiti('TIER_250'), 250)
    assert.equal(tierLimiti('TIER_1K'), 1000)
    assert.equal(tierLimiti('TIER_10K'), 10000)
    assert.equal(tierLimiti('TIER_BILINMEYEN'), 250)
    assert.ok(tierEtiketi('TIER_250').length > 0)
  })

  it('kotaAl: sınıra kadar verir, sonra reddeder; başka doktorun sayacı ayrı', async () => {
    const { sb } = sahneKur()
    for (let i = 0; i < 3; i++) assert.equal((await kotaAl(sb, A, 3)).ok, true)
    const r = await kotaAl(sb, A, 3)
    assert.equal(r.ok, false)
    assert.ok(!r.ok && r.neden === 'limit')
    assert.equal((await kotaAl(sb, B, 3)).ok, true)
    assert.equal(await son24Saat(sb, A), 3)
  })

  it('gonder: 250. mesaj gider, 251. Meta\'ya hiç gitmeden reddedilir', async () => {
    const { db, sb } = sahneKur()
    await baglan(sb, A, 'PN-A')
    db.ekle('whatsapp_kota_saatlik', { doctor_id: A, saat: new Date(Math.floor(Date.now() / 3600e3) * 3600e3).toISOString(), adet: 249 })
    const { f, gonderimler } = sahteFetch()
    const g = whatsappGondericisi({ sb: () => sb, env: ENV, fetch: f })
    const gir = (id: string) => ({ doktorId: A, alici: '05321112233', metin: '', sablonKodu: 'randevu_hatirlatma', degiskenler: ['QA', 'a', 'b', 'c'], idemAnahtar: id })
    assert.equal((await g.gonder(gir('kuyruk:1'))).ok, true)
    const ikinci = await g.gonder(gir('kuyruk:2'))
    assert.equal(ikinci.ok, false)
    assert.match(!ikinci.ok ? ikinci.hata : '', /sınır/)
    assert.equal(gonderimler().length, 1)
  })

  it('Meta\'nın bildirdiği tier sınırı yükseltir', async () => {
    const { db, sb } = sahneKur()
    await baglan(sb, A, 'PN-A')
    db.tablo(TABLO).find((r) => r.doctor_id === A)!.mesaj_limiti_tier = 'TIER_1K'
    db.ekle('whatsapp_kota_saatlik', { doctor_id: A, saat: new Date(Math.floor(Date.now() / 3600e3) * 3600e3).toISOString(), adet: 400 })
    const { f } = sahteFetch()
    const g = whatsappGondericisi({ sb: () => sb, env: ENV, fetch: f })
    assert.equal((await g.gonder({ doktorId: A, alici: '05321112233', metin: '', sablonKodu: 'randevu_hatirlatma', degiskenler: ['QA', 'a', 'b', 'c'], idemAnahtar: 'kuyruk:9' })).ok, true)
  })

  it('Meta reddederse ayrılan hak iade edilir; belirsiz (ağ yok) sonuçta iade edilmez', async () => {
    const { sb } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const gir = (id: string) => ({ doktorId: A, alici: '05321112233', metin: '', sablonKodu: 'randevu_hatirlatma', degiskenler: ['QA', 'a', 'b', 'c'], idemAnahtar: id })
    const red = sahteFetch(() => ({ status: 400, json: { error: { message: 'x', code: 131026 } } }))
    const r = await whatsappGondericisi({ sb: () => sb, env: ENV, fetch: red.f }).gonder(gir('kuyruk:r1'))
    assert.equal(r.ok, false)
    assert.equal(await son24Saat(sb, A), 0)
    const ag = sahteFetch(() => 'ag-hatasi')
    const b = await whatsappGondericisi({ sb: () => sb, env: ENV, fetch: ag.f }).gonder(gir('kuyruk:r2'))
    assert.equal(b.ok, false)
    assert.ok(!b.ok && b.belirsiz === true)
    assert.equal(await son24Saat(sb, A), 1)
  })

  it('kullanım: aylık sayım ve tahmini ücret sabiti', async () => {
    const { db, sb } = sahneKur()
    db.ekle('whatsapp_kota_saatlik', { doctor_id: A, saat: new Date().toISOString(), adet: 12 })
    assert.equal(await buAy(sb, A), 12)
    assert.equal(TR_UTILITY_USD, 0.0009)
  })
})

describe('idempotency: aynı anahtar en çok bir kez gider', () => {
  it('aynı idemAnahtar ikinci kez Meta\'ya gitmez, kotayı yemez', async () => {
    const { db, sb } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const { f, gonderimler } = sahteFetch()
    const g = whatsappGondericisi({ sb: () => sb, env: ENV, fetch: f })
    const gir = { doktorId: A, alici: '05321112233', metin: '', sablonKodu: 'randevu_hatirlatma', degiskenler: ['QA', 'a', 'b', 'c'], idemAnahtar: 'kuyruk:abc', hastaId: 'p1', tur: 'randevu_hatirlatma' }
    const ilk = await g.gonder(gir)
    const ikinci = await g.gonder(gir)
    assert.equal(ilk.ok, true)
    assert.equal(ikinci.ok, false)
    assert.equal(gonderimler().length, 1)
    assert.equal(await son24Saat(sb, A), 1)
    const gunluk = db.tablo(GUNLUK).filter((r) => r.doctor_id === A)
    assert.deepEqual(gunluk.map((r) => r.durum).sort(), ['deneniyor', 'gonderildi'])
    assert.ok(gunluk.every((r) => r.idem_anahtar === 'kuyruk:abc'))
  })

  it('denetim satırı şifreli gövde taşır; düz telefon/metin yok, numara anahtarlı özetle', async () => {
    const { db, sb } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const { f } = sahteFetch()
    await whatsappGondericisi({ sb: () => sb, env: ENV, fetch: f }).gonder({ doktorId: A, alici: '05321112233', metin: '', sablonKodu: 'randevu_hatirlatma', degiskenler: ['QA Ayşe', '12 Ekim', '14:30', 'Dr. QA'], idemAnahtar: 'kuyruk:enc' })
    const ham = JSON.stringify(db.tablo(GUNLUK))
    assert.ok(!ham.includes('QA Ayşe'))
    assert.ok(!ham.includes('5321112233'))
    const son = db.tablo(GUNLUK).find((r) => r.durum === 'gonderildi')!
    assert.match(decryptPII(String(son.govde_encrypted)), /QA Ayşe/)
    assert.equal(son.karsi_taraf_hash, karsiTarafIzi('905321112233'))
  })

  it('gelen webhook iki kez teslim edilse de EVET bir kez işlenir ve bir kez yanıtlanır', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe')
    const r = randevu(A, h)
    const { f, gonderimler } = sahteFetch()
    const ham = mesajGovdesi('PN-A', 'EVET', 'wamid.IN-DUP')
    const deps = { sb: () => sb, env: ENV, fetch: f, simdi: oglen(), alarm: async () => {} }
    assert.equal((await webhookIsle(ham, imzala(ham), deps)).status, 200)
    assert.equal((await webhookIsle(ham, imzala(ham), deps)).status, 200)
    assert.equal(db.tablo(YANITLAR).length, 1)
    assert.equal(gonderimler().length, 1)
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'onaylandi')
  })
})

describe('otomatik eylemler: EVET onaylar, İPTAL iptal eder, yeniden planla öneri sunar', () => {
  const gelen = (govde: string, wamid: string) => [{ phoneNumberId: 'PN-A', wamid, karsiNumara: TEL, zaman: oglen().toISOString(), tip: 'text', govde, mediaId: null, yon: 'gelen' as const }]

  it('EVET: randevu onaylanır, sabit teşekkür gönderilir, kart "randevu_onaylandi"', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r = randevu(A, hasta(A, 'QA Ayşe'))
    const { f, gonderimler } = sahteFetch()
    const o = await yanitIsle(sb, gelen('EVET', 'wamid.IN-1'), { fetch: f, simdi: oglen() })
    const rd = db.tablo('randevular').find((x) => x.id === r)!
    assert.equal(rd.durum, 'onaylandi')
    assert.ok(rd.hasta_teyit_at)
    assert.equal(db.tablo(YANITLAR)[0].otomatik_eylem, 'randevu_onaylandi')
    assert.equal(db.tablo(YANITLAR)[0].niyet, 'onay')
    assert.equal(gonderimler().length, 1)
    assert.equal(gonderimler()[0].body.type, 'text')
    assert.ok(o.yanitlananlar.has('wamid.IN-1'))
  })

  it('İPTAL ve IPTAL: randevu iptal edilir, doktor kartı işaretli', async () => {
    for (const kelime of ['İPTAL', 'IPTAL']) {
      const { db, sb, hasta, randevu } = sahneKur()
      await baglan(sb, A, 'PN-A')
      const r = randevu(A, hasta(A, 'QA Ayşe'))
      const { f } = sahteFetch()
      await yanitIsle(sb, gelen(kelime, 'wamid.IN-2'), { fetch: f, simdi: oglen() })
      assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'iptal', kelime)
      assert.match(String(db.tablo(YANITLAR)[0].otomatik_eylem), /^randevu_iptal/)
    }
  })

  it('İPTAL, iptal edilecek randevu yoksa mesaj durdurma anlamına düşer (SMS ile aynı)', async () => {
    const { db, sb, hasta } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe')
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('İPTAL', 'wamid.IN-3'), { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('patients').find((p) => p.id === h)!.iletisim_izni_whatsapp, false)
    assert.equal(db.tablo(YANITLAR)[0].otomatik_eylem, 'vazgec_uygulandi')
  })

  it('DUR: aynı numaradaki tüm hastaların WhatsApp izni kapanır', async () => {
    const { db, sb, hasta } = sahneKur()
    await baglan(sb, A, 'PN-A')
    hasta(A, 'QA Anne', '1985-01-01')
    hasta(A, 'QA Çocuk', '2018-01-01')
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('DUR', 'wamid.IN-4'), { fetch: f, simdi: oglen() })
    assert.deepEqual(db.tablo('patients').map((p) => p.iletisim_izni_whatsapp), [false, false])
  })

  it('yeniden planla isteği: serbest saatler önerilir, randevu kendiliğinden TAŞINMAZ', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r = randevu(A, hasta(A, 'QA Ayşe'))
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('Randevuyu ertelemek istiyorum', 'wamid.IN-5'), { fetch: f, simdi: oglen() })
    const rd = db.tablo('randevular').find((x) => x.id === r)!
    assert.equal(rd.baslangic, yarin(10, 30))
    assert.equal(rd.durum, 'planlandi')
    assert.equal(db.tablo(YANITLAR)[0].niyet, 'yeniden_planla')
  })

  it('soru: yalnız doktor kartı oluşur, otomatik eylem ve yanıt yok; LLM etiketi eylemi tetiklemez', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r = randevu(A, hasta(A, 'QA Ayşe'))
    const { f, gonderimler } = sahteFetch()
    // Even a (hostile) model that says "iptal" cannot cancel: only rule matches drive actions.
    await yanitIsle(sb, gelen('Randevumla ilgili bir şey soracaktım', 'wamid.IN-6'), { fetch: f, simdi: oglen(), llm: async () => 'iptal' })
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'planlandi')
    assert.equal(db.tablo(YANITLAR)[0].niyet_kaynagi, 'yapay_zeka')
    assert.equal(db.tablo(YANITLAR)[0].otomatik_eylem ?? null, null)
    assert.equal(gonderimler().length, 0)
  })

  it('aynı numarada iki hasta ("coklu"): otomatik eylem yok, doktor seçer', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const h1 = hasta(A, 'QA Anne', '1985-01-01')
    hasta(A, 'QA Çocuk', '2018-01-01')
    const r = randevu(A, h1)
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('EVET', 'wamid.IN-7'), { fetch: f, simdi: oglen() })
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'planlandi')
    assert.equal(db.tablo(YANITLAR)[0].eslesme, 'coklu')
  })

  it('kart gövdesi ve numara şifreli saklanır', async () => {
    const { db, sb, hasta } = sahneKur()
    await baglan(sb, A, 'PN-A')
    hasta(A, 'QA Ayşe')
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('Ücret nedir?', 'wamid.IN-8'), { fetch: f, simdi: oglen(), llm: async () => 'soru' })
    const k = db.tablo(YANITLAR)[0]
    assert.ok(!JSON.stringify(k).includes('Ücret nedir'))
    assert.ok(!JSON.stringify(k).includes(TEL))
    assert.equal(decryptPII(String(k.govde_encrypted)), 'Ücret nedir?')
  })
})

describe('doktor kartı: tek dokunuşla eylemler', () => {
  it('Onayla randevuyu onaylar; İptal Et iptal eder; ikinci dokunuş zararsız', async () => {
    const { db, sb, hasta, randevu } = sahneKur()
    await baglan(sb, A, 'PN-A')
    const r = randevu(A, hasta(A, 'QA Ayşe'))
    const { f } = sahteFetch()
    await yanitIsle(sb, [{ phoneNumberId: 'PN-A', wamid: 'wamid.IN-C', karsiNumara: TEL, zaman: oglen().toISOString(), tip: 'text', govde: 'Müsait miyim bilmiyorum', mediaId: null, yon: 'gelen' }], { fetch: f, simdi: oglen(), llm: async () => 'diger' })
    const kartId = String(db.tablo(YANITLAR)[0].id)
    const onay = await kartEylemi(sb, { doktorId: A, yapanId: A, kartId, eylem: 'onayla' }, { fetch: f, simdi: oglen() })
    assert.equal(onay.ok, true)
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'onaylandi')
    const iptal = await kartEylemi(sb, { doktorId: A, yapanId: A, kartId, eylem: 'iptal' }, { fetch: f, simdi: oglen() })
    assert.equal(iptal.ok, true)
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'iptal')
    assert.equal((await kartEylemi(sb, { doktorId: A, yapanId: A, kartId, eylem: 'iptal' }, { fetch: f, simdi: oglen() })).ok, true)
  })
})

describe('e-posta yedeği: WhatsApp teslimi başarısız olunca', () => {
  async function kur() {
    const s = sahneKur()
    const h = s.hasta(A, 'QA Ayşe')
    const r = s.randevu(A, h)
    s.db.ekle('users', { id: A, full_name: 'QA Hekim', first_name: 'Işıl', last_name: 'Öztürk', title: 'Dr.', specialty: 'kardiyoloji', email: 'qa-hekim@ornek.test' })
    s.db.ekle('iletisim_kayitlari', { doctor_id: A, patient_id: h, kanal: 'whatsapp', tur: 'randevu_hatirlatma', durum: 'gonderildi', randevu_id: r, saglayici_mesaj_id: 'wamid.FAIL1', otomatik: true })
    const cagrilar: any[] = []
    const eposta = { kanal: 'eposta' as const, saglayici: 'gmail', hazirMi: async () => true, gonder: async (i: any) => { cagrilar.push(i); return { ok: true as const, saglayici: 'gmail', saglayiciMesajId: 'gm-1' } } }
    return { ...s, h, r, cagrilar, eposta }
  }

  it('başarısız teslimde hastaya e-posta gider, kayıt düşer', async () => {
    const k = await kur()
    const s = await basarisizTeslimYedegi(k.sb, { doktorId: A, mesajId: 'wamid.FAIL1' }, { eposta: k.eposta as never, simdi: oglen() })
    assert.equal(s, 'gonderildi')
    assert.equal(k.cagrilar.length, 1)
    assert.equal(k.cagrilar[0].doktorId, A)
    assert.equal(k.cagrilar[0].patientId, k.h)
    assert.ok(k.db.tablo('iletisim_kayitlari').some((x) => x.kanal === 'eposta' && x.otomatik === true))
  })

  it('aynı başarısız mesaj için yedek bir kez gider (idempotent)', async () => {
    const k = await kur()
    const ilk = await basarisizTeslimYedegi(k.sb, { doktorId: A, mesajId: 'wamid.FAIL1' }, { eposta: k.eposta as never, simdi: oglen() })
    const ikinci = await basarisizTeslimYedegi(k.sb, { doktorId: A, mesajId: 'wamid.FAIL1' }, { eposta: k.eposta as never, simdi: oglen() })
    assert.equal(ilk, 'gonderildi')
    assert.equal(ikinci, 'atlandi')
    assert.equal(k.cagrilar.length, 1)
  })

  it('başka doktorun mesaj kimliği yedek tetiklemez', async () => {
    const k = await kur()
    assert.equal(await basarisizTeslimYedegi(k.sb, { doktorId: B, mesajId: 'wamid.FAIL1' }, { eposta: k.eposta as never, simdi: oglen() }), 'atlandi')
    assert.equal(k.cagrilar.length, 0)
  })

  it('sessiz saatte gönderilmez; bilinmeyen mesaj kimliği atlanır; e-posta bağlı değilse atlanır', async () => {
    const k = await kur()
    const gece = new Date(`${bugunTr()}T23:30:00+03:00`)
    assert.equal(await basarisizTeslimYedegi(k.sb, { doktorId: A, mesajId: 'wamid.FAIL1' }, { eposta: k.eposta as never, simdi: gece }), 'sessiz_saat')
    assert.equal(await basarisizTeslimYedegi(k.sb, { doktorId: A, mesajId: 'wamid.YOK' }, { eposta: k.eposta as never, simdi: oglen() }), 'atlandi')
    assert.equal(await basarisizTeslimYedegi(k.sb, { doktorId: A, mesajId: 'wamid.FAIL1' }, { eposta: null, simdi: oglen() }), 'atlandi')
    assert.equal(k.cagrilar.length, 0)
  })
})

describe('bakım ve denetim', () => {
  it('10 dakikadan eski "deneniyor" satırı "belirsiz" olarak kapatılır, yenisine dokunulmaz', async () => {
    const { db, sb } = sahneKur()
    const simdi = oglen()
    db.ekle(GUNLUK, { doctor_id: A, yon: 'giden', tur: 'randevu_hatirlatma', durum: 'deneniyor', idem_anahtar: 'kuyruk:eski', created_at: new Date(simdi.getTime() - 30 * 60e3).toISOString() })
    db.ekle(GUNLUK, { doctor_id: A, yon: 'giden', tur: 'randevu_hatirlatma', durum: 'deneniyor', idem_anahtar: 'kuyruk:yeni', created_at: new Date(simdi.getTime() - 60e3).toISOString() })
    const n = await takilanDenemeleriKapat(sb, simdi)
    assert.equal(n, 1)
    const belirsiz = db.tablo(GUNLUK).filter((r) => r.durum === 'belirsiz')
    assert.equal(belirsiz.length, 1)
    assert.equal(belirsiz[0].idem_anahtar, 'kuyruk:eski')
  })

  it('KVKK onay sürümü sabit ve tarihli', () => {
    assert.equal(KVKK_ONAY_SURUM, '2026-10-16')
  })
})

describe('kurulum yardımcısı', () => {
  it('sık sorulan sorular yerelde cevaplanır; LLM yalnız SSS dışı için çağrılır ve hata varsayılana düşer', async () => {
    assert.ok(sssBul('Meta hesabı nedir?'))
    let cagri = 0
    const llm = async () => { cagri++; return 'Kısa bir yanıt.' }
    assert.equal((await yardimCevabi('Meta hesabı nedir?', llm)).kaynak, 'sss')
    assert.equal(cagri, 0)
    assert.equal((await yardimCevabi('zxqv wxyz lorem', llm)).kaynak, 'yapay_zeka')
    const hata = await yardimCevabi('zxqv wxyz lorem', async () => { throw new Error('x') })
    assert.equal(hata.kaynak, 'varsayilan')
    assert.match(hata.cevap, /destek/i)
  })

  it('SMS/sesli arama ve ücretsiz Business uygulamasına geçiş SSS\'te anlatılır', () => {
    const t = sssBul('Numaramı nasıl doğrularım kod sms')?.cevap || ''
    assert.match(t, /SMS/)
    assert.match(t, /sesli arama/)
    assert.ok(sssBul('WhatsApp Business uygulaması nedir')?.cevap.match(/ücretsiz/i))
  })
})

describe('TABLO sabiti ve yalıtım sözleşmesi', () => {
  it('bağlantı tablosu doktor başına tek satır', async () => {
    const { db, sb } = sahneKur()
    await baglan(sb, A, 'PN-A')
    await baglan(sb, B, 'PN-B')
    assert.deepEqual(db.tablo(TABLO).map((r) => r.doctor_id).sort(), [A, B])
  })
})
