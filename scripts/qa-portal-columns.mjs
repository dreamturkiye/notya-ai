#!/usr/bin/env node
/** Print column names (not values) for tables the seeder writes to. */
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

for (const t of ['sessions', 'notes', 'hasta_ilaclar', 'hasta_lab_sonuclari', 'hasta_goruntulemeler']) {
  const { data, error } = await sb.from(t).select('*').limit(1)
  console.log(`\n== ${t} ==`)
  if (error) console.log('ERR', error.message)
  else console.log(data?.[0] ? Object.keys(data[0]).join(', ') : '(empty table)')
}

// Which specialty values already exist (enum-ish check), no PHI.
const { data: sp } = await sb.from('sessions').select('specialty').limit(50)
console.log('\nspecialty values seen:', [...new Set((sp || []).map((s) => s.specialty))].join(' | '))
const { data: mod } = await sb.from('hasta_goruntulemeler').select('modalite').limit(20)
console.log('modalite values seen:', [...new Set((mod || []).map((m) => m.modalite))].join(' | ') || '(none)')
