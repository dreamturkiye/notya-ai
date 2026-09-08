#!/usr/bin/env node
/**
 * Rank Dr. Gökhan Mamur's real patients by how much portal-visible data they
 * have, and report which note fields carry content that the portal could use.
 * Prints counts and presence flags only — never clinical text.
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

const { data: users } = await sb.from('users').select('id, full_name, email').limit(100)
const cands = (users || []).filter((u) => /mamur/i.test(String(u.full_name || u.email || '')))
let doctorId = cands[0].id
let best = -1
for (const c of cands) {
  const { count } = await sb.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', c.id)
  if ((count ?? 0) > best) { best = count ?? 0; doctorId = c.id }
}

const { data: patients } = await sb.from('patients').select('id, created_at').eq('doctor_id', doctorId)
const rows = []

for (const p of patients || []) {
  const { data: ss } = await sb.from('sessions').select('id, created_at, specialty').eq('patient_id', p.id)
  const sids = (ss || []).map((s) => s.id)

  let approved = 0
  let vitalsNotes = 0
  const fieldPresence = {
    recete_onerisi: 0,
    content_ilaclar: 0,
    content_lab_istekleri: 0,
    content_goruntulemeler: 0,
    content_tani: 0,
    icd10_codes: 0,
    kritik_bulgular: 0,
    hasta_ozeti: 0,
  }
  if (sids.length) {
    const { data: nn } = await sb
      .from('notes')
      .select(
        'id, approved_at, vitaller, recete_onerisi, content_ilaclar, content_lab_istekleri, content_goruntulemeler, content_tani, icd10_codes, kritik_bulgular, hasta_ozeti'
      )
      .in('session_id', sids)
    for (const n of nn || []) {
      if (n.approved_at) approved += 1
      if (n.vitaller && typeof n.vitaller === 'object') vitalsNotes += 1
      for (const k of Object.keys(fieldPresence)) {
        const v = n[k]
        const has = Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : v != null
        if (has) fieldPresence[k] += 1
      }
    }
  }

  const c = async (t) => {
    const { count } = await sb.from(t).select('id', { count: 'exact', head: true }).eq('patient_id', p.id)
    return count ?? 0
  }
  const { data: toks } = await sb
    .from('hasta_portal_tokens')
    .select('token_hash, pin_hash, expires_at')
    .eq('patient_id', p.id)

  const meds = await c('hasta_ilaclar')
  const labs = await c('hasta_lab_sonuclari')
  const imgs = await c('hasta_goruntulemeler')
  const { count: threads } = await sb
    .from('hasta_mesaj_konulari')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', p.id)

  rows.push({
    patient: p.id,
    approvedVisits: approved,
    vitalsNotes,
    meds,
    labs,
    imgs,
    threads: threads ?? 0,
    liveTokens: (toks || []).filter((t) => new Date(t.expires_at) > new Date() && t.pin_hash).length,
    fieldPresence,
    score: approved * 3 + meds + labs + imgs + (threads ?? 0),
  })
}

rows.sort((a, b) => b.score - a.score)

console.log(`Dr. Gökhan Mamur — ${rows.length} hasta, portal verisine göre sıralı:\n`)
for (const r of rows) {
  console.log(
    `${r.patient.slice(0, 8)}…  onaylı ziyaret:${r.approvedVisits}  vitalli not:${r.vitalsNotes}  ilaç:${r.meds}  lab:${r.labs}  görüntüleme:${r.imgs}  mesaj:${r.threads}  canlı PIN'li link:${r.liveTokens}`
  )
}

const top = rows[0]
console.log(`\nEn zengin gerçek hasta: ${top.patient}`)
console.log('Notlarında portal için kullanılabilir içerik (kaç notta dolu):')
for (const [k, v] of Object.entries(top.fieldPresence)) console.log(`  ${k}: ${v}`)
