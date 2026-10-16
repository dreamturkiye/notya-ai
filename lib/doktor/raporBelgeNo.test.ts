import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { belgeTarihGorunum, belgeTarihYYYYMMDD, raporBelgeNoUret } from './raporBelgeNo'

describe('raporBelgeNo', () => {
  it('belgeTarihYYYYMMDD belirtilen tarihi biçimler', () => {
    assert.equal(belgeTarihYYYYMMDD('2026-10-15'), '20261015')
  })

  it('belgeTarihYYYYMMDD geçersiz/boş tarihte bugünü kullanır', () => {
    const bugun = new Date()
    const beklenen = `${bugun.getFullYear()}${String(bugun.getMonth() + 1).padStart(2, '0')}${String(bugun.getDate()).padStart(2, '0')}`
    assert.equal(belgeTarihYYYYMMDD(null), beklenen)
    assert.equal(belgeTarihYYYYMMDD('not-a-date'), beklenen)
  })

  it('raporBelgeNoUret tip kodunu büyük harfe çevirir ve enjekte edilen rastgele üreticiyi kullanır', () => {
    const no = raporBelgeNoUret('istirahat', '2026-10-15', () => 'AB12')
    assert.equal(no, 'NOTYA-ISTIRAHAT-20261015-AB12')
  })

  it('raporBelgeNoUret boş tip koduna RPR düşer', () => {
    const no = raporBelgeNoUret('', '2026-10-15', () => 'FFFF')
    assert.match(no, /^NOTYA-RPR-20261015-FFFF$/)
  })

  it('raporBelgeNoUret enjeksiyon olmadan da tutarlı biçimde üretir (rastgele ama hex)', () => {
    const no = raporBelgeNoUret('spor', '2026-10-15')
    assert.match(no, /^NOTYA-SPOR-20261015-[0-9A-F]{4}$/)
  })

  it('belgeTarihGorunum tr-TR biçiminde', () => {
    assert.match(belgeTarihGorunum('2026-10-15'), /15\.10\.2026/)
  })
})
