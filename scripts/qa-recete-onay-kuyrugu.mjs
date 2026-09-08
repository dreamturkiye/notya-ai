#!/usr/bin/env node
/**
 * NOTYA-RECETE-01 doğrulama: nottan aktarılan reçeteler doktorun kuyruğunda mı,
 * hastanın portalında görünmüyor mu? İlaç adlarını basar (hekimin göreceği liste),
 * hasta kimliği kısaltılır.
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

const { data: rows, error } = await sb
  .from('hasta_ilaclar')
  .select('id, patient_id, ilac_adi, etken_madde, doz, kullanim_sikli, aktif, onay_durumu, kaynak_note_id, baslangic_tarihi')
  .order('patient_id', { ascending: true })
  .order('baslangic_tarihi', { ascending: false })

if (error) throw new Error(error.message)

const byPatient = new Map()
for (const r of rows || []) {
  const arr = byPatient.get(r.patient_id) || []
  arr.push(r)
  byPatient.set(r.patient_id, arr)
}

let bekleyen = 0
let onayli = 0
for (const [pid, list] of byPatient) {
  console.log(`\nhasta ${String(pid).slice(0, 8)}…`)
  for (const r of list) {
    const durum = r.onay_durumu === 'beklemede' ? 'BEKLEMEDE (hastaya görünmez)' : r.aktif ? 'onaylı · aktif' : 'onaylı · sonlandırıldı'
    const kaynak = r.kaynak_note_id ? 'nottan' : 'elle'
    console.log(`  ${durum.padEnd(30)} ${kaynak.padEnd(6)} ${r.ilac_adi}`)
    if (r.onay_durumu === 'beklemede') bekleyen += 1
    else onayli += 1
  }
}

console.log(`\nToplam: ${bekleyen} beklemede · ${onayli} onaylı`)
console.log('Portal yalnızca onaylı satırları gösterir (app/api/portal/hasta/[token]/route.ts).')
