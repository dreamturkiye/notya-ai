/**
 * BRANS-ALAN-SIZMASI — rota düzeyi yürüyüş: sentetik QA hekimleri (pediatri, kadın doğum, dahiliye, dermatoloji,
 * göz, kardiyoloji, aile hekimliği) GERÇEK route handler'larından geçer; yalnız veritabanı / oturum / model sahtedir
 * (lib/security/testing/sahteSupabase.ts — HASTA-IZOLASYON-01 ile aynı altyapı).
 *
 * Her hekim için yürünen yol, Kaan'ın canlı bulduğu iki hatanın tam yolu:
 *   1. GET  /api/notes?pending=true      → İnceleme kuyruğu: ölçüm alanları + hitap (sunucu hesaplar)
 *      + ortak <YasamsalBulgularFormu> bu yanıtla GERÇEKTEN çizilir (react-dom/server) → Baş Çevresi var mı?
 *   2. GET  /api/notes/[id]              → not sayfası / yazdır: aynı paket + Neyzi persentili yalnız pediatride
 *   3. POST /api/sessions/[id]/end       → SOAP üretimi (gerçek soapUret, sahte Anthropic): sistem promptunda veli?
 *                                          model baş çevresi doldurursa KD notuna yazılıyor mu?
 *   4. POST /api/doktor/not-konsult      → "↻ Notuma göre yenile": UI'nin gönderdiği istek + sistem promptu veli?
 *   5. POST /api/doktor/araclar/epikriz  → "Kliniği: …" başlığı ve imza unvanı hekimin branşı mı?
 *
 * VELI-YASAL-ONAM (Kaan 2026-09-17): iki ayrı eksen yürünür —
 *   KLİNİK (baş çevresi, Neyzi, sağlam çocuk)  → branş güdümlü: yalnız pediatri / çocuk cerrahisi / aile+çocuk
 *   HİTAP  ("veli" dili)                        → yaş güdümlü: <18 hasta HER branşta (göz, KBB, ortopedi, kardiyoloji…)
 * Her pediatri dışı branş hem reşit olmayan hem erişkin sentetik hastayla yürünür.
 *
 * Sentetik veri — gerçek hasta, gerçek hesap, production yok.   npm test (--experimental-test-module-mocks)
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-brans-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'

// ─── Sahte altyapı ──────────────────────────────────────────────────────────────────────────────
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
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}

/** SOAP üretiminin (Anthropic SDK) gördüğü sistem promptları + modelin "dolduracağı" sentetik yanıt. */
const soapSistemleri: string[] = []
const MODEL_SOAP = {
  basvuruYakinmasi: 'Sentetik yakınma',
  soap: { subjektif: 'Şikayet: sentetik', objektif: 'Genel durum iyi', degerlendirme: '1) Sentetik tanı', plan: '1) Kontrol' },
  // Model KD muayenesinde dikte edilen fetal "baş çevresi 28 cm"yi annenin vitaline yazmış olsun:
  vitaller: { kilo: '64', ates: '36.7', basCevresi: '28' },
  hasta_ozeti: 'Sentetik hasta özeti.',
  alarmBulgulari: [], receteOnerisi: [], icd10_codes: [], kritik_bulgular: [], ilaclar: [],
}
class SahteAnthropic {
  messages = {
    create: async (istek: { system?: string }) => {
      soapSistemleri.push(String(istek?.system || ''))
      return { content: [{ type: 'text', text: JSON.stringify(MODEL_SOAP) }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }
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
const epikrizSistemleri: string[] = []
mock.module(yerel('lib/dr-ayse/groq.ts'), {
  namedExports: {
    groqChat: async (mesajlar: Array<{ role: string; content: string }>) => {
      epikrizSistemleri.push(mesajlar.find((m) => m.role === 'system')?.content || '')
      return JSON.stringify({ taniVeTedavi: 'TANI: sentetik', taburcuOzeti: 'Sentetik seyir.' })
    },
  },
})
mock.module(yerel('lib/doktor/hizLimiti.ts'), { namedExports: { aiKotaKullan: async () => ({ izin: true }), KOTA_MESAJI: 'kota', KOVA_LIMITLERI: {} } })
mock.module(yerel('lib/alarm.ts'), { namedExports: { kritikAlarm: async () => undefined } })

/** not-konsult Claude'a düz fetch ile gider — istek yakalanır, model baş çevresi + özet döndürür. */
const konsultIstekleri: Array<{ system: string; mesajlar: string }> = []
globalThis.fetch = (async (girdi: unknown, init?: { body?: string }) => {
  if (String(girdi).includes('api.anthropic.com')) {
    const govde = JSON.parse(String(init?.body || '{}'))
    konsultIstekleri.push({ system: String(govde.system || ''), mesajlar: JSON.stringify(govde.messages || []) })
    const cevap = { cevap: 'Özeti güncelledim Hocam.', duzenlemeler: { hastaOzeti: 'Yenilenmiş sentetik özet.', vitaller: { nabiz: '84', basCevresi: '30' } }, eylemler: [] }
    return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(cevap) }] }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  throw new Error(`brans-alan-sizmasi testi ağ erişimi yapamaz: ${String(girdi)}`)
}) as typeof fetch

// ─── Sentetik QA hekimleri ──────────────────────────────────────────────────────────────────────
type Hekim = { ad: string; id: string; token: string; hasta: string; bekleyenNot: string; yeniSeans: string; seansBransi: string }
let encrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest

/** usersSpecialty: users.specialty ham değeri (gerçek KD profilleri 'kadin-dogum' taşır). */
function hekimKur(ad: string, usersSpecialty: string, seansBransi: string, dogum: string): Hekim {
  const id = randomUUID()
  const token = `qa-sentetik-token-${ad}`
  db.kullanicilar.set(token, { id, email: `qa-${ad}@ornek.test` })
  db.ekle('users', { id, full_name: `QA Hekim ${ad}`, email: `qa-${ad}@ornek.test`, specialty: usersSpecialty, subscription_tier: 'pro', monthly_session_count: 0, recete_baslik: {} })
  const hasta = db.ekle('patients', {
    doctor_id: id, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: `QA Hasta ${ad}` })),
    dob_encrypted: encrypt(dogum), gender_encrypted: encrypt('female'),
  }).id
  const seans = db.ekle('sessions', { doctor_id: id, patient_id: hasta, specialty: seansBransi, status: 'completed', started_at: '2026-09-16T08:00:00Z' }).id
  const bekleyenNot = db.ekle('notes', {
    session_id: seans, doctor_id: id, note_type: 'soap', approved_at: null, created_at: '2026-09-16T08:30:00Z',
    content_subjektif: 'Şikayet: sentetik', content_plan: '1) Kontrol', content_ilaclar: [],
    vitaller: { ates: '36.8', kilo: '17', boy: '104', basCevresi: '49' },
    hasta_ozeti: 'Sentetik özet.',
  }).id
  const yeniSeans = db.ekle('sessions', { doctor_id: id, patient_id: hasta, specialty: seansBransi, status: 'recording' }).id
  return { ad, id, token, hasta, bekleyenNot, yeniSeans, seansBransi }
}

