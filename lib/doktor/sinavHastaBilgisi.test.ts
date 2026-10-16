/**
 * PEDIATRI-SINAV-01 — yaş biçimleyici + muayene ekranı hasta bilgisi kapısı (branş alan sızması, iki yönlü).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import { yasGosterim, sinavHastaBilgisi } from './sinavHastaBilgisi'
import SinavHastaBilgisi from '@/components/doktor/SinavHastaBilgisi'

// 2026-10-16 12:00 UTC (TRT öğleden sonra; gün sınırından uzak)
const NOW = Date.UTC(2026, 9, 16, 9, 0, 0)

describe('yasGosterim', () => {
  it('yenidoğan: gün', () => {
    assert.equal(yasGosterim('2026-10-16', NOW), '0 günlük')
    assert.equal(yasGosterim('2026-10-04', NOW), '12 günlük')
    assert.equal(yasGosterim('2026-09-17', NOW), '29 günlük')
  })
  it('1 ay ve 11 ay', () => {
    assert.equal(yasGosterim('2026-09-16', NOW), '1 aylık')
    assert.equal(yasGosterim('2025-11-20', NOW), '10 aylık')
    assert.equal(yasGosterim('2025-11-16', NOW), '11 aylık')
  })
  it('12 ay sınırı ve 24 ay tam', () => {
    assert.equal(yasGosterim('2025-10-16', NOW), '1 yaş')
    assert.equal(yasGosterim('2025-10-17', NOW), '11 aylık')
    assert.equal(yasGosterim('2024-10-16', NOW), '2 yaş')
    assert.equal(yasGosterim('2024-10-17', NOW), '1 yaş 11 ay')
  })
  it('2 yaş 3 ay ve yetişkin', () => {
    assert.equal(yasGosterim('2024-07-10', NOW), '2 yaş 3 ay')
    assert.equal(yasGosterim('1990-01-01', NOW), '36 yaş 9 ay')
  })
  it('artık gün (29 Şubat)', () => {
    // Kural: ayda olmayan doğum günü ayın son gününde dolar (29 Şub → 28 Şub). 27 Şubat'ta henüz dolmadı.
    assert.equal(yasGosterim('2024-02-29', Date.UTC(2025, 1, 27, 9)), '11 aylık')
    assert.equal(yasGosterim('2024-02-29', Date.UTC(2025, 1, 28, 9)), '1 yaş')
    assert.equal(yasGosterim('2024-02-29', Date.UTC(2025, 2, 1, 9)), '1 yaş')
    assert.equal(yasGosterim('2024-02-29', Date.UTC(2028, 1, 29, 9)), '4 yaş')
  })
  it('gelecek / boş / bozuk tarih → boş (uydurma yok)', () => {
    assert.equal(yasGosterim('2026-10-17', NOW), '')
    assert.equal(yasGosterim('2030-01-01', NOW), '')
    assert.equal(yasGosterim('', NOW), '')
    assert.equal(yasGosterim(null, NOW), '')
    assert.equal(yasGosterim('abc', NOW), '')
    assert.equal(yasGosterim('2024-13-40', NOW), '')
  })
})

const cocuk = { adSoyad: 'Ela Yılmaz', cinsiyet: 'Kız', dogumIso: '2024-07-10', anneAdi: 'Ayşe', babaAdi: 'Mehmet', nowMs: NOW }

describe('sinavHastaBilgisi — kapı', () => {
  it('pediatri: anne/baba + cinsiyet + yaş', () => {
    const b = sinavHastaBilgisi({ ...cocuk, seansBransi: 'pediatri' })
    assert.deepEqual(b.ebeveyn, { anne: 'Ayşe', baba: 'Mehmet' })
    assert.equal(b.yas, '2 yaş 3 ay')
    assert.equal(b.cinsiyet, 'Kız')
    const html = renderToStaticMarkup(React.createElement(SinavHastaBilgisi, { bilgi: b }))
    assert.match(html, /Anne: Ayşe/)
    assert.match(html, /Baba: Mehmet/)
    assert.match(html, /Kız · 2 yaş 3 ay/)
  })
  it('çocuk cerrahisi (kural her-zaman) da görür', () => {
    assert.ok(sinavHastaBilgisi({ ...cocuk, seansBransi: 'cocuk-cerrahisi' }).ebeveyn)
  })
  it('pediatri doktoru ama yetişkin hasta: blok YOK, veli dili YOK', () => {
    const b = sinavHastaBilgisi({ ...cocuk, dogumIso: '1990-01-01', seansBransi: 'pediatri' })
    assert.equal(b.goster, false)
    assert.equal(b.ebeveyn, null)
    assert.equal(b.veliDili, false)
  })
  it('pediatri, yaş bilinmiyor: blok görünür (pediatri hekiminin kendi hastası)', () => {
    const b = sinavHastaBilgisi({ ...cocuk, dogumIso: null, seansBransi: 'pediatri' })
    assert.ok(b.ebeveyn)
    assert.equal(b.yas, '')
  })
  it('pediatri/çocuk cerrahisi dışındaki HER branşta blok tamamen yok (ad/cinsiyet/yaş/anne/baba); çocuk hasta olsa bile', () => {
    const digerleri = Object.keys(BRANS_ETIKETLERI).filter((k) => !['pediatri', 'cocuk-cerrahisi'].includes(k))
    assert.ok(digerleri.length >= 27)
    for (const k of digerleri) {
      const b = sinavHastaBilgisi({ ...cocuk, seansBransi: k })
      assert.equal(b.goster, false, k)
      assert.equal(b.ebeveyn, null, k)
      assert.equal(b.yas, '', k)
      assert.equal(renderToStaticMarkup(React.createElement(SinavHastaBilgisi, { bilgi: b })), '', k)
    }
  })
  it('yetişkin hasta hiçbir branşta veli dili almaz; reşit olmayan her branşta alır (yaşa bağlı hukuki kural, blok görünürlüğünden bağımsız)', () => {
    for (const k of Object.keys(BRANS_ETIKETLERI)) {
      assert.equal(sinavHastaBilgisi({ ...cocuk, dogumIso: '1985-05-05', seansBransi: k }).veliDili, false, k)
      assert.equal(sinavHastaBilgisi({ ...cocuk, seansBransi: k }).veliDili, true, k)
    }
  })
  it('branşsız doktor: blok yok (çocuk da olsa)', () => {
    assert.equal(sinavHastaBilgisi({ ...cocuk, seansBransi: null }).goster, false)
  })
  it('boş anne/baba adı → satır yok; veri yoksa bileşen boş', () => {
    const b = sinavHastaBilgisi({ seansBransi: 'pediatri', nowMs: NOW })
    assert.equal(b.ebeveyn, null)
    assert.equal(b.goster, true)
    assert.equal(renderToStaticMarkup(React.createElement(SinavHastaBilgisi, { bilgi: b })), '')
  })
})
