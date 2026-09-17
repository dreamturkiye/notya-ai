#!/usr/bin/env npx tsx
/**
 * NOTYA-AVATAR-01 QA — hekim profil fotoğrafının uçtan uca yolu.
 *
 * GERÇEK route handler'larını çalıştırır (/api/doktor/profil/avatar GET/POST/DELETE) ve GERÇEK
 * AES-256-GCM şifrelemesini (lib/vault/crypto) kullanır; yalnız oturum ve Supabase istemcisi
 * sahtedir (bellek içi tablo). Kullanılan hekim ve görsel TAMAMEN SENTETİKTİR: gerçek bir
 * hesaba, gerçek hastaya veya production veritabanına DOKUNMAZ, PHI içermez — fotoğraf
 * betiğin ürettiği damalı bir PNG'dir.
 *
 *   npx --yes tsx --experimental-test-module-mocks scripts/qa-doktor-avatar.mts
 *
 * Doğrulananlar:
 *   1. Ayarlar'dan yükleme: sentetik PNG 201 ile kaydediliyor.
 *   2. Saklama: satır şifreli (düz PNG imzası veritabanında YOK).
 *   3. Karşılama ekranı: GET yüklenen fotoğrafın baytlarını birebir geri veriyor.
 *   4. Fotoğrafı olmayan hekim: GET null → baş harfli avatar (kırık görsel/boşluk değil).
 *   5. Kapılar: 2 MB üstü ve PDF reddediliyor; oturumsuz istek 401.
 *   6. Kaldır: DELETE sonrası yine baş harfli avatara dönülüyor.
 */
import { mock } from 'node:test'
import { deflateSync } from 'node:zlib'

// Gerçek şifrelemenin çalışması için sentetik anahtar (yalnız bu süreçte, .env okunmaz).
process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-avatar-anahtari-2026'

const QA_DOKTOR = 'aaaaaaaa-0000-4000-8000-00000000d050'
const QA_DOKTOR_FOTOSUZ = 'aaaaaaaa-0000-4000-8000-00000000d051'
const QA_TOKEN = 'qa-sentetik-token'
const QA_TOKEN_FOTOSUZ = 'qa-sentetik-token-fotosuz'
const QA_AD = 'ismail Çetinkaya' // Türkçe büyütme kapanını da sınar: "İÇ" olmalı, "IC" değil

// ── Sentetik görsel: damalı 48x48 PNG (gerçek bir fotoğraf değil) ───────────
function crc32(buf: Buffer): number {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function parca(tip: string, veri: Buffer): Buffer {
  const uzunluk = Buffer.alloc(4)
  uzunluk.writeUInt32BE(veri.length)
  const govde = Buffer.concat([Buffer.from(tip, 'ascii'), veri])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(govde))
  return Buffer.concat([uzunluk, govde, crc])
}
function sentetikPng(boyut = 48): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(boyut, 0)
  ihdr.writeUInt32BE(boyut, 4)
  ihdr[8] = 8 // bit derinliği
  ihdr[9] = 2 // renk tipi: truecolor RGB
  const ham: number[] = []
  for (let y = 0; y < boyut; y++) {
    ham.push(0) // filtre baytı
    for (let x = 0; x < boyut; x++) {
      const kare = ((x >> 3) + (y >> 3)) % 2 === 0
      ham.push(kare ? 0x0f : 0x2d, kare ? 0x9b : 0xd4, kare ? 0x8e : 0xbf)
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    parca('IHDR', ihdr),
    parca('IDAT', deflateSync(Buffer.from(ham))),
    parca('IEND', Buffer.alloc(0)),
  ])
}

// ── Bellek içi doctor_avatars tablosu ───────────────────────────────────────
interface Satir { [k: string]: any }
let tablo: Satir[] = []

