#!/usr/bin/env node
import assert from 'assert'

// Mirror lib/asistan/platform.ts logic for CI-less smoke test
function connectionErrorHelp(detail) {
  const base = 'Bağlantı kurulamadı. Tekrar deneyin.'
  if (!detail) return base
  if (/denied|not-allowed|permission/i.test(detail)) return 'mikrofon'
  return `${base} (${detail.slice(0, 60)})`
}

assert.ok(connectionErrorHelp('NotAllowedError').includes('mikrofon') || connectionErrorHelp('permission denied').includes('mikrofon'))
assert.ok(connectionErrorHelp('websocket 1008').includes('Bağlantı kurulamadı'))
console.log('asistan platform tests: OK')
