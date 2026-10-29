#!/usr/bin/env node
/**
 * SES-OMURGA-V2 — the required voice tests, run on every Vercel build (`prebuild`; a release branch's
 * `npm run build:ulke` runs `npm run build`, so the same hook). The repo has no separate CI by
 * design (workflows were removed), so the build is the gate: a build whose voice spine breaks one of the contracts
 * below does not ship.
 *
 *   - one utterance → one brain (a burst of duplicates = one model call, a grown transcript aborts the old one)
 *   - never a whitespace-only reply (skip_turn or the "... " buffer)
 *   - first byte ≤ 300 ms on the synthetic path
 *   - fast-path correctness (general medical questions, action-status questions, address stripping)
 *
 * The tests run against the in-memory scene with the network blocked. The child gets a minimal environment, so
 * production feature flags and keys on the build machine cannot change what the tests see.
 * Locked by .cursor/rules/ses-omurga-kilidi.mdc (founder lock).
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

/** Türkiye's spine test; on a release branch also the country mouth's turn test. */
const TESTLER = ['lib/asistan/sesOmurgaV2.test.ts', 'lib/ulke/asistan/sesTur.test.ts'].filter((t) => existsSync(t))
const TSX = 'tsx@4.23.12'

const ortam = { NODE_ENV: 'test', CI: '1' }
for (const k of ['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'npm_config_cache', 'NPM_CONFIG_CACHE', 'npm_config_registry', 'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY', 'NODE_EXTRA_CA_CERTS', 'SystemRoot']) {
  if (process.env[k]) ortam[k] = process.env[k]
}
const t0 = Date.now()
const r = spawnSync('npx', ['--yes', TSX, '--experimental-test-module-mocks', '--test', '--test-reporter=dot', ...TESTLER], { stdio: 'inherit', env: ortam, shell: process.platform === 'win32' })
const ms = Date.now() - t0
if (r.status !== 0) {
  console.error(`[ses-ci] ZORUNLU SES TESTLERİ GEÇMEDİ (${ms} ms) — build durdu. Ayrıntı: npm run test:ses`)
  process.exit(1)
}
console.log(`[ses-ci] tamam — zorunlu ses testleri geçti (${ms} ms)`)
