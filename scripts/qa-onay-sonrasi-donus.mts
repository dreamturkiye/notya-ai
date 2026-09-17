#!/usr/bin/env npx tsx
/**
 * NOTYA-ONAY-DONUS-01 — Dr. Gökhan'ın 2026-09-17'de canlıda bildirdiği akışın tekrarı:
 * "Muayene notunda düzeltme yapıp Onayla'ya bastım; 'Bekleyen not yok' yazan İnceleme
 * Kuyruğu'nda kaldım, hasta dosyasına dönemedim."
 *
 * GERÇEK route handler'larını çalıştırır (/api/notes?pending=true, /api/notes/[id]/approve,
 * /api/notes/[id]) — yalnız oturum ve Supabase istemcisi sahtedir (bellek içi tablolar).
 * Kullanılan doktor/hasta TAMAMEN SENTETİKTİR: Dr. Gökhan'ın hesabına, gerçek hastalara veya
 * production veritabanına DOKUNMAZ, PHI içermez.
 *
 *   npx --yes tsx --experimental-test-module-mocks scripts/qa-onay-sonrasi-donus.mts
 *
 * Doğrulananlar:
 *   1. Dr. Gökhan senaryosu: kuyrukta tek not → düzelt → onayla → kuyruk boşalır (hata DEĞİL,
 *      doğru davranış) ama hekim artık orada bırakılmıyor: kesinleşmiş nota yönlendiriliyor.
 *   2. Kesinleşmiş not = hasta dosyasındaki "Muayene Geçmişi"nden açılan sayfanın ta kendisi,
 *      düzeltmeler orada görünüyor ve hasta dosyasına dönüş bağlantısı çalışıyor.
 *   3. Oradan yeniden düzeltme + yeniden onay döngüsü çalışıyor (onaylı not tekrar onaylanıyor).
 *   4. Kuyrukta başka bekleyen not varsa akış bölünmüyor (kuyrukta kalınıyor).
 *   5. Hastaya bağlı olmayan notta bile dönüş ölü bağlantı değil (hasta listesine düşüyor).
 */
import { mock } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const QA_DOKTOR = 'aaaaaaaa-0000-4000-8000-00000000d002'
const QA_HASTA = 'aaaaaaaa-0000-4000-8000-00000000p002'
const QA_NOT_1 = 'aaaaaaaa-0000-4000-8000-00000000n002'
const QA_NOT_2 = 'aaaaaaaa-0000-4000-8000-00000000n003'
const QA_TOKEN = 'qa-sentetik-token'

interface Satir { [k: string]: any }
let tablo: Satir[] = []

/** Sadece bu betiğin dokunduğu Supabase zinciri (bellek içi). */
function sorguKurucu(tabloAdi: string) {
  const kosullar: ((r: Satir) => boolean)[] = []
  let govde: Satir | null = null
  let sinir: number | null = null
  const eklenen: Satir[] = []

  const uygula = () => {
    const hepsi = tablo.filter((r) => r.__tablo === tabloAdi && kosullar.every((k) => k(r)))
    if (govde) for (const r of hepsi) Object.assign(r, govde)
    return sinir == null ? hepsi : hepsi.slice(0, sinir)
  }

  const api: any = {
    select: () => api,
    insert: (g: Satir | Satir[]) => {
      for (const x of Array.isArray(g) ? g : [g]) { const r = { __tablo: tabloAdi, ...x }; tablo.push(r); eklenen.push(r) }
      return api
    },
    update: (g: Satir) => { govde = g; return api },
    upsert: (g: Satir) => { tablo.push({ __tablo: tabloAdi, ...g }); return api },
    eq: (a: string, d: any) => { kosullar.push((r) => r[a] === d); return api },
    in: (a: string, d: any[]) => { kosullar.push((r) => d.includes(r[a])); return api },
    is: (a: string, d: any) => { kosullar.push((r) => (r[a] ?? null) === d); return api },
    order: () => api,
    limit: (n: number) => { sinir = n; return api },
    maybeSingle: () => Promise.resolve({ data: (eklenen[0] ?? uygula()[0]) ?? null, error: null }),
    single: () => {
      const r = eklenen[0] ?? uygula()[0]
      return Promise.resolve({ data: r ?? null, error: r ? null : { message: 'yok' } })
    },
    then: (coz: any, red?: any) => Promise.resolve({ data: eklenen.length ? eklenen : uygula(), error: null }).then(coz, red),
  }
  return api
}
const sahteSupabase: any = {
  from: (t: string) => sorguKurucu(t),
  auth: { getUser: async (t: string) => (t === QA_TOKEN ? { data: { user: { id: QA_DOKTOR } }, error: null } : { data: { user: null }, error: { message: 'gecersiz' } }) },
}

