import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  NOT_YENIDEN_DEGERLENDIR_ISTEK,
  klinikNotImzasi,
  yenidenDegerlendirDuzenlemeTemizle,
} from './notYenidenDegerlendir'

describe('notYenidenDegerlendir', () => {
  it('asks Ayşe to rebuild suggestions without rewriting hekim ilaçlar', () => {
    assert.match(NOT_YENIDEN_DEGERLENDIR_ISTEK, /yeniden değerlendir/i)
    assert.match(NOT_YENIDEN_DEGERLENDIR_ISTEK, /ICD-10/)
    assert.match(NOT_YENIDEN_DEGERLENDIR_ISTEK, /SABİT kabul/)
    assert.doesNotMatch(NOT_YENIDEN_DEGERLENDIR_ISTEK, /ilaçlar listesini.*güncelle/i)
    assert.match(NOT_YENIDEN_DEGERLENDIR_ISTEK, /İlaçlar.*değiştirme|duzenlemeler ile değiştirme/i)
  })

  it('NOTYA-NOT-HEKIM-01: strips ilaclar/asilar/SOAP from yeniden-değerlendir edits', () => {
    const temiz = yenidenDegerlendirDuzenlemeTemizle({
      ilaclar: [{ ad: 'eski' }],
      asilar: [{ asi_adi: 'Hep A' }],
      plan: 'planı bozma',
      subjektif: 's',
      icdKodlari: [{ code: 'Z00.1' }],
      receteOnerisi: [{ ticariOrnek: 'X' }],
      aiDegerlendirme: 'Plan ile ilaç uyumsuz; hekim doğrulasın.',
      alarmBulgulari: ['ateş olursa dönün'],
      hastaOzeti: 'özet',
    })
    assert.equal(temiz.ilaclar, undefined)
    assert.equal(temiz.asilar, undefined)
    assert.equal(temiz.plan, undefined)
    assert.equal(temiz.subjektif, undefined)
    assert.deepEqual(temiz.icdKodlari, [{ code: 'Z00.1' }])
    assert.equal(temiz.aiDegerlendirme, 'Plan ile ilaç uyumsuz; hekim doğrulasın.')
    assert.ok(Array.isArray(temiz.alarmBulgulari))
  })

  it('changes clinical signature when SOAP or vitals change', () => {
    const a = klinikNotImzasi({
      basvuru: 'rutin izlem',
      vitaller: { boy: '160' },
      subjektif: 's1',
      objektif: 'o1',
      degerlendirme: 'd1',
      plan: 'p1',
    })
    const b = klinikNotImzasi({
      basvuru: 'rutin izlem',
      vitaller: { boy: '161' },
      subjektif: 's1',
      objektif: 'o1',
      degerlendirme: 'd1',
      plan: 'p1',
    })
    assert.notEqual(a, b)
  })
})
