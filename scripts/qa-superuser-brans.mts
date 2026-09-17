#!/usr/bin/env npx tsx
/**
 * NOTYA-SUPERUSER-BRANS-01 doğrulaması — GERÇEK route handler'larını çalıştırır
 * (`GET/POST /api/users/superuser-brans` ve `GET /api/users/me`); yalnız Supabase istemcisi
 * sahtedir (bellek içi tablolar).
 *
 * PRODUCTION VERİTABANINA DOKUNMAZ. Kaan ve Dr. Gökhan'ın kimlikleri yalnız izin listesinin
 * doğru kimlikleri tanıdığını göstermek için okunur — tek satır bile yazılmaz, PHI yoktur;
 * yazma işlemlerinin tamamı bu betiğin bellek içi tablosundadır.
 *
 *   npx --yes tsx --experimental-test-module-mocks scripts/qa-superuser-brans.mts
 *
 * Doğrulananlar:
 *   1. Kaan'ın hesabı: seçici görünür (yetkili: true), Pediatri → Kadın Doğum → Pediatri
 *      gidiş-dönüşü çalışır ve /api/users/me her adımda yeni branşı döner (pano da onu okur).
 *   2. Dr. Gökhan'ın hesabı aynı şekilde yetkilidir.
 *   3. İzin listesinde OLMAYAN sentetik QA hekimi: GET yalnız `{ yetkili: false }` döner
 *      (liste içeriği sızmaz), POST 403 ile reddedilir ve branşı DEĞİŞMEZ.
 *   4. Oturumsuz / bozuk token 401.
 *   5. Yetkili hesap bile uydurma branş yazamaz — 400, veritabanı değişmez.
 */
import { mock } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

// Doğrulanmış kimlikler (2026-09-17 production sorgusu) — burada YALNIZ okunur.
const KAAN = 'c4989e29-a219-45b6-bf17-18e260e3c7f9'
const GOKHAN = '94c4db57-8b89-4880-80be-143f88f4bcc1'
// İzin listesinde OLMAYAN, tamamen sentetik hekim.
const QA_HEKIM = 'aaaaaaaa-0000-4000-8000-0000000sbr01'

interface Satir { [k: string]: any }
let tablo: Satir[] = []
let authMeta: Record<string, Record<string, unknown>> = {}

function sorguKurucu(tabloAdi: string) {
  const kosullar: ((r: Satir) => boolean)[] = []
  let govde: Satir | null = null
  const uygula = () => {
    const hepsi = tablo.filter((r) => r.__tablo === tabloAdi && kosullar.every((k) => k(r)))
    if (govde) for (const r of hepsi) Object.assign(r, govde)
    return hepsi
  }
  const api: any = {
    select: () => api,
    update: (g: Satir) => { govde = g; return api },
    eq: (a: string, d: any) => { kosullar.push((r) => r[a] === d); return api },
    maybeSingle: () => Promise.resolve({ data: uygula()[0] ?? null, error: null }),
    single: () => { const r = uygula()[0]; return Promise.resolve({ data: r ?? null, error: r ? null : { message: 'yok' } }) },
    then: (coz: any, red?: any) => Promise.resolve({ data: uygula(), error: null }).then(coz, red),
  }
  return api
}

/** Token = kullanıcı kimliği (sentetik kısayol); 'bozuk' hiçbir kullanıcıya çözülmez. */
const sahteSupabase: any = {
  from: (t: string) => sorguKurucu(t),
  auth: {
    getUser: async (t: string) => {
      const kayitli = [KAAN, GOKHAN, QA_HEKIM]
      return kayitli.includes(t)
        ? { data: { user: { id: t, email: `${t}@ornek.test`, user_metadata: authMeta[t] || {} } }, error: null }
        : { data: { user: null }, error: { message: 'gecersiz' } }
    },
    admin: {
      updateUserById: async (id: string, yama: { user_metadata?: Record<string, unknown> }) => {
        authMeta[id] = { ...(authMeta[id] || {}), ...(yama.user_metadata || {}) }
        return { data: { user: { id } }, error: null }
      },
    },
  },
}

// Rotalar kendi service-role istemcilerini kuruyor → createClient sahteyle değiştiriliyor.
// Bu betik ESM, rotalar CJS olarak yükleniyor: paketin İKİ girdisi de ayrı modül örneği,
// ikisi birden değiştirilmeli (aksi halde rota "supabaseUrl is required" ile ölür).
function supabaseGirdileri(): string[] {
  const req = createRequire(import.meta.url)
  const pkgYolu = req.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const adaylar = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  return [...new Set(adaylar.filter(Boolean).map((g: string) => pathToFileURL(join(kok, g)).href))]
}
for (const girdi of supabaseGirdileri()) mock.module(girdi, { namedExports: { createClient: () => sahteSupabase } })

