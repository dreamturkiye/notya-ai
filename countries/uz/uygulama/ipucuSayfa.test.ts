/**
 * IPUCU-TETIK-01 — Uzbekistan: the tip trigger names the page in every language. Lives in the uz pack, not in the
 * English language set's ipucu.test.ts: a language set may not import a country pack (wall D8).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { UZ_UYGULAMA_METINLERI } from './metinler'

describe('uz: the tip trigger names the page in every language (IPUCU-TETIK-01)', () => {
  it('uz-Latn, uz-Cyrl and ru fill ipuclari.sayfa', () => {
    for (const [dil, m] of Object.entries(UZ_UYGULAMA_METINLERI)) assert.ok((m.ipuclari?.sayfa ?? '').trim().length >= 8, dil)
  })
})
