import { test } from 'node:test'
import assert from 'node:assert/strict'
import { satirTarihiDogrula, tekrarAyikla, panelTarihi, ENABIZ_TALIMAT } from './enabiz'

test('e-Nabız satır tarihi: ISO ve TR biçimi kabul; boş / geçersiz / gelecek / doğumdan önce → null + neden (onaylı seriye girmez)', () => {
  assert.deepEqual(satirTarihiDogrula('2025-03-14', '2026-09-17', '1960-01-01'), { tarih: '2025-03-14', not: null })
  assert.equal(satirTarihiDogrula('4.3.2024', '2026-09-17', null).tarih, '2024-03-04')
  assert.match(satirTarihiDogrula(null, '2026-09-17', null).not!, /okunamadı/)
  assert.match(satirTarihiDogrula('2025-02-30', '2026-09-17', null).not!, /geçersiz/)
  assert.match(satirTarihiDogrula('2027-01-01', '2026-09-17', null).not!, /gelecek/)
  assert.match(satirTarihiDogrula('1955-05-05', '2026-09-17', '1960-01-01').not!, /doğum/)
  assert.equal(satirTarihiDogrula('bilinmiyor', '2026-09-17', null).tarih, null)
})

test('tekrar ayıklama test+tarih+değer ile; farklı tarihli aynı test korunur; panel tarihi en yeni geçerli tarih', () => {
  const s = (raw_name: string, value: string, numune_tarihi: string | null) => ({ raw_name, value, unit: null, ref_low: null, ref_high: null, flag_printed: null, page: 1, numune_tarihi })
  const r = tekrarAyikla([s('HbA1c', '7,1', '2025-01-10'), s('hba1c ', '7,1', '2025-01-10'), s('HbA1c', '6,8', '2025-07-02'), s('LDL', '130', null)])
  assert.deepEqual(r.map((x) => `${x.raw_name.trim()}|${x.numune_tarihi}`), ['HbA1c|2025-01-10', 'HbA1c|2025-07-02', 'LDL|null'])
  assert.equal(panelTarihi(['2025-01-10', null, '2025-07-02']), '2025-07-02')
  assert.equal(panelTarihi([null]), null)
})

test('çıkarım talimatı: tarih uydurma yasağı, tanı/reçete satıra çevrilmez', () => {
  assert.match(ENABIZ_TALIMAT, /Tarih UYDURMA/); assert.match(ENABIZ_TALIMAT, /reçete/)
})
