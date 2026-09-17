#!/usr/bin/env npx tsx
/**
 * NOTYA-ARAMA-TR-01 — Dr. Gökhan'ın 2026-09-17'de canlıda bildirdiği "Hasta ara çalışmıyor"
 * akışının birebir tekrarı, GERÇEK route handler'larla.
 *
 * Yalnız oturum ve Supabase istemcisi sahte (bellek içi tablo). Doktor ve hastalar TAMAMEN
 * SENTETİKTİR — Dr. Gökhan'ın hesabına, gerçek hastalara veya production veritabanına DOKUNMAZ,
 * PHI içermez. Şifreleme anahtarı da bu süreç için üretilen atılabilir bir test anahtarıdır.
 *
 *   npx --yes tsx --experimental-test-module-mocks scripts/qa-randevu-hasta-arama-tr.mts
 *
 * Adımlar:
 *   1. Sentetik hastalar: "Hasta Iki" (NOKTASIZ büyük I), "Işık Yılmaz", "Ahmet Yılmaz"
 *   2. GET /api/doktor/hastalar → randevu formunun beslendiği gerçek liste
 *   3. Dr. Gökhan'ın yazdığı metin ("Hasta iki") ESKİ katlamayla vs YENİ katlamayla süzülür
 *   4. Bulunan hastayla POST /api/doktor/randevular → randevu gerçekten patient_id'ye bağlı mı?
 *   5. Eski (hatalı) yol: kayıtsız randevu + onay → ikinci bir hasta dosyası açılıyor mu?
 *   6. Kayıtsız randevu sonradan gerçek hastaya bağlanabiliyor mu (PATCH patientId)?
 */
import { mock } from 'node:test'
import { randomBytes } from 'node:crypto'

// Atılabilir test anahtarı — hiçbir gerçek veriyi çözmez/şifrelemez.
process.env.ENCRYPTION_MASTER_KEY = randomBytes(32).toString('hex')
process.env.ENCRYPTION_SALT = 'qa-arama-tr-salt'

const QA_DOKTOR_ID = '00000000-0000-4000-8000-0000000000d1'
const QA_RANDEVU_ID = '00000000-0000-4000-8000-0000000000b1'

interface Satir { [k: string]: any }
let tablo: Satir[] = []
let sayac = 0

/** Route handler'ların kullandığı zincirin bellek içi karşılığı. */
function sorguKurucu(tabloAdi: string) {
  const kosullar: ((r: Satir) => boolean)[] = []
  let guncellemeGovdesi: Satir | null = null
  let eklenen: Satir | null = null
  let silme = false
  let siraAlan: string | null = null
  let siraArtan = true

  const calistir = () => {
    if (eklenen) return [eklenen]
    let hedef = tablo.filter((r) => r.__tablo === tabloAdi).filter((r) => kosullar.every((k) => k(r)))
    if (siraAlan) {
      hedef = [...hedef].sort((a, b) => (a[siraAlan!] < b[siraAlan!] ? -1 : 1))
      if (!siraArtan) hedef.reverse()
    }
    if (guncellemeGovdesi) for (const r of hedef) Object.assign(r, guncellemeGovdesi)
    if (silme) tablo = tablo.filter((r) => !hedef.includes(r))
    return hedef
  }

  const api: any = {
    select: () => api,
    insert: (govde: Satir) => {
      eklenen = { __tablo: tabloAdi, id: `${tabloAdi}-${++sayac}`, created_at: new Date(2026, 0, sayac).toISOString(), ...govde }
      tablo.push(eklenen)
      return api
    },
    update: (govde: Satir) => { guncellemeGovdesi = govde; return api },
    delete: () => { silme = true; return api },
    eq: (alan: string, deger: any) => { kosullar.push((r) => r[alan] === deger); return api },
    neq: (alan: string, deger: any) => { kosullar.push((r) => r[alan] !== deger); return api },
    lt: (alan: string, deger: any) => { kosullar.push((r) => r[alan] < deger); return api },
    gt: (alan: string, deger: any) => { kosullar.push((r) => r[alan] > deger); return api },
    order: (alan: string, secenek?: { ascending?: boolean }) => { siraAlan = alan; siraArtan = secenek?.ascending !== false; return api },
    limit: (n: number) => Promise.resolve({ data: calistir().slice(0, n), error: null }),
    maybeSingle: () => Promise.resolve({ data: calistir()[0] ?? null, error: null }),
    single: () => {
      const sonuc = calistir()
      return Promise.resolve({ data: sonuc[0] ?? null, error: sonuc.length ? null : { message: 'yok' } })
    },
    then: (coz: any) => Promise.resolve({ data: calistir(), error: null }).then(coz),
  }
  return api
}

const sahteSupabase: any = { from: (t: string) => sorguKurucu(t) }

