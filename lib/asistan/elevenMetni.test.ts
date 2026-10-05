/**
 * NOTYA-SES-ELEVEN-NORMAL-01 + NOTYA-SES-LAB-NEFES-01 + NOTYA-SES-SAYI-NET-01 —
 * ElevenLabs hears spoken Turkish units; dense lab lists are breath-paced; no digit islands
 * reach Flash (Beta QoS — number slur is a ship blocker).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { elevenMetni, labNefesAyir, kalanRakamlariOku, rakamKaldiMi } from './elevenMetni'
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

  it('NOTYA-SES-SAYI-NET-01: Boss exam-summary sample leaves zero digit islands', () => {
    const sample = [
      'İdrar pH 6. İdrar densitesi (SG) 1,02 — referans içinde (1.005-1.03).',
      'Lökosit (WBC) 0 — referans içinde (0-5).',
      'Lökosit (WBC) 7,8 10³/µL — referans içinde (5-15.5).',
      'kilo 12 kg; boy 90 cm; baş çevresi 48 cm; ateş 36,5 °C; nabız 100/dk; SpO₂ %99; tansiyon 90/60 mmHg.',
      'Kilo 12 kg (p32, z -0,47); Boy 90 cm (p68, z +0,45); Baş çevresi 48 cm (p20, z -0,85).',
      'Aşı kaydı, 03.10.2026. M-CHAT-R/F: dusuk risk (puan 0). GİDR (20-24 ay).',
      'Reçete: Wellcare 1000 ünite d vitamini haftada 5 fiss; NBL Probiotik Kids günde bir adet.',
      'lot no: H1234 2. Lot no: V1234.',
    ].join(' ')
    const okunus = elevenMetni(sample)
    assert.equal(rakamKaldiMi(okunus), false, okunus)
    assert.match(okunus, /çarpı on üssü üç mikrolitre/)
    assert.match(okunus, /Z skoru eksi sıfır virgül kırk yedi/)
    assert.match(okunus, /Z skoru artı sıfır virgül kırk beş/)
    assert.match(okunus, /bir virgül sıfır sıfır beş ile bir virgül sıfır üç/)
    assert.match(okunus, /H bir iki üç dört/)
    assert.match(okunus, /V bir iki üç dört/)
    // Abbreviations stay on the existing dictionary path — not expanded into prose just for TTS.
    assert.match(okunus, /em çat/)
    assert.match(okunus, /Gelişimi İzleme ve Destekleme Rehberi/)
    assert.equal(elevenMetni(okunus), okunus)
  })

  it('NOTYA-SES-SAYI-NET-01: leftover codes are spelled digit-by-digit', () => {
    assert.equal(kalanRakamlariOku('lot H1234'), 'lot H bir iki üç dört')
    assert.equal(kalanRakamlariOku('kalan 10³'), 'kalan on üssü üç')
    assert.equal(rakamKaldiMi(kalanRakamlariOku('WBC 7,8 10³')), false)
  })
})