// Not rotaları kendi service-role istemcisini kurar → createClient'ı sahteyle değiştiriyoruz.
// Dikkat: bu betik ESM (.mts), rotalar ise CJS olarak yükleniyor (package.json'da type:module yok),
// yani paketin ESM ve CJS girdileri AYRI modül örnekleri. İkisini de değiştiriyoruz ki
// hangi girdiden geçilirse geçilsin sahte istemci dönsün.
function supabaseGirdileri(): string[] {
  const req = createRequire(import.meta.url)
  const pkgYolu = req.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const adaylar = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  return [...new Set(adaylar.filter(Boolean).map((g: string) => pathToFileURL(join(kok, g)).href))]
}
for (const girdi of supabaseGirdileri()) mock.module(girdi, { namedExports: { createClient: () => sahteSupabase } })
// /api/notes/[id] pratikOturum üzerinden çalışır.
mock.module('@/lib/doktor/pratikOturum', {
  namedExports: {
    pratikOturum: async () => ({ supabase: sahteSupabase, doktorId: QA_DOKTOR, rol: 'doktor', user: { id: QA_DOKTOR } }),
    sadeceDoktor: () => null,
  },
})
// Sentetik veride şifreleme anahtarı yok — "ENC:" öneki yerine geçer (PHI yok, uydurma ad).
mock.module('@/lib/security/encryption', {
  namedExports: {
    decrypt: (v: string) => (String(v || '').startsWith('ENC:') ? String(v).slice(4) : ''),
    encrypt: (v: string) => `ENC:${v}`,
  },
})
// Onayın yan etkileri (reçete aktarımı, hafıza sayacı, stil damıtma) bu testin konusu değil —
// hepsi route içinde try/catch'te; ağ çağrısı yapmasınlar diye susturuluyor.
mock.module('@/lib/doktor/receteAktarim', { namedExports: { nottanIlacAktar: async () => ({ aktarilan: 0, atlanan: 0, hata: null }) } })
mock.module('@/lib/doktor/hafiza', { namedExports: { seansIsle: async () => undefined } })
mock.module('@/lib/doktor/soapUret', { namedExports: { stilProfiliDamit: async () => '' } })

const { GET: KUYRUK_GET } = await import('../app/api/notes/route')
const { POST: ONAY_POST } = await import('../app/api/notes/[id]/approve/route')
const { GET: NOT_GET } = await import('../app/api/notes/[id]/route')
// Arayüzün onay sonrası hedefi nasıl seçtiğinin ta kendisi — kopyası değil.
const { onaySonrasiHedef, onaylananNotYolu, hastaDosyasiYolu } = await import('../lib/doktor/onaySonrasiYol')
const { NextRequest } = await import('next/server')

let hataVar = false
function kontrol(baslik: string, kosul: boolean, ayrinti: string) {
  console.log(`   ${kosul ? '✅' : '❌'} ${baslik} — ${ayrinti}`)
  if (!kosul) hataVar = true
}

const yetki = { Authorization: `Bearer ${QA_TOKEN}` }

function notSatiri(id: string, hastaBagli: boolean): Satir {
  return {
    __tablo: 'notes', id, doctor_id: QA_DOKTOR, approved_at: null,
    created_at: new Date().toISOString(),
    basvuru_yakinmasi: 'Üç gündür öksürük',
    content_subjektif: 'Üç gündür kuru öksürük, ateş yok.',
    content_objektif: 'Genel durum iyi, akciğerler doğal.',
    content_degerlendirme: 'Üst solunum yolu enfeksiyonu.',
    content_plan: 'Bol sıvı, istirahat.',
    content_ilaclar: [], icd10_codes: [], alarm_bulgulari: [], recete_onerisi: [],
    hasta_ozeti: '', vitaller: {}, ai_degerlendirme: '',
    sessions: hastaBagli ? { patient_id: QA_HASTA, specialty: 'pediatri' } : null,
  }
}

