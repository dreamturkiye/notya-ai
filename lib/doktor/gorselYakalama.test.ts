import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  GORSEL_YAKALAMA_PDF_AZAMI_BAYT,
  gorselYakalamaBoyutGecerliMi,
  gorselYakalamaDogrula,
  gorselYakalamaTuru,
  vizitHastayaUygunMu,
} from './gorselYakalama'

describe('GORSEL-YAKALAMA-01 — tür saptama (foto / pdf)', () => {
  it('bilinen görsel mime türleri foto sayılır', () => {
    for (const m of ['image/jpeg', 'image/png', 'image/webp', 'image/heic']) {
      assert.equal(gorselYakalamaTuru(m), 'foto')
    }
  })
  it('application/pdf pdf sayılır', () => {
    assert.equal(gorselYakalamaTuru('application/pdf'), 'pdf')
  })
  it('bilinmeyen / boş mime null döner (ne foto ne pdf)', () => {
    assert.equal(gorselYakalamaTuru(''), null)
    assert.equal(gorselYakalamaTuru(null), null)
    assert.equal(gorselYakalamaTuru('video/mp4'), null) // NOT-01: video kapsam dışı
    assert.equal(gorselYakalamaTuru('application/octet-stream'), null)
  })
})

describe('GORSEL-YAKALAMA-01 — boyut sınırı', () => {
  it('fotoda sınır yok (downscale istemcide yapılır)', () => {
    assert.equal(gorselYakalamaBoyutGecerliMi('foto', 50 * 1024 * 1024).ok, true)
  })
  it('pdf azami boyutu aşarsa reddedilir', () => {
    const r = gorselYakalamaBoyutGecerliMi('pdf', GORSEL_YAKALAMA_PDF_AZAMI_BAYT + 1)
    assert.equal(r.ok, false)
  })
  it('pdf sınır içindeyse kabul edilir', () => {
    assert.equal(gorselYakalamaBoyutGecerliMi('pdf', 1024).ok, true)
  })
})

describe('GORSEL-YAKALAMA-01 — vizit ↔ hasta eşleşmesi', () => {
  it('vizitin hastası aynıysa uygun', () => {
    assert.equal(vizitHastayaUygunMu('hasta-1', 'hasta-1'), true)
  })
  it('vizitin hastası FARKLIYSA uygun değil (aynı hekimin iki hastası karışmasın)', () => {
    assert.equal(vizitHastayaUygunMu('hasta-2', 'hasta-1'), false)
  })
  it('vizitin hasta bağı yoksa (nadiren) çelişki yok sayılır', () => {
    assert.equal(vizitHastayaUygunMu(null, 'hasta-1'), true)
  })
  it('hastaId boşsa asla uygun değil', () => {
    assert.equal(vizitHastayaUygunMu('hasta-1', ''), false)
  })
})

describe('GORSEL-YAKALAMA-01 — tek kapı: gorselYakalamaDogrula', () => {
  it('visitId verilmemişse yalnız tür + boyut kontrol edilir', () => {
    const r = gorselYakalamaDogrula({ tur: 'foto', bayt: 1, hastaId: 'h1', visitId: null, visit: null })
    assert.equal(r.ok, true)
  })
  it('visitId verilip seansSahibi null dönmüşse (yabancı doktorun vizit\'i) 404', () => {
    const r = gorselYakalamaDogrula({ tur: 'foto', bayt: 1, hastaId: 'h1', visitId: 'v1', visit: null })
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.durum, 404)
  })
  it('vizit doktorun ama BAŞKA hastasınınsa 400 (çapraz hasta, aynı hekim)', () => {
    const r = gorselYakalamaDogrula({ tur: 'foto', bayt: 1, hastaId: 'h1', visitId: 'v1', visit: { id: 'v1', patient_id: 'h2' } })
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.durum, 400)
  })
  it('vizit doğru hastanınsa kabul edilir', () => {
    const r = gorselYakalamaDogrula({ tur: 'foto', bayt: 1, hastaId: 'h1', visitId: 'v1', visit: { id: 'v1', patient_id: 'h1' } })
    assert.equal(r.ok, true)
  })
  it('tanımsız dosya türü 400 ile reddedilir', () => {
    const r = gorselYakalamaDogrula({ tur: null, bayt: 1, hastaId: 'h1', visitId: null, visit: null })
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.durum, 400)
  })
})
