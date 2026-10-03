/**
 * NOTYA-SES-ELEVEN-NORMAL-01 — ElevenLabs hears spoken Turkish units; screen text stays written.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { elevenMetni } from './elevenMetni'
import { seslendirilmemisler } from '@/lib/ses/tibbiSeslendirme'

describe('elevenMetni — ElevenLabs choke point', () => {
  it('lab units from Dr. Gökhan list become Turkish words', () => {
    assert.equal(
      elevenMetni('Hb 12,4 g/dL, ferritin 32 ng/mL.'),
      'hemoglobin on iki virgül dört gram desilitre, ferritin otuz iki nanogram mililitre.',
    )
    assert.equal(
      elevenMetni('Sodyum 140 mEq/L, glukoz 95 mg/dL.'),
      'Sodyum yüz kırk miliekivalan litre, glukoz doksan beş miligram desilitre.',
    )
    assert.equal(
      elevenMetni('ALT 32 U/L, D vitamini 400 IU.'),
      'ALT otuz iki ünite litre, D vitamini dört yüz enternasyonel ünite.',
    )
    assert.equal(
      elevenMetni('PEEP 6 cmH2O, tansiyon 110/70 mmHg.'),
      'PEEP altı santimetre su, tansiyon yüz on bölü yetmiş milimetre cıva.',
    )
  })

  it('is idempotent and leaves no unread unit abbreviations', () => {
    const bir = elevenMetni('Ferritin 32 ng/mL ve Hb 12,4 g/dL Hocam.')
    assert.equal(elevenMetni(bir), bir)
    assert.deepEqual(seslendirilmemisler(bir), [])
  })

  it('does not invent content for plain talk', () => {
    assert.equal(elevenMetni('Merhaba Hocam, ben Ayşe.'), 'Merhaba Hocam, ben Ayşe.')
    assert.equal(elevenMetni('Devamı ekranınızda Hocam.'), 'Devamı ekranınızda Hocam.')
  })
})
