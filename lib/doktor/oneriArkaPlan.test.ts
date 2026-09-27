/**
 * NOTYA-NOT-HIZ-03 — Ayşe'nin önerisi nota arka planda yazılır: yalnız o not (id + doktor), yalnız hâlâ boş sütunlar;
 * ai_degerlendirme'ye (çek listesi bloğu korunarak) eklenir; B düşerse sütunlar boş kalır ve log yalnız hata sınıfıdır.
 * In-memory Supabase, no network. Synthetic QA data only.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { oneriyiArkaPlandaYaz, oneriyiNotaYaz } from './oneriArkaPlan'
import type { SoapOnerisi } from './soapUret'

const ONERI: SoapOnerisi = {
  aiDegerlendirme: 'Öneri (doktor onayına tabi): astım ayırıcı tanıda düşünülebilir.',
  receteOnerisi: [{ etkenMadde: 'Salbutamol', ticariOrnek: 'Ventolin', sgkListesinde: true }],
  kritik_bulgular: ['Solunum sıkıntısı'],
  alarmBulgulari: ['Şu durumlarda doktorunuz ile temas kurun: nefes darlığı.'],
  hasta_ozeti: 'Akut bronşit saptandı; 1 hafta sonra kontrol.',
}
const CEK = 'Çek listesi doğrulaması:\n- Kulak muayenesi: ✓'

let db: SahteVeritabani
let doktor: string
let baska: string
let not: string
beforeEach(() => {
  db = new SahteVeritabani()
  doktor = randomUUID()
  baska = randomUUID()
  not = db.ekle('notes', { doctor_id: doktor, content_plan: '1. Bol sıvı', ai_degerlendirme: CEK, hasta_ozeti: null, alarm_bulgulari: null, recete_onerisi: null, kritik_bulgular: null }).id
})
const satir = (id = not) => db.tablo('notes').find((x) => x.id === id)!

describe('oneriyiNotaYaz', () => {
  it('boş öneri sütunlarını doldurur; ai_degerlendirme çek bloğunun ardına eklenir; gövdeye dokunmaz', async () => {
    const yazilan = await oneriyiNotaYaz(db.istemci() as never, { noteId: not, doktorId: doktor, oneri: ONERI })
    assert.deepEqual(yazilan.sort(), ['ai_degerlendirme', 'alarm_bulgulari', 'hasta_ozeti', 'kritik_bulgular', 'recete_onerisi'])
    const s = satir()
    assert.equal(s.hasta_ozeti, ONERI.hasta_ozeti)
    assert.deepEqual(s.alarm_bulgulari, ONERI.alarmBulgulari)
    assert.deepEqual(s.recete_onerisi, ONERI.receteOnerisi)
    assert.deepEqual(s.kritik_bulgular, ONERI.kritik_bulgular)
    assert.equal(s.ai_degerlendirme, `${CEK}\n\n${ONERI.aiDegerlendirme}`)
    assert.equal(s.content_plan, '1. Bol sıvı')
  })

  it('HASTA-IZOLASYON-01: başka doktorun kimliğiyle hiçbir şey yazılmaz', async () => {
    const yazilan = await oneriyiNotaYaz(db.istemci() as never, { noteId: not, doktorId: baska, oneri: ONERI })
    assert.deepEqual(yazilan, [])
    const s = satir()
    assert.equal(s.hasta_ozeti, null)
    assert.equal(s.ai_degerlendirme, CEK)
  })

  it('hekimin doldurduğu / onayda değiştirdiği sütun ezilmez', async () => {
    const s0 = satir()
    s0.hasta_ozeti = 'Hekimin kendi özeti'
    s0.alarm_bulgulari = []
    const yazilan = await oneriyiNotaYaz(db.istemci() as never, { noteId: not, doktorId: doktor, oneri: ONERI })
    assert.ok(!yazilan.includes('hasta_ozeti') && !yazilan.includes('alarm_bulgulari'))
    assert.equal(satir().hasta_ozeti, 'Hekimin kendi özeti')
    assert.deepEqual(satir().alarm_bulgulari, [])
    assert.deepEqual(satir().recete_onerisi, ONERI.receteOnerisi)
  })

  it('ai_degerlendirme boşsa öneri metni tek başına yazılır; aiMetni (çek bloğu sil) uygulanır', async () => {
    satir().ai_degerlendirme = null
    await oneriyiNotaYaz(db.istemci() as never, { noteId: not, doktorId: doktor, oneri: { aiDegerlendirme: 'Öneri: X\nBLOK' }, aiMetni: (a) => a.replace('\nBLOK', '') })
    assert.equal(satir().ai_degerlendirme, 'Öneri: X')
  })

  it('boş öneri alanları yazılmaz', async () => {
    const yazilan = await oneriyiNotaYaz(db.istemci() as never, { noteId: not, doktorId: doktor, oneri: { receteOnerisi: [], hasta_ozeti: '  ', aiDegerlendirme: '' } })
    assert.deepEqual(yazilan, [])
    assert.equal(satir().recete_onerisi, null)
  })
})

describe('oneriyiArkaPlandaYaz', () => {
  it('söz çözülene kadar not dokunulmaz; çözülünce yazılır', async () => {
    let coz!: (o: SoapOnerisi | null) => void
    const soz = new Promise<SoapOnerisi | null>((r) => { coz = r })
    const is = oneriyiArkaPlandaYaz(db.istemci() as never, { noteId: not, doktorId: doktor, oneriSozu: soz, etiket: 'test' })
    await new Promise((r) => setTimeout(r, 5))
    assert.equal(satir().hasta_ozeti, null)
    coz(ONERI)
    await is
    assert.equal(satir().hasta_ozeti, ONERI.hasta_ozeti)
  })

  it('öneri null (B düştü) → sütunlar boş kalır, fırlatmaz', async () => {
    await oneriyiArkaPlandaYaz(db.istemci() as never, { noteId: not, doktorId: doktor, oneriSozu: Promise.resolve(null), etiket: 'test' })
    assert.equal(satir().hasta_ozeti, null)
    assert.equal(satir().ai_degerlendirme, CEK)
  })

  it('yazma hatası fırlatmaz; log yalnız hata sınıfı taşır (öneri metni yok)', async () => {
    const loglar: string[] = []
    const orijinal = console.error
    console.error = (...a: unknown[]) => { loglar.push(a.map(String).join(' ')) }
    try {
      const bozuk = { from: () => { throw Object.assign(new Error(`bağlantı: ${ONERI.hasta_ozeti}`), { name: 'FetchError' }) } }
      await oneriyiArkaPlandaYaz(bozuk as never, { noteId: not, doktorId: doktor, oneriSozu: Promise.resolve(ONERI), etiket: 'test' })
    } finally { console.error = orijinal }
    assert.equal(loglar.length, 1)
    assert.match(loglar[0], /\[test\] öneri nota yazılamadı: FetchError/)
    assert.ok(!loglar[0].includes('bronşit'))
  })
})
