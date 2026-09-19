import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  acilTara, hekimOnayiGerekliMi, intakeAcilKodlari,
  ACIL_KODLARI, GUVENLIK_KONTROL_LISTESI, HASTA_ACIL_METNI, INTAKE_ACIL_SECENEKLERI, type AcilKod,
} from '../engines/acil'
import { BRANS_SORULARI } from '@/lib/intake/bransSorulari'
import { hastaDiliTemizMi } from '../engines/portal-ruhsagligim'

const KODLAR: AcilKod[] = ['intihar_dusunce', 'kendine_zarar', 'siddet_riski', 'psikoz_acil', 'yok_sayma']

describe('PSIK-EXCEPTIONAL-01 güvenlik / acil kapısı', () => {
  it('declares exactly the five outpatient safety codes', () => {
    assert.deepEqual(ACIL_KODLARI.map((k) => k.kod), KODLAR)
    assert.equal(new Set(ACIL_KODLARI.map((k) => k.ad)).size, 5)
  })

  it('intake checkbox labels match INTAKE_ACIL_SECENEKLERI one-to-one', () => {
    const alan = BRANS_SORULARI.psikiyatri.alanlar.find((a) => a.id === 'acilBelirtilerPsik')
    assert.ok(alan, 'acilBelirtilerPsik intake alanı yok')
    assert.equal(alan!.tur, 'checkbox-grup')
    const secenekler = alan!.secenekler || []
    assert.deepEqual(secenekler, [...INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket), 'Yok'])
    assert.match(String(alan!.yardim || ''), /112/)
  })

  it('intake answers map back to codes; "Yok" maps to nothing', () => {
    assert.deepEqual(intakeAcilKodlari(['Yaşamımı sonlandırma düşüncesi']), ['intihar_dusunce'])
    assert.deepEqual(intakeAcilKodlari(['İlacımı kendi kararımla bıraktım']), ['yok_sayma'])
    assert.deepEqual(intakeAcilKodlari(['Yok']), [])
    assert.deepEqual(intakeAcilKodlari(null), [])
    assert.deepEqual(intakeAcilKodlari('Yaşamımı sonlandırma düşüncesi'), [])
    const hepsi = intakeAcilKodlari(INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket))
    assert.deepEqual(hepsi.sort(), [...KODLAR].sort())
  })

  it('acilTara finds free-text red flags', () => {
    assert.deepEqual(acilTara(['Artık yaşamak istemiyorum, ölmek istiyorum']).map((b) => b.kod), ['intihar_dusunce'])
    assert.deepEqual(acilTara(['Dün akşam bir kutu ilaç içtim']).map((b) => b.kod), ['kendine_zarar'])
    assert.deepEqual(acilTara(['Olmayan sesler duyuyorum, takip edildiğimi düşünüyorum']).map((b) => b.kod), ['psikoz_acil'])
    assert.deepEqual(acilTara(['İlaçlarımı kestim, kendi kararımla bıraktım']).map((b) => b.kod), ['yok_sayma'])
    // Türkçe büyük "İ" cümle başında: JS /i bayrağı bunu "i" ile eşlemez, motor önce tr-TR küçültür
    assert.deepEqual(acilTara(['İntihar etmeyi düşünüyorum']).map((b) => b.kod), ['intihar_dusunce'])
    assert.deepEqual(acilTara(['Uykum düzensiz, canım hiçbir şey yapmak istemiyor']), [])
    assert.deepEqual(acilTara([null, undefined, '']), [])
  })

  it('doctor checkboxes raise flags without any text, and duplicates collapse', () => {
    const b = acilTara(['ölmek istiyorum'], ['intihar_dusunce', 'siddet_riski'])
    assert.deepEqual(b.map((x) => x.kod).sort(), ['intihar_dusunce', 'siddet_riski'])
    assert.equal(acilTara([], ['psikoz_acil']).length, 1)
  })

  it('"hemen" flags sort first and require physician sign-off', () => {
    const b = acilTara([], ['yok_sayma', 'intihar_dusunce'])
    assert.equal(b[0].oncelik, 'hemen')
    assert.equal(b[1].oncelik, 'ayni_gun')
    assert.equal(hekimOnayiGerekliMi(b), true)
    assert.equal(hekimOnayiGerekliMi(acilTara([], ['yok_sayma'])), false)
    assert.equal(hekimOnayiGerekliMi([]), false)
  })

  it('every action line routes to 112 / acil instead of a portal message, and never names a diagnosis', () => {
    for (const kod of KODLAR) {
      const b = acilTara([], [kod])[0]
      assert.ok(b.eylem.length > 20, `${kod} eylem metni yok`)
      assert.doesNotMatch(b.eylem, /depresyon|bipolar|şizofren|psikoz tanısı/i)
      assert.doesNotMatch(b.eylem, /\bmg\b|\bmL\b/i)
    }
    const hemen = KODLAR.filter((k) => acilTara([], [k])[0].oncelik === 'hemen')
    for (const k of hemen) assert.match(acilTara([], [k])[0].eylem, /112|acil/i)
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.doesNotMatch(HASTA_ACIL_METNI, /tanı|PHQ|GAD|skor/i)
  })

  it('patient-facing emergency text stays inside the portal vocabulary lock', () => {
    assert.equal(hastaDiliTemizMi(HASTA_ACIL_METNI), true)
    for (const s of INTAKE_ACIL_SECENEKLERI) assert.equal(hastaDiliTemizMi(s.etiket), true, s.etiket)
  })

  it('safety checklist is physician-owned and covers means / support / crisis plan', () => {
    assert.ok(GUVENLIK_KONTROL_LISTESI.length >= 6)
    const hepsi = GUVENLIK_KONTROL_LISTESI.join(' ')
    assert.match(hepsi, /plan/i)
    assert.match(hepsi, /silah|ilaç erişimi|biriktir/i)
    assert.match(hepsi, /112/)
    assert.match(hepsi, /destek/i)
  })
})
