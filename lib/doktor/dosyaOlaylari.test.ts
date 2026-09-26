/**
 * NOTYA-AYSE-STANDART-01 + HASTA-IZOLASYON-01 — olay dizininin okumaları doktora kapsanır.
 *
 * Sahte veritabanı (lib/security/testing/sahteSupabase.ts, bilmediği filtrede hata fırlatır) üzerinde: A doktoru B'nin
 * hastasını derleyemez (null); A'nın hastasının altına B'nin bıraktığı kirli satırlar (aşı, lab, not) A'nın olay
 * dizinine girmez; onaysız not plan kaynağı değildir; arşivlenmiş muayene görünmez (NOTYA-ARSIV-01). Sentetik veri.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-standart-anahtari'

let encrypt: (s: string) => string
let dosyaSorguVerisiDerle: typeof import('./dosyaOlaylari').dosyaSorguVerisiDerle
let hastaOlaylariniDerle: typeof import('./dosyaOlaylari').hastaOlaylariniDerle

const A = 'doktor-a-standart', B = 'doktor-b-standart'
const db = new SahteVeritabani()
let pa = '', pb = ''

before(async () => {
  ;({ encrypt } = await import('@/lib/security/encryption'))
  ;({ dosyaSorguVerisiDerle, hastaOlaylariniDerle } = await import('./dosyaOlaylari'))
  db.ekle('users', { id: A, specialty: 'Pediatri' })
  db.ekle('users', { id: B, specialty: 'Pediatri' })
  pa = db.ekle('patients', { doctor_id: A, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta A GIZLI-A-STD' })), dob_encrypted: encrypt('2024-07-20'), gender_encrypted: encrypt('male') }).id
  pb = db.ekle('patients', { doctor_id: B, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta B GIZLI-B-STD' })), dob_encrypted: encrypt('2023-01-01'), gender_encrypted: encrypt('female') }).id

  const s1 = db.ekle('sessions', { patient_id: pa, doctor_id: A, created_at: '2026-09-16T10:00:00Z', archived_at: null }).id
  const s2 = db.ekle('sessions', { patient_id: pa, doctor_id: A, created_at: '2026-09-20T10:00:00Z', archived_at: '2026-09-21T00:00:00Z' }).id
  const s3 = db.ekle('sessions', { patient_id: pa, doctor_id: A, created_at: '2026-09-22T10:00:00Z', archived_at: null }).id
  db.ekle('notes', { session_id: s1, doctor_id: A, approved_at: '2026-09-16T12:00:00Z', created_at: '2026-09-16T12:00:00Z', content_subjektif: 'Kulak ağrısı.', content_plan: 'Bugün Hepatit B 2. dozunu yapacağız.' })
  db.ekle('notes', { session_id: s2, doctor_id: A, approved_at: '2026-09-20T12:00:00Z', created_at: '2026-09-20T12:00:00Z', content_plan: 'ARSIV-GIZLI ferritin istendi.' })
  db.ekle('notes', { session_id: s3, doctor_id: A, approved_at: null, created_at: '2026-09-22T12:00:00Z', content_plan: 'ONAYSIZ-GIZLI KKK yapılacak.' })
  // B'nin, A'nın hastası altına bıraktığı kirli satırlar (geçmiş bir yazma açığı) — okuma asla yaymamalı.
  db.ekle('asilar', { patient_id: pa, doktor_id: B, asi_adi: 'KIRLI-B Hepatit B', doz_no: 2, uygulama_tarihi: '2026-09-17' })
  db.ekle('lab_satirlar', { patient_id: pa, doctor_id: B, onayli: true, canonical_key: 'Ferritin', kanonik_deger: 99, numune_tarihi: '2026-09-18' })
  db.ekle('asilar', { patient_id: pa, doktor_id: A, asi_adi: 'Hepatit B', doz_no: 1, uygulama_tarihi: '2024-07-20' })
  db.ekle('lab_satirlar', { patient_id: pa, doctor_id: A, onayli: true, canonical_key: 'Hb', kanonik_deger: 11.4, kanonik_birim: 'g/dL', numune_tarihi: '2026-09-18' })
  db.ekle('hasta_ilaclar', { patient_id: pa, doctor_id: A, ilac_adi: 'D vitamini damla', aktif: true, baslangic_tarihi: '2026-01-01', kaynak_note_id: null })
  db.ekle('hasta_ilaclar', { patient_id: pa, doctor_id: B, ilac_adi: 'KIRLI-B ilaç', aktif: true, baslangic_tarihi: '2026-01-01', kaynak_note_id: null })
})

describe('dosyaOlaylari — HASTA-IZOLASYON-01', () => {
  it('A, B\'nin hastasını derleyemez', async () => {
    assert.equal(await dosyaSorguVerisiDerle(db.istemci() as never, A, pb, '2026-09-26'), null)
    assert.deepEqual(await hastaOlaylariniDerle(db.istemci() as never, A, pb), [])
  })
  it('kendi hastası: kendi satırları var, B\'nin kirli satırları yok', async () => {
    const r = await dosyaSorguVerisiDerle(db.istemci() as never, A, pa, '2026-09-26')
    assert.ok(r)
    const metin = JSON.stringify(r!.olaylar)
    assert.ok(metin.includes('Hepatit B 1. doz'), metin)
    assert.ok(r!.olaylar.some((o) => o.tur === 'asi' && o.kaynak === 'not' && o.durum === 'planlandi' && o.doz === 2), metin)
    assert.ok(!metin.includes('KIRLI-B'), metin)
    // Pozitif kontrol: sorgu gerçekten çalıştı (okuma hatası sessizce boş dönseydi bu da yok olurdu).
    assert.deepEqual(r!.olaylar.filter((o) => o.kaynak === 'lab').map((o) => o.anahtar), ['Hb'], metin)
    assert.ok(metin.includes('D vitamini damla'), metin)
    assert.equal(r!.hasta.ad, 'QA Hasta A GIZLI-A-STD')
    assert.equal(r!.hasta.cinsiyet, 'male')
  })
  it('arşivlenmiş muayene ve onaysız not olay dizinine girmez', async () => {
    const metin = JSON.stringify((await dosyaSorguVerisiDerle(db.istemci() as never, A, pa, '2026-09-26'))!.olaylar)
    assert.ok(!metin.includes('ARSIV-GIZLI'), metin)
    assert.ok(!metin.includes('ONAYSIZ-GIZLI'), metin)
  })
})
