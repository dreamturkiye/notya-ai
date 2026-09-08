#!/usr/bin/env node
/** Schema probe for portal QA — surfaces errors and column names, not PHI values. */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const ROOT = process.cwd()
for (const f of ['.env.local', '.env']) {
  const p = path.join(ROOT, f)
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

const out = {}
for (const t of ['users', 'patients', 'sessions', 'notes', 'hasta_portal_tokens', 'hasta_ilaclar', 'hasta_lab_sonuclari', 'hasta_goruntulemeler']) {
  const { data, error, count } = await sb.from(t).select('*', { count: 'exact' }).limit(1)
  out[t] = error
    ? { error: error.message }
    : { rows_total: count, columns: data?.[0] ? Object.keys(data[0]) : '(table empty)' }
}
console.log(JSON.stringify(out, null, 2))
