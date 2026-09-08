#!/usr/bin/env node
/** Reproduce the portal's exact notes select and surface the error it swallows. */
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

const { data: s } = await sb.from('sessions').select('id').limit(5)
const ids = (s || []).map((r) => r.id)

// EXACTLY what app/api/portal/hasta/[token]/route.ts sends today:
const withSpecialty = await sb
  .from('notes')
  .select(
    'session_id, content_subjektif, content_objektif, content_degerlendirme, content_plan, basvuru_yakinmasi, vitaller, specialty, created_at, approved_at'
  )
  .in('session_id', ids)

// Same query without the phantom `specialty` column:
const withoutSpecialty = await sb
  .from('notes')
  .select(
    'session_id, content_subjektif, content_objektif, content_degerlendirme, content_plan, basvuru_yakinmasi, vitaller, created_at, approved_at'
  )
  .in('session_id', ids)

console.log(
  JSON.stringify(
    {
      sessions_probed: ids.length,
      portal_query_today: {
        error: withSpecialty.error?.message ?? null,
        error_code: withSpecialty.error?.code ?? null,
        rows: withSpecialty.data?.length ?? null,
      },
      same_query_without_specialty: {
        error: withoutSpecialty.error?.message ?? null,
        rows: withoutSpecialty.data?.length ?? null,
      },
    },
    null,
    2
  )
)
