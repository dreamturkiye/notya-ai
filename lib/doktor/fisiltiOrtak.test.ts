import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeKohortSatiri } from './fisiltiOrtak'

describe('NOTYA-FISILTI-GIZLE-01 — Fısıltı başlığı', () => {
  it('aşı kaydı tutarsızlığı "gecikti" diye değil, kendi adıyla ve aşı sekmesine gider', () => {
    const it0 = normalizeKohortSatiri({ patientId: 'p1', ad: 'Sentetik Çocuk', bayraklar: ['asi_kayit_tutarsiz'], detay: ['Aşı kaydı tutarsız — Hep B 2. doz tarihi / doğum tarihini kontrol edin'], sekme: 'asilar', enErkenTarih: '2024-06-15' }, 'pediatri')
    assert.equal(it0?.baslik, 'aşı kaydı tutarsız')
    assert.equal(it0?.hedefYol, '/dashboard/doktor/hastalar/p1?tab=asilar')
  })
  it('bilinmeyen bayrak kodu okunur alt çizgisiz metne düşer', () => {
    assert.equal(normalizeKohortSatiri({ patientId: 'p1', ad: 'X', bayraklar: ['tbse_gecikti'] }, 'dermatoloji')?.baslik, 'tbse gecikti')
  })
})
