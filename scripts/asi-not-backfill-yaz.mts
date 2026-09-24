/**
 * NOTYA-ASI-NOT-02 — backfill WRITE (Kaan approved 2026-09-24 after the preview).
 * For each APPROVED, non-archived note of one doctor: the vaccines its objektif / plan / tedavi say were given in that
 * visit become notes.content_asilar (only when the note has none yet — never overwrites the doctor's list), then the
 * same approval sync as Onayla (nottanAsiAktar) writes them to the aşı kartı. Duplicates are skipped and conflicts are
 * NOT written by that sync. Everything touched is saved first to the rollback file.
 *
 * Usage: npx tsx --env-file=.env.local scripts/asi-not-backfill-yaz.mts <doctor e-mail> <rollback.json>
 */
import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const { decrypt } = await import('../lib/security/encryption')
const { arsivsizNotlar } = await import('../lib/doktor/arsiv')
const { seriAdi, uygulananAsiParcalari } = await import('../lib/doktor/notAsilari')
const { ziyaretGunu, nottanAsiAktar } = await import('../lib/doktor/notAsiAktarim')

const [eposta, geriAlDosyasi] = [process.argv[2], process.argv[3]]
if (!eposta || !geriAlDosyasi) { console.error('Usage: <doctor e-mail> <rollback.json>'); process.exit(1) }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const { data: u } = await sb.from('users').select('id').eq('email', eposta).maybeSingle()
if (!u) { console.error('doctor not found'); process.exit(1) }
const doktorId = String(u.id)

const { data: notlar, error } = await arsivsizNotlar(sb, 'id, created_at, content_objektif, content_plan, content_tedavi, content_asilar, sessions!inner(patient_id, doctor_id)')
  .eq('doctor_id', doktorId).eq('sessions.doctor_id', doktorId).not('approved_at', 'is', null).order('created_at', { ascending: true }).limit(2000)
if (error) { console.error(error.message); process.exit(1) }

type Is = { noteId: string; pid: string; gun: string; liste: { asi_adi: string; doz_no: number | null; uygulama_tarihi: string }[]; eskiListe: unknown }
const isler: Is[] = []
for (const n of (notlar || []) as Record<string, unknown>[]) {
  const s = (Array.isArray(n.sessions) ? n.sessions[0] : n.sessions) as { patient_id?: string } | null
  if (!s?.patient_id) continue
  const mevcut = Array.isArray(n.content_asilar) ? n.content_asilar : []
  if (mevcut.length) continue // the doctor already has a list on this note — never overwrite
  const metin = [n.content_objektif, n.content_plan, n.content_tedavi].map((x) => String(x || '')).filter(Boolean).join('\n')
  const parcalar = uygulananAsiParcalari(metin)
  if (!parcalar.length) continue
  const gun = ziyaretGunu(String(n.created_at))
  const gorulen = new Set<string>()
  const liste = parcalar.filter((p) => { const k = `${p.seri}#${p.doz ?? '-'}`; if (gorulen.has(k)) return false; gorulen.add(k); return true })
    .map((p) => ({ asi_adi: seriAdi(p.seri), doz_no: p.doz, uygulama_tarihi: gun }))
  isler.push({ noteId: String(n.id), pid: String(s.patient_id), gun, liste, eskiListe: n.content_asilar ?? null })
}

// Rollback first: every asilar row of this doctor + the old content_asilar of the notes we touch.
const { data: onceAsilar } = await sb.from('asilar').select('*').eq('doktor_id', doktorId)
writeFileSync(geriAlDosyasi, JSON.stringify({ zaman: new Date().toISOString(), doktorId, asilarOnce: onceAsilar || [], notlar: isler.map((i) => ({ id: i.noteId, content_asilar: i.eskiListe })) }, null, 2))
console.log(`rollback saved: ${geriAlDosyasi} (${(onceAsilar || []).length} asilar rows, ${isler.length} notes)`)

const dob = new Map<string, string | null>()
for (const i of isler) {
  if (!dob.has(i.pid)) {
    const { data: p } = await sb.from('patients').select('dob_encrypted').eq('id', i.pid).eq('doctor_id', doktorId).maybeSingle()
    let d: string | null = null
    try { d = p?.dob_encrypted ? decrypt(String(p.dob_encrypted)).slice(0, 10) : null } catch { d = null }
    dob.set(i.pid, d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null)
  }
  const { error: e } = await sb.from('notes').update({ content_asilar: i.liste }).eq('id', i.noteId).eq('doctor_id', doktorId)
  if (e) { console.log(`note ${i.noteId.slice(0, 8)}: content_asilar write failed: ${e.message}`); continue }
  const r = await nottanAsiAktar(sb as never, { noteId: i.noteId, doctorId: doktorId, patientId: i.pid, asilar: i.liste, notTarihi: i.gun, dogumIso: dob.get(i.pid) ?? null })
  console.log(`${i.gun} note ${i.noteId.slice(0, 8)}: written ${r.yazilan}, updated ${r.guncellenen}, already-on-card ${r.karttaVar.length}, conflict ${r.catisma.length}${r.catisma.length ? ' [' + r.catisma.map((c) => c.mesaj).join(' | ') + ']' : ''}${r.hata ? ' ERROR ' + r.hata : ''}`)
}
const { data: sonra } = await sb.from('asilar').select('asi_adi, doz_no, uygulama_tarihi, kaynak_note_id').eq('doktor_id', doktorId).order('uygulama_tarihi')
console.log(`asilar rows now: ${(sonra || []).length}`)
for (const r of sonra || []) console.log('  ', JSON.stringify(r))
