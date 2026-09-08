#!/usr/bin/env npx tsx
/**
 * Mint a Sağlığım portal link + PIN for an existing patient.
 *
 * Same derivation as POST /api/doktor/araclar/hasta-portali: HMAC-SHA256 over
 * patientId+doctorId+timestamp with PORTAL_TOKEN_SECRET, 30-day expiry, PIN
 * stored only as a scrypt hash. Use when an older link's PIN is lost (hashes
 * are not reversible) and the patient needs a working link.
 *
 *   npx --yes tsx scripts/mint-portal-link.mts <patient-id-or-prefix>
 */
import fs from 'fs'
import path from 'path'
import { createHmac } from 'crypto'
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

const { generatePortalPin, hashPortalPin } = await import('../lib/portal/pinAuth')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

const arg = process.argv[2]
if (!arg) throw new Error('Kullanım: mint-portal-link.mts <patient-id-or-prefix>')

const { data: patients, error: pErr } = await sb.from('patients').select('id, doctor_id').limit(500)
if (pErr) throw new Error(`patients: ${pErr.message}`)

const matches = (patients || []).filter((p) => String(p.id).startsWith(arg.replace(/…$/, '')))
if (!matches.length) throw new Error(`Hasta bulunamadı: ${arg}`)
if (matches.length > 1) throw new Error(`Belirsiz önek, ${matches.length} hasta eşleşti`)

const patientId = matches[0].id as string
const doctorId = matches[0].doctor_id as string

const secret = process.env.PORTAL_TOKEN_SECRET
if (!secret) throw new Error('PORTAL_TOKEN_SECRET tanımlı değil')

const timestamp = Date.now()
const tokenHash = createHmac('sha256', secret).update(`${patientId}${doctorId}${timestamp}`).digest('hex')
const pin = generatePortalPin()

const { error } = await sb.from('hasta_portal_tokens').insert({
  token_hash: tokenHash,
  doctor_id: doctorId,
  patient_id: patientId,
  expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  created_at: new Date().toISOString(),
  pin_hash: hashPortalPin(pin),
})
if (error) throw new Error(`hasta_portal_tokens: ${error.message}`)

const base = process.env.NEXT_PUBLIC_APP_URL || 'https://notya-ai.vercel.app'
console.log(`Hasta: ${patientId.slice(0, 8)}…  Doktor: ${doctorId.slice(0, 8)}…`)
console.log(`Link: ${base}/portal/hasta/${tokenHash}`)
console.log(`PIN:  ${pin}`)
