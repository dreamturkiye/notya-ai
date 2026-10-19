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

  it('does not call the provider without voices, a key, or a Flash model', async () => {
    const patlama: typeof fetch = async () => { throw new Error('called') }
    assert.deepEqual(await sesSentezle('Hello.', 'kadin', { ses: null, anahtar: 'anahtar', fetchFn: patlama }), { durum: 'yok' })
    assert.deepEqual(await sesSentezle('Hello.', 'erkek', { ses: ornek, anahtar: '', fetchFn: patlama }), { durum: 'hazir-degil' })
    assert.deepEqual(sesIstegi(ornek, '  ', 'erkek'), { tamam: false, kod: 'BOS' })
    const bozuk = { ...ornek, model: 'eleven_v4_turbo' as UlkeSesCikisi['model'] }
    assert.deepEqual(await sesSentezle('Hello.', 'erkek', { ses: bozuk, anahtar: 'anahtar', fetchFn: patlama }), { durum: 'red', kod: 'MODEL' })
  })

  it('the United States names a spoken voice (this pack\'s own view — see file header)', () => {
    // NOTYA-ULKE-ASISTAN-SES-US-NZ-UZ-01 (2026-10-19): this checkout (release/us) can verify only its OWN
    // countries/ copy. Checked directly: this branch's own copies of countries/gb, countries/au and
    // countries/ca are STALE — they predate those countries' real ses.ts work (no ses.ts file exists in any
    // of them here, despite that being live and shipped on their own real release branches) — so this test
    // does not assert anything about another country's files, only this pack's own, which is what this job
    // actually changed and can verify from here.
    const oku = (yol: string) => readFileSync(join(KOK, yol), 'utf8')
    assert.match(oku('countries/us/klinik/index.ts'), /ses: US_SES/)
    assert.match(oku('countries/us/ses.ts'), /eleven_flash_v2_5/)
    assert.match(oku('countries/us/ses.ts'), /dilKodu: 'en'/)
  })
})
