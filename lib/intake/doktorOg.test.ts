import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { doktorBasHarfler, intakeOgAciklama, intakeOgBaslik, type IntakeDoktorOg } from './doktorOg'

describe('NOTYA-INTAKE-OG-01', () => {
  it('baş harfler Dr. önekini atlar', () => {
    assert.equal(doktorBasHarfler('Dr. Kaan Arıoğlu'), 'KA')
    assert.equal(doktorBasHarfler('Dr. Gökhan Mamur'), 'GM')
    assert.equal(doktorBasHarfler('Kaan'), 'KA')
  })

  it('önizleme başlığı doktor adı, Notya AI değil', () => {
    const d: IntakeDoktorOg = {
      doktorAdi: 'Dr. Kaan Arıoğlu',
      initials: 'KA',
      hastaAdi: 'Ali Kara',
      bransEtiket: 'Pediatri (Çocuk Sağlığı)',
    }
    assert.equal(intakeOgBaslik(d), 'Dr. Kaan Arıoğlu')
    assert.match(intakeOgAciklama(d), /Ali Kara/)
    assert.match(intakeOgAciklama(d), /Hasta Bilgi Formu/)
    assert.doesNotMatch(intakeOgBaslik(d), /Notya/i)
    assert.doesNotMatch(intakeOgAciklama(d), /Yapay Zekâ Uzman/i)
  })
})
