#!/usr/bin/env node
/**
 * QA: find Dr. Gökhan Mamur and audit whether his patients have portal-visible data.
 * Prints counts/flags only — no patient names, note text, or lab values.
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

const out = {}

// ── Find the doctor (users has no `role` column — it has specialty/unvan) ────
const { data: allUsers, error: usersErr } = await sb
  .from('users')
  .select('id, full_name, email, specialty, unvan, account_type')
  .limit(50)

if (usersErr) out.users_error = usersErr.message
out.all_doctors = (allUsers || []).map((d) => ({
  full_name: d.full_name,
  specialty: d.specialty,
  unvan: d.unvan,
  account_type: d.account_type,
}))

const doc = (allUsers || []).find((d) => /mamur|gökhan|gokhan/i.test(String(d.full_name || d.email || '')))
if (!doc) {
  out.mamur_found = false
  console.log(JSON.stringify(out, null, 2))
  process.exit(0)
}
out.doctor = { id: `${doc.id.slice(0, 6)}…`, full_name: doc.full_name, specialty: doc.specialty }

// ── His patients ─────────────────────────────────────────────────────────────
const { data: pts, error: ptErr } = await sb
  .from('patients')
  .select('id, created_at')
  .eq('doctor_id', doc.id)
  .order('created_at', { ascending: false })
  .limit(50)

if (ptErr) out.patients_error = ptErr.message
out.patient_count = (pts || []).length

const rows = []
for (const p of (pts || []).slice(0, 12)) {
  const { data: ss } = await sb.from('sessions').select('id').eq('patient_id', p.id).limit(100)
  const sids = (ss || []).map((s) => s.id)
  let notesTotal = 0
  let approved = 0
  let withVitals = 0
  if (sids.length) {
    const { data: nn } = await sb.from('notes').select('id, approved_at, vitaller').in('session_id', sids)
    notesTotal = (nn || []).length
    approved = (nn || []).filter((n) => n.approved_at).length
    withVitals = (nn || []).filter((n) => n.vitaller && typeof n.vitaller === 'object').length
  }
  const c = async (t, f = (q) => q) => {
    const { count } = await f(sb.from(t).select('id', { count: 'exact', head: true }).eq('patient_id', p.id))
    return count ?? 0
  }
  const { data: imgs } = await sb
    .from('hasta_goruntulemeler')
    .select('id, dosya_url')
    .eq('patient_id', p.id)
    .limit(50)
  const meds = await c('hasta_ilaclar')
  const labs = await c('hasta_lab_sonuclari')
  const tokens = await (async () => {
    const { count } = await sb
      .from('hasta_portal_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', p.id)
    return count ?? 0
  })()

  rows.push({
    patient: `${p.id.slice(0, 6)}…`,
    sessions: sids.length,
    notes_total: notesTotal,
    notes_approved: approved,
    notes_with_vitals: withVitals,
    medications: meds,
    labs,
    imaging: (imgs || []).length,
    imaging_no_file_uses_stock: (imgs || []).filter((i) => !i.dosya_url).length,
    portal_tokens: tokens,
    portal_would_be_all_empty: approved === 0 && meds === 0 && labs === 0 && (imgs || []).length === 0,
    blocked_by_approval_gate: notesTotal > 0 && approved === 0,
  })
}
out.patients = rows

out.totals = {
  patients_checked: rows.length,
  with_any_session: rows.filter((r) => r.sessions > 0).length,
  with_any_note: rows.filter((r) => r.notes_total > 0).length,
  with_approved_note: rows.filter((r) => r.notes_approved > 0).length,
  blocked_by_approval_gate: rows.filter((r) => r.blocked_by_approval_gate).length,
  portal_all_empty: rows.filter((r) => r.portal_would_be_all_empty).length,
  has_portal_token: rows.filter((r) => r.portal_tokens > 0).length,
}

console.log(JSON.stringify(out, null, 2))
