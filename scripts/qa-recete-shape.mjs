#!/usr/bin/env node
/**
 * Inspect the SHAPE of notes.recete_onerisi / content_ilaclar for one patient:
 * item type and object keys only, never the prescription text itself.
 *
 *   node scripts/qa-recete-shape.mjs <patient-id-prefix>
 */
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

const prefix = (process.argv[2] || '7d417008').replace(/…$/, '')
const { data: patients } = await sb.from('patients').select('id').limit(500)
const patientId = (patients || []).find((p) => String(p.id).startsWith(prefix))?.id
if (!patientId) throw new Error('hasta bulunamadı')

const { data: ss } = await sb.from('sessions').select('id').eq('patient_id', patientId)
const { data: nn } = await sb
  .from('notes')
  .select('id, created_at, recete_onerisi, content_ilaclar, icd10_codes, takip_suresi')
  .in('session_id', (ss || []).map((s) => s.id))
  .not('approved_at', 'is', null)

const describe = (v) => {
  if (v == null) return 'null'
  if (Array.isArray(v)) {
    const kinds = new Set(
      v.map((it) =>
        it == null ? 'null' : typeof it === 'object' ? `object{${Object.keys(it).sort().join(',')}}` : typeof it
      )
    )
    return `array[${v.length}] of ${[...kinds].join(' | ')}`
  }
  return typeof v
}

for (const n of nn || []) {
  console.log(`NOT ${String(n.created_at).slice(0, 16)}`)
  console.log(`  recete_onerisi : ${describe(n.recete_onerisi)}`)
  console.log(`  content_ilaclar: ${describe(n.content_ilaclar)}`)
  console.log(`  icd10_codes    : ${describe(n.icd10_codes)}`)
  console.log(`  takip_suresi   : ${typeof n.takip_suresi}`)
  // If items are plain strings, show only their character lengths.
  for (const key of ['recete_onerisi', 'content_ilaclar']) {
    const v = n[key]
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
      console.log(`    ${key} item uzunlukları: ${v.map((x) => x.length).join(', ')}`)
    }
  }
  console.log()
}
