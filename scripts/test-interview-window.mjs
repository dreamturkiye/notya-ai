#!/usr/bin/env node
import assert from 'assert'

const OPEN_H = 24
const CLOSE_M = 30

function getWindow(iso) {
  const t = new Date(iso).getTime()
  const opens = t - OPEN_H * 3600000
  const closes = t + CLOSE_M * 60000
  const now = Date.now()
  if (now < opens) return { allowed: false }
  if (now > closes) return { allowed: false }
  return { allowed: true }
}

const in45m = new Date(Date.now() + 45 * 60000).toISOString()
const in2d = new Date(Date.now() + 48 * 3600000).toISOString()
const past = new Date(Date.now() - 2 * 3600000).toISOString()

assert.equal(getWindow(in45m).allowed, true, '45 min ahead should be open')
assert.equal(getWindow(in2d).allowed, false, '48h ahead should be closed until 24h window')
assert.equal(getWindow(past).allowed, false, 'past appointment should be closed')

console.log('interview-window tests: OK')
