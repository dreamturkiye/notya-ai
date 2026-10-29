/**
 * SES-KILIT (founder lock, Kaan 2026-10-29): the locked voice / text path must match lib/asistan/ses-kilit.json.
 * A change to any locked file fails this test (and the Vercel build, `prebuild`) until Kaan's written "go" is recorded
 * with `node scripts/ses-kilit.mjs --onayla "Kaan-onay: YYYY-MM-DD <change>"` (.cursor/rules/ses-omurga-kilidi.mdc).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const kok = process.cwd()
const manifest = JSON.parse(readFileSync(join(kok, 'lib/asistan/ses-kilit.json'), 'utf8')) as { onay: string; dosyalar: Record<string, string> }

test('SES-KILIT: every locked file matches the approved manifest', () => {
  const r = spawnSync(process.execPath, [join(kok, 'scripts/ses-kilit.mjs'), '--denetle'], { cwd: kok, encoding: 'utf8' })
  assert.equal(r.status, 0, `${r.stderr}\n${r.stdout}`)
})

test('SES-KILIT: the manifest carries a recorded Kaan approval', () => {
  assert.match(manifest.onay, /^Kaan-onay: \d{4}-\d{2}-\d{2} .{10,}$/)
  assert.ok(readFileSync(join(kok, 'docs/SES-KILIT-ONAYLARI.md'), 'utf8').includes(manifest.onay), 'onay satırı kayıtta')
})

test('SES-KILIT: the core of the path is in the lock', () => {
  for (const yol of ['lib/asistan/sesLlm.ts', 'lib/asistan/ayseCevapla.ts', 'lib/asistan/sesTurYoneticisi.ts', 'lib/asistan/konusma.ts', 'lib/asistan/sesMotoru.ts', 'lib/doktor/hastaDosyaKart.ts', 'components/asistan/AsistanOturumContext.tsx', 'app/api/asistan/ses-llm/v1/chat/completions/route.ts', 'lib/db/migrations/183_ses_omurga_v2.sql']) {
    assert.ok(manifest.dosyalar[yol], yol)
  }
})
