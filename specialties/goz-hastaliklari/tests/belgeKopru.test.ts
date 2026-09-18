/**
 * GOZ-EXCEPTIONAL-01 — Belge Tier A → göz dual-sign köprüsü. Sentetik rapor; model çağrısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { belgeModaliteGoz, gozModaliteBelge, guvenUst, kopruGozDogrula, analizKopruyeUygun, belgeTaslakMetni, TEK_ALAN_FUNDUS_UST } from '../imaging/belgeKopru'
import { okumaGecisi, taslakTaniDiliUyarisi } from '../imaging/dualSign'
import { BRANS_KURALLARI, bransKurali } from '../../../core/belgeler/router'
import type { BelgeRaporu } from '../../../core/belgeler/types'

const kok = path.join(import.meta.dirname, '..', '..', '..')
const rapor: BelgeRaporu = {
  modalite: 'Fundus', kalite: 'iyi', ozet: 'Sentetik: arka kutupta dağınık mikroanevrizma görünümü.', bulgular: ['Mikroanevrizma benzeri noktalar', 'Optik disk sınırları seçilebiliyor'],
  tanilar: [{ ad: 'Orta nonproliferatif DR', icd10: 'E11.32', guven_pct: 88, guven_bant: 'yüksek', destek: [], karsi: [] }],
  acil_bayrak: false, oneri: '', sinirlar: ['Perifer değerlendirilemez'], hekim_tanisi: [], engines_used: ['claude-vision'],
}

describe('Belge → dual-sign köprüsü', () => {
  it('modality mapping: fundus / oct / dış göz only', () => {
    assert.equal(belgeModaliteGoz('fundus'), 'fundus'); assert.equal(belgeModaliteGoz('oct'), 'oct'); assert.equal(belgeModaliteGoz('dis_goz'), 'on_segment')
    for (const m of ['cxr', 'ekg', 'derm', 'pdf_rapor', null]) assert.equal(belgeModaliteGoz(m), null, String(m))
    assert.equal(gozModaliteBelge('on_segment'), 'dis_goz')
  })
  it('OD/OS required (no OU, no empty)', () => {
    assert.equal(kopruGozDogrula('sag').ok, true)
    for (const g of ['iki', '', null, 'OD']) assert.equal(kopruGozDogrula(g).ok, false, String(g))
  })
  it('single-field fundus caps confidence at ≤70%; other modalities keep fusion cap', () => {
    assert.equal(guvenUst(90, 'fundus', true), TEK_ALAN_FUNDUS_UST)
    assert.equal(guvenUst(60, 'fundus', true), 60)
    assert.equal(guvenUst(85, 'oct', true), 85)
    assert.equal(guvenUst(85, 'fundus', false), 85)
  })
  it('draft text: disclaimer, per-eye, diagnoses reframed as "olası bulgu — evre değildir", clipped to cap, no certainty language', () => {
    const t = belgeTaslakMetni({ rapor, modalite: 'fundus', goz: 'sol', guvenUstPct: guvenUst(90, 'fundus', true), tekAlan: true })
    assert.match(t, /Karar desteği, tanı değildir\. Uzman onayı gerekir\./)
    assert.match(t, /sol göz \(OS\)/)
    assert.match(t, /evre değildir — DR evresini hekim DR kartında kilitler/)
    assert.match(t, /Orta nonproliferatif DR \(%70\)/, 'model 88% is clipped to the 70% single-field cap')
    assert.match(t, /Tek alan fundus fotoğrafı — güven en çok %70/)
    assert.equal(taslakTaniDiliUyarisi(t), null)
    assert.ok(t.length <= 3000)
  })
  it('failed / low-quality analyses are refused (checklist scaffold is the fallback)', () => {
    assert.equal(analizKopruyeUygun('hata', null).ok, false)
    assert.equal(analizKopruyeUygun('kalite_dusuk', rapor).ok, false)
    assert.equal(analizKopruyeUygun('taslak', { ...rapor, kalite: 'dusuk' }).ok, false)
    assert.equal(analizKopruyeUygun('taslak', rapor).ok, true)
  })
  it('dual-sign intact: an asistan draft from the bridge still needs the uzman', () => {
    assert.equal(okumaGecisi({ taslak: 'x', taslakYazan: 'asistan', durum: 'draft', uzmanMetin: null }, 'onayla', 'asistan').ok, false)
    assert.equal(okumaGecisi({ taslak: 'x', taslakYazan: 'asistan', durum: 'draft', uzmanMetin: null }, 'onayla', 'uzman').ok, true)
  })
})

describe('Köprü yalnız göz branşında (brans-alan-sizmasi)', () => {
  it('goruntuOkumaKoprusu is set only on the göz rule', () => {
    const acik = Object.entries(BRANS_KURALLARI).filter(([, k]) => k.goruntuOkumaKoprusu).map(([b]) => b)
    assert.deepEqual(acik, ['goz'])
    assert.ok(!bransKurali('dahiliye').goruntuOkumaKoprusu && !bransKurali('pediatri').goruntuOkumaKoprusu && !bransKurali('aile').goruntuOkumaKoprusu)
  })
  it('shared Belge page reads the router flag (no hard-coded branş string); both routes share the Tier A helper', () => {
    const sayfa = fs.readFileSync(path.join(kok, 'app/dashboard/doktor/hastalar/[id]/belgeler/[belgeId]/page.tsx'), 'utf8')
    assert.match(sayfa, /kural\.goruntuOkumaKoprusu &&/)
    assert.doesNotMatch(sayfa, /bransKey === ['"]goz['"]/)
    assert.match(fs.readFileSync(path.join(kok, 'app/api/doktor/belgeler/analiz/route.ts'), 'utf8'), /tierAYazVeFuzyonla\(/)
    assert.match(fs.readFileSync(path.join(kok, 'app/api/doktor/goz/_ek.ts'), 'utf8'), /tierAYazVeFuzyonla\(/)
  })
})
