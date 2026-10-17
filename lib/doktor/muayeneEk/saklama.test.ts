/** MUAYENE-EKLERI-01 — saklama: tablo yokken sessiz düşüş, doktor izolasyonu, şifreli sonuç. */
process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-muayene-ek-anahtari'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SahteVeritabani } from '../../security/testing/sahteSupabase'
import { degerlendirmeOku, degerlendirmeYaz, notaBagla, ogrenmeKaydet, ogrenmeYukle, seansDegerlendirmeleri, tabloYokMu } from './saklama'
import { genelSonucu } from './donustur'

/** Tabloları olmayan veritabanı: her sorgu 42P01 döner. */
function tablosuzIstemci(): SupabaseClient {
  const hata = { code: '42P01', message: 'relation "muayene_ek_degerlendirmeleri" does not exist' }
  const zincir: unknown = new Proxy(function () { /* */ }, {
    get(_t, ad) {
      if (ad === 'then') return (res: (v: unknown) => void) => res({ data: null, error: hata })
      return () => zincir
    },
    apply() { return zincir },
  })
  return { from: () => zincir } as unknown as SupabaseClient
}

const sonuc = () => genelSonucu('diger', { belge_turu: 'Rapor', tarih: null, ozet: 'Belgede hafif bulgu yazıyor.', onemli_bulgular: [], ilaclar: [], takip: [], okunamayan: [] })

describe('saklama — tablo yok (migration 171 uygulanmadı)', () => {
  const sb = tablosuzIstemci()
  it('hiçbir çağrı fırlatmaz; okuma boş, yazma false', async () => {
    const d = randomUUID(), p = randomUUID(), s = randomUUID(), b = randomUUID()
    assert.equal(await degerlendirmeOku(sb, d, b), null)
    assert.deepEqual(await seansDegerlendirmeleri(sb, d, s), [])
    assert.equal(await degerlendirmeYaz(sb, { doktorId: d, patientId: p, sessionId: s, belgeId: b, tur: 'lab', durum: 'tamam', sonuc: sonuc() }), false)
    assert.deepEqual(await ogrenmeYukle(sb, d, 'pediatri'), [])
    await notaBagla(sb, d, s, randomUUID())
  })
  it('tabloYokMu yaygın hata kodlarını tanır', () => {
    assert.equal(tabloYokMu({ code: '42P01' }), true)
    assert.equal(tabloYokMu({ code: 'PGRST205' }), true)
    assert.equal(tabloYokMu({ message: 'Could not find the table' }), true)
    assert.equal(tabloYokMu({ code: '23505', message: 'duplicate' }), false)
    assert.equal(tabloYokMu(null), false)
  })
})

describe('saklama — tablo var', () => {
  function kur() {
    const db = new SahteVeritabani()
    return { db, sb: db.istemci() as unknown as SupabaseClient, A: randomUUID(), B: randomUUID(), p: randomUUID(), s: randomUUID(), belge: randomUUID() }
  }
  it('yaz → oku gidiş-dönüş; sonuç şifreli saklanır, düz metin satırda yok', async () => {
    const { db, sb, A, p, s, belge } = kur()
    assert.equal(await degerlendirmeYaz(sb, { doktorId: A, patientId: p, sessionId: s, belgeId: belge, tur: 'diger', durum: 'tamam', girdiHash: 'h1', sonuc: sonuc() }), true)
    const ham = JSON.stringify(db.tablo('muayene_ek_degerlendirmeleri'))
    assert.ok(!ham.includes('hafif bulgu'), 'klinik metin düz saklanmamalı')
    const oku = await degerlendirmeOku(sb, A, belge)
    assert.equal(oku?.durum, 'tamam')
    assert.equal(oku?.girdiHash, 'h1')
    assert.match(oku?.sonuc?.ozet || '', /hafif bulgu/)
  })
  it('aynı belge ikinci yazımda güncellenir (tek satır)', async () => {
    const { db, sb, A, p, s, belge } = kur()
    await degerlendirmeYaz(sb, { doktorId: A, patientId: p, sessionId: s, belgeId: belge, tur: 'lab', durum: 'bekliyor' })
    await degerlendirmeYaz(sb, { doktorId: A, patientId: p, sessionId: s, belgeId: belge, tur: 'diger', durum: 'tamam', sonuc: sonuc() })
    assert.equal(db.tablo('muayene_ek_degerlendirmeleri').length, 1)
    assert.equal((await degerlendirmeOku(sb, A, belge))?.tur, 'diger')
  })
  it('İZOLASYON: B doktoru A doktorunun değerlendirmesini ne okur ne seans listesinde görür', async () => {
    const { sb, A, B, p, s, belge } = kur()
    await degerlendirmeYaz(sb, { doktorId: A, patientId: p, sessionId: s, belgeId: belge, tur: 'diger', durum: 'tamam', sonuc: sonuc() })
    assert.equal(await degerlendirmeOku(sb, B, belge), null)
    assert.deepEqual(await seansDegerlendirmeleri(sb, B, s), [])
    assert.equal((await seansDegerlendirmeleri(sb, A, s)).length, 1)
  })
  it('notaBagla yalnız çağıran doktorun satırlarına not kimliği yazar', async () => {
    const { sb, A, B, p, s, belge } = kur()
    await degerlendirmeYaz(sb, { doktorId: A, patientId: p, sessionId: s, belgeId: belge, tur: 'diger', durum: 'tamam', sonuc: sonuc() })
    const not = randomUUID()
    await notaBagla(sb, B, s, not)
    assert.equal((await degerlendirmeOku(sb, A, belge))?.noteId, null)
    await notaBagla(sb, A, s, not)
    assert.equal((await degerlendirmeOku(sb, A, belge))?.noteId, not)
  })
  it('öğrenme kayıtları doktor + branş bazlı ayrışır', async () => {
    const { sb, A, B } = kur()
    const art = [{ ozellik: 'ad:hemogram', tur: 'lab' as const, onayEk: 1, duzeltmeEk: 0 }]
    await ogrenmeKaydet(sb, A, 'pediatri', art)
    assert.ok((await ogrenmeYukle(sb, A, 'pediatri')).length >= 1)
    assert.equal((await ogrenmeYukle(sb, B, 'pediatri')).length, 0)
    assert.equal((await ogrenmeYukle(sb, A, 'kardiyoloji')).length, 0)
  })
})
