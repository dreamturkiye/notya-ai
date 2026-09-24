/**
 * NOTYA-ASI-LOT-01 part 2 — fill asilar.lot_no / asilar.uygulama_yeri of rows written from a muayene note
 * (kaynak_note_id) from that note's own text. Kaan approved backfilling this data (2026-09-24).
 *
 *   npx tsx scripts/asi-lot-backfill.mts <doctor e-mail> <rollback.json>            dry-run: table only, nothing written
 *   npx tsx scripts/asi-lot-backfill.mts <doctor e-mail> <rollback.json> --uygula   write
 *
 * Source = the approved note's objektif / plan / tedavi (this-visit sections, as NOTYA-ASI-NOT-03), read with the same
 * deterministic reader as the SOAP backstop (lib/doktor/notAsilari → asiLotYeriBul: the vaccine's own clause only, a
 * value only with an explicit marker, two different values → empty). ONLY empty fields are filled — never overwritten
 * (the update itself is guarded with `is null`). The note's content_asilar entry for that vaccine gets the same values
 * (only its empty fields) so the note form shows them and a re-approval keeps them. --uygula writes the rollback file
 * (old asilar rows + old content_asilar) BEFORE any change. Rows of an archived muayene are not touched (arsivsizAsilar).
 * Patients are shown as initials + id prefix (KVKK).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { decrypt } = await import('../lib/security/encryption')
const { arsivsizAsilar } = await import('../lib/doktor/arsiv')
const { asiLotYeriBul, asiSeriAnahtari } = await import('../lib/doktor/notAsilari')

const [eposta, geriAlDosyasi] = [process.argv[2], process.argv[3]]
const uygula = process.argv.includes('--uygula')
if (!eposta || !geriAlDosyasi || geriAlDosyasi.startsWith('--')) {
  console.error('Usage: npx tsx scripts/asi-lot-backfill.mts <doctor e-mail> <rollback.json> [--uygula]')
  process.exit(1)
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const { data: u, error: uErr } = await sb.from('users').select('id').eq('email', eposta).maybeSingle()
if (uErr || !u) { console.error('doctor not found:', eposta, uErr?.message || ''); process.exit(1) }
const doktorId = String(u.id)

type Satir = { id: string; patient_id: string; asi_adi: string; doz_no: number | null; uygulama_tarihi: string | null; kaynak_note_id: string; lot_no: string | null; uygulama_yeri: string | null }
const { data: hamSatirlar, error: aErr } = await arsivsizAsilar(sb, 'id, patient_id, asi_adi, doz_no, uygulama_tarihi, kaynak_note_id, lot_no, uygulama_yeri')
  .eq('doktor_id', doktorId).not('kaynak_note_id', 'is', null).order('uygulama_tarihi', { ascending: true }).limit(2000)
if (aErr) { console.error(aErr.message); process.exit(1) }
const satirlar = ((hamSatirlar || []) as unknown as Satir[]).filter((r) => !r.lot_no || !r.uygulama_yeri)

const notIdleri = [...new Set(satirlar.map((r) => r.kaynak_note_id))]
const notlar = new Map<string, { metin: string; content_asilar: unknown }>()
for (let i = 0; i < notIdleri.length; i += 100) {
  const { data, error } = await sb.from('notes').select('id, content_objektif, content_plan, content_tedavi, content_asilar')
    .eq('doctor_id', doktorId).in('id', notIdleri.slice(i, i + 100))
  if (error) { console.error(error.message); process.exit(1) }
  for (const n of data || []) {
    notlar.set(String(n.id), { metin: [n.content_objektif, n.content_plan, n.content_tedavi].map((x) => String(x || '')).filter(Boolean).join('\n'), content_asilar: n.content_asilar ?? null })
  }
}

const etiketler = new Map<string, string>()
async function hastaEtiketi(pid: string): Promise<string> {
  if (!etiketler.has(pid)) {
    const { data: p } = await sb.from('patients').select('name_encrypted').eq('id', pid).eq('doctor_id', doktorId).maybeSingle()
    let ad = ''
    try { ad = p?.name_encrypted ? decrypt(String(p.name_encrypted)) : '' } catch { ad = '' }
    try { const j = JSON.parse(ad); ad = `${j.ad || ''} ${j.soyad || ''}` } catch { /* plain text */ }
    const bas = ad.trim().split(/\s+/).filter(Boolean).map((w) => `${w[0].toLocaleUpperCase('tr-TR')}.`).join('')
    etiketler.set(pid, `${bas || '?'} (${pid.slice(0, 8)})`)
  }
  return etiketler.get(pid)!
}

