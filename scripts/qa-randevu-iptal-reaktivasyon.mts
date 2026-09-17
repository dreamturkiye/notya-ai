#!/usr/bin/env npx tsx
/**
 * NOTYA-RANDEVU-14 — Dr. Gökhan'ın 2026-09-17'de canlıda bildirdiği akışın birebir tekrarı.
 *
 * GERÇEK `PATCH /api/doktor/randevular/[id]` route handler'ını çalıştırır; yalnız oturum ve
 * Supabase istemcisi sahte (bellek içi tablo). Kullanılan doktor/hasta TAMAMEN SENTETİKTİR —
 * Dr. Gökhan'ın hesabına, gerçek hastalara veya production veritabanına DOKUNMAZ, PHI içermez.
 *
 *   npx --yes tsx --experimental-test-module-mocks scripts/qa-randevu-iptal-reaktivasyon.mts
 *
 * Adımlar (Dr. Gökhan'ın anlattığı sıra):
 *   1. Randevu oluştur   → takvimde normal
 *   2. İptal et          → takvimde ÜSTÜ ÇİZİLİ (doğru)
 *   3. Tekrar aç, saati değiştir, Güncelle → durum ne oldu?
 *   4. "Aktif Hale Getir" → durum ne oldu?
 *   5. İptalden sonra slot başkasına verilmişse reaktivasyon ne yapar?
 */
import { mock } from 'node:test'

const QA_DOKTOR_ID = '00000000-0000-4000-8000-00000000qa01'.replace('qa', 'aa')
const QA_KULLANICI_ID = QA_DOKTOR_ID
const QA_RANDEVU_ID = '00000000-0000-4000-8000-0000000000r1'.replace('r', 'b')
const QA_RAKIP_ID = '00000000-0000-4000-8000-0000000000r2'.replace('r', 'b')

interface Satir { [k: string]: any }

/** Bellek içi `randevular` tablosu — sentetik QA verisi. */
let tablo: Satir[] = []

/** Route handler'ın kullandığı zincir: .from().select().eq().neq().lt().gt().limit()/.maybeSingle() */
function sorguKurucu(tabloAdi: string) {
  let kayitlar = () => tablo.filter((r) => r.__tablo === tabloAdi)
  const kosullar: ((r: Satir) => boolean)[] = []
  let guncellemeGovdesi: Satir | null = null
  let silme = false

  const uygula = () => kayitlar().filter((r) => kosullar.every((k) => k(r)))

  const calistir = () => {
    const hedef = uygula()
    if (guncellemeGovdesi) for (const r of hedef) Object.assign(r, guncellemeGovdesi)
    if (silme) tablo = tablo.filter((r) => !hedef.includes(r))
    return hedef
  }

  const api: any = {
    select: () => api,
    insert: (govde: Satir) => { tablo.push({ __tablo: tabloAdi, ...govde }); return api },
    update: (govde: Satir) => { guncellemeGovdesi = govde; return api },
    delete: () => { silme = true; return api },
    eq: (alan: string, deger: any) => { kosullar.push((r) => r[alan] === deger); return api },
    neq: (alan: string, deger: any) => { kosullar.push((r) => r[alan] !== deger); return api },
    lt: (alan: string, deger: any) => { kosullar.push((r) => r[alan] < deger); return api },
    gt: (alan: string, deger: any) => { kosullar.push((r) => r[alan] > deger); return api },
    order: () => api,
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
    pratikOturum: async () => ({
      supabase: sahteSupabase,
      doktorId: QA_DOKTOR_ID,
      rol: 'doktor',
      user: { id: QA_KULLANICI_ID },
    }),
  },
})

const { PATCH } = await import('../app/api/doktor/randevular/[id]/route')
const { NextRequest } = await import('next/server')

