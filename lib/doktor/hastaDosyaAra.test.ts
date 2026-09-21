import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARAMA_ALANLARI, adaylariTopla, klinikAramaMi, listeSorgusuMu, metinEslesir, sorguyuAyikla, yasAyHesapla, yasFiltreEslesir } from './hastaDosyaAra'

const PAZAR = new Date('2026-09-20T15:00:00+03:00')

describe('hastaDosyaAra — sorgu (ad/doğum tarihi yok)', () => {
  it('geçen hafta + aşı → pencere ve asi bayrağı', () => {
    const q = sorguyuAyikla('Gecen haftaki asi yaptigim hastalar hangileriyedi?', PAZAR)
    assert.equal(q.asi, true)
    assert.equal(q.cogul, true)
    assert.equal(q.pencere?.basGun, '2026-09-07')
    assert.equal(q.pencere?.bitGun, '2026-09-13')
  })

  it('bu hafta kulak iltihabı → otit eşanlamı', () => {
    const q = sorguyuAyikla('Hangi hasta bana bu hafta kulak iltehabi ile geldi?', PAZAR)
    assert.equal(q.cogul, false)
    assert.ok(q.terimler.includes('kulak') || q.terimler.includes('otit'))
    assert.ok(q.terimler.includes('iltihap') || q.terimler.some((t) => t.includes('iltihap') || t.includes('otit') || t.includes('kulak')))
    assert.equal(q.pencere?.basGun, '2026-09-14')
    assert.equal(q.pencere?.bitGun, '2026-09-20')
  })

  it('otitis media notu kulak sorgusuna uyar', () => {
    assert.equal(metinEslesir('Akut otitis media, sağ kulak zarı bombeli', ['kulak', 'otit', 'h66']), true)
    assert.equal(metinEslesir('Sağlam çocuk kontrolü, aşı yok', ['kulak', 'otit']), false)
  })

  it('selamlaşma klinik arama açmaz', () => {
    assert.equal(klinikAramaMi('Merhaba hocam nasılsınız'), false)
  })

  it('alan kataloğu birleşik filtre için yeterli (takma adlar dahil)', () => {
    const takma = ARAMA_ALANLARI.flatMap((a) => [a.anahtar, ...a.takma])
    assert.ok(ARAMA_ALANLARI.length >= 30, 'alan sayısı')
    assert.ok(takma.length >= 80, `takma ${takma.length}`)
  })

  it('aynı hastanın iki kaynağı birleşir; yabancı id karışmaz', () => {
    const g = adaylariTopla([
      { patientId: 'A', kaynak: 'asi', neden: 'Hepatit B', skor: 12 },
      { patientId: 'A', kaynak: 'not', neden: 'otit', skor: 8 },
      { patientId: 'B', kaynak: 'asi', neden: 'KPA', skor: 12 },
    ])
    assert.equal(g.get('A')?.skor, 20)
    assert.equal(g.size, 2)
  })

  it('bu hafta 2 yaşındaki gördüklerim → yaş + pencere + boş artık terim', () => {
    const q = sorguyuAyikla('Bu hafta gördüğüm 2 yaşındaki hastalar hangileriydi?', PAZAR)
    assert.equal(q.yas?.minAy, 24)
    assert.equal(q.yas?.maxAy, 35)
    assert.equal(q.pencere?.basGun, '2026-09-14')
    assert.equal(q.ziyaret, true)
    assert.equal(q.klinik, true)
    assert.ok(!q.terimler.includes('yasindaki') && !q.terimler.includes('yasinda'))
    assert.equal(listeSorgusuMu('Bu hafta gördüğüm 2 yaşındaki hastalar hangileriydi?', q), true)
  })

  it('iki yaşında / 18 aylık / 2-4 yaş aralığı', () => {
    assert.deepEqual(sorguyuAyikla('iki yaşındaki kızlar', PAZAR).yas, { minAy: 24, maxAy: 35, etiket: '2 yaş' })
    assert.equal(sorguyuAyikla('18 aylık bebekler', PAZAR).yas?.minAy, 18)
    const a = sorguyuAyikla('2-4 yaş arası otit', PAZAR)
    assert.equal(a.yas?.minAy, 24)
    assert.equal(a.yas?.maxAy, 59)
  })

  it('BETWEEN 1–5 yaş + bu hafta + kaç tane (TR ve EN)', () => {
    for (const cumle of [
      'Bu hafta 1-5 yaş arası kaç hasta gördüm?',
      'Bu hafta 1 ile 5 yaş arasında kaç hastam vardı?',
      "Tell me the number of hastas I had this week between then ages of 1-5",
    ]) {
      const q = sorguyuAyikla(cumle, PAZAR)
      assert.equal(q.yas?.minAy, 12, cumle)
      assert.equal(q.yas?.maxAy, 71, cumle)
      assert.equal(q.pencere?.etiket, 'bu hafta', cumle)
      assert.equal(q.sayim, true, cumle)
      assert.equal(q.ziyaret, true, cumle)
    }
  })

  it('kaç tane → sayım + liste', () => {
    const q = sorguyuAyikla('Bu hafta 2 yaşında kaç hasta gördüm?', PAZAR)
    assert.equal(q.sayim, true)
    assert.equal(q.cogul, true)
    assert.ok(q.yas)
  })

  it('yaş hesabı 2.0–2.99 yılı 24–35 ay', () => {
    const ay = yasAyHesapla('2024-03-20', PAZAR)
    assert.ok(ay != null && ay >= 24 && ay <= 35)
    assert.equal(yasFiltreEslesir(ay, { minAy: 24, maxAy: 35, etiket: '2 yaş' }), true)
    assert.equal(yasFiltreEslesir(12, { minAy: 24, maxAy: 35, etiket: '2 yaş' }), false)
  })

  it('her tablo sorgusu doktor kolonuna kilitli (izolasyon)', () => {
    const s = readFileSync(new URL('./hastaDosyaAra.ts', import.meta.url), 'utf8')
    const fromlar = [...s.matchAll(/\.from\('([^']+)'\)([\s\S]{0,280})/g)]
    assert.ok(fromlar.length >= 8, 'arama tabloları eksik')
    for (const m of fromlar) {
      const parca = m[2]
      assert.ok(
        /doctor_id|doktor_id/.test(parca),
        `${m[1]} doktor filtresi yok`
      )
    }
  })
})
