/**
 * DERM-EXCEPTIONAL-01 — Belge Tier A → derm dual-sign köprüsü. Sentetik rapor; model çağrısı yok.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  analizKopruyeUygun, belgeModaliteDerm, belgeTaslakMetni, dermModaliteTask, guvenUst, kopruBolgeDogrula,
  taslakAyiricilar, taslakSonrakiAdim, taslakTaniDiliUyarisi, FITZ_BILINMIYOR_UST,
} from '../imaging/belgeKopru'
import { uzmanOnay, VISION_DISCLAIMER } from '../imaging/vision-tools'
import type { BelgeRaporu } from '../../../core/belgeler/types'
import type { VisionRead } from '../schema'

const kok = path.join(import.meta.dirname, '..', '..', '..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')

const rapor: BelgeRaporu = {
  modalite: 'Dermatoskopi',
  kalite: 'iyi',
  ozet: 'Sentetik: asimetrik pigmente lezyon, düzensiz ağ görünümü.',
  bulgular: ['Düzensiz pigment ağı', 'Çok renklilik (kahverengi–siyah)'],
  tanilar: [{ ad: 'Melanom şüphesi', icd10: 'C43', guven_pct: 88, guven_bant: 'yüksek', destek: [], karsi: [] }],
  acil_bayrak: true,
  oneri: '',
  sinirlar: ['Ölçek referansı yok'],
  hekim_tanisi: [],
  engines_used: ['claude-vision'],
}

const taslak = (o: Partial<Parameters<typeof belgeTaslakMetni>[0]> = {}) =>
  belgeTaslakMetni({ rapor, modalite: 'dermatoskopi', bolge: 'sırt', guvenUstPct: guvenUst(90, true), fitzpatrickBilinmiyor: true, ...o })

describe('Belge → derm dual-sign köprüsü', () => {
  it('modality mapping: dermatoskopi / derm / yara only', () => {
    assert.equal(belgeModaliteDerm('dermatoskopi'), 'dermatoskopi')
    assert.equal(belgeModaliteDerm('derm'), 'derm')
    assert.equal(belgeModaliteDerm('yara'), 'yara')
    for (const m of ['fundus', 'oct', 'cxr', 'ekg', 'pdf_rapor', 'patoloji', null, undefined]) {
      assert.equal(belgeModaliteDerm(m), null, String(m))
    }
  })

  it('task mapping: dermoskopi ipucu only from dermatoskopi', () => {
    assert.equal(dermModaliteTask('dermatoskopi'), 'dermoskopi_ipucu')
    assert.equal(dermModaliteTask('derm'), 'morfoloji')
    assert.equal(dermModaliteTask('yara'), 'morfoloji')
  })

  it('body region required; "tüm vücut" refused (a read is per lesion)', () => {
    assert.deepEqual(kopruBolgeDogrula('  sırt '), { ok: true, bolge: 'sırt' })
    for (const b of ['', ' ', 'a', null, undefined, 'tüm vücut', 'Tum Vucut', 'genel', 'yaygın']) {
      assert.equal(kopruBolgeDogrula(b).ok, false, String(b))
    }
  })

  it('unknown Fitzpatrick caps confidence at ≤70%; a recorded skin type keeps the fusion cap', () => {
    assert.equal(guvenUst(90, true), FITZ_BILINMIYOR_UST)
    assert.equal(guvenUst(60, true), 60)
    assert.equal(guvenUst(85, false), 85)
    assert.equal(guvenUst(null, true), FITZ_BILINMIYOR_UST)
  })

  it('draft text: disclaimer, region, diagnoses reframed as "olası bulgu — tanı değildir", clipped to cap', () => {
    const t = taslak()
    assert.match(t, new RegExp(VISION_DISCLAIMER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.match(t, /Dermatoskopi, sırt/)
    assert.match(t, /tanı değildir — resmî tanıyı hekim lezyon kartında kilitler, histopatoloji esastır/)
    assert.match(t, /Melanom şüphesi \(%70\)/, 'model 88% is clipped to the 70% unknown-Fitzpatrick cap')
    assert.match(t, /Deri tipi \(Fitzpatrick\) bilinmiyor — güven en çok %70/)
    assert.match(t, /aynı gün ABCDE \/ dermoskopi/)
    assert.equal(taslakTaniDiliUyarisi(t), null)
    assert.ok(t.length <= 3000)
  })

  it('draft never writes a diagnosis or a dose', () => {
    const t = taslak()
    assert.ok(!/kesin tanı|tanısı konmuştur|melanomdur/i.test(t))
    assert.ok(!/\b\d+\s?(mg|mcg|IU|mg\/kg|J\/cm²)\b/i.test(t), 'doz / J-cm² taslağa yazılmaz')
    assert.equal(taslakTaniDiliUyarisi('Lezyon melanomdur.'), 'Taslak kesin tanı dili içeriyor — okuma karar desteğidir, tanı histopatoloji ile konur.')
  })

  it('differentials and next step stay decision support', () => {
    assert.deepEqual(taslakAyiricilar(rapor, 70), ['Melanom şüphesi (%70) — olası bulgu'])
    assert.match(taslakSonrakiAdim(rapor, 'dermatoskopi'), /Aynı gün hekim değerlendirmesi/)
    assert.match(taslakSonrakiAdim({ ...rapor, acil_bayrak: false }, 'yara'), /Yara bakımı kontrolü/)
    assert.match(taslakSonrakiAdim({ ...rapor, acil_bayrak: false }, 'derm'), /Uzman onayı/)
  })

  it('failed / low-quality analyses are refused (morphology checklist is the fallback)', () => {
    assert.equal(analizKopruyeUygun('hata', null).ok, false)
    assert.equal(analizKopruyeUygun('kalite_dusuk', rapor).ok, false)
    assert.equal(analizKopruyeUygun('taslak', { ...rapor, kalite: 'dusuk' }).ok, false)
    assert.equal(analizKopruyeUygun('taslak', rapor).ok, true)
  })

  it('dual-sign intact: an asistan draft from the bridge still needs the uzman', () => {
    const okuma: VisionRead = {
      id: 'vr-1', assetIds: [], task: 'dermoskopi_ipucu', status: 'draft', drafted_by: 'asistan', approved_by: null,
      observations: taslak(), differentials: taslakAyiricilar(rapor, 70), next_step: taslakSonrakiAdim(rapor, 'dermatoskopi'),
      disclaimer: VISION_DISCLAIMER,
    }
    assert.equal(uzmanOnay(okuma, 'asistan').ok, false)
    const onay = uzmanOnay(okuma, 'uzman')
    assert.equal(onay.ok, true)
    assert.equal(onay.ok && onay.read.status, 'onayli')
  })
})

describe('Köprü yalnız dermatoloji branşında (brans-alan-sizmasi)', () => {
  it('derm route bridges only derm modalities; the göz bridge stays on the göz route', () => {
    const rota = oku('app/api/doktor/dermatoloji/route.ts')
    assert.match(rota, /action === 'goruntu-okuma'/)
    assert.match(rota, /tierAYazVeFuzyonla\(/)
    for (const gozKelimesi of ['fundus', "'oct'", 'dis_goz', 'on_segment', 'goz_goruntu_okumalari', 'tekAlanFundus']) {
      assert.ok(!rota.includes(gozKelimesi), `göz alanı derm rotasına sızmaz: ${gozKelimesi}`)
    }
  })

  it('the shared Belge page bridge stays göz-only (router flag untouched)', () => {
    const { BRANS_KURALLARI } = require('../../../core/belgeler/router') as typeof import('../../../core/belgeler/router')
    const acik = Object.entries(BRANS_KURALLARI).filter(([, k]) => k.goruntuOkumaKoprusu).map(([b]) => b)
    assert.deepEqual(acik, ['goz'], 'derm köprüsü kendi chapter UI’sinden çalışır; ortak Belge sayfası göz-özel kalır')
  })

  it('BelgeAnalizOzet exposes the bridge button without leaking eye / growth vocabulary', () => {
    const ui = oku('specialties/dermatoloji/ui/BelgeAnalizOzet.tsx')
    assert.match(ui, /Görüntü okumasına aktar/)
    assert.match(ui, /goruntu-okuma/)
    for (const yabanci of ['OD (sağ)', 'OS (sol)', 'fundus', 'GİB', 'persentil', 'Baş Çevresi', 'Neyzi']) {
      assert.ok(!ui.includes(yabanci), `başka branşın alanı derm UI’sine sızmaz: ${yabanci}`)
    }
  })
})
