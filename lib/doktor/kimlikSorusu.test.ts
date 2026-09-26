/**
 * NOTYA-BETA-0925 — kimlik / iletişim sorusu sunucuda, modelsiz cevaplanır (Dr. Gökhan'ın cümleleri).
 *
 * 1. Soru tanıma: "Anne ve babasının adı nedir", "annesinin adı ne", "babasının telefonu" — klinik cümle ve kohort
 *    sorusu eşleşmez.
 * 2. Gerçek rotalar (sahte Supabase + sahte Claude): yazılı sohbet ve sesli hasta_bul değeri EKRANA verir, model
 *    hiç çağrılmaz, sesli ajana ve saklanan sohbet geçmişine değer gitmez; başka doktorun hastası çözülmez.
 * 3. Derleyici: anne / baba adı ve doğum yeri Ayşe'nin model bağlamına girmez (VELI-YASAL-ONAM korunur).
 *
 * Yalnız sentetik QA verisi.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-kimlik-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'

let db = new SahteVeritabani()
function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
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
/** Every request a route sent to the (mocked) Claude API. An identity question must send none. */
const modelIstekleri: string[] = []
class SahteAnthropic {
  messages = {
    create: async (istek: unknown) => {
      modelIstekleri.push(JSON.stringify(istek))
      return { content: [{ type: 'text', text: JSON.stringify({ speech: 'Sentetik yanıt' }) }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }
    },
  }
}
{
  const kok = dirname(require.resolve('@anthropic-ai/sdk'))
  const pkg = JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as Record<string, any>
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.require, pkg.exports?.['.']?.import?.default, pkg.exports?.['.']?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter((x) => typeof x === 'string').map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { defaultExport: SahteAnthropic })
  }
}
mock.module(pathToFileURL(join(__dirname, 'hizLimiti.ts')).href, { namedExports: { aiKotaKullan: async () => ({ izin: true }), KOTA_MESAJI: 'kota', KOVA_LIMITLERI: {} } })
globalThis.fetch = (async (g: unknown) => { throw new Error(`kimlik testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

let encrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest
let K: typeof import('./kimlikSorusu')
let R: Record<string, any>

const ANNE = 'QA-Anne-Nermin'
const BABA = 'QA-Baba-Kemal'
const TEL = '0532 700 11 22'
const BABA_TEL = '0533 800 33 44'

type Sahne = { doktor: { id: string; token: string }; diger: { id: string; token: string }; hasta: string; bos: string; yabanci: string }

function sahne(): Sahne {
  db = new SahteVeritabani()
  modelIstekleri.length = 0
  const kullanici = () => { const id = randomUUID(); const token = `qa-${id}`; db.kullanicilar.set(token, { id }); return { id, token } }
  const doktor = kullanici()
  const diger = kullanici()
  db.ekle('users', { id: doktor.id, full_name: 'QA Hekim', specialty: 'pediatri' })
  db.ekle('users', { id: diger.id, full_name: 'QA Hekim 2', specialty: 'pediatri' })
  const hasta = db.ekle('patients', {
    doctor_id: doktor.id, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: 'Umutcan Türkoğlu' })), dob_encrypted: encrypt('2019-04-10'),
    phone_encrypted: encrypt(TEL), email_encrypted: null,
    notes_encrypted: encrypt(JSON.stringify({ anneAdi: ANNE, babaAdi: BABA })),
  }).id
  db.ekle('hasta_intake_formlari', {
    doktor_id: doktor.id, patient_id: hasta,
    form_data_encrypted: encrypt(JSON.stringify({
      anneAdi: ANNE, babaAdi: BABA, dogumYeri: 'QA-Eskişehir', adres: 'QA Mah. 1. Sok. No 2', il: 'Eskişehir',
      veliAd: 'QA-Kemal', veliSoyad: 'Türkoğlu', veliYakinligi: 'Baba', veliTelefon: BABA_TEL, alerji: 'Yok',
    })),
  })
  const bos = db.ekle('patients', { doctor_id: doktor.id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'Bilgisiz Deneme' })), dob_encrypted: encrypt('1980-01-01') }).id
  const yabanci = db.ekle('patients', {
    doctor_id: diger.id, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: 'Yabancı Hastaoğlu' })),
    notes_encrypted: encrypt(JSON.stringify({ anneAdi: 'GIZLI-B-ANNE' })),
  }).id
  return { doktor, diger, hasta, bos, yabanci }
}

function iste(yol: string, token: string, govde: unknown) {
  return new NextRequestSinifi(`http://localhost${yol}`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(govde),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
async function coz(r: Response | Promise<Response>) { const y = await r; const metin = await y.text(); return { status: y.status, json: JSON.parse(metin), metin } }

before(async () => {
  ;({ encrypt } = await import('../security/encryption'))
  NextRequestSinifi = (await import('next/server')).NextRequest
  K = await import('./kimlikSorusu')
  R = {
    chat: await import('../../app/api/asistan/chat/route'),
    hastaBul: await import('../../app/api/asistan/hasta-bul/route'),
    derleyici: await import('./hastaDosyaDerleyici'),
  }
})

describe('kimlikSorusu — Gökhan’ın cümleleri tanınır', () => {
  it('"Anne ve babasının adı nedir" → anne adı + baba adı', () => {
    assert.deepEqual(K.kimlikSorusu('Anne ve babasının adı nedir'), ['anneAdi', 'babaAdi'])
  })
  it('"annesinin adı ne" → anne adı', () => {
    assert.deepEqual(K.kimlikSorusu('annesinin adı ne'), ['anneAdi'])
  })
  it('"babasının telefonu" → babasının telefonu', () => {
    assert.deepEqual(K.kimlikSorusu('babasının telefonu'), ['babaTelefon'])
  })
  it('adıyla: "Umutcan Türkoğlu’nun anne ve baba adı ne?"', () => {
    assert.deepEqual(K.kimlikSorusu('Umutcan Türkoğlu’nun anne ve baba adı ne?'), ['anneAdi', 'babaAdi'])
  })
  it('diğer kimlik alanları: veli, telefon, e-posta, adres, doğum yeri ve tarihi', () => {
    assert.deepEqual(K.kimlikSorusu('velisi kim'), ['veli'])
    assert.deepEqual(K.kimlikSorusu('hastanın telefon numarası'), ['telefon'])
    assert.deepEqual(K.kimlikSorusu('e-posta adresi ne'), ['eposta'])
    assert.deepEqual(K.kimlikSorusu('adresi nedir'), ['adres'])
    assert.deepEqual(K.kimlikSorusu('doğum yeri neresi'), ['dogumYeri'])
    assert.deepEqual(K.kimlikSorusu('DOĞUM TARİHİ NE?'), ['dogumTarihi'])
  })
  it('erişim itirazı: "bu bilgilere ulaşamıyorum" + anne/baba → aynı alanlar, modelsiz tekrar', () => {
    assert.equal(K.kimlikErisimSorusu('Bu bilgilere ulaşamıyorum, annenin ve babanın telefonu'), true)
    assert.deepEqual(K.kimlikSorusu('Bu bilgilere ulaşamıyorum, annenin ve babanın telefonu'), ['anneAdi', 'babaAdi', 'anneTelefon', 'babaTelefon'])
    assert.equal(K.kimlikErisimSorusu('Annesi telefonda ateşin 39 olduğunu söyledi'), false)
  })
  it('klinik cümle, kohort sorusu, arama ve kayıt niyeti kimlik sorusu değildir', () => {
    for (const m of [
      'Annesi telefonda ateşin 39 olduğunu söyledi, ne yapalım?',
      'Annesinde diyabet var mı?',
      'Telefonu olmayan hastalar hangileri?',
      'Annesinin adı Ayşe olan hastayı bul',
      'Babasının telefonunu 0532 000 00 00 olarak kaydet',
      'Anneanne ile geldi, öksürük üç gündür',
      'Son reçetesi ne?',
    ]) assert.deepEqual(K.kimlikSorusu(m), [], m)
  })
})

describe('kimlik cevabı — değer ekrana, model bağlamına asla', () => {
  let s: Sahne
  beforeEach(() => { s = sahne() })

  it('kayıt okunur: kart önce, form ve belge yedek; eksik alan için nereden ekleneceği söylenir', async () => {
    const k = await K.kimlikKaydiOku(db.istemci() as never, s.doktor.id, s.hasta)
    assert.equal(k?.anneAdi?.deger, ANNE)
    assert.equal(k?.anneAdi?.kaynak, 'kart')
    assert.equal(k?.dogumYeri?.deger, 'QA-Eskişehir')
    assert.equal(k?.veli?.telefon, BABA_TEL)
    const c = K.kimlikCevabiMetni(['eposta'], k!)
    assert.match(c.ekran, /E-posta kayıtlı değil — hasta dosyasında Özet › Demografik bilgiler › Düzenle/)
    // Belge özetindeki "Anne Adı:" satırı, kart ve form boşken okunur
    db.ekle('hasta_belgeler', { doctor_id: s.doktor.id, patient_id: s.bos, ai_ozet: { ozet: 'Taburculuk epikrizi\nAnne Adı: QA-Belge-Anne\nDoğum Yeri: QA-Bursa' } })
    const kb = await K.kimlikKaydiOku(db.istemci() as never, s.doktor.id, s.bos)
    assert.equal(kb?.anneAdi?.deger, 'QA-Belge-Anne')
    assert.equal(kb?.anneAdi?.kaynak, 'belge')
    assert.equal(kb?.dogumYeri?.deger, 'QA-Bursa')
  })

  it('reşit hastada veli sorusu: veli bilgisi tutulmaz', async () => {
    const k = await K.kimlikKaydiOku(db.istemci() as never, s.doktor.id, s.bos)
    assert.match(K.kimlikCevabiMetni(['veli'], k!).ekran, /18 yaşını doldurmuş/)
  })

  it('yazılı sohbet: "Umutcan Türkoğlu’nun anne ve babasının adı nedir" → değerler ekranda, model çağrılmaz, geçmiş değersiz', async () => {
    const y = await coz(R.chat.POST(iste('/api/asistan/chat', s.doktor.token, { message: 'Umutcan Türkoğlu’nun anne ve babasının adı nedir' })))
    assert.equal(y.status, 200, y.metin)
    assert.match(y.json.data.speech, new RegExp(ANNE))
    assert.match(y.json.data.speech, new RegExp(BABA))
    assert.equal(modelIstekleri.length, 0, 'kimlik sorusunda model çağrılmamalı')
    const oturum = db.tablo('asistan_sessions').at(-1)!
    const gecmis = JSON.stringify(oturum.messages)
    assert.ok(!gecmis.includes(ANNE) && !gecmis.includes(BABA), 'saklanan geçmiş (sonraki turda modele gider) değer taşımamalı')
    assert.equal(oturum.active_context.currentPatientId, s.hasta)

    const t = await coz(R.chat.POST(iste('/api/asistan/chat', s.doktor.token, { message: 'Bu bilgilere ulaşamıyorum, annenin ve babanın telefonu da var mı', asistanSessionId: oturum.id })))
    assert.equal(t.status, 200, t.metin)
    assert.match(t.json.data.speech, new RegExp(ANNE))
    assert.match(t.json.data.speech, new RegExp(BABA))
    assert.match(t.json.data.speech, new RegExp(BABA_TEL))
    assert.ok(!/erişemem|ulaşamam|erişimim yok/i.test(t.json.data.speech), t.json.data.speech)
    assert.equal(modelIstekleri.length, 0)
    const k = await coz(R.chat.POST(iste('/api/asistan/chat', s.doktor.token, { message: 'Öksürüğü için ne önerirsin?', asistanSessionId: oturum.id })))
    assert.equal(k.status, 200, k.metin)
    assert.ok(modelIstekleri.length >= 1, 'klinik soru modele gitmeli (pozitif kontrol)')
    for (const istek of modelIstekleri) {
      for (const deger of [ANNE, BABA, BABA_TEL, TEL, 'QA-Eskişehir']) assert.ok(!istek.includes(deger), `model isteğinde kimlik değeri: ${deger}`)
    }
  })

  it('sesli hasta_bul: ajana giden sonuc değersiz, değer yalnız ekran alanında', async () => {
    const y = await coz(R.hastaBul.POST(iste('/api/asistan/hasta-bul', s.doktor.token, { isim: 'Umutcan Türkoğlu annesinin adı ne' })))
    assert.equal(y.status, 200, y.metin)
    assert.match(y.json.ekran, new RegExp(ANNE))
    assert.ok(!String(y.json.sonuc).includes(ANNE), 'sesli ajana değer gitmemeli')
    assert.match(y.json.sonuc, /ekran/)
    assert.equal(modelIstekleri.length, 0)
  })

  it('başka doktorun hastası adıyla sorulsa da çözülmez, değeri dönmez', async () => {
    const y = await coz(R.chat.POST(iste('/api/asistan/chat', s.doktor.token, { message: 'Yabancı Hastaoğlu annesinin adı ne' })))
    assert.ok(!y.metin.includes('GIZLI-B-ANNE'))
    const v = await coz(R.hastaBul.POST(iste('/api/asistan/hasta-bul', s.doktor.token, { isim: 'Yabancı Hastaoğlu annesinin adı ne' })))
    assert.ok(!v.metin.includes('GIZLI-B-ANNE'))
    assert.equal(await K.kimlikKaydiOku(db.istemci() as never, s.doktor.id, s.yabanci), null)
  })

  it('derleyici: anne / baba adı ve doğum yeri Ayşe’nin model bağlamına girmez; klinik form cevabı girer', async () => {
    const paket = await R.derleyici.hastaDosyaPaketiniDerle(db.istemci(), s.doktor.id, s.hasta)
    assert.ok(paket)
    for (const deger of [ANNE, BABA, 'QA-Eskişehir', BABA_TEL, TEL]) assert.ok(!paket.metin.includes(deger), `model bağlamında: ${deger}`)
    assert.match(paket.metin, /alerji: Yok/)
  })
})
