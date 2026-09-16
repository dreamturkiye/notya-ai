import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

// Regression guard for the Next 14 fetch-cache class of bugs (PRs #143, #170, portal growth curves 2026-09-14):
// every server-side @supabase/supabase-js createClient() under app/api and lib must carry cache: 'no-store'.
test('every server-side Supabase createClient uses cache: no-store', () => {
  const r = spawnSync('node', ['scripts/codemod-no-store.mjs', '--check'], { encoding: 'utf8' })
  assert.equal(r.status, 0, `Stale-fetch risk found. Fix with: node scripts/codemod-no-store.mjs\n${r.stdout}`)
})
