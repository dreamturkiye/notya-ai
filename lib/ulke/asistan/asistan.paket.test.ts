/**
 * AU-CANLI-01 — the live assistant against the ACTIVE pack (run once per country by scripts/ulke-test.mjs).
 * A pack either brings the whole feature or none of it; and where it is brought, the two-voices rule and the
 * fail-closed rule hold. Nothing here names a country.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { asistanKimligi, roller, uygulamaMetni } from '@/lib/ulke/arayuz'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { canliDurum } from './ajan'
import { AsistanCanli, CanliPanel } from '@/components/ulke/uygulama/AsistanCanli'

const KOK = join(__dirname, '../../..')
const SIR = 'q'.repeat(32)

describe('live assistant: the active pack', () => {
  const canli = AKTIF_KLINIK?.canliAsistan
  const ses = AKTIF_KLINIK?.ses

  it('brings the whole feature or none of it', () => {
    if (!canli) return assert.ok(true)
    assert.ok(ses, 'a live assistant needs the pack\'s two voices')
    assert.ok(canli.dilAdi && canli.ulkeAdi && canli.pratikBaglami.length > 0 && canli.sinirlar.length > 0)
    assert.ok(canli.gunlukTurLimiti > 0)
    assert.equal(typeof canli.kaynakBlogu, 'function')
    assert.ok(canli.ekranSozleri.liste(3).includes('3'))
  })

  it('where it exists, every role with an assistant has a gender that picks one of exactly two voices', () => {
    if (!canli || !ses) return assert.ok(true)
    const dil = ulkePaketi().varsayilanDil
    const sesler = new Set<string>()
    for (const r of roller()) {
      const kimlik = asistanKimligi(r.anahtar, dil)
      if (!kimlik) continue
      assert.ok(kimlik.cinsiyet === 'erkek' || kimlik.cinsiyet === 'kadin', r.anahtar)
      sesler.add(ses.sesler[kimlik.cinsiyet].id)
    }
    assert.ok(sesler.size <= 2)
  })

  it('without agents and secrets the feature is off for every role', () => {
    const dil = ulkePaketi().varsayilanDil
    for (const r of roller()) {
      const d = canliDurum({ kod: ulkePaketi().kod, ses, canli, kimlik: asistanKimligi(r.anahtar, dil), ortam: {} })
      assert.equal(d.hazir, false, r.anahtar)
    }
  })

  it('the home draws no microphone unless the server said yes', () => {
    const m = uygulamaMetni(ulkePaketi().varsayilanDil)
    // No api, or a catalogue without the slot: nothing at all.
    assert.equal(renderToStaticMarkup(React.createElement(AsistanCanli, { m })), '')
    if (m.asistanCanli) {
      const html = renderToStaticMarkup(React.createElement(CanliPanel, { t: m.asistanCanli, ad: 'Name', durum: 'bosta', mesajlar: [], gecici: '', hata: null, onBaslat: () => {}, onBitir: () => {} }))
      assert.match(html, /data-eylem="baslat"/)
      assert.ok(!/data-eylem="bitir"/.test(html))
    }
  })

  it('the routes are the kit\'s: session first, feature gate, no id from the request', () => {
    const rota = readFileSync(join(KOK, 'app/api/ulke/asistan-canli/route.ulke.ts'), 'utf8')
    assert.match(rota, /ozellikAcik\('cekirdekMuayene'\)[\s\S]*ulkeOturum/)
    assert.ok(!/searchParams|req\.json|govdeOku/.test(rota))
    for (const yol of ['app/api/ulke/asistan-canli/ses-llm/v1/route.ulke.ts', 'app/api/ulke/asistan-canli/ses-llm/v1/chat/completions/route.ulke.ts']) {
      assert.match(readFileSync(join(KOK, yol), 'utf8'), /canliLlmPost/)
    }
    void SIR
  })
})