/** Sentetik sahne: QA doktoru + QA hastası + istenen sayıda bekleyen not. */
function sahneyiKur(bekleyenIdler: string[], hastaBagli = true) {
  tablo = []
  tablo.push({ __tablo: 'users', id: QA_DOKTOR, full_name: 'QA Test Hekimi', email: 'qa@ornek.test', recete_baslik: {} })
  tablo.push({ __tablo: 'patients', id: QA_HASTA, doctor_id: QA_DOKTOR, name_encrypted: 'ENC:{"ad":"QA","soyad":"Sentetik"}', dob_encrypted: 'ENC:2020-04-01', gender_encrypted: 'ENC:male' })
  for (const id of bekleyenIdler) tablo.push(notSatiri(id, hastaBagli))
}
const notu = (id: string) => tablo.find((r) => r.__tablo === 'notes' && r.id === id)

async function kuyrukListesi() {
  const y = await KUYRUK_GET(new NextRequest('http://localhost/api/notes?pending=true', { headers: yetki }))
  return { durum: y.status, liste: (await y.json()) as any[] }
}
async function onayla(id: string, duzenlemeler: Record<string, unknown>) {
  const y = await ONAY_POST(
    new NextRequest(`http://localhost/api/notes/${id}/approve`, { method: 'POST', headers: { ...yetki, 'Content-Type': 'application/json' }, body: JSON.stringify({ duzenlemeler }) }),
    { params: { id } },
  )
  return { durum: y.status, govde: (await y.json()) as any }
}
async function notuGetir(id: string) {
  const y = await NOT_GET(new NextRequest(`http://localhost/api/notes/${id}`, { headers: yetki }), { params: Promise.resolve({ id }) })
  return { durum: y.status, govde: (await y.json()) as any }
}

console.log('\n=== 1. Dr. Gökhan senaryosu: kuyrukta TEK not → düzelt → Onayla ===')
sahneyiKur([QA_NOT_1])
const once = await kuyrukListesi()
kontrol('kuyrukta bekleyen not var', once.liste.length === 1, `HTTP ${once.durum} · ${once.liste.length} not`)

const DUZELTME = 'Üst solunum yolu enfeksiyonu — viral. Antibiyotik endikasyonu yok.'
const onay = await onayla(QA_NOT_1, { degerlendirme: DUZELTME })
kontrol('onay başarılı', onay.durum === 200 && onay.govde.success === true, `HTTP ${onay.durum}`)
kontrol('düzeltme nota işlendi', String(notu(QA_NOT_1)?.content_degerlendirme) === DUZELTME, `${onay.govde.duzenlenenAlanSayisi} alan düzenlendi`)
kontrol('not onaylandı (approved_at yazıldı)', !!notu(QA_NOT_1)?.approved_at, String(notu(QA_NOT_1)?.approved_at))

const sonra = await kuyrukListesi()
kontrol('kuyruk boşaldı — "Bekleyen not yok" ekranının sebebi', sonra.liste.length === 0, `${sonra.liste.length} bekleyen not`)

const hedef = onaySonrasiHedef(QA_NOT_1, sonra.liste.length)
kontrol('ÖNCEKİ HATA YOK: hekim boş kuyrukta bırakılmıyor', hedef.tur === 'not', `hedef.tur=${hedef.tur}`)
kontrol('hedef, notun kesinleşmiş görünümü', hedef.tur === 'not' && hedef.yol === `/dashboard/doktor/notlar/${QA_NOT_1}/yazdir`, hedef.tur === 'not' ? hedef.yol : '—')

