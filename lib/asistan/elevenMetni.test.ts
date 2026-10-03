/**
 * NOTYA-SES-ELEVEN-NORMAL-01 + NOTYA-SES-LAB-NEFES-01 — ElevenLabs hears spoken Turkish units;
 * dense lab lists are breath-paced so Flash does not slur.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { elevenMetni, labNefesAyir } from './elevenMetni'
import { seslendirilmemisler } from '@/lib/ses/tibbiSeslendirme'
import { SES_BLOK_ESIGI, SesYayKapisi } from './sesYay'

describe('elevenMetni — ElevenLabs choke point', () => {
  it('lab units from Dr. Gökhan list become Turkish words', () => {
    assert.equal(
      elevenMetni('Hb 12,4 g/dL.'),
      'hemoglobin on iki virgül dört gram desilitre.',
    )
    assert.equal(
      elevenMetni('Sodyum 140 mEq/L.'),
      'Sodyum yüz kırk miliekivalan litre.',
    )
    assert.equal(
      elevenMetni('ALT 32 U/L, D vitamini 400 IU.'),
      'ALT otuz iki ünite litre. D vitamini dört yüz enternasyonel ünite.',
    )
    assert.equal(
      elevenMetni('PEEP 6 cmH2O.'),
      'PEEP altı santimetre su.',
    )
    assert.match(elevenMetni('tansiyon 110/70 mmHg.'), /milimetre cıva/)
  })

  it('NOTYA-SES-LAB-NEFES-01: dense lab lists become short spoken beats', () => {
    const okunus = elevenMetni('Hb 12,4 g/dL, ferritin 32 ng/mL, WBC 8,4.')
    assert.match(okunus, /gram desilitre\.\s*Ferritin/)
    assert.match(okunus, /nanogram mililitre/)
    // Each lab value is its own sentence — Flash gets a breath between numbers.
    const cumleler = okunus.split(/(?<=\.)\s+/).filter(Boolean)
    assert.ok(cumleler.length >= 2, okunus)
    assert.ok(cumleler.every((c) => c.length < 120), cumleler.map((c) => c.length).join(','))
  })

  it('does not split ordinary talk on commas', () => {
    assert.equal(elevenMetni('Merhaba Hocam, ben Ayşe.'), 'Merhaba Hocam, ben Ayşe.')
    assert.equal(labNefesAyir('Devamı ekranınızda Hocam.'), 'Devamı ekranınızda Hocam.')
  })

  it('is idempotent and leaves no unread unit abbreviations', () => {
    const bir = elevenMetni('Ferritin 32 ng/mL ve Hb 12,4 g/dL Hocam.')
    assert.equal(elevenMetni(bir), bir)
    assert.deepEqual(seslendirilmemisler(bir), [])
    assert.equal(labNefesAyir(labNefesAyir(bir)), bir)
  })

  it('SesYayKapisi releases lab beats without mid-word cuts', () => {
    const parcalar: string[] = []
    const k = new SesYayKapisi((p) => parcalar.push(p))
    const soz = elevenMetni(
      'Hb 12,4 g/dL, ferritin 32 ng/mL, MCV 79,7 fL, MCHC 33,7 g/dL, sodyum 140 mEq/L, glukoz 95 mg/dL.',
    )
    k.ekle(`${soz} `)
    k.bitir()
    assert.ok(parcalar.length >= 1)
    const birlesik = parcalar.join('')
    assert.match(birlesik, /gram desilitre/)
    assert.match(birlesik, /nanogram mililitre/)
    assert.match(birlesik, /femtolitre/)
    assert.match(birlesik, /miliekivalan litre/)
    // No hard mid-word cut: every released chunk ends at a pause or sentence end.
    for (const p of parcalar) {
      assert.match(p.trim(), /[.,…!?]$/, `bad cut: "${p}"`)
      assert.ok(p.length <= SES_BLOK_ESIGI * 2.5, `oversized breath ${p.length}`)
    }
  })
})
