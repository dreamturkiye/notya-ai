/**
 * AU-PEDIATRI-GOLD-01a — specialty voice lines on every offered role; live prompt carries them.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { canliIstem } from '@/lib/ulke/asistan/istem'
import { AU_ASISTAN_ADLARI } from '../klinik/asistanAdlari'
import { AU_CANLI_ASISTAN } from './canli'
import { auAsistanKaynakBlogu } from './kaynaklar'
import { AU_SES_ODAK, auSesOdakBlogu } from './sesOdak'

describe('AU specialty voice lines (GOLD-01a)', () => {
  it('every offered role has clinical focus and a Triple Zero emergency line', () => {
    for (const rol of Object.keys(AU_ASISTAN_ADLARI)) {
      const s = AU_SES_ODAK[rol as keyof typeof AU_SES_ODAK]
      assert.ok(s && s.odak.length >= 1, rol)
      assert.match(s.acil, /Triple Zero \(000\)/, rol)
      assert.match(auSesOdakBlogu(rol)!, /CLINICAL FOCUS/, rol)
    }
    assert.equal(auSesOdakBlogu('hair-transplant'), null)
  })

  it('kaynakBlogu and canliIstem carry the focus block for paediatrics and cardiology', () => {
    for (const rol of ['paediatrics', 'cardiology', 'physiotherapy'] as const) {
      const kaynak = auAsistanKaynakBlogu(rol)
      assert.ok(kaynak)
      assert.match(kaynak!, /CLINICAL FOCUS FOR THIS ROLE/)
      assert.match(kaynak!, /EMERGENCY PATHWAY/)
      const ad = AU_ASISTAN_ADLARI[rol]
      const istem = canliIstem({
        canli: AU_CANLI_ASISTAN,
        tamAd: ad.tamAd,
        kisaAd: ad.kisaAd,
        rolAdi: rol,
        rol,
        acilNumara: '000',
      })
      assert.match(istem, /CLINICAL FOCUS FOR THIS ROLE/)
      assert.match(istem, /Triple Zero \(000\)/)
    }
  })

  it('paediatrics focus names fever under three months; cardiology does not', () => {
    assert.match(auSesOdakBlogu('paediatrics')!, /three months|under three months|Fever under/i)
    assert.doesNotMatch(auSesOdakBlogu('cardiology')!, /three months/)
  })
})
