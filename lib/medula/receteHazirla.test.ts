/**
 * NOTYA-SUT-RAPOR-01 — the e-Reçete Asistanı hints that name a SUT rule, against the official text.
 * Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali. Base tool: the hints are the same for every specialty.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { medulaTaslagiHazirla } from './receteHazirla'

const taslak = (ilac_adi: string, etken_madde: string, kullanim_sikli = '1x1') =>
  medulaTaslagiHazirla({
    ilaclar: [{ ilac_adi, etken_madde, kullanim_sikli }],
    tanilar: [{ code: 'J45.9', description: 'Astım', is_primary: true }],
    hasta: { ad: 'QA', soyad: 'Test', dogumTarihi: '1980-01-01' },
    doktor: { ad: 'QA', soyad: 'Hekim', bransKodu: 1 },
    protokolNo: 'T-1',
    receteTarihi: new Date('2026-10-10T09:00:00Z'),
  }).uyarilar.join('\n')

test('SUT 4.2.24.A(2): montelukast ipucu reçete edebilen uzmanlıkları ve rapor yolunu söyler; EK-4/F demez', () => {
  const u = taslak('Singulair 10 mg', 'montelukast')
  assert.match(u, /SUT 4\.2\.24\.A/)
  assert.match(u, /iç hastalıkları, çocuk sağlığı ve hastalıkları, göğüs hastalıkları ve alerji uzman hekimlerince/)
  assert.match(u, /uzman hekim raporuyla/)
  assert.doesNotMatch(u, /EK-4\/F/)
  assert.doesNotMatch(u, /uzun süreli kullanımda/)
})

test('SUT 4.2.24.A(11) / 4.2.24.B(13): nebül formu raporsuz en fazla 1 kutu; "ayda birden fazla kutu açıklama" kuralı yazılmaz', () => {
  const u = taslak('Pulmicort nebül', 'budesonid', '2x1')
  assert.match(u, /SUT 4\.2\.24/)
  assert.match(u, /raporsuz en fazla 1 kutu/)
  assert.match(u, /uzman hekim raporu gerekir/)
  assert.doesNotMatch(u, /ayda birden fazla kutu/)
  assert.doesNotMatch(u, /açıklama ister/)
})

test('ipuçları branşa göre değişmez: aynı ilaç, farklı branş kodu, aynı metin', () => {
  const brans = (bransKodu: number) =>
    medulaTaslagiHazirla({
      ilaclar: [{ ilac_adi: 'Singulair 10 mg', etken_madde: 'montelukast', kullanim_sikli: '1x1' }],
      tanilar: [{ code: 'J45.9', is_primary: true }],
      hasta: { ad: 'QA', soyad: 'Test' },
      doktor: { ad: 'QA', soyad: 'Hekim', bransKodu },
      protokolNo: 'T-2',
    }).uyarilar
  assert.deepEqual(brans(1), brans(42))
})
