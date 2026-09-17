#!/usr/bin/env npx tsx
/**
 * NOTYA-MUAYENEYE-DON-01 — Dr. Gökhan'ın 2026-09-17'de canlıda bildirdiği akışın tekrarı:
 * "M-CHAT-R/F'i puanlayıp 'Bugünkü Muayene Formuna Ekle' dedim, yeşil onay çıktı — ama oradan
 * muayene formuna dönecek bir bağlantı yok."
 *
 * GERÇEK route handler'larını çalıştırır; yalnız oturum ve Supabase istemcisi sahtedir
 * (bellek içi tablolar). Kullanılan doktor/hasta TAMAMEN SENTETİKTİR — Dr. Gökhan'ın hesabına,
 * gerçek hastalara veya production veritabanına DOKUNMAZ, PHI içermez.
 *
 *   npx --yes tsx --experimental-test-module-mocks scripts/qa-muayene-formuna-don.mts
 *
 * Doğrulananlar:
 *   1. M-CHAT-R/F → bugünkü muayene formuna eklendi → dönüş bağlantısı ÇIKIYOR ve
 *      tam olarak satırın yazıldığı notun formuna gidiyor (genel not listesine değil).
 *   2. Bugün muayene yoksa → onay yok, bağlantı da YOK (hekim boş forma gönderilmez).
 *   3. İkinci tüketici (dahiliye taraması "Nota ekle", ayrı/forked onay arayüzü) → aynı bağlantı.
 */
import { mock } from 'node:test'

const QA_DOKTOR = 'aaaaaaaa-0000-4000-8000-00000000d001'
const QA_HASTA = 'aaaaaaaa-0000-4000-8000-00000000p001'
const QA_SEANS = 'aaaaaaaa-0000-4000-8000-00000000s001'
const QA_NOT = 'aaaaaaaa-0000-4000-8000-00000000n001'

interface Satir { [k: string]: any }
let tablo: Satir[] = []

/** Sadece bu betiğin ihtiyaç duyduğu Supabase zinciri. */
function sorguKurucu(tabloAdi: string) {
  const kosullar: ((r: Satir) => boolean)[] = []
  let govde: Satir | null = null
  let sinir: number | null = null
  let eklenen: Satir[] = []

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
    eq: (a: string, d: any) => { kosullar.push((r) => r[a] === d); return api },
    in: (a: string, d: any[]) => { kosullar.push((r) => d.includes(r[a])); return api },
    gte: (a: string, d: any) => { kosullar.push((r) => String(r[a]) >= String(d)); return api },
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
const sahteSupabase: any = { from: (t: string) => sorguKurucu(t) }

mock.module('@/lib/doktor/pratikOturum', {
  namedExports: {
    pratikOturum: async () => ({ supabase: sahteSupabase, doktorId: QA_DOKTOR, rol: 'doktor', user: { id: QA_DOKTOR } }),
    sadeceDoktor: () => null,
  },
})

const { POST: MCHAT_POST } = await import('../app/api/doktor/mchat/route')
const { wow4Post } = await import('../app/api/doktor/dahiliye/_wow4')
const { MCHAT_R_SORULARI, MCHAT_TERS_MADDELER } = await import('../lib/clinical/mchatR')
// Arayüzün bağlantıyı nasıl kurduğunun ta kendisi — kopyası değil.
const { eklenenNotId, muayeneFormuYolu } = await import('../lib/doktor/muayeneFormuYolu')
const { NextRequest } = await import('next/server')

let hataVar = false
function kontrol(baslik: string, kosul: boolean, ayrinti: string) {
  console.log(`   ${kosul ? '✅' : '❌'} ${baslik} — ${ayrinti}`)
  if (!kosul) hataVar = true
}

/** Bugünkü muayene + boş notu olan sentetik hasta. */
function sahneyiKur(bugunMuayeneVar: boolean) {
  tablo = []
  if (!bugunMuayeneVar) return
  tablo.push({ __tablo: 'sessions', id: QA_SEANS, doctor_id: QA_DOKTOR, patient_id: QA_HASTA, created_at: new Date().toISOString() })
  tablo.push({ __tablo: 'notes', id: QA_NOT, session_id: QA_SEANS, doctor_id: QA_DOKTOR, created_at: new Date().toISOString(), content_degerlendirme: 'Ön tanı: sağlam çocuk izlemi.', content_subjektif: '', content_objektif: '' })
}
const notu = () => tablo.find((r) => r.__tablo === 'notes' && r.id === QA_NOT)

/** "Otizm özelliği yok" çıkacak şekilde: 20 sorunun tamamı normal yanıt. */
async function mchatCalistir() {
  const cevaplar: Record<string, boolean> = {}
  // Hepsi normal yanıt → 0/20 "Otizm özelliği yok" (Dr. Gökhan'ın gördüğü sonuç).
  // Ters puanlanan 2, 5, 12'de normal yanıt HAYIR; diğer 17 maddede EVET.
  for (const s of MCHAT_R_SORULARI) cevaplar[String(s.no)] = !MCHAT_TERS_MADDELER.has(s.no)
  const req = new NextRequest('http://localhost/api/doktor/mchat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId: QA_HASTA, cevaplar, muayeneFormunaEkle: true }),
  })
  const y = await MCHAT_POST(req)
  return { durum: y.status, govde: await y.json() as any }
}

