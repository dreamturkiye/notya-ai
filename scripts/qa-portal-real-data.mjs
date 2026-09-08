#!/usr/bin/env node
/**
 * QA: does the real hasta portal populate from real data?
 *
 * Prints COUNTS AND FLAGS ONLY — never patient names, note text, or lab values.
 * Usage: node scripts/qa-portal-real-data.mjs [token]
 */
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

const TOKEN = process.argv[2] || '6c4be6554bdbcd74261e1e40d218e48f4d41414a53b9c22e2c98e65012e38b46'

const out = {}

// ── 1. Token → patient/doctor ────────────────────────────────────────────────
const { data: tok, error: tokErr } = await sb
  .from('hasta_portal_tokens')
  .select('patient_id, doctor_id, expires_at, pin_hash, created_at')
  .eq('token_hash', TOKEN)
  .maybeSingle()

out.token = tokErr
  ? { error: tokErr.message }
  : !tok
    ? { found: false }
    : {
        found: true,
        expired: new Date(tok.expires_at) < new Date(),
        expires_at: tok.expires_at,
        has_pin: Boolean(tok.pin_hash),
      }

if (!tok) {
  console.log(JSON.stringify(out, null, 2))
  process.exit(0)
}

const patientId = tok.patient_id
const doctorId = tok.doctor_id

// ── 2. Which doctor owns this token ──────────────────────────────────────────
for (const table of ['doctors', 'profiles', 'users']) {
  const { data, error } = await sb.from(table).select('*').eq('id', doctorId).maybeSingle()
  if (!error && data) {
    const nameKey = ['full_name', 'name', 'ad_soyad', 'display_name', 'email'].find((k) => data[k])
    out.doctor = { table, matched: true, name_field: nameKey || null, name: nameKey ? String(data[nameKey]) : null }
    break
  }
}

// ── 3. Per-section counts for THIS patient ───────────────────────────────────
async function count(table, filter = (q) => q) {
  const { count, error } = await filter(sb.from(table).select('id', { count: 'exact', head: true }).eq('patient_id', patientId))
  return error ? `ERR:${error.message}` : count
}

const { data: sessions } = await sb.from('sessions').select('id').eq('patient_id', patientId).limit(100)
const sessionIds = (sessions || []).map((s) => s.id)

let approvedNotes = 0
let notesTotal = 0
let notesWithVitals = 0
if (sessionIds.length) {
  const { data: notes } = await sb
    .from('notes')
    .select('id, approved_at, vitaller')
    .in('session_id', sessionIds)
  notesTotal = (notes || []).length
  approvedNotes = (notes || []).filter((n) => n.approved_at).length
  notesWithVitals = (notes || []).filter((n) => n.vitaller && typeof n.vitaller === 'object').length
}

const { data: imgRows } = await sb
  .from('hasta_goruntulemeler')
  .select('id, dosya_url, rapor_metni')
  .eq('patient_id', patientId)
  .limit(50)

out.patient_sections = {
  sessions: sessionIds.length,
  notes_total: notesTotal,
  notes_approved: approvedNotes,
  visits_patient_will_see: approvedNotes,
  notes_with_vitals: notesWithVitals,
  medications: await count('hasta_ilaclar'),
  medications_active: await count('hasta_ilaclar', (q) => q.eq('aktif', true)),
  lab_results: await count('hasta_lab_sonuclari'),
  imaging: (imgRows || []).length,
  imaging_with_real_file: (imgRows || []).filter((r) => r.dosya_url).length,
  imaging_falling_back_to_stock_placeholder: (imgRows || []).filter((r) => !r.dosya_url).length,
}

// ── 4. Is this doctor's wider patient population populated? ──────────────────
const { data: docTokens } = await sb
  .from('hasta_portal_tokens')
  .select('patient_id, expires_at, pin_hash')
  .eq('doctor_id', doctorId)
  .limit(200)

const uniquePatients = [...new Set((docTokens || []).map((t) => t.patient_id))]
out.doctor_portal_tokens = {
  tokens: (docTokens || []).length,
  unique_patients: uniquePatients.length,
  live_tokens: (docTokens || []).filter((t) => new Date(t.expires_at) > new Date()).length,
  tokens_without_pin: (docTokens || []).filter((t) => !t.pin_hash).length,
}

// Sample up to 5 of this doctor's portal patients: do they have any shareable data?
const sample = []
for (const pid of uniquePatients.slice(0, 5)) {
  const { data: ss } = await sb.from('sessions').select('id').eq('patient_id', pid).limit(50)
  const sids = (ss || []).map((s) => s.id)
  let appr = 0
  let tot = 0
  if (sids.length) {
    const { data: nn } = await sb.from('notes').select('id, approved_at').in('session_id', sids)
    tot = (nn || []).length
    appr = (nn || []).filter((n) => n.approved_at).length
  }
  const { count: meds } = await sb
    .from('hasta_ilaclar')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', pid)
  const { count: labs } = await sb
    .from('hasta_lab_sonuclari')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', pid)
  sample.push({
    patient: `${pid.slice(0, 6)}…`,
    sessions: sids.length,
    notes_total: tot,
    notes_approved: appr,
    medications: meds,
    labs,
    portal_would_look_empty: appr === 0 && (meds || 0) === 0 && (labs || 0) === 0,
  })
}
out.doctor_patient_sample = sample

console.log(JSON.stringify(out, null, 2))
