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
import { AsistanCanli, CanliKarti } from '@/components/ulke/uygulama/AsistanCanli'
import { AsistanGorunumu } from '@/components/ulke/uygulama/AsistanSayfasi'

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
      const html = renderToStaticMarkup(React.createElement(CanliKarti, { t: m.asistanCanli, ad: 'Name', href: '/x/asistan' }))
      // The home card is a door to the assistant page, not a call button of its own (AU-CANLI-02).
      assert.match(html, /href="\/x\/asistan"/)
      assert.ok(!/<button/.test(html))
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

  it('the assistant page: fail closed, the door on the home, the sidebar and the typed route', () => {
    const m = uygulamaMetni(ulkePaketi().varsayilanDil)
    if (!m.asistanCanli) return assert.ok(true)
    const t = m.asistanCanli
    const props = { t, unvan: 'Role', durum: 'bosta' as const, balonlar: [], hata: null, bekliyor: false, girdi: '', onGirdi: () => {}, onGonder: () => {}, onBaslat: () => {}, onBitir: () => {}, onTemizle: () => {}, geriHref: '/today' }
    // Not asked yet / not available: no microphone control at all.
    for (const hazir of [undefined, null]) assert.ok(!/data-eylem="baslat"/.test(renderToStaticMarkup(React.createElement(AsistanGorunumu, { ...props, hazir }))))
    const html = renderToStaticMarkup(React.createElement(AsistanGorunumu, { ...props, hazir: { ad: 'Dr Name', kisaAd: 'Name', cinsiyet: 'kadin' as const }, balonlar: [{ id: 'a', sira: 1, role: 'user' as const, text: 'Question?' }, { id: 'b', sira: 2, role: 'ai' as const, text: 'Answer.' }] }))
    assert.match(html, /data-eylem="baslat"/)
    assert.match(html, /data-alan="asistan-yazili"/)
    assert.match(html, /data-rol="siz"[\s\S]*Question\?[\s\S]*data-rol="asistan"[\s\S]*Answer\./)
    const sayfa = readFileSync(join(KOK, 'app/asistan/page.ulke.tsx'), 'utf8')
    assert.match(sayfa, /ekran="asistan"/)
    const yazili = readFileSync(join(KOK, 'app/api/ulke/asistan-canli/yazili/route.ulke.ts'), 'utf8')
    assert.match(yazili, /ozellikAcik\('cekirdekMuayene'\)[\s\S]*ulkeOturum[\s\S]*canliYaziliCevabi/)
    assert.ok(!/searchParams/.test(yazili))
    // The shared screens: the page is a registered screen, the sidebar links to it, the home links to it.
    assert.match(readFileSync(join(KOK, 'components/ulke/uygulama/Kabuk.tsx'), 'utf8'), /baglanti\('asistan', YOL\.asistan/)
    assert.match(readFileSync(join(KOK, 'components/ulke/uygulama/AsistanCanli.tsx'), 'utf8'), /YOL\.asistan/)
  })
})
