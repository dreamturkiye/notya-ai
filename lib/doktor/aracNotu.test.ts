/**
 * ARACLAR-CILA-01 Faz 2 — araç çıktısının bugünkü muayene notuna eklenen bloğu (saf fonksiyon).
 * Hekim kilidi, PHI ve tavan kuralları burada sınanır; yazma yolu lib/security/hasta-izolasyon.test.ts'te.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aracNotBlogu, aracNotuBugun, ARAC_NOT_ALANLARI, ARAC_NOT_ETIKETI } from './aracNotu'

describe('aracNotBlogu', () => {
  it('başlık + tire işaretli satırlar, hekimin düzenleyebileceği düz metin', () => {
    const b = aracNotBlogu('VA / logMAR', ['OD (sağ): bugün 0,8', 'OS (sol): bugün 0,6'], '2026-09-19')
    assert.equal(b, `[2026-09-19] VA / logMAR (${ARAC_NOT_ETIKETI})\n- OD (sağ): bugün 0,8\n- OS (sol): bugün 0,6`)
    assert.doesNotMatch(b!, /[*_#`]|\{|\}/) // markdown / JSON yok
  })

  it('araç adı ya da satır yoksa blok üretilmez (boş satır nota yazılmaz)', () => {
    assert.equal(aracNotBlogu('', ['bir şey'], '2026-09-19'), null)
    assert.equal(aracNotBlogu('VA', [], '2026-09-19'), null)
    assert.equal(aracNotBlogu('VA', ['   ', ''], '2026-09-19'), null)
    assert.equal(aracNotBlogu('VA', null, '2026-09-19'), null)
  })

  it('bloğun kendisi "araç çıktısı — hekim ekledi" diye etiketlenir (hekim kilidi görünür)', () => {
    assert.match(aracNotBlogu('SCORE2 / KVR', ['%7 — 10 yıllık risk'], '2026-09-19')!, /araç çıktısı — hekim ekledi/)
  })

  it('T.C. kimlik no benzeri 11 haneli dizi bloğa girmez', () => {
    const b = aracNotBlogu('SGK rapor', ['Hasta 12345678901 · rapor 12 ay', 'Tel 05001234567'], '2026-09-19')!
    assert.doesNotMatch(b, /12345678901/)
    assert.match(b, /\*{11}/)
    // 11 haneden kısa/uzun sayılar (ölçüm, tarih, doz değil) korunur
    assert.match(aracNotBlogu('VA', ['logMAR 0,3 · 1234567890'], '2026-09-19')!, /1234567890/)
  })

  it('satır ve uzunluk tavanı: bir araç notu dolduramaz', () => {
    const cok = Array.from({ length: 60 }, (_, i) => `satır ${i}`)
    const b = aracNotBlogu('Araç', cok, '2026-09-19')!
    assert.equal(b.split('\n').length, 25) // başlık + 24 satır
    const uzun = aracNotBlogu('Araç', ['x'.repeat(900)], '2026-09-19')!
    assert.ok(uzun.split('\n')[1].length <= 302)
  })

  it('satır içi kırılmalar tek satıra indirgenir (blok okunabilir kalır)', () => {
    assert.equal(aracNotBlogu('Araç', ['a\nb\tc   d'], '2026-09-19'), `[2026-09-19] Araç (${ARAC_NOT_ETIKETI})\n- a b c d`)
  })

  it('metin girdisi de kabul edilir (mevcut kopya metinleri satırlara bölünür)', () => {
    const b = aracNotBlogu('Doz hesabı', 'Satır 1\n\nSatır 2', '2026-09-19')!
    assert.equal(b.split('\n').length, 3)
  })

  it('geçersiz tarih başlığa yazılmaz', () => {
    assert.match(aracNotBlogu('Araç', ['x'], 'bugün')!, /^Araç \(/)
  })
})

describe('aracNotuBugun', () => {
  it('İstanbul saatiyle (UTC+3) bugünün ISO günü', () => {
    assert.equal(aracNotuBugun(Date.parse('2026-09-19T22:30:00Z')), '2026-09-20')
    assert.equal(aracNotuBugun(Date.parse('2026-09-19T08:00:00Z')), '2026-09-19')
  })
})

describe('ARAC_NOT_ALANLARI', () => {
  it('yalnız gununNotunaEkle\'nin yazabildiği alanlar', () => {
    assert.deepEqual([...ARAC_NOT_ALANLARI], ['content_degerlendirme', 'content_subjektif', 'content_objektif'])
  })
})
