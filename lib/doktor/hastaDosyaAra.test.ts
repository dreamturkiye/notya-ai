import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { adaylariTopla, klinikAramaMi, metinEslesir, sorguyuAyikla } from './hastaDosyaAra'

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

  it('aynı hastanın iki kaynağı birleşir; yabancı id karışmaz', () => {
    const g = adaylariTopla([
      { patientId: 'A', kaynak: 'asi', neden: 'Hepatit B', skor: 12 },
      { patientId: 'A', kaynak: 'not', neden: 'otit', skor: 8 },
      { patientId: 'B', kaynak: 'asi', neden: 'KPA', skor: 12 },
    ])
    assert.equal(g.get('A')?.skor, 20)
    assert.equal(g.size, 2)
  })

  it('her tablo sorgusu doktor kolonuna kilitli (izolasyon)', () => {
    const s = readFileSync(new URL('./hastaDosyaAra.ts', import.meta.url), 'utf8')
    const fromlar = [...s.matchAll(/\.from\('([^']+)'\)([\s\S]{0,220})/g)]
    assert.ok(fromlar.length >= 6, 'arama tabloları eksik')
    for (const m of fromlar) {
      const parca = m[2]
      assert.ok(
        /doctor_id|doktor_id/.test(parca),
        `${m[1]} doktor filtresi yok`
      )
    }
  })
})
