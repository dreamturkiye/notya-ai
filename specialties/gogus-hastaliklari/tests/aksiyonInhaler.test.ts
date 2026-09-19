import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { aksiyonPlaniOlustur } from '../engines/aksiyonPlani'
import { inhalerIzlem } from '../engines/inhaler'

describe('GOGUS-EXCEPTIONAL-01 aksiyon planı + inhaler', () => {
  it('action plan has green/yellow/red and no dose', () => {
    const s = aksiyonPlaniOlustur({
      hedef: 'astim',
      idameSinifi: 'ICS-LABA idame',
      kurtariciSinifi: 'SABA gerektiğinde',
      astimKontrol: { gunduzSemptom: true, geceUyanma: false, kurtariciIhtiyac: true, aktiviteKisit: false },
      bugun: '2026-09-19',
    })
    assert.ok(s.yesil.length && s.sari.length && s.kirmizi.length)
    assert.match(s.kirmizi.join(' '), /112/)
    const blob = [...s.yesil, ...s.sari, ...s.kirmizi, s.ozetNot].join(' ')
    assert.doesNotMatch(blob, /\bmg\b|mcg|puff/i)
  })

  it('inhaler technique checklist schedules follow-up without dose', () => {
    const s = inhalerIzlem({
      cihaz: 'odi',
      tamamlanan: ['Doğru cihaz hazırlığı (kapak, sallama / kapsül yükleme)'],
      sinifMetni: 'ICS-LABA',
      bugun: '2026-09-19',
    })
    assert.ok(s.toplam >= 6)
    assert.equal(s.gorev.kod, 'inhaler_teknik')
    assert.doesNotMatch(s.ozet, /\bmg\b|mcg|puff sayısı \d/i)
  })
})
