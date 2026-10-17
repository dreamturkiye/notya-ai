/**
 * YENI-DOKTOR-UX-2026-10 — the English set's in-place tips and first-run checklist: every screen of the
 * signed-in application has a tip, every tip is two to four short sentences, and the checklist's
 * placeholders are present. The spelling of every sentence is already checked by ingilizce.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { EN_UYGULAMA_TEMEL } from './uygulama'
import type { UlkeIpucuBolumu } from '@/lib/ulke/arayuz/metinTipleri'

const BOLUMLER: readonly UlkeIpucuBolumu[] = ['bugun', 'takvim', 'hastalar', 'muayene', 'araclar', 'klinik', 'onBuro', 'ayarlar']

describe('en: in-place tips (YENI-DOKTOR-UX-2026-10)', () => {
  const t = EN_UYGULAMA_TEMEL.ipuclari
  it('the set fills the tips: controls and one tip per screen', () => {
    assert.ok(t, 'ipuclari missing from EN_UYGULAMA_TEMEL')
    for (const alan of [t!.rozet, t!.anladim, t!.birDaha, t!.ayarEtiket, t!.ayarIzoh] as const) {
      assert.ok(alan.trim().length >= 2, `empty control text: ${alan}`)
    }
    assert.ok(t!.ac.includes('%'), 'the trigger’s accessible name must carry % for the heading')
    for (const bolum of BOLUMLER) {
      const i = t!.bolumler[bolum]
      assert.ok(i, `no tip for ${bolum}`)
      assert.ok(i!.baslik.trim().length >= 3, `${bolum}: empty heading`)
      assert.ok(i!.satirlar.length >= 2 && i!.satirlar.length <= 4, `${bolum}: ${i!.satirlar.length} sentences (2–4)`)
      for (const s of i!.satirlar) assert.ok(s.trim().length >= 10 && s.length <= 160, `${bolum}: sentence length: ${s}`)
    }
  })
  it('the first-run checklist: every step named, the done-counter carries %1 and %2', () => {
    const k = EN_UYGULAMA_TEMEL.ilkAdimlar
    assert.ok(k, 'ilkAdimlar missing from EN_UYGULAMA_TEMEL')
    assert.ok(k!.tamamOrani.includes('%1') && k!.tamamOrani.includes('%2'))
    for (const anahtar of ['rol', 'hasta', 'randevu', 'muayene'] as const) {
      assert.ok(k!.adimlar[anahtar].etiket.trim().length >= 3, `${anahtar}: empty label`)
      assert.ok(k!.adimlar[anahtar].aciklama.trim().length >= 3, `${anahtar}: empty line`)
    }
  })
})
