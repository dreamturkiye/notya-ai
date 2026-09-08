#!/usr/bin/env node
/** Inspect the SHAPE of notes.vitaller (keys + JS types), never the values. */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[m[1]]) process.env[m[1]] = v
  }
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const { data: notes } = await sb
  .from('notes')
  .select('id, vitaller')
  .not('vitaller', 'is', null)
  .limit(50)

const shapes = new Map()
for (const n of notes || []) {
  const v = n.vitaller
  if (!v || typeof v !== 'object') continue
  for (const [k, val] of Object.entries(v)) {
    const t = val === null ? 'null' : typeof val
    // For strings, report the PATTERN not the content.
    let pattern = ''
    if (t === 'string') {
      pattern = /^\d+\s*\/\s*\d+$/.test(val)
        ? 'numeric/numeric'
        : /^-?\d+(\.\d+)?$/.test(val)
          ? 'numeric-string'
          : /^\s*$/.test(val)
            ? 'blank'
            : 'other-text'
    }
    const key = `${k} :: ${t}${pattern ? ` (${pattern})` : ''}`
    shapes.set(key, (shapes.get(key) || 0) + 1)
  }
}

console.log(`notes with vitaller: ${(notes || []).length}\n`)
console.log('key :: type (pattern)   → count')
for (const [k, c] of [...shapes.entries()].sort()) console.log(`  ${k}   → ${c}`)
