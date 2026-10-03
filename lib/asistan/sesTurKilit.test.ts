import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sesTurKilitAyniMi, type SesTurKilit } from './sesTurKilit'

describe('NOTYA-BUYUME-KISA-01 / NOTYA-SES-TEK-CEVAP-01 sesTurKilit', () => {
  it('aynı / bulanık mesaj TTL içinde meşgul sayılır', () => {
    const k: SesTurKilit = {
      mesaj: 'Rıdvan Dilmen\'in büyümesi yaşına uygun mu?',
      zaman: new Date().toISOString(),
      claimId: 'a',
    }
    assert.equal(sesTurKilitAyniMi(k.mesaj, k), true)
    assert.equal(sesTurKilitAyniMi('Rıdvan Dilmen büyümesi yaşına uygun mu Hocam', k), true)
    assert.equal(sesTurKilitAyniMi('Umutcan\'ın aşıları neler?', k), false)
  })

  it('24 ay muayene sorusu bulanık eşleşir', () => {
    const k: SesTurKilit = {
      mesaj: '24 aylık sağlam çocuk muayenesini yapacağım. Bu muayenede dikkat etmem gerekenler, yapmam gerekenler nelerdir?',
      zaman: new Date().toISOString(),
      claimId: 'b',
    }
    assert.equal(
      sesTurKilitAyniMi(
        '24 aylık sağlığım çocuk muayenesini yapacağım bu muayenede dikkat etmem gerekenler nelerdir',
        k,
      ),
      true,
    )
  })

  it('TTL dolunca serbest', () => {
    const k: SesTurKilit = {
      mesaj: 'Lab sonuçları neler?',
      zaman: new Date(Date.now() - 60_000).toISOString(),
    }
    assert.equal(sesTurKilitAyniMi(k.mesaj, k), false)
  })
})