const COCUK = '2022-03-01'
const YETISKIN = '1990-05-20'
/** 16 yaşında ergen — bugüne göre hesaplanır ki test yıllar geçtikçe erişkine dönmesin */
const ERGEN = new Date(Date.now() - 16.3 * 365.25 * 864e5).toISOString().slice(0, 10)

function iste(yontem: string, yol: string, o: { token?: string; govde?: unknown } = {}) {
  const basliklar: Record<string, string> = {}
  if (o.token) basliklar.authorization = `Bearer ${o.token}`
  if (o.govde !== undefined) basliklar['content-type'] = 'application/json'
  return new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: basliklar, body: o.govde !== undefined ? JSON.stringify(o.govde) : undefined } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
const prm = <T extends object>(p: T) => ({ params: Object.assign(Promise.resolve(p), p) })
async function json(r: Response | Promise<Response>): Promise<{ status: number; veri: any }> {
  const y = await r
  return { status: y.status, veri: await y.json() }
}

const VELI = /veli|anne-baba|ebeveyn/i

// ─── Paket ──────────────────────────────────────────────────────────────────────────────────────
describe('BRANS-ALAN-SIZMASI · sentetik QA hekimleriyle gerçek rotalar', () => {
  let R: Record<string, any>
  let Form: typeof import('../../components/doktor/YasamsalBulgularFormu').default
  const H: Record<string, Hekim> = {}

  before(async () => {
    ;({ encrypt } = await import('../security/encryption'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    Form = (await import('../../components/doktor/YasamsalBulgularFormu')).default
    const ice = (y: string) => import(`../../${y}`)
    R = {
      notlar: await ice('app/api/notes/route'),
      notDetay: await ice('app/api/notes/[id]/route'),
      seansBitir: await ice('app/api/sessions/[id]/end/route'),
      konsult: await ice('app/api/doktor/not-konsult/route'),
      epikriz: await ice('app/api/doktor/araclar/epikriz/route'),
    }
    db = new SahteVeritabani()
    H.pediatri = hekimKur('pediatri', 'pediatri', 'pediatri', COCUK)
    H.kd = hekimKur('kd', 'kadin-dogum', 'kadin-hastaliklari-dogum', YETISKIN)
    // KD hekimi, seans "genel" (profil yüklenmeden başlatılmış muayene) — yine KD sayılmalı
    H.kdGenel = hekimKur('kd-genel', 'kadin-dogum', 'genel', YETISKIN)
    H.dahiliye = hekimKur('dahiliye', 'dahiliye', 'dahiliye', YETISKIN)
    H.derm = hekimKur('derm', 'dermatoloji', 'dermatoloji', YETISKIN)
    H.goz = hekimKur('goz', 'goz-hastaliklari', 'goz-hastaliklari', YETISKIN)
    H.kardiyo = hekimKur('kardiyo', 'kardiyoloji', 'kardiyoloji', YETISKIN)
    H.aileCocuk = hekimKur('aile-cocuk', 'aile-hekimligi', 'aile-hekimligi', COCUK)
    H.aileYetiskin = hekimKur('aile-yetiskin', 'aile-hekimligi', 'aile-hekimligi', YETISKIN)
    // VELI-YASAL-ONAM: pediatri dışı branşlar reşit olmayan hastayla (erişkin eşleri yukarıda: goz, kardiyo)
    H.gozCocuk = hekimKur('goz-cocuk', 'goz-hastaliklari', 'goz-hastaliklari', COCUK)
    H.kardiyoCocuk = hekimKur('kardiyo-cocuk', 'kardiyoloji', 'kardiyoloji', ERGEN)
    H.kbbCocuk = hekimKur('kbb-cocuk', 'kulak-burun-bogaz', 'kulak-burun-bogaz', COCUK)
    H.kbbYetiskin = hekimKur('kbb-yetiskin', 'kulak-burun-bogaz', 'kulak-burun-bogaz', YETISKIN)
    H.ortopediCocuk = hekimKur('ortopedi-cocuk', 'ortopedi', 'ortopedi', ERGEN)
    H.ortopediYetiskin = hekimKur('ortopedi-yetiskin', 'ortopedi', 'ortopedi', YETISKIN)
    H.cocukCerrahi = hekimKur('cocuk-cerrahi', 'cocuk-cerrahisi', 'cocuk-cerrahisi', COCUK)
  })

  /** KLİNİK pediatrik içerik (baş çevresi, Neyzi, sağlam çocuk) — branş güdümlü */
  const PEDIATRIK = new Set(['pediatri', 'aileCocuk', 'cocukCerrahi'])
  /** HİTAP: veli dili — reşit olmayan hasta her branşta + pediatrik bağlam (VELI-YASAL-ONAM) */
  const VELI_DILI = new Set([...PEDIATRIK, 'gozCocuk', 'kardiyoCocuk', 'kbbCocuk', 'ortopediCocuk'])
  const hepsi = () => Object.entries(H)

  it('1. İnceleme kuyruğu (GET /api/notes): Baş Çevresi yalnız pediatrik bağlamda; "veli" etiketi her reşit olmayan hastada — form gerçekten çizilir', async () => {
    for (const [k, h] of hepsi()) {
      const { status, veri } = await json(R.notlar.GET(iste('GET', '/api/notes?pending=true', { token: h.token })))
      assert.equal(status, 200, k)
      const not = (veri as any[]).find((n) => n.id === h.bekleyenNot)
      assert.ok(not?.bransKapsami, `${k}: bransKapsami yok`)
      const html = renderToStaticMarkup(React.createElement(Form, { olcumler: not.bransKapsami.olcumler, degerler: not.vitaller, onDegis: () => {} }))
      const ped = PEDIATRIK.has(k)
      assert.equal(html.includes('Baş Çevresi'), ped, `${k}: Baş Çevresi alanı`)
      assert.ok(html.includes('Ateş') && html.includes('Tansiyon') && html.includes('Kilo'), `${k}: baseline alanlar`)
      const veli = VELI_DILI.has(k)
      assert.equal(VELI.test(JSON.stringify(not.bransKapsami.hitap)), veli, `${k}: veli hitabı`)
      assert.equal(not.bransKapsami.hitap.ozetEtiketi, veli ? 'Hasta/veli özeti' : 'Hasta özeti', k)
      assert.equal(not.bransKapsami.hitap.evdeDikkatHedefi, veli ? 'veliye/hastaya' : 'hastaya', k)
      assert.equal(not.bransKapsami.pediatrik, ped, `${k}: klinik kapsam`)
      assert.equal(not.bransKapsami.veliDili, veli, `${k}: veliDili`)
      if (!ped) assert.equal(not.buyumePersentilleri, null, `${k}: Neyzi persentili`)
    }
    // pediatri bozulmadı: çocuk hastada Neyzi persentili hâlâ geliyor
    const ped = (await json(R.notlar.GET(iste('GET', '/api/notes?pending=true', { token: H.pediatri.token })))).veri.find((n: any) => n.id === H.pediatri.bekleyenNot)
    assert.ok(ped.buyumePersentilleri && ped.buyumePersentilleri.basCevresi, 'pediatri: baş çevresi persentili')
  })

  it('2. Not sayfası / yazdır (GET /api/notes/[id]): aynı kapsam; KD yazdır başlığı "Hasta Özeti", göz/KBB/ortopedi/kardiyoloji çocuk hastada "Hasta / Veli Özeti"', async () => {
    for (const [k, h] of hepsi()) {
      const { status, veri } = await json(R.notDetay.GET(iste('GET', `/api/notes/${h.bekleyenNot}`, { token: h.token }), prm({ id: h.bekleyenNot })))
      assert.equal(status, 200, k)
      const ped = PEDIATRIK.has(k)
      assert.equal(veri.not.bransKapsami.olcumler.some((o: any) => o.anahtar === 'basCevresi'), ped, k)
      assert.equal(veri.not.bransKapsami.hitap.ozetYazdirEtiketi, VELI_DILI.has(k) ? 'Hasta / Veli Özeti' : 'Hasta Özeti', k)
      if (!ped) assert.equal(veri.not.buyumePersentilleri, null, `${k}: Neyzi persentili (yazdır)`)
    }
    const kd = (await json(R.notDetay.GET(iste('GET', `/api/notes/${H.kdGenel.bekleyenNot}`, { token: H.kdGenel.token }), prm({ id: H.kdGenel.bekleyenNot })))).veri
    assert.equal(kd.not.bransKapsami.brans, 'kadin-hastaliklari-dogum', 'genel seans + kadin-dogum profili → KD')
  })

  it('3. SOAP üretimi (POST /api/sessions/[id]/end): veli dili her reşit olmayan hastada, baş çevresi / Neyzi yalnız pediatride; KD notuna model baş çevresi yazamaz', async () => {
    for (const [k, h] of hepsi()) {
      soapSistemleri.length = 0
      const { status, veri } = await json(R.seansBitir.POST(iste('POST', `/api/sessions/${h.yeniSeans}/end`, { token: h.token, govde: { segments: [{ speaker: 'doktor', text: 'Sentetik muayene dikte.' }], context: { specialty: h.seansBransi } } }), prm({ id: h.yeniSeans })))
      assert.equal(status, 200, `${k}: ${JSON.stringify(veri).slice(0, 200)}`)
      const sistem = soapSistemleri.join('\n')
      assert.ok(sistem.length > 1000, `${k}: SOAP promptu yakalanmadı`)
      const ped = PEDIATRIK.has(k)
      assert.equal(VELI.test(sistem), VELI_DILI.has(k), `${k}: SOAP promptunda veli`)
      assert.equal(/"basCevresi"/.test(sistem), ped, `${k}: JSON şablonunda basCevresi`)
      assert.equal(/Neyzi standartları|baş çevresi cm|pediatride prenatal|pediatride mg\/kg/i.test(sistem), ped, `${k}: pediatrik klinik satırlar`)
      const kayit = db.tablolar.get('notes')!.find((n) => n.id === veri.data.note_id)!
      assert.equal('basCevresi' in (kayit.vitaller || {}), ped, `${k}: kaydedilen vitaller`)
      assert.equal(kayit.vitaller.kilo, '64', `${k}: diğer vitaller korunur`)
    }
  })

  it('4. "↻ Notuma göre yenile" (POST /api/doktor/not-konsult): erişkinde UI isteği ve sistem promptu veli içermez, reşit olmayanda içerir; Neyzi ve baş çevresi yalnız pediatride', async () => {
    for (const [k, h] of hepsi()) {
      konsultIstekleri.length = 0
      const liste = (await json(R.notlar.GET(iste('GET', '/api/notes?pending=true', { token: h.token })))).veri as any[]
      const not = liste.find((n) => n.id === h.bekleyenNot)
      // İnceleme sayfasının gönderdiği istek birebir: note.bransKapsami.hitap.ozetYenileIstegi
      const istek = not.bransKapsami.hitap.ozetYenileIstegi
      const { status, veri } = await json(R.konsult.POST(iste('POST', '/api/doktor/not-konsult', { token: h.token, govde: { noteId: h.bekleyenNot, taslak: { hastaOzeti: 'Sentetik özet.' }, mesajlar: [{ rol: 'doktor', icerik: istek }] } })))
      assert.equal(status, 200, `${k}: ${JSON.stringify(veri).slice(0, 200)}`)
      assert.equal(konsultIstekleri.length, 1, k)
      const ped = PEDIATRIK.has(k)
      const veli = VELI_DILI.has(k)
      assert.equal(VELI.test(konsultIstekleri[0].system), veli, `${k}: konsult sistem promptunda veli`)
      assert.equal(VELI.test(konsultIstekleri[0].mesajlar), veli, `${k}: gönderilen istekte veli`)
      assert.equal(/Neyzi/.test(konsultIstekleri[0].system), ped, `${k}: Neyzi kuralı`)
      assert.equal('basCevresi' in veri.duzenlemeler.vitaller, ped, `${k}: önerilen baş çevresi`)
      assert.equal(veri.duzenlemeler.vitaller.nabiz, '84', `${k}: diğer vital önerisi korunur`)
    }
  })

  it('5. Epikriz (tüm seanslar + tek vizit): başlık ve imza hekimin branşı — "Kliniği: Pediatri" ve sağlam çocuk yalnız pediatride; veli beyanı her reşit olmayan hastada', async () => {
    const beklenen: Record<string, [string, string]> = {
      pediatri: ['Kliniği: Pediatri (Çocuk Sağlığı)', 'Çocuk Sağlığı ve Hastalıkları Uzmanı'],
      kd: ['Kliniği: Kadın Hastalıkları ve Doğum', 'Kadın Hastalıkları ve Doğum Uzmanı'],
      dahiliye: ['Kliniği: İç Hastalıkları (Dahiliye)', 'İç Hastalıkları Uzmanı'],
      goz: ['Kliniği: Göz Hastalıkları', 'Göz Hastalıkları Uzmanı'],
      gozCocuk: ['Kliniği: Göz Hastalıkları', 'Göz Hastalıkları Uzmanı'],
      kbbCocuk: ['Kliniği: Kulak Burun Boğaz', 'Uzmanı'],
      kbbYetiskin: ['Kliniği: Kulak Burun Boğaz', 'Uzmanı'],
    }
    for (const [k, [klinik, unvan]] of Object.entries(beklenen)) {
      const h = H[k]
      for (const govde of [{ hastaId: h.hasta, tumSeanslar: true }, { hastaId: h.hasta, seansId: db.tablolar.get('notes')!.find((n) => n.id === h.bekleyenNot)!.session_id }]) {
        epikrizSistemleri.length = 0
        const { status, veri } = await json(R.epikriz.POST(iste('POST', '/api/doktor/araclar/epikriz', { token: h.token, govde })))
        assert.equal(status, 200, `${k}: ${JSON.stringify(veri).slice(0, 200)}`)
        assert.ok(veri.hastaBilgileri.includes(klinik), `${k}: ${veri.hastaBilgileri}`)
        assert.ok(veri.imza.includes(unvan), `${k}: ${veri.imza}`)
        const sistem = epikrizSistemleri.join('\n')
        assert.equal(/sağlam çocuk|AŞI KARNESİ|doğum bilgileri/.test(sistem), PEDIATRIK.has(k), `${k}: pediatrik klinik epikriz satırları`)
        // veli beyanı hitabı yalnız tek vizit promptunda yer alır
        if (!('tumSeanslar' in govde)) assert.equal(/Anne beyanı/.test(sistem), VELI_DILI.has(k), `${k}: veli beyanı hitabı`)
      }
    }
  })
})
