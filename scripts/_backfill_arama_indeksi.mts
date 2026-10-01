/**
 * NOTYA-ARAMA-INDEKS-01 backfill -- one-time: compute search-token hashes for every existing
 * patient so hastaninSozunuCoz()'s indexed lookup has coverage from day one. Idempotent
 * (hastaAramaIndeksiniGuncelle deletes-then-inserts per patient) -- safe to re-run.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvLocal() {
  const envPath = resolve(root, '.env.local')
  if (!existsSync(envPath)) return
  const dq = String.fromCharCode(34)
  const sq = String.fromCharCode(39)
  for (const line of readFileSync(envPath, 'utf8').split(String.fromCharCode(10))) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith(dq) && val.endsWith(dq)) || (val.startsWith(sq) && val.endsWith(sq))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnvLocal()

const { createClient } = await import('@supabase/supabase-js')
const { hastaAdiCoz } = await import('../lib/doktor/hastaCozumleyici')
const { hastaAramaIndeksiniGuncelle } = await import('../lib/doktor/hastaAramaIndeksi')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: hastalar, error } = await supabase.from('patients').select('id, doctor_id, name_encrypted')
if (error) { console.error('fetch error', error.message); process.exit(1) }

let ok = 0
let bos = 0
for (const h of hastalar || []) {
  const ad = hastaAdiCoz(h.name_encrypted)
  if (!ad) { bos++; continue }
  await hastaAramaIndeksiniGuncelle(supabase, h.doctor_id, h.id, ad)
  ok++
}
console.log('backfill done: indexed=' + ok + ' empty-name=' + bos + ' total=' + (hastalar || []).length)
