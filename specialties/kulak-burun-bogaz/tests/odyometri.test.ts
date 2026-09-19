import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  skorla, bantBul, ptaBandi, degisim, sonrakiOlcumGun, asimetriNotu, kayipTipiGecerliMi,
  PTA_FREKANSLARI, ODYO_BANT_AD, KAYIP_TIPI_AD, ASIMETRI_ESIGI_DB, PTA_ENAZ, PTA_ENUST,
} from '@/specialties/kulak-burun-bogaz/engines/odyometri'

describe('KBB-EXCEPTIONAL-01 odyometri (PTA karar desteği)', () => {
  it('PTA is the mean of 0.5 / 1 / 2 / 4 kHz air conduction thresholds', () => {
    assert.deepEqual([...PTA_FREKANSLARI], [0.5, 1, 2, 4])
    const s = skorla([20, 25, 30, 25], 'sag')
    assert.equal(s.pta, 25)
    assert.equal(s.tamamMi, true)
    assert.equal(s.bant, 'normal')
  })

  it('bands follow the classification ranges', () => {
    const beklenen: Array<[number, string]> = [
      [0, 'normal'], [25, 'normal'], [26, 'hafif'], [40, 'hafif'],
      [41, 'orta'], [55, 'orta'], [56, 'orta_ileri'], [70, 'orta_ileri'],
      [71, 'ileri'], [90, 'ileri'], [91, 'cok_ileri'], [120, 'cok_ileri'],
    ]
    for (const [pta, bant] of beklenen) assert.equal(bantBul(pta), bant, `${pta} dB`)
  })

  it('a missing frequency is never averaged away — partial measurement is not interpreted', () => {
    const s = skorla([30, null, 40, 45], 'sol')
    assert.equal(s.tamamMi, false)
    assert.equal(s.eksikFrekans, 1)
    assert.equal(s.bant, null)
    assert.equal(s.bantAd, '—')
    assert.match(s.ozet, /yorumlanmaz/)
    // 0 dB gerçek bir eşiktir, eksik sayılmaz
    assert.equal(skorla([0, 0, 0, 0]).tamamMi, true)
    assert.equal(skorla([0, 0, 0, 0]).pta, 0)
  })

  it('out-of-range thresholds count as missing, not as data', () => {
    assert.equal(skorla([30, 30, 30, PTA_ENUST + 5]).tamamMi, false)
    assert.equal(skorla([PTA_ENAZ - 5, 30, 30, 30]).tamamMi, false)
    assert.equal(skorla([30, 30, 30, 'abc' as unknown as number]).tamamMi, false)
    assert.equal(skorla([]).pta, null)
  })

  it('summary is labelled decision support and never claims a diagnosis or loss type', () => {
    const s = skorla([50, 55, 60, 55], 'sag')
    assert.match(s.ozet, /karar desteği/)
    assert.match(s.ozet, /tanı ve kayıp tipi hekimin/)
    assert.doesNotMatch(s.ozet, /sensorin[öo]ral|iletim tipi|mikst|otoskleroz|presbiakuzi/i)
    assert.equal(s.dipnot.ref, 'ODYOLOJI_SINIFLAMA')
  })

  it('loss type is clinician-selected only', () => {
    for (const k of Object.keys(KAYIP_TIPI_AD)) assert.equal(kayipTipiGecerliMi(k), true, k)
    assert.equal(kayipTipiGecerliMi('sensorineural'), false)
    assert.equal(kayipTipiGecerliMi(null), false)
    assert.equal(kayipTipiGecerliMi(''), false)
  })

  it('ptaBandi handles direct device readings and rejects nonsense', () => {
    assert.equal(ptaBandi(45).bant, 'orta')
    assert.equal(ptaBandi(45).ad, ODYO_BANT_AD.orta)
    assert.equal(ptaBandi(null).bant, null)
    assert.equal(ptaBandi(999).bant, null)
    assert.equal(ptaBandi(undefined).ad, '—')
  })

  it('change below the test-retest window is not called a change', () => {
    assert.match(degisim(40, 45).not, /test-retest/)
    assert.match(degisim(40, 52).not, /eşik yükselmesi/)
    assert.match(degisim(50, 38).not, /iyileşme/)
    assert.equal(degisim(null, 40).fark, null)
    assert.match(degisim(null, 40).not, /önceki odyometri yok/)
  })

  it('retest calendar tightens for severe bands and never claims to be a clinical order', () => {
    assert.equal(sonrakiOlcumGun('normal'), 365)
    assert.equal(sonrakiOlcumGun('orta'), 180)
    assert.equal(sonrakiOlcumGun('ileri'), 90)
    assert.equal(sonrakiOlcumGun('cok_ileri'), 90)
    assert.equal(sonrakiOlcumGun(null), 180)
  })

  it('asymmetry fires at the threshold and defers the workup decision to the clinician', () => {
    assert.equal(asimetriNotu(20, 20 + ASIMETRI_ESIGI_DB - 1), null)
    const not = asimetriNotu(20, 20 + ASIMETRI_ESIGI_DB)!
    assert.match(not, /15 dB fark/)
    assert.match(not, /hekimin/)
    assert.equal(asimetriNotu(null, 40), null)
    assert.equal(asimetriNotu(40, null), null)
  })
})
