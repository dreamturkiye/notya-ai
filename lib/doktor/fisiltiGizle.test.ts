import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fisiltiAyir, fisiltiIcerikOzeti, gizleUntil, type FisiltiGizlemeKaydi } from './fisiltiGizle'
import type { FisiltiItem } from './fisiltiOrtak'

const oge = (ek: Partial<FisiltiItem> = {}): FisiltiItem => ({
  id: 'pediatri:p1', brans: 'pediatri', patientId: 'p1', ad: 'Sentetik Çocuk', baslik: 'aşı kaydı tutarsız',
  detay: ['Aşı kaydı tutarsız — Hep B 2. doz tarihi / doğum tarihini kontrol edin'], enErkenTarih: '2024-06-15',
  hedefYol: '/dashboard/doktor/hastalar/p1?tab=asilar', toplamBekleyen: 0, kaynak: 'klinik', ...ek,
})
const SIMDI = new Date('2026-09-24T09:00:00Z')
const gizlendi = (item: FisiltiItem, sure: 'kalici' | '7gun', an = SIMDI): FisiltiGizlemeKaydi => ({
  id: 'g1', patient_id: item.patientId, tur: item.id, icerik_ozeti: fisiltiIcerikOzeti(item), until: gizleUntil(sure, an), created_at: an.toISOString(),
})

describe('NOTYA-FISILTI-GIZLE-01 — Fısıltı gizleme', () => {
  it('gizle → listeden çıkar, Gizlenenler\'de görünür', () => {
    const a = oge(), b = oge({ id: 'pediatri:p2', patientId: 'p2', ad: 'Diğer' })
    const r = fisiltiAyir([a, b], [gizlendi(a, 'kalici')], SIMDI)
    assert.deepEqual(r.gorunen.map((x) => x.id), ['pediatri:p2'])
    assert.deepEqual(r.gizli.map((x) => x.item.id), ['pediatri:p1'])
  })
  it('olgular değişince (yeni gecikme / yeni tarih) yeniden görünür', () => {
    const a = oge()
    const k = gizlendi(a, 'kalici')
    const degisti = oge({ baslik: 'aşı gecikti', detay: ['Aşı: Hep B 3. doz (15.11.2024)'] })
    assert.equal(fisiltiAyir([degisti], [k], SIMDI).gorunen.length, 1)
    // Aynı olgular bir yıl sonra da gizli kalır
    assert.equal(fisiltiAyir([a], [k], new Date('2027-09-24T09:00:00Z')).gorunen.length, 0)
  })
  it('"7 gün sonra hatırlat" → 7 gün dolunca geri gelir', () => {
    const a = oge()
    const k = gizlendi(a, '7gun')
    assert.equal(fisiltiAyir([a], [k], new Date(SIMDI.getTime() + 6 * 86400_000)).gorunen.length, 0)
    assert.equal(fisiltiAyir([a], [k], new Date(SIMDI.getTime() + 7 * 86400_000)).gorunen.length, 1)
  })
  it('gizleme başka hastanın / başka öğenin uyarısını gizlemez', () => {
    const a = oge()
    const k = { ...gizlendi(a, 'kalici'), patient_id: 'p9' }
    assert.equal(fisiltiAyir([a], [k], SIMDI).gorunen.length, 1)
    const mesaj = oge({ id: 'mesaj:p1:k1', kaynak: 'mesaj', konuId: 'k1' })
    assert.equal(fisiltiAyir([mesaj], [gizlendi(a, 'kalici')], SIMDI).gorunen.length, 1)
  })
  it('özet 64 karakter hex, düz metin / ad içermez', () => {
    const h = fisiltiIcerikOzeti(oge())
    assert.match(h, /^[0-9a-f]{64}$/)
  })
})