mock.module('@/lib/doktor/pratikOturum', {
  namedExports: {
    pratikOturum: async () => ({ supabase: sahteSupabase, doktorId: QA_DOKTOR_ID, rol: 'doktor', user: { id: QA_DOKTOR_ID } }),
  },
})
mock.module('@/lib/doktor/serverAuth', {
  namedExports: {
    doktorOturum: async () => ({ supabase: sahteSupabase, user: { id: QA_DOKTOR_ID } }),
  },
})

const { GET: HASTALAR_GET } = await import('../app/api/doktor/hastalar/route')
const { POST: RANDEVU_POST, GET: RANDEVU_GET } = await import('../app/api/doktor/randevular/route')
const { PATCH: RANDEVU_PATCH } = await import('../app/api/doktor/randevular/[id]/route')
const { encrypt } = await import('../lib/security/encryption')
const { trIcerir } = await import('../lib/utils/turkceArama')
const { NextRequest } = await import('next/server')

let hataVar = false
function kontrol(baslik: string, kosul: boolean, ayrinti: string) {
  console.log(`   ${kosul ? '✅' : '❌'} ${baslik} — ${ayrinti}`)
  if (!kosul) hataVar = true
}

/** Düzeltmeden ÖNCEKİ katlama — üç ayrı dosyada birebir bu vardı. */
const eskiKatlama = (s: string) => s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/\p{M}/gu, '')
const eskiIcerir = (ad: string, q: string) => eskiKatlama(ad).includes(eskiKatlama(q.trim()))

// ——— Adım 1: sentetik hastalar ———
const SENTETIK = ['Hasta Iki', 'Işık Yılmaz', 'Ahmet Yılmaz']
for (const ad of SENTETIK) {
  tablo.push({
    __tablo: 'patients',
    id: `hasta-${SENTETIK.indexOf(ad) + 1}`,
    doctor_id: QA_DOKTOR_ID,
    name_encrypted: encrypt(JSON.stringify({ ad })),
    tc_kimlik_hash: null,
    is_active: true,
    created_at: `2026-0${SENTETIK.indexOf(ad) + 1}-01T00:00:00.000Z`,
  })
}
console.log(`\n1. Sentetik hastalar kaydedildi: ${SENTETIK.map((a) => `"${a}"`).join(', ')}`)
console.log('   ("Hasta Iki" NOKTASIZ büyük I ile — Dr. Gökhan\'ın listesindeki gerçek yazım)')

// ——— Adım 2: formun beslendiği gerçek liste ———
const hastalarYanit = await HASTALAR_GET(new NextRequest('http://localhost/api/doktor/hastalar'))
const roster: { id: string; name: string }[] = (await hastalarYanit.json()).patients
console.log(`\n2. GET /api/doktor/hastalar → ${roster.length} hasta (HTTP ${hastalarYanit.status})`)
kontrol('liste adları doğru çözüldü', SENTETIK.every((a) => roster.some((r) => r.name === a)), roster.map((r) => r.name).join(' | '))

// ——— Adım 3: Dr. Gökhan'ın yazdığı metin ———
const YAZILAN = 'Hasta iki'
const eski = roster.filter((r) => eskiIcerir(r.name, YAZILAN))
const yeni = roster.filter((r) => trIcerir(r.name, YAZILAN))
console.log(`\n3. "Hasta ara" kutusuna "${YAZILAN}" yazıldı:`)
console.log(`   ESKİ katlama → ${eski.length} sonuç  ("Hasta Iki" → "${eskiKatlama('Hasta Iki')}", aranan → "${eskiKatlama(YAZILAN)}")`)
console.log(`   YENİ katlama → ${yeni.length} sonuç  (${yeni.map((r) => r.name).join(', ') || '—'})`)
kontrol('eski davranış hatayı gerçekten üretiyordu', eski.length === 0, 'hiç sonuç yok → form kayıtsız yola düşüyordu')
kontrol('yeni davranış kayıtlı hastayı buluyor', yeni.length === 1 && yeni[0].name === 'Hasta Iki', yeni.map((r) => r.name).join(', '))

for (const [q, beklenen] of [['iki', 'Hasta Iki'], ['IKI', 'Hasta Iki'], ['İKİ', 'Hasta Iki'], ['ıkı', 'Hasta Iki'], ['isik', 'Işık Yılmaz'], ['IŞIK', 'Işık Yılmaz'], ['ışık', 'Işık Yılmaz'], ['yilmaz', 'Işık Yılmaz']] as const) {
  const bulunan = roster.filter((r) => trIcerir(r.name, q))
  kontrol(`"${q}" yazımı`, bulunan.some((r) => r.name === beklenen), bulunan.map((r) => r.name).join(', ') || 'sonuç yok')
}

