#!/usr/bin/env npx tsx
/**
 * Approve Dr. Gökhan Mamur's pending notes so his real patients' portals populate.
 *
 * Mirrors POST /api/notes/[id]/approve exactly: sets approved_at + approved_by
 * and nothing else. No note text is edited, so there are no not_duzenlemeleri
 * edit logs and no style-profile distillation to trigger.
 *
 * approved_by is set to the note's OWN doctor_id — the approval stays his
 * attestation, not the operator's.
 *
 * Writes the touched note IDs to scripts/.approve-mamur-rollback.json so the
 * change can be undone:  --rollback
 *
 *   npx --yes tsx scripts/approve-mamur-notes.mts            # dry run
 *   npx --yes tsx scripts/approve-mamur-notes.mts --apply
 *   npx --yes tsx scripts/approve-mamur-notes.mts --rollback
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[m[1]]) process.env[m[1]] = v
  }
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

const APPLY = process.argv.includes('--apply')
const ROLLBACK = process.argv.includes('--rollback')
const ROLLBACK_FILE = path.join(process.cwd(), 'scripts', '.approve-mamur-rollback.json')

// ── Rollback path ───────────────────────────────────────────────────────────
if (ROLLBACK) {
  if (!fs.existsSync(ROLLBACK_FILE)) throw new Error(`Geri alma dosyası yok: ${ROLLBACK_FILE}`)
  const saved = JSON.parse(fs.readFileSync(ROLLBACK_FILE, 'utf8')) as { noteIds: string[] }
  const { error } = await sb
    .from('notes')
    .update({ approved_at: null, approved_by: null })
    .in('id', saved.noteIds)
  if (error) throw new Error(`geri alma: ${error.message}`)
  console.log(`${saved.noteIds.length} notun onayı geri alındı.`)
  process.exit(0)
}

// ── Find Dr. Mamur (the account that owns patients) ─────────────────────────
const { data: users, error: usersError } = await sb.from('users').select('id, full_name, email').limit(100)
if (usersError) throw new Error(`users: ${usersError.message}`)

const candidates = (users || []).filter((u) => /mamur/i.test(String(u.full_name || u.email || '')))
if (!candidates.length) throw new Error('Dr. Gökhan Mamur bulunamadı')

let doctorId = candidates[0].id as string
let best = -1
for (const c of candidates) {
  const { count } = await sb.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', c.id)
  if ((count ?? 0) > best) {
    best = count ?? 0
    doctorId = c.id as string
  }
}
console.log(`Doktor: ${candidates[0].full_name} (${doctorId.slice(0, 8)}…)`)

// ── His unapproved notes, grouped by patient ────────────────────────────────
const { data: patients } = await sb.from('patients').select('id').eq('doctor_id', doctorId)
const patientIds = (patients || []).map((p) => p.id as string)

const { data: sessions } = await sb
  .from('sessions')
  .select('id, patient_id, created_at, specialty')
  .in('patient_id', patientIds)
const sessionById = new Map((sessions || []).map((s) => [s.id as string, s]))

const { data: notes, error: notesError } = await sb
  .from('notes')
  .select('id, session_id, doctor_id, approved_at, created_at, basvuru_yakinmasi, vitaller')
  .in('session_id', (sessions || []).map((s) => s.id))
  .is('approved_at', null)
if (notesError) throw new Error(`notes: ${notesError.message}`)

const pending = notes || []
if (!pending.length) {
  console.log('Onay bekleyen not yok.')
  process.exit(0)
}

const byPatient = new Map<string, number>()
for (const n of pending) {
  const s = sessionById.get(String(n.session_id))
  const pid = String(s?.patient_id || '?')
  byPatient.set(pid, (byPatient.get(pid) || 0) + 1)
}

console.log(`\nOnay bekleyen ${pending.length} not, ${byPatient.size} hastada:`)
for (const [pid, n] of byPatient) console.log(`  - hasta ${pid.slice(0, 8)}… : ${n} not`)
console.log('\nNot detayı (PHI basılmaz, yalnızca tarih/başvuru başlığı):')
for (const n of pending) {
  const s = sessionById.get(String(n.session_id))
  console.log(
    `  - ${String(n.created_at).slice(0, 10)} | ${s?.specialty || 'genel'} | ${String(
      n.basvuru_yakinmasi || 'başlık yok'
    ).slice(0, 40)} | vitaller: ${n.vitaller ? 'var' : 'yok'}`
  )
}

if (!APPLY) {
  console.log('\nDRY RUN — hiçbir şey değiştirilmedi. Uygulamak için: --apply')
  process.exit(0)
}

// ── Approve (same two columns the app's approve endpoint writes) ────────────
const touched: string[] = []
for (const n of pending) {
  const { error } = await sb
    .from('notes')
    .update({ approved_at: new Date().toISOString(), approved_by: n.doctor_id })
    .eq('id', n.id)
    .is('approved_at', null)
  if (error) throw new Error(`onay (${String(n.id).slice(0, 8)}…): ${error.message}`)
  touched.push(String(n.id))
}

fs.writeFileSync(
  ROLLBACK_FILE,
  JSON.stringify({ approvedAt: new Date().toISOString(), doctorId, noteIds: touched }, null, 2)
)

console.log(`\n${touched.length} not onaylandı.`)
console.log(`Geri almak için: npx --yes tsx scripts/approve-mamur-notes.mts --rollback`)

// ── What each patient will now see ─────────────────────────────────────────
console.log('\nOnay sonrası hasta portalı durumu:')
for (const pid of patientIds) {
  const sids = (sessions || []).filter((s) => s.patient_id === pid).map((s) => s.id)
  let approved = 0
  if (sids.length) {
    const { data: nn } = await sb.from('notes').select('id, approved_at').in('session_id', sids)
    approved = (nn || []).filter((x) => x.approved_at).length
  }
  const { count: tokens } = await sb
    .from('hasta_portal_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', pid)
  const { data: toks } = await sb.from('hasta_portal_tokens').select('pin_hash').eq('patient_id', pid)
  const pinli = (toks || []).filter((t) => t.pin_hash).length
  console.log(
    `  - hasta ${pid.slice(0, 8)}… : ${approved} onaylı ziyaret · ${tokens ?? 0} portal linki (${pinli} PIN'li)`
  )
}
