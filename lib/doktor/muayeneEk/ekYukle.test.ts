/** MUAYENE-EKLERI-01 — seans bitişinde ek hazırlama: izolasyon, zarif bozulma, kanıt zinciri (provenance). */
process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-muayene-ek-anahtari'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SahteVeritabani } from '../../security/testing/sahteSupabase'
import { seansEkleriniHazirla, type SahiplikCozucu } from './ekYukle'
import { degerlendirmeYaz } from './saklama'
import { genelSonucu, hataSonucu, labSonucu } from './donustur'
import { atifKontrol, ATIF_DOGRULANAMADI } from './guvence'
import { ekAiMetni, ekPromptBlogu, onayliAsilariNotaCevir } from './rapor'
import { AZAMI_EK } from './tipler'

const sonuc = (ozet = 'Belgede ateş öyküsü yazıyor.') => genelSonucu('diger', { belge_turu: 'Rapor', tarih: null, ozet, onemli_bulgular: ['CRP 12 mg/L'], ilaclar: [], takip: [], okunamayan: [] })

function kur() {
  const db = new SahteVeritabani()
  const sb = db.istemci() as unknown as SupabaseClient
  const A = randomUUID(), p = randomUUID(), s = randomUUID()
  const belgeler = new Map<string, { id: string; visitId: string | null; patientId: string | null; fileName: string }>()
  const sahiplik: SahiplikCozucu = async (id) => belgeler.get(id) ?? null
  const belge = (ov: Partial<{ visitId: string | null; patientId: string | null; fileName: string }> = {}) => {
    const id = randomUUID()
    belgeler.set(id, { id, visitId: s, patientId: p, fileName: 'sonuc.pdf', ...ov })
    return id
  }
  return { db, sb, A, p, s, belge, sahiplik }
}

describe('seansEkleriniHazirla — izolasyon', () => {
  it('başka seansa bağlı belge düşer', async () => {
    const { sb, A, p, s, belge, sahiplik } = kur()
    const iyi = belge(), yabanciSeans = belge({ visitId: randomUUID() })
    const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, { ekler: [{ belgeId: iyi, sonuc: sonuc() }, { belgeId: yabanciSeans, sonuc: sonuc() }] }, sahiplik)
    assert.deepEqual(r.ekler.map((e) => e.belgeId), [iyi])
    assert.equal(r.dusen, 1)
  })
  it('başka hastanın belgesi düşer', async () => {
    const { sb, A, p, s, belge, sahiplik } = kur()
    const yabanciHasta = belge({ patientId: randomUUID() })
    const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, { ekler: [{ belgeId: yabanciHasta, sonuc: sonuc() }] }, sahiplik)
    assert.equal(r.ekler.length, 0)
  })
  it('doktora ait olmayan (çözücünün null döndürdüğü) belge düşer', async () => {
    const { sb, A, p, s, sahiplik } = kur()
    const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, { ekler: [{ belgeId: randomUUID(), sonuc: sonuc() }] }, sahiplik)
    assert.equal(r.ekler.length, 0)
  })
  it('başka doktorun sunucu kaydı kullanılmaz (istemci sonucu şemadan geçer)', async () => {
    const { sb, p, s, belge, sahiplik } = kur()
    const B = randomUUID(), A = randomUUID()
    const id = belge()
    await degerlendirmeYaz(sb, { doktorId: B, patientId: p, sessionId: s, belgeId: id, tur: 'diger', durum: 'tamam', sonuc: sonuc('B doktorunun yorumu') })
    const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, { ekler: [{ belgeId: id, sonuc: sonuc('A kendi sonucu') }] }, sahiplik)
    assert.match(r.ekler[0].sonuc.ozet, /A kendi sonucu/)
  })
  it('asiOnay yalnız kabul edilmiş eklere ait olabilir', async () => {
    const { sb, A, p, s, belge, sahiplik } = kur()
    const iyi = belge()
    const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, {
      ekler: [{ belgeId: iyi, sonuc: sonuc() }],
      asiOnay: [{ belgeId: iyi, satirlar: [{ asiAdi: 'KKK', kaynakTuru: 'bu_muayene' }] }, { belgeId: randomUUID(), satirlar: [{ asiAdi: 'BCG', kaynakTuru: 'bu_muayene' }] }],
    }, sahiplik)
    assert.equal(r.asiOnaylari.length, 1)
    assert.equal(r.asiOnaylari[0].belgeId, iyi)
  })
})

