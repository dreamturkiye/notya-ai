/**
 * NOTYA-MODEL-LUNAPRO-01 — G4 devre kesici: 5 dakikada ≥5 hata açar, 10 dakika açık, sonra tek yoklama.
 * Saat enjekte edilir (DEVRE_SAAT.simdi) — gerçek zaman beklenmez.
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { DEVRE_AYAR, DEVRE_SAAT, devreBasari, devreBirincilIzinli, devreDurumu, devreHata, devreNotr, devreSifirla } from './devre'

const M = 'openai/model-a'
const DK = 60_000
let saat = 0
const gercekSaat = DEVRE_SAAT.simdi

beforeEach(() => { saat = 1_000_000; DEVRE_SAAT.simdi = () => saat; devreSifirla() })
afterEach(() => { DEVRE_SAAT.simdi = gercekSaat; devreSifirla() })

const hatalar = (n: number, arayla = 0) => { for (let i = 0; i < n; i++) { devreHata(M); saat += arayla } }

describe('devre kesici', () => {
  it('ayarlar brief ile aynı: 5 hata / 5 dk, 10 dk açık', () => {
    assert.deepEqual([DEVRE_AYAR.esik, DEVRE_AYAR.pencereMs, DEVRE_AYAR.acikMs], [5, 5 * DK, 10 * DK])
  })

  it('4 hata açmaz; 5 dakika içinde 5. hata açar', () => {
    hatalar(4, DK)
    assert.equal(devreDurumu(M), 'kapali')
    assert.equal(devreBirincilIzinli(M), true)
    devreHata(M)
    assert.equal(devreDurumu(M), 'acik')
    assert.equal(devreBirincilIzinli(M), false)
  })

  it('kayan pencere: 5 dakikadan eski hatalar sayılmaz', () => {
    hatalar(4, 2 * DK) // 0, 2, 4, 6 dk
    devreHata(M) // 8. dk — penceredeki: 4, 6, 8 → 3
    assert.equal(devreDurumu(M), 'kapali')
  })

  it('model başına: bir modelin devresi diğerini etkilemez', () => {
    hatalar(5)
    assert.equal(devreDurumu(M), 'acik')
    assert.equal(devreDurumu('openai/model-b'), 'kapali')
  })

  it('10 dakika açık; sonra yarı açık — tek yoklama geçer, eşzamanlı ikinci çağrı koruyucuya', () => {
    hatalar(5)
    saat += 10 * DK - 1
    assert.equal(devreBirincilIzinli(M), false)
    saat += 1
    assert.equal(devreDurumu(M), 'yari-acik')
    assert.equal(devreBirincilIzinli(M), true, 'yoklama')
    assert.equal(devreBirincilIzinli(M), false, 'yoklama sürerken ikinci çağrı')
  })

  it('yoklama başarılı → devre kapanır, pencere sıfırlanır', () => {
    hatalar(5)
    saat += 10 * DK
    assert.equal(devreBirincilIzinli(M), true)
    devreBasari(M)
    assert.equal(devreDurumu(M), 'kapali')
    hatalar(4)
    assert.equal(devreDurumu(M), 'kapali', 'eski hatalar yeniden sayılmaz')
  })

  it('yoklama düşer → 10 dakika daha açık', () => {
    hatalar(5)
    saat += 10 * DK
    assert.equal(devreBirincilIzinli(M), true)
    devreHata(M)
    assert.equal(devreDurumu(M), 'acik')
    saat += 10 * DK - 1
    assert.equal(devreBirincilIzinli(M), false)
    saat += 1
    assert.equal(devreBirincilIzinli(M), true)
  })

  it('yoklama nötr biterse (4xx) yoklama hakkı serbest kalır; asılı yoklama zaman aşımında bırakılır', () => {
    hatalar(5)
    saat += 10 * DK
    assert.equal(devreBirincilIzinli(M), true)
    devreNotr(M)
    assert.equal(devreBirincilIzinli(M), true, 'yeniden yoklanabilir')
    assert.equal(devreBirincilIzinli(M), false)
    saat += DEVRE_AYAR.yoklamaZamanAsimiMs
    assert.equal(devreBirincilIzinli(M), true, 'asılı yoklama bırakıldı')
  })

  it('kapalı devrede başarı hata penceresini silmez (kayan pencere)', () => {
    hatalar(4)
    devreBasari(M)
    devreHata(M)
    assert.equal(devreDurumu(M), 'acik')
  })

  it('devreSifirla hepsini kapatır', () => {
    hatalar(5)
    devreSifirla()
    assert.equal(devreDurumu(M), 'kapali')
  })
})