console.log('\n=== 1. Dr. Gökhan senaryosu: M-CHAT-R/F → Bugünkü Muayene Formuna Ekle ===')
sahneyiKur(true)
const m = await mchatCalistir()
console.log(`   HTTP ${m.durum} · sonuç: "${m.govde.sonucMetni}" · ${m.govde.toplamPuan}/20 (${m.govde.riskEtiket})`)
kontrol('not bugünkü muayene formuna eklendi', m.govde.notEkleme?.eklendi === true, `sebep=${m.govde.notEkleme?.sebep ?? '—'}`)
kontrol('M-CHAT satırı notun Değerlendirme bölümüne yazıldı', String(notu()?.content_degerlendirme || '').includes('M-CHAT-R/F'), String(notu()?.content_degerlendirme || '').split('\n').pop() || '')
kontrol('önceki not içeriği korundu', String(notu()?.content_degerlendirme || '').includes('sağlam çocuk izlemi'), 'üzerine yazılmadı')

const bag = eklenenNotId(m.govde)
kontrol('"Muayene Formuna Dön" bağlantısı çıkıyor', bag !== null, `notId=${bag}`)
kontrol('bağlantı TAM OLARAK sonucun eklendiği nota gidiyor (genel listeye değil)', bag === QA_NOT, `${bag} === ${QA_NOT}`)
kontrol('bağlantı hedefi hekimin düzenleyebildiği muayene formu', bag ? muayeneFormuYolu(bag) === `/dashboard/doktor/notlar/${QA_NOT}` : false, bag ? muayeneFormuYolu(bag) : '—')

console.log('\n=== 2. Bugün muayene yokken: onay da bağlantı da olmamalı ===')
sahneyiKur(false)
const m2 = await mchatCalistir()
kontrol('nota eklenemedi (beklenen)', m2.govde.notEkleme?.eklendi === false, m2.govde.notEkleme?.sebep || '—')
kontrol('ölü bağlantı gösterilmiyor', eklenenNotId(m2.govde) === null, 'notId=null → <MuayeneFormunaDon> hiç çizilmez')

console.log('\n=== 3. İkinci tüketici: dahiliye taraması "Nota ekle" (ayrı/forked onay arayüzü) ===')
sahneyiKur(true)
tablo.push({ __tablo: 'dahiliye_taramalar', id: 'qa-tarama-1', patient_id: QA_HASTA, doctor_id: QA_DOKTOR, tip: 'phq2', not_metni: 'PHQ-2 1/6: tarama negatif', created_at: new Date().toISOString(), nota_eklendi_at: null })
const y4 = await wow4Post('notaekle', { tip: 'phq2' }, sahteSupabase, QA_DOKTOR, { id: QA_HASTA, yas: 70, kadin: false })
const g4 = await y4!.json() as any
console.log(`   HTTP ${y4!.status} · yanıt: ${JSON.stringify(g4)}`)
kontrol('tarama sonucu nota eklendi', g4.ok === true, `ok=${g4.ok}`)
kontrol('bu akış da notId döndürüyor', typeof g4.notId === 'string', `notId=${g4.notId}`)
const bag4 = eklenenNotId(g4)
kontrol('aynı "Muayene Formuna Dön" bağlantısı burada da çıkıyor', bag4 === QA_NOT, `${bag4} === ${QA_NOT}`)
kontrol('dahiliye satırı da aynı muayene formuna yazıldı', String(notu()?.content_degerlendirme || '').includes('PHQ-2'), String(notu()?.content_degerlendirme || '').split('\n').pop() || '')

console.log(hataVar ? '\n❌ QA BAŞARISIZ\n' : '\n✅ QA GEÇTİ — onaydan muayene formuna dönüş her iki tüketicide de doğru\n')
process.exit(hataVar ? 1 : 0)