describe('seansEkleriniHazirla — zarif bozulma', () => {
  it('yük yok / bozuk / hastasız → boş, fırlatmaz', async () => {
    const { sb, A, p, s, sahiplik } = kur()
    for (const yuk of [undefined, null, {}, { ekler: 'x' }, { ekler: [] }, { ekler: [null, 5, { belgeId: 7 }, { belgeId: 'zz' }] }]) {
      const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, yuk as never, sahiplik)
      assert.equal(r.ekler.length, 0)
    }
    const r2 = await seansEkleriniHazirla(sb, A, { id: s, patient_id: null }, { ekler: [{ belgeId: randomUUID(), sonuc: sonuc() }] }, sahiplik)
    assert.equal(r2.ekler.length, 0)
  })
  it('çözücü fırlatsa bile not üretimi engellenmez', async () => {
    const { sb, A, p, s } = kur()
    const patlayan: SahiplikCozucu = async () => { throw new Error('vault çöktü') }
    const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, { ekler: [{ belgeId: randomUUID(), sonuc: sonuc() }] }, patlayan)
    assert.deepEqual(r.ekler, [])
  })
  it('şemaya uymayan istemci sonucu düşer; geçerli olan kalır', async () => {
    const { sb, A, p, s, belge, sahiplik } = kur()
    const kotu = belge(), iyi = belge()
    const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, { ekler: [{ belgeId: kotu, sonuc: { tur: 'yok', durum: 'tamam' } }, { belgeId: iyi, sonuc: sonuc() }] }, sahiplik)
    assert.deepEqual(r.ekler.map((e) => e.belgeId), [iyi])
  })
  it('değerlendirilemedi (hata) eki rapora "değerlendirilemedi" olarak girer — sessizce düşmez', async () => {
    const { sb, A, p, s, belge, sahiplik } = kur()
    const id = belge()
    const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, { ekler: [{ belgeId: id, sonuc: hataSonucu('lab', 'Servis yanıt vermedi') }] }, sahiplik)
    assert.equal(r.ekler.length, 1)
    assert.equal(r.ekler[0].sonuc.durum, 'hata')
    assert.match(ekPromptBlogu(r.ekler), /\[EK-1\][^\n]*değerlendirilemedi/)
  })
  it('tekrarlı belge bir kez, en fazla AZAMI_EK adet', async () => {
    const { sb, A, p, s, belge, sahiplik } = kur()
    const a = belge()
    const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, { ekler: [{ belgeId: a, sonuc: sonuc() }, { belgeId: a, sonuc: sonuc() }] }, sahiplik)
    assert.equal(r.ekler.length, 1)
    const cok = Array.from({ length: AZAMI_EK + 5 }, () => ({ belgeId: belge(), sonuc: sonuc() }))
    assert.equal((await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, { ekler: cok }, sahiplik)).ekler.length, AZAMI_EK)
  })
})

describe('kanıt zinciri (provenance) uçtan uca', () => {
  it('etiketler sırayla verilir; ai_degerlendirme bloğu dosya adı + [EK-n.m] içerir, prompt bloğu dosya adı içermez', async () => {
    const { sb, A, p, s, belge, sahiplik } = kur()
    const b1 = belge({ fileName: 'ahmet_yilmaz_tahlil.pdf' }), b2 = belge({ fileName: 'rapor2.pdf' })
    const r = await seansEkleriniHazirla(sb, A, { id: s, patient_id: p }, { ekler: [{ belgeId: b1, sonuc: sonuc() }, { belgeId: b2, sonuc: sonuc('İkinci belge') }] }, sahiplik)
    assert.deepEqual(r.ekler.map((e) => e.etiket), ['EK-1', 'EK-2'])
    assert.ok(r.ekler[0].sonuc.bulgular.every((b) => b.id.startsWith('EK-1.')))
    const ai = ekAiMetni(r.ekler)
    assert.match(ai, /ahmet_yilmaz_tahlil\.pdf/)
    assert.match(ai, /doktorun sözü değildir/)
    assert.ok(!ekPromptBlogu(r.ekler).includes('ahmet_yilmaz'), 'kimlik içerebilen dosya adı modele gitmemeli')
  })
  it('SOAP’ta ekte olmayan değer atfı işaretlenir; bilinmeyen etiket silinir; doğru atıf korunur', () => {
    const lab = labSonucu({ satirlar: [], rapor: null, labAdi: null, numuneTarihi: null, kimlikUyarisi: null })
    const ekler = [{ etiket: 'EK-1', sonuc: { ...lab, izinliSayilar: ['12'] } }]
    const dogru = atifKontrol('CRP 12 mg/L bulundu [EK-1].', ekler as never)
    assert.match(dogru.metin, /\[EK-1\]/)
    assert.ok(!dogru.metin.includes(ATIF_DOGRULANAMADI))
    const uydurma = atifKontrol('CRP 99 mg/L bulundu [EK-1].', ekler as never)
    assert.match(uydurma.metin, /doğrulanamadı/)
    const yok = atifKontrol('Bulgu var [EK-7].', ekler as never)
    assert.ok(!yok.metin.includes('[EK-7]'))
  })
  it('aşı: yalnız hekim onaylı ve bu_muayene satırları nota geçer; karne satırı geçmez', () => {
    const n = onayliAsilariNotaCevir([{ belgeId: 'x', satirlar: [
      { asiAdi: 'Hexaxim', dozNo: 2, kaynakTuru: 'bu_muayene' }, { asiAdi: 'BCG', dozNo: 1, kaynakTuru: 'karne' },
    ] }], '2026-10-16')
    assert.equal(n.length, 1)
    assert.match(n[0].asi_adi, /Karma aşı/) // mevcut notAsilari normalizasyonu marka adını kanonik ada çevirir; karne (BCG) satırı yok
    assert.equal(n[0].uygulama_tarihi, '2026-10-16')
    assert.deepEqual(onayliAsilariNotaCevir(undefined, '2026-10-16'), [])
  })
})