console.log('\n=== 2. Yönlendirilen sayfa gerçekten notu gösteriyor mu + hasta dosyasına dönüş ===')
const kesin = await notuGetir(QA_NOT_1)
kontrol('kesinleşmiş not açılıyor', kesin.durum === 200, `HTTP ${kesin.durum}`)
kontrol('onay damgası görünüyor', !!kesin.govde.not?.approvedAt, String(kesin.govde.not?.approvedAt))
kontrol('düzeltilmiş metin kesinleşmiş notta', kesin.govde.not?.degerlendirme === DUZELTME, String(kesin.govde.not?.degerlendirme).slice(0, 60))
kontrol('hasta dosyasına dönüş bağlantısı var', kesin.govde.hasta?.patientId === QA_HASTA, `patientId=${kesin.govde.hasta?.patientId}`)
kontrol('dönüş bağlantısı hastanın dosyasına gidiyor', hastaDosyasiYolu(kesin.govde.hasta?.patientId) === `/dashboard/doktor/hastalar/${QA_HASTA}`, hastaDosyasiYolu(kesin.govde.hasta?.patientId))
kontrol('bu sayfa hasta dosyasından açılanla AYNI', onaylananNotYolu(QA_NOT_1) === `/dashboard/doktor/notlar/${QA_NOT_1}/yazdir`, onaylananNotYolu(QA_NOT_1))

console.log('\n=== 3. Kesinleşmiş nottan yeniden düzeltme + yeniden onay ===')
const IKINCI = 'Üst solunum yolu enfeksiyonu — viral. Kontrol: 3 gün sonra.'
const onay2 = await onayla(QA_NOT_1, { degerlendirme: IKINCI })
kontrol('onaylı not yeniden onaylanabiliyor', onay2.durum === 200 && onay2.govde.success === true, `HTTP ${onay2.durum}`)
kontrol('ikinci düzeltme de işlendi', String(notu(QA_NOT_1)?.content_degerlendirme) === IKINCI, `${onay2.govde.duzenlenenAlanSayisi} alan düzenlendi`)
const kesin2 = await notuGetir(QA_NOT_1)
kontrol('kesinleşmiş not güncel', kesin2.govde.not?.degerlendirme === IKINCI, String(kesin2.govde.not?.degerlendirme).slice(0, 60))
kontrol('yeniden onaydan sonra da hedef aynı sayfa', (() => { const h = onaySonrasiHedef(QA_NOT_1, 0); return h.tur === 'not' && h.yol === onaylananNotYolu(QA_NOT_1) })(), onaylananNotYolu(QA_NOT_1))

console.log('\n=== 4. Kuyrukta başka bekleyen not varsa akış bölünmemeli ===')
sahneyiKur([QA_NOT_1, QA_NOT_2])
const onay3 = await onayla(QA_NOT_1, { degerlendirme: DUZELTME })
kontrol('onay başarılı', onay3.durum === 200, `HTTP ${onay3.durum}`)
const kalan = await kuyrukListesi()
kontrol('kuyrukta hâlâ bekleyen not var', kalan.liste.length === 1, `${kalan.liste.length} bekleyen not`)
kontrol('hekim kuyrukta kalıyor (sıra bölünmüyor)', onaySonrasiHedef(QA_NOT_1, kalan.liste.length).tur === 'kuyrukta-kal', `kalan=${kalan.liste.length}`)

console.log('\n=== 5. Hastaya bağlı olmayan not: dönüş yine de ölü bağlantı olmamalı ===')
sahneyiKur([QA_NOT_1], false)
await onayla(QA_NOT_1, { degerlendirme: DUZELTME })
const hastasiz = await notuGetir(QA_NOT_1)
kontrol('not hastaya bağlı değil (beklenen)', hastasiz.govde.hasta?.patientId === null, `patientId=${hastasiz.govde.hasta?.patientId}`)
kontrol('dönüş bağlantısı hasta listesine düşüyor', hastaDosyasiYolu(hastasiz.govde.hasta?.patientId) === '/dashboard/doktor/hastalar', hastaDosyasiYolu(hastasiz.govde.hasta?.patientId))

console.log(hataVar ? '\n❌ QA BAŞARISIZ\n' : '\n✅ QA GEÇTİ — onaydan sonra hekim kesinleşmiş nota dönüyor, çıkmaz yok\n')
process.exit(hataVar ? 1 : 0)