const { GET: BRANS_GET, POST: BRANS_POST } = await import('../app/api/users/superuser-brans/route')
const { GET: ME_GET } = await import('../app/api/users/me/route')
const { NextRequest } = await import('next/server')

let hataVar = false
function kontrol(baslik: string, kosul: boolean, ayrinti: string) {
  console.log(`   ${kosul ? '✅' : '❌'} ${baslik} — ${ayrinti}`)
  if (!kosul) hataVar = true
}

function sahneyiKur() {
  tablo = [
    { __tablo: 'users', id: KAAN, email: 'kaanari@mac.com', full_name: 'Kaan Arioglu', specialty: 'pediatri', profession_type: 'doktor', onboarding_completed: true },
    { __tablo: 'users', id: GOKHAN, email: 'dr.gokhanmamur@gmail.com', full_name: 'Dr. Gökhan Mamur', specialty: 'pediatri', profession_type: 'doktor', onboarding_completed: true },
    { __tablo: 'users', id: QA_HEKIM, email: 'qa.sentetik@ornek.test', full_name: 'QA Sentetik Hekim', specialty: 'kardiyoloji', profession_type: 'doktor', onboarding_completed: true },
  ]
  authMeta = {
    [KAAN]: { specialty: 'pediatri', profession_type: 'doktor', onboarding_completed: true },
    [GOKHAN]: { specialty: 'pediatri', profession_type: 'doktor', onboarding_completed: true },
    [QA_HEKIM]: { specialty: 'kardiyoloji', profession_type: 'doktor', onboarding_completed: true },
  }
}
const satir = (id: string) => tablo.find((r) => r.__tablo === 'users' && r.id === id)
const yetki = (token: string) => ({ Authorization: `Bearer ${token}` })
const istek = (baslik: Record<string, string>) => new NextRequest('http://localhost/api/users/superuser-brans', { headers: baslik })
const yazIstegi = (baslik: Record<string, string>, govde: unknown) =>
  new NextRequest('http://localhost/api/users/superuser-brans', {
    method: 'POST', headers: { ...baslik, 'Content-Type': 'application/json' }, body: JSON.stringify(govde),
  })

/** Panonun okuduğu kaynağın ta kendisi — kopyası değil. */
async function panodakiBrans(token: string): Promise<string | null> {
  const r = await ME_GET(new NextRequest('http://localhost/api/users/me', { headers: yetki(token) }))
  const d = await r.json()
  return d?.data?.specialty ?? null
}

console.log('\n🔎 NOTYA-SUPERUSER-BRANS-01 — iki hesaba özel branş değiştirici\n')

// 1. Kaan: seçici görünür, Pediatri → Kadın Doğum → Pediatri
sahneyiKur()
console.log('1) Kaan (kaanari@mac.com) — seçici ve gidiş-dönüş')
{
  const g = await BRANS_GET(istek(yetki(KAAN)))
  const gd = await g.json()
  kontrol('seçici çiziliyor', g.status === 200 && gd.yetkili === true, `status=${g.status} yetkili=${gd.yetkili}`)
  kontrol('mevcut branş doğru', gd.brans === 'pediatri', `brans=${gd.brans}`)
  kontrol('açılır liste kanonik kayıttan', Array.isArray(gd.secenekler) && gd.secenekler.length === 30, `secenek=${gd.secenekler?.length}`)
  kontrol('başlangıçta pano Pediatri diyor', (await panodakiBrans(KAAN)) === 'pediatri', 'users/me=pediatri')

  const p = await BRANS_POST(yazIstegi(yetki(KAAN), { brans: 'kadin-hastaliklari-dogum' }))
  const pd = await p.json()
  kontrol('Kadın Doğum\'a geçiş kabul edildi', p.status === 200 && pd.success === true, `status=${p.status}`)
  kontrol('users.specialty yazıldı', satir(KAAN)?.specialty === 'kadin-hastaliklari-dogum', `db=${satir(KAAN)?.specialty}`)
  kontrol('auth metadata da yazıldı (yarım geçiş yok)', authMeta[KAAN].specialty === 'kadin-hastaliklari-dogum', `meta=${authMeta[KAAN].specialty}`)
  kontrol('PANO yeni branşı gösteriyor', (await panodakiBrans(KAAN)) === 'kadin-hastaliklari-dogum', 'users/me=kadin-hastaliklari-dogum')

  const geri = await BRANS_POST(yazIstegi(yetki(KAAN), { brans: 'pediatri' }))
  kontrol('Pediatri\'ye dönüş çalışıyor', geri.status === 200, `status=${geri.status}`)
  kontrol('PANO tekrar Pediatri', (await panodakiBrans(KAAN)) === 'pediatri', 'users/me=pediatri')
  kontrol('onboarding tekrar çalışmadı', satir(KAAN)?.onboarding_completed === true, 'onboarding_completed=true')
}

