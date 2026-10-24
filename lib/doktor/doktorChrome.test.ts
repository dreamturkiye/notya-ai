/**
 * AU-LOOK-PARITY-01 — Türkiye's doctor chrome, rendered through the shared neutral view (components/doktor/KabukGorunumu.tsx),
 * is byte for byte the markup it produced BEFORE it was made country-neutral. doktorChrome.baseline.json was captured from
 * the old DoktorChrome; the scenarios are lib/doktor/tests/doktorChromeSenaryolari.ts.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, mock } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CHROME_SENARYOLARI } from './tests/doktorChromeSenaryolari'

let yol = '/dashboard/doktor'
mock.module('next/navigation', { namedExports: { usePathname: () => yol, useRouter: () => ({ push: () => {}, replace: () => {} }) } })

const DOSYA = join(__dirname, 'tests/doktorChrome.baseline.json')

describe('Turkiye doctor chrome through the shared view: markup unchanged', async () => {
  const { default: DoktorChrome } = await import('@/components/doktor/DoktorChrome')
  const olustur = (p: string) => { yol = p; return renderToStaticMarkup(React.createElement(DoktorChrome, null, React.createElement('p', null, 'icerik'))) }
  if (process.env.CHROME_BASELINE_YAZ === '1') {
    const o: Record<string, string> = {}
    for (const s of CHROME_SENARYOLARI) o[s.ad] = olustur(s.yol)
    writeFileSync(DOSYA, JSON.stringify(o, null, 1) + '\n')
  }
  const BAZ = existsSync(DOSYA) ? (JSON.parse(readFileSync(DOSYA, 'utf8')) as Record<string, string>) : {}
  for (const s of CHROME_SENARYOLARI) {
    it(s.ad, () => {
      assert.ok(BAZ[s.ad], `no stored markup for ${s.ad}`)
      assert.equal(olustur(s.yol), BAZ[s.ad])
    })
  }
  it('every stored scenario is still run', () => {
    assert.deepEqual(Object.keys(BAZ).sort(), CHROME_SENARYOLARI.map((s) => s.ad).sort())
  })
})
