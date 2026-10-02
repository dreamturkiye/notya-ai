/**
 * NOTYA-AYSE-OZET-01 — a spoken turn must never end with the answer on screen and nothing heard.
 *
 * Live (Dr. Gökhan, 2026-10-02): a long written answer reached the screen with no speech; the `[fish-ws]` log lines
 * of such turns carry `ilk_ses_ms: null`. Two causes were ours:
 *   1. a live socket that takes the text and ends WITHOUT an error and without one byte of audio closed the turn as
 *      `ses_bit` — the browser had been told audio was coming (`ses_hazir`) and spoke nothing;
 *   2. the REST fallback offset was "everything handed to the socket" even when no audio had come back, so the
 *      fallback skipped exactly the text that was never spoken.
 * Here the real /api/asistan/fish-tur handler runs with `ses: "ws"` and a stand-in for the Fish socket (no network).
 */
import { ortam, sahneHazirla, sahneKur, fishTur, type Sahne } from './tests/ayseSahne'
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { FishWsDinleyici, FishWsOturumu } from './fishWsSunucu'

/** How the stand-in socket of the NEXT turn behaves. */
let davranis: 'sessiz' | 'sesli' | 'ilk-kelimede-kopar' | 'ses-sonrasi-kopar' = 'sesli'
const verilen: string[] = []

function sahteOturum(): FishWsOturumu {
  const mod = davranis
  let d: FishWsDinleyici = { onSes: () => {}, onHata: () => {} }
  let kapali = false
  let n = 0
  return {
    bagla: (x) => { d = x },
    yas: () => 0,
    metin: (c) => {
      verilen.push(c)
      n++
      if (mod === 'sesli' || (mod === 'ses-sonrasi-kopar' && n === 1)) d.onSes(new Uint8Array(480))
      if (mod === 'ilk-kelimede-kopar' || (mod === 'ses-sonrasi-kopar' && n === 2)) d.onHata('finish_error')
      return true
    },
    bitir: async () => {},
    kapat: () => { kapali = true },
    acik: () => !kapali,
    bayt: () => 0,
  }
}
mock.module(pathToFileURL(join(__dirname, 'fishWsSunucu.ts')).href, { namedExports: { fishWsAc: async () => sahteOturum() } })

let s: Sahne
const CEVAP = 'Akut otitte ilk seçenek amoksisilindir Hocam. Doz kiloya göre hesaplanır.'

before(async () => {
  process.env.FISH_API_KEY = 'qa-sahte-fish-anahtari'
  delete process.env.NOTYA_FISH_WS
  await sahneHazirla()
})

async function tur(mod: typeof davranis) {
  s = sahneKur()
  // The pool opens the next socket when a turn ends: one throw-away turn makes the turn under test take a socket of `mod`.
  davranis = mod
  ortam.yanit = { metin: JSON.stringify({ speech: CEVAP }) }
  await fishTur(s, 'Merhaba nasılsın bugün?', { govde: { ses: 'ws' } })
  verilen.length = 0
  return fishTur(s, 'Akut otitte ilk seçenek nedir?', { govde: { ses: 'ws' } })
}
const olay = (t: Awaited<ReturnType<typeof fishTur>>, ad: string) => t.olaylar.filter((e) => e.t === ad)

describe('fish-tur — canlı soket ses vermeden biterse tur sessiz kalmaz', () => {
  it('ses veren soket: ses_hazir → soz → ses → ses_bit; ses_dus yok', async () => {
    const t = await tur('sesli')
    assert.equal(t.soz, CEVAP)
    assert.ok(verilen.join('').replace(/\s+/g, ' ').includes('Akut otitte ilk seçenek'), 'metin sokete verildi')
    assert.ok(t.sira.indexOf('ses_hazir') >= 0 && t.sira.indexOf('ses_hazir') < t.sira.indexOf('soz'))
    assert.ok(olay(t, 'ses').length > 0 && olay(t, 'ses_bit').length === 1 && olay(t, 'ses_dus').length === 0, t.sira.join(' '))
  })

  it('soket metni alır, hatasız kapanır, tek bayt ses vermez → ses_bit DEĞİL: ses_dus (islenen 0) — tarayıcı metnin tamamını REST ile söyler', async () => {
    const t = await tur('sessiz')
    assert.equal(t.soz, CEVAP, 'söz olayları eksiksiz: tarayıcının söyleyeceği metin elinde')
    assert.ok(verilen.length > 0, 'metin sokete verildi')
    assert.equal(olay(t, 'ses').length, 0)
    assert.equal(olay(t, 'ses_bit').length, 0, 'ses gelmedi: "ses bitti" denmez')
    assert.deepEqual(olay(t, 'ses_dus').map((e) => e.islenen), [0])
    assert.ok(t.sira.indexOf('ses_dus') > t.sira.indexOf('soz_bit') && t.sira[t.sira.length - 1] === 'bit', t.sira.join(' '))
    assert.equal(t.hata, null)
  })

  it('soket ilk kelimede koparsa (hiç ses yok): ses_dus islenen 0 — verilen kelimeler de yeniden söylenir', async () => {
    const t = await tur('ilk-kelimede-kopar')
    assert.equal(t.soz, CEVAP)
    assert.deepEqual(olay(t, 'ses_dus').map((e) => e.islenen), [0])
    assert.equal(olay(t, 'ses_bit').length, 0)
  })

  it('ses geldikten sonra koparsa: ses_dus sokete verilen yerden — söylenmiş söz yinelenmez', async () => {
    const t = await tur('ses-sonrasi-kopar')
    const dus = olay(t, 'ses_dus')
    assert.equal(dus.length, 1)
    assert.ok(Number(dus[0].islenen) > 0 && Number(dus[0].islenen) < CEVAP.length + 2, String(dus[0].islenen))
    assert.equal(olay(t, 'ses_bit').length, 0)
  })
})