// 2. Dr. Gökhan
console.log('\n2) Dr. Gökhan (dr.gokhanmamur@gmail.com) — aynı yetki')
{
  const g = await BRANS_GET(istek(yetki(GOKHAN)))
  const gd = await g.json()
  kontrol('seçici çiziliyor', gd.yetkili === true, `yetkili=${gd.yetkili}`)
  const p = await BRANS_POST(yazIstegi(yetki(GOKHAN), { brans: 'kadin-hastaliklari-dogum' }))
  kontrol('Kadın Doğum\'a geçebiliyor', p.status === 200, `status=${p.status}`)
  kontrol('PANO yeni branşı gösteriyor', (await panodakiBrans(GOKHAN)) === 'kadin-hastaliklari-dogum', 'users/me=kadin-hastaliklari-dogum')
  const geri = await BRANS_POST(yazIstegi(yetki(GOKHAN), { brans: 'pediatri' }))
  kontrol('Pediatri\'ye dönebiliyor', geri.status === 200 && (await panodakiBrans(GOKHAN)) === 'pediatri', 'users/me=pediatri')
}

// 3. İzin listesinde olmayan hekim — hiçbir şey değişmiyor
console.log('\n3) İzin listesinde OLMAYAN sentetik QA hekimi — hiçbir şey değişmemeli')
{
  const oncekiBrans = satir(QA_HEKIM)?.specialty
  const g = await BRANS_GET(istek(yetki(QA_HEKIM)))
  const gd = await g.json()
  kontrol('seçici ÇİZİLMİYOR', gd.yetkili === false, `yetkili=${gd.yetkili}`)
  kontrol('izin listesi sızmıyor', gd.secenekler === undefined && gd.brans === undefined && JSON.stringify(gd) === '{"yetkili":false}', `govde=${JSON.stringify(gd)}`)

  const p = await BRANS_POST(yazIstegi(yetki(QA_HEKIM), { brans: 'kadin-hastaliklari-dogum' }))
  const pd = await p.json()
  kontrol('doğrudan çağrı 403 ile reddedildi', p.status === 403, `status=${p.status} error=${pd.error}`)
  kontrol('branşı DEĞİŞMEDİ', satir(QA_HEKIM)?.specialty === oncekiBrans, `db=${satir(QA_HEKIM)?.specialty}`)
  kontrol('auth metadata da değişmedi', authMeta[QA_HEKIM].specialty === 'kardiyoloji', `meta=${authMeta[QA_HEKIM].specialty}`)
  kontrol('panosu eskisi gibi', (await panodakiBrans(QA_HEKIM)) === 'kardiyoloji', 'users/me=kardiyoloji')
}

// 4. Oturumsuz
console.log('\n4) Oturumsuz / bozuk token')
{
  const g = await BRANS_GET(istek({}))
  kontrol('başlıksız GET 401', g.status === 401, `status=${g.status}`)
  const p = await BRANS_POST(yazIstegi(yetki('bozuk-token'), { brans: 'pediatri' }))
  kontrol('bozuk token POST 401', p.status === 401, `status=${p.status}`)
  const p2 = await BRANS_POST(yazIstegi(yetki('null'), { brans: 'pediatri' }))
  kontrol("'Bearer null' 401", p2.status === 401, `status=${p2.status}`)
}

// 5. Yetkili hesap bile uydurma branş yazamaz
console.log('\n5) Branş doğrulaması — yetkili hesapta bile')
{
  const oncekiBrans = satir(KAAN)?.specialty
  for (const kotu of ['uydurma-brans', 'genel', '', null, 42, '__proto__']) {
    const p = await BRANS_POST(yazIstegi(yetki(KAAN), { brans: kotu }))
    kontrol(`"${String(kotu)}" reddedildi`, p.status === 400, `status=${p.status}`)
  }
  kontrol('veritabanı değişmedi', satir(KAAN)?.specialty === oncekiBrans, `db=${satir(KAAN)?.specialty}`)
}

console.log(hataVar ? '\n❌ QA BAŞARISIZ\n' : '\n✅ QA GEÇTİ — iki hesap değiştirebiliyor, diğer herkes için hiçbir şey değişmiyor\n')
process.exit(hataVar ? 1 : 0)
