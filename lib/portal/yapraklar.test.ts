/**
 * NOTYA-PORTAL-YAPRAK-02 — Sağlığım leaves background: built from the Notya leaf mark, no stethoscope image,
 * small, on every portal page, never in the way of text (behind content, no pointer events).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync('app/portal/sagligim.css', 'utf8')
const blok = css.slice(css.indexOf('NOTYA-PORTAL-YAPRAK-02'))

test('no plant.jpg (stethoscope) anywhere in the portal styles or layout', () => {
  assert.ok(!css.includes('plant.jpg'))
  assert.ok(!readFileSync('app/portal/layout.tsx', 'utf8').includes('plant.jpg'))
})

test('pure inline SVG from the leaf mark, a few KB', () => {
  assert.ok(blok.length > 0)
  const uri = blok.match(/url\("data:image\/svg\+xml,[^"]+"\)/g) || []
  assert.equal(uri.length, 2)
  const svg = uri.map((u) => decodeURIComponent(u.slice(26, -2)))
  for (const s of svg) {
    assert.ok(s.includes('M8 19c1.6-5.8 3.4-9.6 7.2-14.2'), 'the Notya leaf mark path')
    assert.ok(!/<image|href="http|<script/i.test(s), 'no external image or script')
  }
  assert.ok(blok.length < 4096, `block is ${blok.length} bytes`)
})

test('behind the content, not clickable, phone-width sizing, every Sağlığım page', () => {
  assert.match(blok, /::before \{[^}]*z-index: -1;[^}]*pointer-events: none;/)
  assert.match(blok, /min\(340px, 64vw\)/)
  assert.match(readFileSync('app/portal/layout.tsx', 'utf8'), /sagligim-root sg-yapraklar/)
})