type Is = { satir: Satir; lot: string | null; yer: string | null; cumle: string | null }
const isler: Is[] = []
const tablo: string[] = []
for (const s of satirlar) {
  const n = notlar.get(s.kaynak_note_id)
  const b = n ? asiLotYeriBul(n.metin, s.asi_adi) : { lot_no: null, uygulama_yeri: null, cumle: null }
  const lot = !s.lot_no && b.lot_no ? b.lot_no : null
  const yer = !s.uygulama_yeri && b.uygulama_yeri ? b.uygulama_yeri : null
  if (lot || yer) isler.push({ satir: s, lot, yer, cumle: b.cumle })
  const tarih = String(s.uygulama_tarihi || '').slice(0, 10)
  const tr = tarih ? `${tarih.slice(8, 10)}.${tarih.slice(5, 7)}.${tarih.slice(0, 4)}` : '—'
  tablo.push(`| ${tr} | ${await hastaEtiketi(s.patient_id)} | ${s.asi_adi} | ${s.doz_no ?? '—'} | ${s.lot_no || (lot ? `**${lot}**` : '—')} | ${s.uygulama_yeri || (yer ? `**${yer}**` : '—')} | ${n ? (b.cumle || '(no lot / site in the note)').replace(/\|/g, '/') : '(note not found)'} |`)
}

console.log(`Doctor: ${eposta} · note-sourced rows with an empty lot / site: ${satirlar.length} · to fill: ${isler.length} · ${uygula ? 'WRITE (--uygula)' : 'DRY-RUN (nothing written)'}\n`)
console.log('| Date | Patient | Vaccine | Dose | Lot | Site | Clause read |')
console.log('|---|---|---|---|---|---|---|')
for (const t of tablo) console.log(t)
console.log('\n(**bold** = would be filled / filled now; plain = already on the row)')

if (!uygula || !isler.length) process.exit(0)

// Rollback first: the old asilar rows we touch + the old content_asilar of their notes.
const dokunulanNotlar = [...new Set(isler.map((i) => i.satir.kaynak_note_id))]
const { data: onceSatirlar, error: oErr } = await sb.from('asilar').select('*').eq('doktor_id', doktorId).in('id', isler.map((i) => i.satir.id))
if (oErr) { console.error(oErr.message); process.exit(1) }
writeFileSync(geriAlDosyasi, JSON.stringify({
  is: 'NOTYA-ASI-LOT-01', zaman: new Date().toISOString(), doktorId,
  asilarOnce: onceSatirlar || [],
  notlar: dokunulanNotlar.map((id) => ({ id, content_asilar: notlar.get(id)?.content_asilar ?? null })),
}, null, 2))
console.log(`\nrollback saved: ${geriAlDosyasi} (${(onceSatirlar || []).length} asilar rows, ${dokunulanNotlar.length} notes)`)

let lotYazilan = 0, yerYazilan = 0
for (const i of isler) {
  // Guarded with `is null`: a value written meanwhile is never overwritten.
  if (i.lot) {
    const { data, error } = await sb.from('asilar').update({ lot_no: i.lot }).eq('id', i.satir.id).eq('doktor_id', doktorId).is('lot_no', null).select('id')
    if (error) console.log(`row ${i.satir.id.slice(0, 8)} lot: ERROR ${error.message}`)
    else lotYazilan += (data || []).length
  }
  if (i.yer) {
    const { data, error } = await sb.from('asilar').update({ uygulama_yeri: i.yer }).eq('id', i.satir.id).eq('doktor_id', doktorId).is('uygulama_yeri', null).select('id')
    if (error) console.log(`row ${i.satir.id.slice(0, 8)} site: ERROR ${error.message}`)
    else yerYazilan += (data || []).length
  }
}

let notYazilan = 0
for (const noteId of dokunulanNotlar) {
  const eski = notlar.get(noteId)?.content_asilar
  if (!Array.isArray(eski)) continue
  let degisti = false
  const yeni = eski.map((e: Record<string, unknown>) => {
    const eslesen = isler.find((i) => i.satir.kaynak_note_id === noteId && asiSeriAnahtari(String(e.asi_adi || '')) === asiSeriAnahtari(i.satir.asi_adi)
      && (e.doz_no == null || i.satir.doz_no == null || Number(e.doz_no) === Number(i.satir.doz_no)))
    if (!eslesen) return e
    const out = { ...e }
    if (!out.lot_no && eslesen.lot) { out.lot_no = eslesen.lot; degisti = true }
    if (!out.uygulama_yeri && eslesen.yer) { out.uygulama_yeri = eslesen.yer; degisti = true }
    return out
  })
  if (!degisti) continue
  const { error } = await sb.from('notes').update({ content_asilar: yeni }).eq('id', noteId).eq('doctor_id', doktorId)
  if (error) console.log(`note ${noteId.slice(0, 8)} content_asilar: ERROR ${error.message}`)
  else notYazilan += 1
}
console.log(`written: lot_no ${lotYazilan}, uygulama_yeri ${yerYazilan}, notes.content_asilar ${notYazilan}`)