// ——— Adım 4: seçilen hastayla randevu ———
const secilen = yeni[0]
const postYanit = await RANDEVU_POST(new NextRequest('http://localhost/api/doktor/randevular', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientId: secilen.id,
    hastaAdiSerbest: null,
    baslangic: '2026-09-18T07:00:00.000Z',
    bitis: '2026-09-18T07:20:00.000Z',
    tur: 'muayene',
  }),
}))
const olusan = (await postYanit.json()).randevu
console.log(`\n4. Listeden seçilip randevu oluşturuldu (HTTP ${postYanit.status})`)
kontrol('randevu GERÇEK hasta kaydına bağlı', olusan?.patient_id === secilen.id, `patient_id=${olusan?.patient_id}`)
kontrol('serbest isim yazılmadı (kopya kayıt yok)', olusan?.hasta_adi_serbest === null, `hasta_adi_serbest=${JSON.stringify(olusan?.hasta_adi_serbest)}`)

const listeYanit = await RANDEVU_GET(new NextRequest('http://localhost/api/doktor/randevular?baslangic=2026-09-18T00:00:00.000Z&bitis=2026-09-19T00:00:00.000Z'))
const listelenen = (await listeYanit.json()).randevular[0]
kontrol('takvim "kayıtlı hasta" olarak gösteriyor', listelenen?.kayitliHasta === true && listelenen?.hastaAdi === 'Hasta Iki', `hastaAdi=${listelenen?.hastaAdi}, kayitliHasta=${listelenen?.kayitliHasta}`)
kontrol('hasta sayısı artmadı (ikinci dosya açılmadı)', tablo.filter((r) => r.__tablo === 'patients').length === 3, `${tablo.filter((r) => r.__tablo === 'patients').length} hasta`)

// ——— Adım 5: eski yolun sonucu — veri kalitesi sorunu ———
tablo.push({
  __tablo: 'randevular',
  id: QA_RANDEVU_ID,
  doktor_id: QA_DOKTOR_ID,
  patient_id: null,
  hasta_adi_serbest: 'Hasta Iki',
  hasta_telefon_serbest: null,
  hasta_email_serbest: null,
  baslangic: '2026-09-18T09:00:00.000Z',
  bitis: '2026-09-18T09:20:00.000Z',
  tur: 'muayene',
  durum: 'planlandi',
  notlar: null,
  iptal_nedeni: null,
})
const onay = await RANDEVU_PATCH(
  new NextRequest(`http://localhost/api/doktor/randevular/${QA_RANDEVU_ID}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ durum: 'onaylandi' }) }),
  { params: { id: QA_RANDEVU_ID } }
)
await onay.json()
const hastaSayisi = tablo.filter((r) => r.__tablo === 'patients').length
console.log(`\n5. ESKİ yolun sonucu: kayıtsız "Hasta Iki" randevusu onaylandı → hasta sayısı 3 → ${hastaSayisi}`)
kontrol(
  'onay, aynı isim için İKİNCİ bir hasta dosyası açıyor (bilinen veri kalitesi sorunu)',
  hastaSayisi === 4,
  'TC/doğum/cinsiyet BOŞ ikinci kayıt — Dr. Gökhan\'ın "boş TC" gördüğü not tam olarak bu',
)

// ——— Adım 6: sonradan gerçek hastaya bağlama yolu var mı? ———
tablo.push({
  __tablo: 'randevular',
  id: 'kayitsiz-2',
  doktor_id: QA_DOKTOR_ID,
  patient_id: null,
  hasta_adi_serbest: 'Hasta Iki',
  hasta_telefon_serbest: '05001112233',
  baslangic: '2026-09-18T10:00:00.000Z',
  bitis: '2026-09-18T10:20:00.000Z',
  tur: 'muayene',
  durum: 'planlandi',
  iptal_nedeni: null,
})
const bagla = await RANDEVU_PATCH(
  new NextRequest('http://localhost/api/doktor/randevular/kayitsiz-2', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: secilen.id }) }),
  { params: { id: 'kayitsiz-2' } }
)
const baglanan = (await bagla.json()).randevu
console.log(`\n6. Kayıtsız randevu sonradan gerçek hastaya bağlandı (HTTP ${bagla.status})`)
kontrol('randevu → hasta bağlama yolu ÇALIŞIYOR', baglanan?.patient_id === secilen.id, `patient_id=${baglanan?.patient_id}`)
kontrol('bağlanınca serbest metin temizlendi', baglanan?.hasta_adi_serbest === null, `hasta_adi_serbest=${JSON.stringify(baglanan?.hasta_adi_serbest)}`)
console.log('   ⚠️  AÇIK MADDE: randevu bağlanıyor ama Adım 5\'te açılan KOPYA hasta dosyası ortada kalıyor —')
console.log('      iki hasta kaydını (ve notlarını) birleştiren bir ekran yok. docs/OPEN-COMMITMENTS.md\'ye yazıldı.')

console.log(hataVar ? '\n❌ QA BAŞARISIZ\n' : '\n✅ QA GEÇTİ — Türkçe I/i araması artık kayıtlı hastayı buluyor ve randevu gerçek dosyaya bağlanıyor\n')
process.exit(hataVar ? 1 : 0)
