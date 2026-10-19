/**
 * The country speaker. A pack's voices are tested in that pack (countries/<cc>/ses.test.ts). Here: the request
 * is Flash v2.5 in the pack's language code, and a country with no `ses` does not speak.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import type { UlkeSesCikisi } from '../tipler'
import { SES_SES_AYARLARI, sesIstegi, sesSentezle } from './sesSentez'

const KOK = join(__dirname, '../../..')
const ornek: UlkeSesCikisi = {
  saglayici: 'elevenlabs',
  model: 'eleven_flash_v2_5',
  dilKodu: 'en',
  yerel: 'en-GB',
  sesler: {
    erkek: { ad: 'Daniel', id: 'onwK4e9ZLuTAKqWW03F9' },
    kadin: { ad: 'Alice', id: 'Xb7hH8MSUJpSbSDYk0k2' },
  },
}

describe('country speaker', () => {
  it('posts Flash v2.5 in the pack language, at speed 1, to the chosen voice', async () => {
    const erkek = sesIstegi(ornek, 'The visit is recorded.', 'erkek')
    assert.equal(erkek.tamam, true)
    if (!erkek.tamam) return
    assert.equal(erkek.adres, 'https://api.elevenlabs.io/v1/text-to-speech/onwK4e9ZLuTAKqWW03F9')
    assert.equal(erkek.govde.model_id, 'eleven_flash_v2_5')
    assert.equal(erkek.govde.language_code, 'en')
    assert.deepEqual(erkek.govde.voice_settings, SES_SES_AYARLARI)
    const cagrilar: string[] = []
    const fetchFn: typeof fetch = async (adres, secenek) => {
      cagrilar.push(String(adres))
      assert.equal(JSON.parse(String(secenek?.body)).text, 'Good morning.')
      return new Response(new Uint8Array([1]), { status: 200 })
    }
    const tamam = await sesSentezle('Good morning.', 'kadin', { ses: ornek, anahtar: 'anahtar', fetchFn })
    assert.equal(tamam.durum, 'tamam')
    assert.deepEqual(cagrilar, ['https://api.elevenlabs.io/v1/text-to-speech/Xb7hH8MSUJpSbSDYk0k2'])
  })

  it('does not call the provider without voices, a key, or a model on the valid list', async () => {
    const patlama: typeof fetch = async () => { throw new Error('called') }
    assert.deepEqual(await sesSentezle('Hello.', 'kadin', { ses: null, anahtar: 'anahtar', fetchFn: patlama }), { durum: 'yok' })
    assert.deepEqual(await sesSentezle('Hello.', 'erkek', { ses: ornek, anahtar: '', fetchFn: patlama }), { durum: 'hazir-degil' })
    assert.deepEqual(sesIstegi(ornek, '  ', 'erkek'), { tamam: false, kod: 'BOS' })
    // Genuinely unsupported — eleven_v4_turbo was never added to SES_GECERLI_MODELLER (only eleven_v4 was,
    // for Uzbekistan's cross-lingual attempt below) — still correctly rejected, cast past the type since the
    // union no longer includes this literal at all.
    const bozuk = { ...ornek, model: 'eleven_v4_turbo' as unknown as UlkeSesCikisi['model'] }
    assert.deepEqual(await sesSentezle('Hello.', 'erkek', { ses: bozuk, anahtar: 'anahtar', fetchFn: patlama }), { durum: 'red', kod: 'MODEL' })
  })

  it('admits eleven_v4 (Uzbekistan\'s cross-lingual attempt), not just Flash v2.5', async () => {
    const uzOrnek: UlkeSesCikisi = { ...ornek, model: 'eleven_v4', dilKodu: 'uz', yerel: 'uz-Latn-UZ' }
    const istek = sesIstegi(uzOrnek, 'Salom.', 'erkek')
    assert.equal(istek.tamam, true)
    if (!istek.tamam) return
    assert.equal(istek.govde.model_id, 'eleven_v4')
    assert.equal(istek.govde.language_code, 'uz')
    const cagrilar: { body: unknown }[] = []
    const fetchFn: typeof fetch = async (_adres, secenek) => {
      cagrilar.push({ body: JSON.parse(String(secenek?.body)) })
      return new Response(new Uint8Array([1]), { status: 200 })
    }
    const tamam = await sesSentezle('Salom.', 'erkek', { ses: uzOrnek, anahtar: 'anahtar', fetchFn })
    assert.equal(tamam.durum, 'tamam')
    assert.equal((cagrilar[0].body as { model_id: string }).model_id, 'eleven_v4')
  })

  it('Uzbekistan speaks eleven_v4\'s cross-lingual Uzbek attempt, not native Uzbek (this pack\'s own view — see file header)', () => {
    // NOTYA-ULKE-ASISTAN-SES-US-NZ-UZ-01 / NOTYA-UZ-ASISTAN-SES-01 (2026-10-19): this checkout (release/uz) can
    // verify only its OWN countries/ copy. Checked directly on the sibling release/us checkout: a branch's own
    // copies of OTHER countries' folders can be stale relative to their real release branches (no ses.ts at all,
    // in that case, despite it being live and shipped there) — so this test does not assert anything about
    // another country's files, only this pack's own, which is what this job actually changed and can verify
    // from here.
    const oku = (yol: string) => readFileSync(join(KOK, yol), 'utf8')
    assert.match(oku('countries/uz/klinik/index.ts'), /ses: UZ_SES/)
    assert.match(oku('countries/uz/ses.ts'), /model: 'eleven_v4'/)
    // Deliberately 'uz' now — eleven_v4 (unlike every sibling country's eleven_flash_v2_5) actually lists
    // Uzbek. Still not a native voice: see countries/uz/ses.ts for the cross-lingual caveat and the pending
    // real-speaker quality confirmation.
    assert.match(oku('countries/uz/ses.ts'), /dilKodu: 'uz'/)
  })
})
