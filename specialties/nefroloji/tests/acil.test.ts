/**
 * NEFROLOJI-DEEPEN-01 — Acil / kırmızı bayrak motor birim testleri (psik peer bar).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  acilTara, hekimOnayiGerekliMi, intakeAcilKodlari,
  ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, INTAKE_ACIL_SECENEKLERI, type AcilKod,
} from '../engines/acil'
import { BRANS_SORULARI } from '@/lib/intake/bransSorulari'
import { hastaDiliTemizMi } from '../engines/portal-bobreklerim'

const KODLAR: AcilKod[] = ['hiperkalemi', 'asiri_sivi', 'uremik_acil', 'diyaliz_acil', 'anuri_oliguri']

describe('NEFROLOJI-DEEPEN-01 acil / kırmızı bayrak', () => {
  it('declares exactly the five outpatient nefro codes', () => {
    assert.deepEqual(ACIL_KODLARI.map((k) => k.kod), KODLAR)
    assert.equal(new Set(ACIL_KODLARI.map((k) => k.ad)).size, 5)
  })

  it('intake checkbox labels match INTAKE_ACIL_SECENEKLERI one-to-one', () => {
    const alan = BRANS_SORULARI.nefroloji.alanlar.find((a) => a.id === 'acilBelirtilerNef')
    assert.ok(alan, 'acilBelirtilerNef intake alanı yok')
    assert.equal(alan!.tur, 'checkbox-grup')
    const secenekler = alan!.secenekler || []
    assert.deepEqual(secenekler, [...INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket), 'Yok'])
    assert.match(String(alan!.yardim || ''), /112/)
  })

  it('intake answers map back to codes; "Yok" maps to nothing', () => {
    assert.deepEqual(intakeAcilKodlari(['Şiddetli halsizlik veya çarpıntı (yüksek potasyum şüphesi)']), ['hiperkalemi'])
    assert.deepEqual(intakeAcilKodlari(['İdrarın birden azalması veya kesilmesi']), ['anuri_oliguri'])
    assert.deepEqual(intakeAcilKodlari(['Yok']), [])
    assert.deepEqual(intakeAcilKodlari(null), [])
    assert.deepEqual(intakeAcilKodlari('Şiddetli halsizlik'), [])
    const hepsi = intakeAcilKodlari(INTAKE_ACIL_SECENEKLERI.map((s) => s.etiket))
    assert.deepEqual(hepsi.sort(), [...KODLAR].sort())
  })

  it('acilTara finds free-text red flags', () => {
    assert.deepEqual(acilTara(['potasyum 6.5 hiperkalemi']).map((b) => b.kod), ['hiperkalemi'])
    assert.deepEqual(acilTara(['Ani nefes darlığı ve pulmoner ödem']).map((b) => b.kod), ['asiri_sivi'])
    assert.deepEqual(acilTara(['Üremik ensefalopati bilinç değişikliği']).map((b) => b.kod), ['uremik_acil'])
    assert.deepEqual(acilTara(['Diyaliz fistül kanama']).map((b) => b.kod), ['diyaliz_acil'])
    assert.deepEqual(acilTara(['Anüri idrar yok']).map((b) => b.kod), ['anuri_oliguri'])
    // Türkçe büyük "İ"
    assert.ok(acilTara(['İdrar birden kesildi']).some((b) => b.kod === 'anuri_oliguri'))
    assert.deepEqual(acilTara(['Hafif yorgunluk, iştah biraz az']), [])
    assert.deepEqual(acilTara([null, undefined, '']), [])
  })

  it('doctor checkboxes raise flags without any text, and duplicates collapse', () => {
    const b = acilTara(['hiperkalemi'], ['hiperkalemi', 'asiri_sivi'])
    assert.deepEqual(b.map((x) => x.kod).sort(), ['asiri_sivi', 'hiperkalemi'])
    assert.equal(acilTara([], ['diyaliz_acil']).length, 1)
  })

  it('"hemen" flags sort first and require physician sign-off', () => {
    const b = acilTara([], ['diyaliz_acil', 'hiperkalemi'])
    assert.equal(b[0].oncelik, 'hemen')
    assert.equal(b[1].oncelik, 'ayni_gun')
    assert.equal(hekimOnayiGerekliMi(b), true)
    assert.equal(hekimOnayiGerekliMi(acilTara([], ['diyaliz_acil'])), false)
    assert.equal(hekimOnayiGerekliMi([]), false)
  })

  it('every action line routes to 112 / acil and never invents a dose', () => {
    for (const kod of KODLAR) {
      const b = acilTara([], [kod])[0]
      assert.ok(b.eylem.length > 20, `${kod} eylem metni yok`)
      assert.doesNotMatch(b.eylem, /\bmg\b|\bmL\b|\bIU\b/i)
      assert.doesNotMatch(b.eylem, /tanı koy|CKD stage/i)
    }
    const hemen = KODLAR.filter((k) => acilTara([], [k])[0].oncelik === 'hemen')
    for (const k of hemen) assert.match(acilTara([], [k])[0].eylem, /112|acil/i)
    assert.match(HASTA_ACIL_METNI, /112/)
  })

  it('patient-facing emergency text stays inside the portal vocabulary lock', () => {
    assert.equal(hastaDiliTemizMi(HASTA_ACIL_METNI), true)
    for (const s of INTAKE_ACIL_SECENEKLERI) assert.equal(hastaDiliTemizMi(s.etiket), true, s.etiket)
  })

  it('acil checklist is physician-owned and covers 112 / diyaliz / EKG', () => {
    assert.ok(ACIL_KONTROL_LISTESI.length >= 5)
    const hepsi = ACIL_KONTROL_LISTESI.join(' ')
    assert.match(hepsi, /112/)
    assert.match(hepsi, /diyaliz/i)
    assert.match(hepsi, /Potasyum|EKG/i)
  })
})
