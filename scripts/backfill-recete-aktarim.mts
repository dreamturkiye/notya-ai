#!/usr/bin/env npx tsx
/**
 * NOTYA-RECETE-01 backfill — reçete aktarımı, onay endpoint'ine eklenmeden ÖNCE
 * onaylanmış notlar için.
 *
 * Aktarım artık not onayında otomatik çalışıyor; ancak mevcut onaylı notların
 * reçeteleri hiç aktarılmamıştı. Bu script onları hasta_ilaclar'a 'beklemede'
 * olarak yazar — hepsi hekim kararını bekler, hiçbiri hastaya görünmez.
 *
 * Idempotent: (kaynak_note_id, ilac_adi) tekil indeksi tekrarı önler.
 *
 *   npx --yes tsx scripts/backfill-recete-aktarim.mts                 # dry run
 *   npx --yes tsx scripts/backfill-recete-aktarim.mts --apply
 *   npx --yes tsx scripts/backfill-recete-aktarim.mts --apply --doctor mamur
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

const { nottanIlaclariCikar, nottanIlacAktar } = await import('../lib/doktor/receteAktarim')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

const APPLY = process.argv.includes('--apply')
const doctorFilter = (() => {
  const i = process.argv.indexOf('--doctor')
  return i >= 0 ? process.argv[i + 1] : null
})()

// ── Hedef doktorlar ─────────────────────────────────────────────────────────
const { data: users } = await sb.from('users').select('id, full_name, email').limit(200)
let hedefDoktorlar = users || []
if (doctorFilter) {
  const re = new RegExp(doctorFilter, 'i')
  hedefDoktorlar = hedefDoktorlar.filter((u) => re.test(String(u.full_name || u.email || '')))
  if (!hedefDoktorlar.length) throw new Error(`Doktor bulunamadı: ${doctorFilter}`)
}

let toplamNot = 0
let toplamIlac = 0
let toplamAktarilan = 0
let toplamAtlanan = 0

for (const doc of hedefDoktorlar) {
  const { data: patients } = await sb.from('patients').select('id').eq('doctor_id', doc.id)
  const patientIds = (patients || []).map((p) => p.id as string)
  if (!patientIds.length) continue

  const { data: sessions } = await sb.from('sessions').select('id, patient_id').in('patient_id', patientIds)
  const patientBySession = new Map((sessions || []).map((s) => [s.id as string, s.patient_id as string]))
  if (!patientBySession.size) continue

  const { data: notes } = await sb
    .from('notes')
    .select('id, session_id, created_at, content_ilaclar, recete_onerisi')
    .in('session_id', [...patientBySession.keys()])
    .not('approved_at', 'is', null)

  const ilgili = (notes || []).filter((n) => nottanIlaclariCikar(n).length > 0)
  if (!ilgili.length) continue

  console.log(`\n${doc.full_name} — reçete taşıyan ${ilgili.length} onaylı not:`)

  for (const n of ilgili) {
    const patientId = patientBySession.get(String(n.session_id))
    if (!patientId) continue
    const ilaclar = nottanIlaclariCikar(n)
    toplamNot += 1
    toplamIlac += ilaclar.length

    console.log(
      `  ${String(n.created_at).slice(0, 10)} | hasta ${patientId.slice(0, 8)}… | ${ilaclar.length} ilaç: ${ilaclar
        .map((i) => i.ilac_adi)
        .join(', ')}`
    )

    if (!APPLY) continue

    const sonuc = await nottanIlacAktar(sb, {
      noteId: String(n.id),
      doctorId: String(doc.id),
      patientId,
      tarih: n.created_at as string | null,
    })
    if (sonuc.hata) {
      console.log(`     HATA: ${sonuc.hata}`)
      continue
    }
    toplamAktarilan += sonuc.aktarilan
    toplamAtlanan += sonuc.atlanan
    console.log(`     → aktarılan: ${sonuc.aktarilan}, atlanan: ${sonuc.atlanan}`)
  }
}

console.log(`\n${toplamNot} not, ${toplamIlac} reçete satırı tespit edildi.`)
if (APPLY) {
  console.log(`Aktarılan: ${toplamAktarilan} · Atlanan (zaten var): ${toplamAtlanan}`)
  console.log("Hepsi 'beklemede' — hekim karar verene kadar hastaya görünmez.")
} else {
  console.log('DRY RUN — hiçbir şey yazılmadı. Uygulamak için: --apply')
}
