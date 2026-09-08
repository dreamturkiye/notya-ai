#!/usr/bin/env node
/**
 * For one patient, report which note fields carry content and how long that
 * content is. Prints field names, lengths and vitals keys — never the text.
 *
 *   node scripts/qa-real-patient-fields.mjs <patient-id-prefix>
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
const { data: patients } = await sb.from('patients').select('id, doctor_id').limit(500)
const match = (patients || []).filter((p) => String(p.id).startsWith(prefix))
if (match.length !== 1) throw new Error(`Beklenen 1 hasta, bulunan ${match.length}`)
const patientId = match[0].id

const { data: ss } = await sb
  .from('sessions')
  .select('id, created_at, specialty, status, duration_seconds')
  .eq('patient_id', patientId)
  .order('created_at', { ascending: false })

const sids = (ss || []).map((s) => s.id)
const { data: nn } = await sb.from('notes').select('*').in('session_id', sids)

console.log(`Hasta ${patientId.slice(0, 8)}… — ${sids.length} seans, ${(nn || []).length} not\n`)

for (const s of ss || []) {
  const n = (nn || []).find((x) => x.session_id === s.id)
  console.log(`SEANS ${String(s.created_at).slice(0, 16)} | ${s.specialty} | ${s.status} | ${s.duration_seconds ?? '?'}s`)
  if (!n) {
    console.log('  not: YOK\n')
    continue
  }
  const filled = []
  const emptyF = []
  for (const [k, v] of Object.entries(n)) {
    if (['id', 'session_id', 'doctor_id', 'created_at', 'updated_at'].includes(k)) continue
    const has = Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : v != null
    if (has) {
      const len = typeof v === 'string' ? `${v.length} karakter` : Array.isArray(v) ? `${v.length} öğe` : typeof v === 'object' ? `${Object.keys(v).length} anahtar` : String(v).length > 30 ? 'değer' : String(v)
      filled.push(`${k}(${len})`)
    } else emptyF.push(k)
  }
  console.log(`  onaylı: ${n.approved_at ? 'EVET' : 'hayır'}`)
  console.log(`  DOLU  : ${filled.join(', ')}`)
  console.log(`  BOŞ   : ${emptyF.join(', ')}`)
  if (n.vitaller && typeof n.vitaller === 'object') {
    const kv = Object.entries(n.vitaller).map(([k, v]) => `${k}=${v === null ? 'null' : typeof v}`)
    console.log(`  vitaller: ${kv.join(', ')}`)
  }
  console.log()
}
