/** MUAYENE-EKLERI-01 — onay sonrası yönlendirme: röntgen/EKG → görüntü bölümü, idempotent, izole, tablo yokken zarif. */
process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-muayene-ek-anahtari'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SahteVeritabani } from '../../security/testing/sahteSupabase'
import { degerlendirmeYaz } from './saklama'
import { genelSonucu } from './donustur'
import { onayliEkleriYonlendir } from './yonlendir'

const sonuc = (tur: 'diger') => genelSonucu(tur, { belge_turu: null, tarih: null, ozet: 'x', onemli_bulgular: [], ilaclar: [], takip: [], okunamayan: [] })

function kur() {
  const db = new SahteVeritabani()
  const sb = db.istemci() as unknown as SupabaseClient
  const A = randomUUID(), p = randomUUID(), s = randomUUID(), not = randomUUID()
  const belge = async (category: string, tur: 'rontgen' | 'ekg' | 'lab', ov: Record<string, unknown> = {}) => {
    const d = db.ekle('medical_documents', { doctor_id: A, patient_id: p, visit_id: s, category, created_at: '2026-10-16T09:00:00Z', ...ov })
    await degerlendirmeYaz(sb, { doktorId: A, patientId: p, sessionId: s, belgeId: String(d.id), tur, durum: 'tamam', sonuc: { ...sonuc('diger'), tur } })
    return String(d.id)
  }
  return { db, sb, A, p, s, not, belge }
}

describe('onayliEkleriYonlendir', () => {
  it('röntgen ve EKG goruntu_calisma’ya belge_id + seans_id ile bağlanır; lab bağlanmaz', async () => {
    const { db, sb, A, p, s, not, belge } = kur()
    const x = await belge('Röntgen', 'rontgen'), e = await belge('EKG', 'ekg'), l = await belge('Lab Sonucu', 'lab')
    const r = await onayliEkleriYonlendir(sb, { doktorId: A, patientId: p, sessionId: s, noteId: not })
    assert.equal(r.goruntu, 2)
    const satirlar = db.tablo('goruntu_calisma')
    assert.deepEqual(satirlar.map((g) => g.belge_id).sort(), [x, e].sort())
    assert.ok(satirlar.every((g) => g.seans_id === s && g.doctor_id === A && g.patient_id === p && g.onay_durum === 'taslak'))
    assert.ok(!satirlar.some((g) => g.belge_id === l))
    assert.deepEqual(satirlar.map((g) => g.tip).sort(), ['ekg', 'xr'])
  })
  it('idempotent: ikinci onayda ikinci satır açılmaz', async () => {
    const { db, sb, A, p, s, not, belge } = kur()
    await belge('Röntgen', 'rontgen')
    await onayliEkleriYonlendir(sb, { doktorId: A, patientId: p, sessionId: s, noteId: not })
    const r2 = await onayliEkleriYonlendir(sb, { doktorId: A, patientId: p, sessionId: s, noteId: not })
    assert.equal(db.tablo('goruntu_calisma').length, 1)
    assert.equal(r2.goruntu, 0)
  })
  it('İZOLASYON: kasadaki belge başka doktor / başka vizit / başka hastaya aitse bağlanmaz', async () => {
    const { db, sb, A, p, s, not, belge } = kur()
    await belge('Röntgen', 'rontgen', { doctor_id: randomUUID() })
    await belge('Röntgen', 'rontgen', { visit_id: randomUUID() })
    await belge('Röntgen', 'rontgen', { patient_id: randomUUID() })
    const r = await onayliEkleriYonlendir(sb, { doktorId: A, patientId: p, sessionId: s, noteId: not })
    assert.equal(r.goruntu, 0)
    assert.equal(db.tablo('goruntu_calisma').length, 0)
  })
  it('başka doktor aynı seansı yönlendiremez (değerlendirme satırı göremez)', async () => {
    const { db, sb, p, s, not, belge } = kur()
    await belge('Röntgen', 'rontgen')
    const r = await onayliEkleriYonlendir(sb, { doktorId: randomUUID(), patientId: p, sessionId: s, noteId: not })
    assert.equal(r.goruntu, 0)
    assert.equal(db.tablo('goruntu_calisma').length, 0)
  })
  it('değerlendirme tablosu yoksa fırlatmadan 0 döner', async () => {
    const hata = { code: '42P01', message: 'does not exist' }
    const zincir: unknown = new Proxy(function () { /* */ }, { get(_t, ad) { return ad === 'then' ? (res: (v: unknown) => void) => res({ data: null, error: hata }) : () => zincir }, apply() { return zincir } })
    const sb = { from: () => zincir } as unknown as SupabaseClient
    const r = await onayliEkleriYonlendir(sb, { doktorId: randomUUID(), patientId: randomUUID(), sessionId: randomUUID(), noteId: randomUUID() })
    assert.deepEqual(r, { goruntu: 0, atlanan: 0 })
  })
})
