/**
 * KONSULTASYON-01 — uçtan uca akış, GERÇEK route handler'larıyla (yalnız veritabanı / oturum sahte:
 * lib/security/testing/sahteSupabase.ts, hasta-izolasyon paketiyle aynı altyapı). Sentetik QA verisi.
 *
 *   1. Kaan'ın akışı: pediatri hekimi → KBB'ye istem → konsültan raporu Kasa'ya → hekimin cümlesi → yanıtlandı
 *      → "Bugünkü muayene formuna ekle" (hekim basar) → note_id kaydı. Otomatik yazma yok.
 *   2. Durum geçişleri (yanıtlanmış kayıt yanıtsız kapatılamaz, yanıtsız nota eklenmez, hatırlatma 7 günde bir).
 *   3. GERİ UYUM: mevcut dahiliye "sevk" adımı ve göz "açık dahiliye göz sevki" köprüsü aynı tabloya yazmaya /
 *      okumaya devam eder; o satırlar konsültasyon zaman çizelgesinde "eski kayıt" olarak görünür ve kapatılabilir.
 *
 *   npm test (--experimental-test-module-mocks)
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-konsultasyon-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'
process.env.PORTAL_TOKEN_SECRET = 'qa-sentetik-portal-sirri'

let db = new SahteVeritabani()
const KOK = resolve(__dirname, '../..')
const yerel = (yol: string) => pathToFileURL(join(KOK, yol)).href

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
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
{
  const kok = dirname(require.resolve('@anthropic-ai/sdk'))
  const pkg = JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as Record<string, any>
  class SahteAnthropic { messages = { create: async () => { throw new Error('konsültasyon akışı modele gitmez') } } }
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.require, pkg.exports?.['.']?.import?.default, pkg.exports?.['.']?.default, pkg.main, pkg.module].filter((x) => typeof x === 'string').map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { defaultExport: SahteAnthropic })
  }
}
mock.module(yerel('lib/dr-ayse/groq.ts'), { namedExports: { groqChat: async () => { throw new Error('model yok') } } })
mock.module(yerel('lib/alarm.ts'), { namedExports: { kritikAlarm: async () => undefined } })
mock.module(yerel('lib/mail/resend.ts'), { namedExports: { sendResendEmail: async () => ({ ok: true }) } })
globalThis.fetch = (async (g: unknown) => { throw new Error(`konsültasyon testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

let NextRequestSinifi: typeof import('next/server').NextRequest
let encrypt: (s: string) => string
type Rotalar = Record<string, any>
let R: Rotalar

function iste(yontem: string, yol: string, token: string, govde?: unknown, cerez?: string) {
  return new NextRequestSinifi(`http://localhost${yol}`, {
    method: yontem,
    headers: { authorization: `Bearer ${token}`, ...(cerez ? { cookie: cerez } : {}), ...(govde !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: govde !== undefined ? JSON.stringify(govde) : undefined,
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
async function coz(r: Response | Promise<Response>): Promise<{ status: number; j: any }> {
  const y = await r
  return { status: y.status, j: await y.json().catch(() => ({})) }
}

type Sahne = { hekim: string; token: string; hasta: string; seansBugun: string; notBugun: string; belge: string }
function sahne(specialty: string): Sahne {
  db = new SahteVeritabani()
  const hekim = randomUUID()
  const token = `qa-konsultasyon-${specialty}`
  db.kullanicilar.set(token, { id: hekim })
  db.ekle('users', { id: hekim, full_name: 'Dr. QA Müdavi', specialty, recete_baslik: { satirlar: ['Dr. QA Müdavi', 'QA Muayenehanesi'] } })
  const hasta = db.ekle('patients', { doctor_id: hekim, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA', soyad: 'Çocuk' })), dob_encrypted: encrypt('2020-05-01'), gender_encrypted: encrypt('male') }).id
  const seansBugun = db.ekle('sessions', { doctor_id: hekim, patient_id: hasta, specialty, status: 'completed' }).id
  const notBugun = db.ekle('notes', { session_id: seansBugun, doctor_id: hekim, note_type: 'soap', content_degerlendirme: 'Sağlam çocuk izlemi.' }).id
  const belge = db.ekle('medical_documents', { doctor_id: hekim, patient_id: hasta, file_name: 'kbb-konsultasyon-raporu.pdf', file_type: 'application/pdf', file_size: 12, category: 'Konsültasyon raporu', deleted_at: null }).id
  return { hekim, token, hasta, seansBugun, notBugun, belge }
}

describe('KONSULTASYON-01 — kapalı döngü (gerçek rota, sahte veritabanı)', () => {
  before(async () => {
    ;({ encrypt } = await import('../security/encryption'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    const ice = (y: string) => import(`../../${y}`)
    R = {
      konsultasyon: await ice('app/api/doktor/konsultasyon/route'),
      dahiliye: await ice('app/api/doktor/dahiliye/route'),
      goz: await ice('app/api/doktor/goz/route'),
      portal: await ice('app/api/portal/hasta/[token]/route'),
    }
  })

  let s: Sahne
  beforeEach(() => { s = sahne('pediatri') })

  it("Kaan'ın akışı: KBB'ye istem → rapor Kasa'da → hekimin cümlesi → yanıtlandı → hekim basınca nota eklenir", async () => {
    // 1) İstem
    const olustur = await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', s.token, {
      patientId: s.hasta, hedefBrans: 'kulak-burun-bogaz', klinikSoru: 'İşitme kaybı var mı? Okul performansında düşüş, sesli konuşma.',
      aciliyet: 'rutin', tanilar: 'İşitme kaybı şüphesi', mevcutDurum: 'Ateş yok, genel durum iyi.', hedefHekim: 'Dr. QA Konsültan',
    })))
    assert.equal(olustur.status, 201, JSON.stringify(olustur.j))
    const k = olustur.j.konsultasyon
    assert.equal(k.durum, 'yanit_bekleniyor')
    assert.equal(k.hedef, 'kulak-burun-bogaz', '`hedef` NOT NULL — geri uyum için kanonik anahtar yazılır')
    assert.equal(k.hedef_brans, 'kulak-burun-bogaz')
    assert.equal(k.kaynak, 'konsultasyon')
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(k.istem_tarihi))
    // Hiçbir şey kendiliğinden nota yazılmadı
    assert.equal(db.tablo('notes').find((n) => n.id === s.notBugun)?.content_degerlendirme, 'Sağlam çocuk izlemi.')

    // 2) Hastanın zaman çizelgesi + hekimin bekleyenleri
    const liste = await coz(R.konsultasyon.GET(iste('GET', `/api/doktor/konsultasyon?patientId=${s.hasta}`, s.token)))
    assert.equal(liste.status, 200)
    assert.equal(liste.j.konsultasyonlar.length, 1)
    assert.equal(liste.j.konsultasyonlar[0].hedefEtiketi, 'KBB')
    assert.deepEqual(liste.j.hedefler.onerilen.map((x: string[]) => x[0]), ['kulak-burun-bogaz', 'goz-hastaliklari', 'cocuk-cerrahisi'])
    const bekleyen = await coz(R.konsultasyon.GET(iste('GET', '/api/doktor/konsultasyon?bekleyen=1', s.token)))
    assert.deepEqual(bekleyen.j.bekleyenler.map((b: { id: string; hastaAdi: string }) => [b.id, b.hastaAdi]), [[k.id, 'QA Çocuk']])

    // 3) Kasa'dan rapor bağla (özet henüz yazılmadı) → durum değişmez
    const bagla = await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: k.id, islem: 'belge_bagla', belgeId: s.belge })))
    assert.equal(bagla.status, 200, JSON.stringify(bagla.j))
    assert.equal(bagla.j.konsultasyon.belge_id, s.belge)
    assert.equal(bagla.j.konsultasyon.durum, 'yanit_bekleniyor')

    // 4) Yanıt: hekimin kendi cümlesi
    const yanit = await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: k.id, islem: 'yanit', yanitOzeti: 'İşitme kaybı saptanmadı.' })))
    assert.equal(yanit.status, 200, JSON.stringify(yanit.j))
    assert.equal(yanit.j.konsultasyon.durum, 'yanitlandi')
    assert.equal(yanit.j.konsultasyon.yanit_ozeti, 'İşitme kaybı saptanmadı.')
    assert.equal(yanit.j.konsultasyon.belge_id, s.belge, 'rapor bağı korunur')
    assert.equal(db.tablo('notes').find((n) => n.id === s.notBugun)?.content_degerlendirme, 'Sağlam çocuk izlemi.', 'yanıt nota OTOMATİK yazılmaz')
    const bekleyen2 = await coz(R.konsultasyon.GET(iste('GET', '/api/doktor/konsultasyon?bekleyen=1', s.token)))
    assert.equal(bekleyen2.j.bekleyenler.length, 0)

    // 5) "Show proof": zaman çizelgesinde rapor adı + tarih
    const kanit = await coz(R.konsultasyon.GET(iste('GET', `/api/doktor/konsultasyon?patientId=${s.hasta}`, s.token)))
    const satir = kanit.j.konsultasyonlar[0]
    assert.equal(satir.belge.ad, 'kbb-konsultasyon-raporu.pdf')
    assert.equal(satir.hedef_hekim, 'Dr. QA Konsültan')

    // 6) Hekim basar → bugünkü nota eklenir, note_id kaydedilir
    const nota = await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: k.id, islem: 'nota_ekle' })))
    assert.equal(nota.status, 200, JSON.stringify(nota.j))
    assert.equal(nota.j.ok, true)
    assert.equal(nota.j.notId, s.notBugun)
    const metin = String(db.tablo('notes').find((n) => n.id === s.notBugun)?.content_degerlendirme)
    assert.ok(metin.startsWith('Sağlam çocuk izlemi.\n'), 'mevcut metin korunur')
    assert.ok(metin.includes('Konsültasyon yanıtı — KBB (hekim ekledi)'))
    assert.ok(metin.includes('İşitme kaybı saptanmadı.'))
    assert.ok(metin.includes("Rapor: Kasa'da — kbb-konsultasyon-raporu.pdf"))
    assert.equal(db.tablo('sevkler').find((x) => x.id === k.id)?.note_id, s.notBugun)

    // 7) Yazdırılabilir istem formu verisi: antet + hasta tanımlayıcıları + veli satırı (5 yaş)
    const form = await coz(R.konsultasyon.GET(iste('GET', `/api/doktor/konsultasyon?form=${k.id}`, s.token)))
    assert.equal(form.status, 200)
    assert.equal(form.j.hasta.adSoyad, 'QA Çocuk')
    assert.equal(form.j.hasta.veliSatiri, true)
    assert.equal(form.j.baslik.hekim, 'Dr. QA Müdavi')
    assert.equal(form.j.konsultasyon.tanilar, 'İşitme kaybı şüphesi')
  })

  it('durum geçişleri: yanıtsız nota eklenmez; yanıtlanmış yanıtsız kapatılamaz; kapanmışa geç rapor eklenebilir', async () => {
    const k = (await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', s.token, { patientId: s.hasta, hedefBrans: 'goz-hastaliklari', klinikSoru: 'Şaşılık var mı, göz muayenesi?' })))).j.konsultasyon
    const patch = (g: Record<string, unknown>) => coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: k.id, ...g })))
    assert.equal((await patch({ islem: 'nota_ekle' })).status, 409)
    assert.equal((await patch({ islem: 'yanit', yanitOzeti: '' })).status, 400)
    assert.equal((await patch({ islem: 'bilinmeyen' })).status, 400)
    // hatırlatma: bir kez gider, 7 gün içinde ikinci kez gitmez; mesajda klinik soru yok
    const h1 = await patch({ islem: 'hatirlat' })
    assert.equal(h1.status, 200, JSON.stringify(h1.j))
    const mesaj = db.tablo('hasta_mesajlar').at(-1)
    assert.ok(mesaj && !String(mesaj.metin).includes('Şaşılık'), 'hatırlatma klinik soruyu taşımaz')
    assert.ok(String(mesaj!.metin).includes("Göz Hastalıkları'na yönlendirildiğiniz"))
    assert.equal((await patch({ islem: 'hatirlat' })).status, 409)
    // yanıtsız kapat → sonra geç gelen rapor
    const kapat = await patch({ islem: 'kapat' })
    assert.equal(kapat.j.konsultasyon.durum, 'kapandi_yanitsiz')
    assert.equal((await patch({ islem: 'kapat' })).status, 409)
    assert.equal((await patch({ islem: 'hatirlat' })).status, 409)
    const gec = await patch({ islem: 'yanit', yanitOzeti: 'Şaşılık saptanmadı.', belgeId: s.belge })
    assert.equal(gec.j.konsultasyon.durum, 'yanitlandi')
    assert.equal((await patch({ islem: 'kapat' })).status, 409, 'yanıtlanmış kayıt yanıtsız kapatılamaz')
    // başka hastanın (aynı hekim) belgesi bu konsültasyona bağlanamaz
    const baskaHasta = db.ekle('patients', { doctor_id: s.hekim, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA', soyad: 'Diğer' })) }).id
    const baskaBelge = db.ekle('medical_documents', { doctor_id: s.hekim, patient_id: baskaHasta, file_name: 'baska.pdf', file_type: 'application/pdf', deleted_at: null }).id
    assert.equal((await patch({ islem: 'belge_bagla', belgeId: baskaBelge })).status, 404)
    // silinmiş (kasadan kaldırılmış) belge bağlanamaz
    db.tablo('medical_documents').find((d) => d.id === s.belge)!.deleted_at = new Date().toISOString()
    const silinmis = db.ekle('medical_documents', { doctor_id: s.hekim, patient_id: s.hasta, file_name: 'silinmis.pdf', deleted_at: new Date().toISOString() }).id
    assert.equal((await patch({ islem: 'belge_bagla', belgeId: silinmis })).status, 404)
  })

  it('yanıtsız kapatılmış kayıt silinebilir; açık/yanıtlanmış silinemez', async () => {
    const k = (await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', s.token, { patientId: s.hasta, hedefBrans: 'kulak-burun-bogaz', klinikSoru: 'İşitme kaybı var mı, odyometri?' })))).j.konsultasyon
    const patch = (g: Record<string, unknown>) => coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: k.id, ...g })))
    assert.equal((await patch({ islem: 'sil' })).status, 409, 'açık istem silinmez')
    assert.equal((await patch({ islem: 'kapat' })).status, 200)
    const sil = await patch({ islem: 'sil' })
    assert.equal(sil.status, 200, JSON.stringify(sil.j))
    assert.equal(sil.j.silindi, true)
    assert.equal(db.tablo('sevkler').find((x) => x.id === k.id), undefined)
  })

  it('istem doğrulaması: serbest metin hedef ve kısa soru reddedilir, satır yazılmaz', async () => {
    const once = db.tablo('sevkler').length
    for (const g of [{ hedefBrans: 'KBB', klinikSoru: 'İşitme kaybı var mı?' }, { hedefBrans: 'kulak-burun-bogaz', klinikSoru: 'KBB?' }]) {
      const y = await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', s.token, { patientId: s.hasta, ...g })))
      assert.equal(y.status, 400)
    }
    assert.equal(db.tablo('sevkler').length, once)
  })

  it('GERİ UYUM — dahiliye "sevk" adımı aynı tabloya yazar; kayıt konsültasyon çizelgesinde "eski kayıt" görünür ve yanıtlanabilir', async () => {
    s = sahne('dahiliye')
    const y = await coz(R.dahiliye.POST(iste('POST', '/api/doktor/dahiliye', s.token, { adim: 'sevk', patientId: s.hasta, hedef: 'nefroloji', not: 'eGFR düşüşü' })))
    assert.equal(y.status, 200, JSON.stringify(y.j))
    const eski = db.tablo('sevkler').find((x) => x.patient_id === s.hasta)!
    assert.equal(eski.hedef, 'nefroloji'); assert.equal(eski.kaynak, 'hekim')
    assert.equal(eski.durum ?? 'acik', 'acik', 'dahiliye yazımı değişmedi: durum verilmez, veritabanı varsayılanı "acik"')
    eski.durum = eski.durum ?? 'acik' // sahte veritabanı kolon varsayılanını uygulamaz
    // dahiliye GET açık sevkleri hâlâ okur
    const dGet = await coz(R.dahiliye.GET(iste('GET', `/api/doktor/dahiliye?patientId=${s.hasta}`, s.token)))
    assert.equal(dGet.status, 200)
    assert.deepEqual((dGet.j.sevkler as Array<{ id: string }>).map((x) => x.id), [eski.id], 'dahiliye açık sevkleri okumaya devam eder')
    // konsültasyon çizelgesi eski kaydı gösterir
    const k = await coz(R.konsultasyon.GET(iste('GET', `/api/doktor/konsultasyon?patientId=${s.hasta}`, s.token)))
    const satir = k.j.konsultasyonlar.find((x: { id: string }) => x.id === eski.id)
    assert.ok(satir)
    assert.equal(satir.eskiKayit, true)
    assert.equal(satir.hedefEtiketi, 'Nefroloji')
    // eski kayıt da kapalı döngüye girer
    const yanit = await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: eski.id, islem: 'yanit', yanitOzeti: 'Nefroloji: izlem önerildi.' })))
    assert.equal(yanit.j.konsultasyon.durum, 'yanitlandi')
    assert.equal(db.tablo('sevkler').find((x) => x.id === eski.id)?.hedef, 'nefroloji', 'eski `hedef` değişmez')
    const dGet2 = await coz(R.dahiliye.GET(iste('GET', `/api/doktor/dahiliye?patientId=${s.hasta}`, s.token)))
    assert.deepEqual(dGet2.j.sevkler, [], 'yanıtlanan kayıt dahiliyenin açık listesinden düşer')
  })

  it('GERİ UYUM — göz bölümü "açık dahiliye göz sevki" köprüsü eski acik satırı okur; yeni konsültasyonla karışmaz', async () => {
    s = sahne('goz-hastaliklari')
    const eski = db.ekle('sevkler', { patient_id: s.hasta, doctor_id: s.hekim, hedef: 'goz', not_metni: 'DM yıllık göz dibi', kaynak: 'dahiliye_dm', durum: 'acik' })
    await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', s.token, { patientId: s.hasta, hedefBrans: 'noroloji', klinikSoru: 'Görme alanı defekti — nörolojik değerlendirme?' })))
    const g = await coz(R.goz.GET(iste('GET', `/api/doktor/goz?patientId=${s.hasta}`, s.token)))
    assert.equal(g.status, 200, JSON.stringify(g.j).slice(0, 300))
    assert.deepEqual(g.j.acikGozSevkleri.map((x: { id: string }) => x.id), [eski.id])
    const k = await coz(R.konsultasyon.GET(iste('GET', `/api/doktor/konsultasyon?patientId=${s.hasta}`, s.token)))
    const eskiSatir = k.j.konsultasyonlar.find((x: { id: string }) => x.id === eski.id)
    assert.equal(eskiSatir.hedefEtiketi, 'Göz Hastalıkları')
    assert.equal(eskiSatir.eskiKayit, true)
  })

  it('SAĞLIĞIM: "KBB\'ye yönlendirildiniz · Sonuç alındı" — klinik soru, tanı, yanıt, rapor, konsültan adı ve eski/yabancı satır YOK', async () => {
    // Yeni akış: istem + yanıt (rapor bağlı)
    const k = (await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', s.token, { patientId: s.hasta, hedefBrans: 'kulak-burun-bogaz', klinikSoru: 'GIZLI-SORU işitme kaybı var mı?', tanilar: 'GIZLI-TANI', mevcutDurum: 'GIZLI-DURUM', hedefHekim: 'Dr. GIZLI-KONSULTAN', istemTarihi: '2026-09-12' })))).j.konsultasyon
    await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: k.id, islem: 'yanit', yanitOzeti: 'GIZLI-YANIT saptanmadı', yanitTarihi: '2026-09-18', belgeId: s.belge })))
    // Eski dahiliye hesaplayıcı satırı (hedef_brans yok) ve başka hekimin aynı hastaya düşmüş satırı
    db.ekle('sevkler', { patient_id: s.hasta, doctor_id: s.hekim, hedef: 'gastroenteroloji', not_metni: 'GIZLI-ESKI FIB-4', kaynak: 'dm_fib4', durum: 'acik' })
    db.ekle('sevkler', { patient_id: s.hasta, doctor_id: randomUUID(), hedef: 'noroloji', hedef_brans: 'noroloji', klinik_soru: 'GIZLI-YABANCI', durum: 'yanit_bekleniyor', istem_tarihi: '2026-09-15' })
    const portalToken = 'qa-portal-konsultasyon'
    db.ekle('hasta_portal_tokens', { token_hash: portalToken, doctor_id: s.hekim, patient_id: s.hasta, expires_at: new Date(Date.now() + 86400e3).toISOString(), pin_hash: 'sentetik' })
    const { setUnlockCookie, UNLOCK_COOKIE } = await import('../portal/pinAuth')
    const { NextResponse } = await import('next/server')
    const res = NextResponse.json({}); setUnlockCookie(res, portalToken)
    const cerez = `${UNLOCK_COOKIE}=${res.cookies.get(UNLOCK_COOKIE)?.value}`
    const y = await coz(R.portal.GET(iste('GET', `/api/portal/hasta/${portalToken}`, '', undefined, cerez), { params: { token: portalToken } }))
    assert.equal(y.status, 200, JSON.stringify(y.j).slice(0, 300))
    assert.deepEqual(y.j.yonlendirmeler, [{ id: k.id, brans: 'KBB', tarih: '2026-09-12', durum: 'sonuc_alindi', sonucTarihi: '2026-09-18' }])
    const metin = JSON.stringify(y.j)
    for (const g of ['GIZLI-SORU', 'GIZLI-TANI', 'GIZLI-DURUM', 'GIZLI-KONSULTAN', 'GIZLI-YANIT', 'GIZLI-ESKI', 'GIZLI-YABANCI', 'kbb-konsultasyon-raporu']) {
      assert.ok(!metin.includes(g), `portala sızdı: ${g}`)
    }
    const { portalYonlendirmeMetni } = await import('./konsultasyon')
    assert.equal(portalYonlendirmeMetni(y.j.yonlendirmeler[0]), "KBB'ye yönlendirildiniz (12.09.2026) · Sonuç alındı (18.09.2026)")
  })

  it('KOHORT: yanıt bekleyenler en uzun bekleyen üstte + son 180 günün istem → yanıt medyanı', async () => {
    const olustur = async (istemTarihi: string) => (await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', s.token, { patientId: s.hasta, hedefBrans: 'goz-hastaliklari', klinikSoru: 'Görme keskinliği değerlendirmesi?', istemTarihi })))).j.konsultasyon
    const a = await olustur('2026-09-01'), b = await olustur('2026-09-10'), c = await olustur('2026-09-11')
    await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: c.id, islem: 'yanit', yanitOzeti: 'Olağan.', yanitTarihi: '2026-09-15' })))
    const y = await coz(R.konsultasyon.GET(iste('GET', '/api/doktor/konsultasyon?bekleyen=1', s.token)))
    assert.deepEqual(y.j.bekleyenler.map((x: { id: string }) => x.id), [a.id, b.id])
    assert.ok(y.j.bekleyenler[0].gun > y.j.bekleyenler[1].gun)
    assert.deepEqual(y.j.yanitSuresi, { adet: 1, medyanGun: 4, enUzunGun: 4 })
    // KONSULTASYON-02: araç satırı klinik soruyu taşır; ana sayfa sayısı AYNI listeden (ad çözülmez)
    assert.equal(y.j.bekleyenler[0].klinikSoru, 'Görme keskinliği değerlendirmesi?')
    assert.equal(y.j.bekleyenler[0].sonHatirlatmaAt, null)
    const sayi = await coz(R.konsultasyon.GET(iste('GET', '/api/doktor/konsultasyon?bekleyen=sayi', s.token)))
    assert.equal(sayi.j.sayi, y.j.bekleyenler.length)
    assert.equal(sayi.j.enUzunGun, y.j.bekleyenler[0].gun)
    assert.equal(sayi.j.tabloHazir, true)
    assert.ok(!JSON.stringify(sayi.j).includes('QA'), 'sayı modunda hasta adı yok')
  })

  // ── AYSE-KONSULTASYON-01 (A): istem düzenlenebilir, yanıt gelince KİLİTLİ; düzenleme izi kaybolmaz ──
  it('İSTEM DÜZENLEME: yanıt beklerken düzenlenir, önceki metin izde kalır; yanıtlanınca SUNUCU reddeder', async () => {
    const ilk = 'İşitme kaybı var mı? Okul performansında düşüş.'
    const k = (await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', s.token, { patientId: s.hasta, hedefBrans: 'kulak-burun-bogaz', klinikSoru: ilk, aciliyet: 'rutin' })))).j.konsultasyon
    const patch = (g: Record<string, unknown>) => coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: k.id, ...g })))

    // 1) yanit_bekleniyor → düzenlenir
    const yeni = 'Sayın Meslektaşım,\n\nİşitme kaybı açısından değerlendirmenizi rica ederim.'
    const d1 = await patch({ islem: 'duzenle', klinikSoru: yeni, aciliyet: 'oncelikli' })
    assert.equal(d1.status, 200, JSON.stringify(d1.j))
    assert.equal(d1.j.konsultasyon.klinik_soru, yeni)
    assert.equal(d1.j.konsultasyon.aciliyet, 'oncelikli')
    assert.equal(d1.j.konsultasyon.durum, 'yanit_bekleniyor', 'düzenleme durumu değiştirmez')
    assert.deepEqual([...d1.j.degisen].sort(), ['aciliyet', 'klinik_soru'])
    // 2) İZ: önceki metin KAYBOLMADI — kim, ne zaman, hangi alan
    const iz = db.tablo('konsultasyon_revizyonlar').filter((r) => r.sevk_id === k.id)
    assert.equal(iz.length, 2)
    const soruIzi = iz.find((r) => r.alan === 'klinik_soru')!
    assert.equal(soruIzi.onceki, ilk, 'önceki istem metni izde')
    assert.equal(soruIzi.sonraki, yeni)
    assert.equal(soruIzi.doctor_id, s.hekim)
    assert.equal(soruIzi.patient_id, s.hasta)
    assert.equal(iz.find((r) => r.alan === 'aciliyet')!.onceki, 'rutin')
    // değişiklik yoksa iz yazılmaz
    assert.equal((await patch({ islem: 'duzenle', klinikSoru: yeni })).status, 400)
    assert.equal(db.tablo('konsultasyon_revizyonlar').filter((r) => r.sevk_id === k.id).length, 2)
    // kısa soru reddedilir, satır değişmez
    assert.equal((await patch({ islem: 'duzenle', klinikSoru: 'KBB?' })).status, 400)
    // ikinci düzenleme de iz bırakır (ilk metin hâlâ duruyor)
    const ucuncu = `${yeni}\nTelevizyonu yüksek sesle izliyor.`
    assert.equal((await patch({ islem: 'duzenle', klinikSoru: ucuncu })).status, 200)
    const soruIzleri = db.tablo('konsultasyon_revizyonlar').filter((r) => r.sevk_id === k.id && r.alan === 'klinik_soru').map((r) => r.onceki)
    assert.deepEqual(soruIzleri, [ilk, yeni], 'her önceki metin sırayla saklanır')
    // GET düzenleme geçmişini döndürür
    const g = await coz(R.konsultasyon.GET(iste('GET', `/api/doktor/konsultasyon?patientId=${s.hasta}`, s.token)))
    const satir = g.j.konsultasyonlar.find((x: { id: string }) => x.id === k.id)
    assert.deepEqual(satir.duzenlemeler.filter((r: { alan: string }) => r.alan === 'klinik_soru').map((r: { onceki: string }) => r.onceki), [ilk, yeni])

    // 3) yanıtlandı → istem KİLİTLİ (sunucuda 409), metin ve iz değişmez
    assert.equal((await patch({ islem: 'yanit', yanitOzeti: 'İşitme kaybı saptanmadı.' })).status, 200)
    const izOnce = db.tablo('konsultasyon_revizyonlar').length
    const kilit = await patch({ islem: 'duzenle', klinikSoru: 'Yanıttan sonra değiştirilmiş istem metni.' })
    assert.equal(kilit.status, 409)
    assert.match(kilit.j.error, /kilitli/)
    assert.equal(db.tablo('sevkler').find((x) => x.id === k.id)?.klinik_soru, ucuncu)
    assert.equal(db.tablo('konsultasyon_revizyonlar').length, izOnce)

    // 4) yanıt tarafı düzeltilebilir kalır — önceki özet izde
    const duzelt = await patch({ islem: 'yanit', yanitOzeti: 'İşitme kaybı saptanmadı; odyometri normal.' })
    assert.equal(duzelt.status, 200)
    const yanitIzi = db.tablo('konsultasyon_revizyonlar').filter((r) => r.sevk_id === k.id && r.alan === 'yanit_ozeti')
    assert.deepEqual(yanitIzi.map((r) => [r.onceki, r.sonraki]), [['İşitme kaybı saptanmadı.', 'İşitme kaybı saptanmadı; odyometri normal.']])
  })

  it('İSTEM DÜZENLEME: eski "acik" kayıt düzenlenir; yanıtsız kapatılmış kayıt düzenlenmez', async () => {
    const eski = db.ekle('sevkler', { patient_id: s.hasta, doctor_id: s.hekim, hedef: 'nefroloji', not_metni: 'eGFR düşüşü', kaynak: 'hekim', durum: 'acik', created_at: '2026-09-01T08:00:00Z' })
    const y = await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: eski.id, islem: 'duzenle', klinikSoru: 'eGFR düşüşü — nefroloji değerlendirmesi rica olunur.' })))
    assert.equal(y.status, 200, JSON.stringify(y.j))
    assert.equal(db.tablo('sevkler').find((x) => x.id === eski.id)?.not_metni, 'eGFR düşüşü', 'eski not_metni korunur')
    const k = (await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', s.token, { patientId: s.hasta, hedefBrans: 'goz-hastaliklari', klinikSoru: 'Şaşılık var mı, göz muayenesi?' })))).j.konsultasyon
    await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: k.id, islem: 'kapat' })))
    const kapali = await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: k.id, islem: 'duzenle', klinikSoru: 'Kapandıktan sonra değiştirilmiş istem.' })))
    assert.equal(kapali.status, 409)
  })

  it('İSTEM DÜZENLEME: iz yazılamazsa değişiklik YAPILMAZ (sessiz üzerine yazma yok)', async () => {
    const ilk = 'Görme keskinliği değerlendirmesi rica olunur.'
    const k = (await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', s.token, { patientId: s.hasta, hedefBrans: 'goz-hastaliklari', klinikSoru: ilk })))).j.konsultasyon
    const asil = db.istemci.bind(db)
    ;(db as unknown as { istemci: typeof db.istemci }).istemci = (o) => {
      const c = asil(o)
      return { ...c, from: (t: string) => (t === 'konsultasyon_revizyonlar' ? { insert: () => ({ select: async () => ({ data: null, error: { message: 'tablo yok' } }) }) } : c.from(t)) } as ReturnType<typeof db.istemci>
    }
    try {
      const y = await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', s.token, { id: k.id, islem: 'duzenle', klinikSoru: 'Tamamen farklı bir istem metni yazıldı.' })))
      assert.equal(y.status, 500)
      assert.match(y.j.error, /değişiklik yapılmadı/)
    } finally { (db as unknown as { istemci: typeof db.istemci }).istemci = asil }
    assert.equal(db.tablo('sevkler').find((x) => x.id === k.id)?.klinik_soru, ilk)
  })
})