function sorguKurucu(tabloAdi: string) {
  const kosullar: ((r: Satir) => boolean)[] = []
  let islem: 'select' | 'delete' | 'upsert' = 'select'
  let govde: Satir | null = null

  const suz = () => tablo.filter((r) => r.__tablo === tabloAdi && kosullar.every((k) => k(r)))
  const uygula = () => {
    if (islem === 'delete') {
      const silinecek = new Set(suz())
      tablo = tablo.filter((r) => !silinecek.has(r))
      return { data: null, error: null }
    }
    if (islem === 'upsert' && govde) {
      const mevcut = tablo.find((r) => r.__tablo === tabloAdi && r.doctor_id === govde!.doctor_id)
      if (mevcut) Object.assign(mevcut, govde)
      else tablo.push({ __tablo: tabloAdi, ...govde })
      return { data: null, error: null }
    }
    return { data: suz(), error: null }
  }

  const api: any = {
    select: () => api,
    eq: (a: string, d: any) => { kosullar.push((r) => r[a] === d); return api },
    delete: () => { islem = 'delete'; return api },
    upsert: (g: Satir) => { islem = 'upsert'; govde = g; return api },
    maybeSingle: () => Promise.resolve({ data: suz()[0] ?? null, error: null }),
    then: (coz: any, red?: any) => Promise.resolve(uygula()).then(coz, red),
  }
  return api
}

const sahteSupabase: any = { from: (t: string) => sorguKurucu(t) }

// Rota @/lib/doktor/serverAuth üzerinden çalışır → oturumu sahteliyoruz (createClient'a hiç
// inilmiyor, bu yüzden CJS/ESM girdi ikilemi burada yok).
mock.module('@/lib/doktor/serverAuth', {
  namedExports: {
    OTURUM_YOK: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.',
    servisSupabase: () => sahteSupabase,
    doktorOturum: async (req: any) => {
      const auth = String(req.headers.get('authorization') || '')
      const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
      if (token === QA_TOKEN) return { user: { id: QA_DOKTOR }, supabase: sahteSupabase }
      if (token === QA_TOKEN_FOTOSUZ) return { user: { id: QA_DOKTOR_FOTOSUZ }, supabase: sahteSupabase }
      const { NextResponse: NR } = await import('next/server')
      return { hata: NR.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 }) }
    },
  },
})

const { GET, POST, DELETE } = await import('../app/api/doktor/profil/avatar/route')
const { doktorBasHarfleri, AVATAR_MAX_BYTES } = await import('../lib/doktor/avatar')
const { NextRequest } = await import('next/server')

let hataVar = false
function kontrol(baslik: string, kosul: boolean, ayrinti: string) {
  console.log(`   ${kosul ? '✅' : '❌'} ${baslik} — ${ayrinti}`)
  if (!kosul) hataVar = true
}

const URL_AVATAR = 'http://localhost/api/doktor/profil/avatar'
const istek = (token: string | null, init?: RequestInit) =>
  new NextRequest(URL_AVATAR, { ...(init as any), headers: token ? { Authorization: `Bearer ${token}` } : {} })

const yukle = async (token: string, dosya: File) => {
  const form = new FormData()
  form.append('file', dosya)
  return POST(new NextRequest(URL_AVATAR, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form as any }))
}

const png = sentetikPng()
console.log(`\n🧪 NOTYA-AVATAR-01 — sentetik QA hekimi, sentetik görsel (${png.length} bayt PNG)\n`)

// ── 1. Fotoğraf yokken karşılama ekranı ─────────────────────────────────────
console.log('1) Fotoğrafı olmayan hekim (yedek yol)')
{
  const r = await GET(istek(QA_TOKEN_FOTOSUZ))
  const j = await r.json()
  kontrol('GET 200 ve avatar null', r.status === 200 && j.avatar === null, `HTTP ${r.status}, avatar=${JSON.stringify(j.avatar)}`)
  kontrol('Baş harfli avatara düşüyor (kırık görsel değil)', doktorBasHarfleri(QA_AD) === 'İÇ', `"${QA_AD}" → "${doktorBasHarfleri(QA_AD)}"`)
}

// ── 2. Ayarlar'dan yükleme ──────────────────────────────────────────────────
console.log('\n2) Ayarlar › Profil fotoğrafı — yükleme')
{
  const r = await yukle(QA_TOKEN, new File([new Uint8Array(png)], 'qa-avatar.png', { type: 'image/png' }))
  const j = await r.json()
  kontrol('Yükleme 201', r.status === 201, `HTTP ${r.status} ${j.error || ''}`)
  kontrol('Yanıt data URL veriyor', String(j?.avatar?.dataUrl || '').startsWith('data:image/png;base64,'), String(j?.avatar?.dataUrl || '').slice(0, 40))
}