async function patch(id: string, govde: Record<string, unknown>) {
  const req = new NextRequest(`http://localhost/api/doktor/randevular/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(govde),
  })
  const yanit = await PATCH(req, { params: { id } })
  return { durum: yanit.status, govde: await yanit.json() }
}

const randevu = () => tablo.find((r) => r.id === QA_RANDEVU_ID)!

/** Takvimin o randevuyu nasıl çizdiği — page.tsx'teki kural: durum === 'iptal' → üstü çizili. */
const takvimGorunumu = () => (randevu().durum === 'iptal' ? 'ÜSTÜ ÇİZİLİ (iptal)' : `normal (${randevu().durum})`)

let hataVar = false
function kontrol(baslik: string, kosul: boolean, ayrinti: string) {
  console.log(`   ${kosul ? '✅' : '❌'} ${baslik} — ${ayrinti}`)
  if (!kosul) hataVar = true
}

// ——— Adım 1: sentetik randevu ———
tablo = [{
  __tablo: 'randevular',
  id: QA_RANDEVU_ID,
  doktor_id: QA_DOKTOR_ID,
  patient_id: null,
  hasta_adi_serbest: 'QA Sentetik Hasta',
  hasta_telefon_serbest: null,
  hasta_email_serbest: null,
  baslangic: '2026-09-18T07:00:00.000Z',
  bitis: '2026-09-18T07:20:00.000Z',
  tur: 'muayene',
  durum: 'planlandi',
  notlar: null,
  iptal_nedeni: null,
  hatirlatma_gonderildi: true,
}]
console.log('\n1. Randevu oluşturuldu (sentetik QA hastası) →', takvimGorunumu())

// ——— Adım 2: iptal ———
await patch(QA_RANDEVU_ID, { durum: 'iptal', iptalNedeni: 'QA testi' })
console.log('2. İptal edildi →', takvimGorunumu())
kontrol('iptal kaydedildi', randevu().durum === 'iptal', `durum=${randevu().durum}, neden=${randevu().iptal_nedeni}`)

// ——— Adım 3: tekrar aç, saati değiştir, Güncelle (Dr. Gökhan'ın yaptığı) ———
const kaydet = await patch(QA_RANDEVU_ID, {
  baslangic: '2026-09-18T08:00:00.000Z',
  bitis: '2026-09-18T08:20:00.000Z',
  tur: 'muayene',
  notlar: null,
  hastaAdiSerbest: 'QA Sentetik Hasta',
})
console.log('3. Saat 10:00→11:00 (TRT) değiştirilip Güncelle →', takvimGorunumu(), `(HTTP ${kaydet.durum})`)
kontrol('saat gerçekten değişti', randevu().baslangic === '2026-09-18T08:00:00.000Z', randevu().baslangic)
kontrol(
  'durum HÂLÂ iptal (bayat arayüz değil, verinin gerçeği)',
  randevu().durum === 'iptal',
  'saat düzenlemesi durumu sessizce değiştirmemeli — geri alma açık bir aksiyon olmalı'
)

// ——— Adım 4: reaktivasyon (düzeltmeden önce HİÇ YOKTU) ———
const geri = await patch(QA_RANDEVU_ID, { durum: 'planlandi' })
console.log('4. "Aktif Hale Getir" →', takvimGorunumu(), `(HTTP ${geri.durum})`)
kontrol('randevu yeniden aktif', randevu().durum === 'planlandi', `durum=${randevu().durum}`)
kontrol('iptal nedeni temizlendi', randevu().iptal_nedeni === null, `iptal_nedeni=${randevu().iptal_nedeni}`)
kontrol('hatırlatma yeniden gönderilebilir', randevu().hatirlatma_gonderildi === false, `hatirlatma_gonderildi=${randevu().hatirlatma_gonderildi}`)
kontrol('yanıt reaktivasyonu bildiriyor', geri.govde.reaktivasyon === true, `reaktivasyon=${geri.govde.reaktivasyon}`)

// ——— Adım 5: iptalden sonra slot başkasına verilmişse ———
await patch(QA_RANDEVU_ID, { durum: 'iptal', iptalNedeni: 'QA testi 2' })
tablo.push({
  __tablo: 'randevular',
  id: QA_RAKIP_ID,
  doktor_id: QA_DOKTOR_ID,
  patient_id: null,
  hasta_adi_serbest: 'QA Sentetik Hasta 2',
  baslangic: '2026-09-18T08:00:00.000Z',
  bitis: '2026-09-18T08:20:00.000Z',
  tur: 'muayene',
  durum: 'onaylandi',
  iptal_nedeni: null,
  hatirlatma_gonderildi: false,
})
const cakisma = await patch(QA_RANDEVU_ID, { durum: 'planlandi' })
console.log(`5. Slot başkasına verildikten sonra "Aktif Hale Getir" → HTTP ${cakisma.durum}`)
kontrol('çift kayıt engellendi', cakisma.durum === 409, cakisma.govde.error)
kontrol('randevu iptal kaldı', randevu().durum === 'iptal', `durum=${randevu().durum}`)

// İptal durumundaki randevunun saatini boş bir saate çekip sonra aktif etmek çalışmalı.
await patch(QA_RANDEVU_ID, { baslangic: '2026-09-18T09:00:00.000Z', bitis: '2026-09-18T09:20:00.000Z' })
const sonuc = await patch(QA_RANDEVU_ID, { durum: 'planlandi' })
console.log('6. Boş saate taşıyıp "Aktif Hale Getir" →', takvimGorunumu(), `(HTTP ${sonuc.durum})`)
kontrol('boş saatte reaktivasyon çalışıyor', randevu().durum === 'planlandi', `durum=${randevu().durum}`)

console.log(hataVar ? '\n❌ QA BAŞARISIZ\n' : '\n✅ QA GEÇTİ — Dr. Gökhan senaryosu baştan sona doğru\n')
process.exit(hataVar ? 1 : 0)