// ── 3. Saklama: şifreli mi? ─────────────────────────────────────────────────
console.log('\n3) Saklama')
{
  const satir = tablo.find((r) => r.__tablo === 'doctor_avatars' && r.doctor_id === QA_DOKTOR)
  kontrol('Satır yalnız bu hekime yazıldı', !!satir && satir.doctor_id === QA_DOKTOR, `doctor_id=${satir?.doctor_id}`)
  kontrol('MIME ve boyut kaydedildi', satir?.mime_type === 'image/png' && satir?.byte_length === png.length, `${satir?.mime_type}, ${satir?.byte_length} bayt`)
  const saklanan = Buffer.from(String(satir?.image_encrypted || ''), 'base64')
  const pngImzasi = Buffer.from([0x89, 0x50, 0x4e, 0x47])
  kontrol('Veritabanındaki bayt şifreli (düz PNG imzası yok)', !saklanan.subarray(0, 8).includes(pngImzasi) && !saklanan.equals(png), `${saklanan.length} bayt zarf`)
}

// ── 4. Karşılama ekranı fotoğrafı yansıtıyor mu? ────────────────────────────
console.log('\n4) Karşılama ekranı')
{
  const r = await GET(istek(QA_TOKEN))
  const j = await r.json()
  const b64 = String(j?.avatar?.dataUrl || '').split(',')[1] || ''
  const gelen = Buffer.from(b64, 'base64')
  kontrol('GET 200', r.status === 200, `HTTP ${r.status}`)
  kontrol('Dönen bayt yüklenenle birebir aynı', gelen.equals(png), `${gelen.length} / ${png.length} bayt`)
  kontrol('MIME korunuyor', j?.avatar?.mime === 'image/png', String(j?.avatar?.mime))
}

// ── 5. Kapılar ──────────────────────────────────────────────────────────────
console.log('\n5) Yükleme kapıları')
{
  const buyuk = Buffer.alloc(AVATAR_MAX_BYTES + 1, 7)
  const r1 = await yukle(QA_TOKEN, new File([new Uint8Array(buyuk)], 'buyuk.png', { type: 'image/png' }))
  const j1 = await r1.json()
  kontrol('2 MB üstü reddediliyor (400)', r1.status === 400, `HTTP ${r1.status} — ${j1.error}`)

  const r2 = await yukle(QA_TOKEN, new File([new Uint8Array(Buffer.from('%PDF-1.4'))], 'belge.pdf', { type: 'application/pdf' }))
  const j2 = await r2.json()
  kontrol('PDF reddediliyor (400)', r2.status === 400, `HTTP ${r2.status} — ${j2.error}`)

  const r3 = await GET(istek(null))
  kontrol('Oturumsuz istek 401', r3.status === 401, `HTTP ${r3.status}`)

  const r4 = await GET(istek(QA_TOKEN))
  const j4 = await r4.json()
  const halaAyni = Buffer.from(String(j4?.avatar?.dataUrl || '').split(',')[1] || '', 'base64').equals(png)
  kontrol('Reddedilen yüklemeler mevcut fotoğrafı bozmadı', halaAyni, halaAyni ? 'fotoğraf yerinde' : 'BOZULDU')
}

// ── 6. Kaldır ───────────────────────────────────────────────────────────────
console.log('\n6) Fotoğrafı kaldır')
{
  const r = await DELETE(istek(QA_TOKEN, { method: 'DELETE' }))
  kontrol('DELETE 200', r.status === 200, `HTTP ${r.status}`)
  const g = await GET(istek(QA_TOKEN))
  const j = await g.json()
  kontrol('Yeniden baş harfli avatara dönüyor', j.avatar === null, `avatar=${JSON.stringify(j.avatar)}`)
  kontrol('Satır veritabanından silindi', !tablo.some((r2) => r2.__tablo === 'doctor_avatars' && r2.doctor_id === QA_DOKTOR), `${tablo.length} satır kaldı`)
}

console.log(`\n${hataVar ? '❌ QA BAŞARISIZ' : '✅ QA GEÇTİ — tüm kontroller tamam'}\n`)
process.exit(hataVar ? 1 : 0)
