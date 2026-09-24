/**
 * NOTYA-ASI-NOT-01 / -02 — backfill PREVIEW (dry-run only): which vaccines did this doctor's APPROVED, non-archived
 * notes say were given in that visit, and what would reach the aşı kartı?
 *
 *   npx tsx scripts/asi-not-backfill.mts dr.gokhan@notya.ai
 *
 * Reads only. Nothing is written — the write (NOTYA-ASI-NOT-02) waits for Kaan's approval of this table.
 * Source text = the approved note body (what the doctor signed), read with the same deterministic clause reader the
 * SOAP backstop uses (lib/doktor/notAsilari → uygulananAsiParcalari): only "yapıldı / uygulandı / vuruldu / verildi"
 * clauses, never planned / recommended / given-before ones. A dose the note does not state is computed from the card
 * (next in series) and marked "hesaplandı". Card match = the approval rules (notAsisiKartDurumu), notes processed in
 * date order so a series across several visits is simulated. Patients are shown as initials + id prefix (KVKK).
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { decrypt } = await import('../lib/security/encryption')
const { arsivsizAsilar, arsivsizNotlar } = await import('../lib/doktor/arsiv')
const { notAsisiKartDurumu, seriAdi, sonrakiDozNo, uygulananAsiParcalari } = await import('../lib/doktor/notAsilari')
const { ziyaretGunu } = await import('../lib/doktor/notAsiAktarim')
type KartAsisi = import('../lib/doktor/notAsilari').KartAsisi

const eposta = process.argv[2]
if (!eposta || process.argv.includes('--yaz')) {
  console.error('Kullanım: npx tsx scripts/asi-not-backfill.mts <doktor e-postası>   (yalnız önizleme — yazma yok)')
  process.exit(1)
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const coz = (v: unknown) => { try { return v ? decrypt(String(v)) : '' } catch { return '' } }

const { data: u, error: uErr } = await sb.from('users').select('id').eq('email', eposta).maybeSingle()
if (uErr || !u) { console.error('Doktor bulunamadı:', eposta, uErr?.message || ''); process.exit(1) }
const doktorId = String(u.id)

const ALANLAR = 'id, created_at, basvuru_yakinmasi, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_anamnez, content_tedavi, sessions!inner(patient_id, doctor_id)'
const { data: notlar, error } = await arsivsizNotlar(sb, ALANLAR)
  .eq('doctor_id', doktorId).eq('sessions.doctor_id', doktorId)
  .not('approved_at', 'is', null).order('created_at', { ascending: true }).limit(2000)
if (error) { console.error(error.message); process.exit(1) }

const kartlar = new Map<string, KartAsisi[]>()
async function kart(pid: string): Promise<KartAsisi[]> {
  if (!kartlar.has(pid)) {
    const { data, error: e } = await arsivsizAsilar(sb, 'id, asi_adi, doz_no, uygulama_tarihi, kaynak').eq('doktor_id', doktorId).eq('patient_id', pid).limit(500)
    if (e) throw new Error(e.message)
    kartlar.set(pid, (data || []) as KartAsisi[])
  }
  return kartlar.get(pid)!
}
const adlar = new Map<string, string>()
async function hastaEtiketi(pid: string): Promise<string> {
  if (!adlar.has(pid)) {
    const { data: p } = await sb.from('patients').select('name_encrypted').eq('id', pid).eq('doctor_id', doktorId).maybeSingle()
    let ad = coz(p?.name_encrypted)
    try { const j = JSON.parse(ad); ad = `${j.ad || ''} ${j.soyad || ''}` } catch { /* düz metin */ }
    const bas = ad.trim().split(/\s+/).filter(Boolean).map((w) => `${w[0].toLocaleUpperCase('tr-TR')}.`).join('')
    adlar.set(pid, `${bas || '?'} (${pid.slice(0, 8)})`)
  }
  return adlar.get(pid)!
}

type Satir = { tarih: string; hasta: string; asi: string; doz: string; durum: string; cumle: string }
const satirlar: Satir[] = []
let taranan = 0
for (const n of (notlar || []) as Record<string, unknown>[]) {
  taranan++
  const seans = (Array.isArray(n.sessions) ? n.sessions[0] : n.sessions) as { patient_id?: string } | null
  const pid = seans?.patient_id ? String(seans.patient_id) : null
  if (!pid) continue
  const metin = [n.basvuru_yakinmasi, n.content_subjektif, n.content_objektif, n.content_degerlendirme, n.content_plan, n.content_anamnez, n.content_tedavi]
    .map((x) => String(x || '')).filter(Boolean).join('\n')
  const parcalar = uygulananAsiParcalari(metin)
  if (!parcalar.length) continue
  const gun = ziyaretGunu(String(n.created_at))
  const k = await kart(pid)
  const gorulen = new Set<string>()
  for (const p of parcalar) {
    const anahtar = `${p.seri}#${p.doz ?? '-'}`
    if (gorulen.has(anahtar)) continue
    gorulen.add(anahtar)
    const asiAdi = seriAdi(p.seri)
    const doz = p.doz ?? sonrakiDozNo(asiAdi, k, gun)
    const a = { asi_adi: asiAdi, doz_no: doz, uygulama_tarihi: gun }
    const d = notAsisiKartDurumu(a, k)
    const durum = d.tur === 'yeni' ? 'would-insert' : d.tur === 'kartta_var' ? `already-on-card (${d.satir.kaynak || '?'})` : `conflict: ${d.mesaj}`
    if (d.tur === 'yeni') k.push({ asi_adi: asiAdi, doz_no: doz, uygulama_tarihi: gun, kaynak: 'not (önizleme)' })
    satirlar.push({ tarih: gun, hasta: await hastaEtiketi(pid), asi: asiAdi, doz: `${doz}${p.doz == null ? ' (hesaplandı)' : ''}`, durum, cumle: p.cumle.replace(/\|/g, '/') })
  }
}

console.log(`Doktor: ${eposta} · onaylı, arşivsiz not: ${taranan} · aşı satırı: ${satirlar.length} · YAZMA YOK (önizleme)\n`)
console.log('| Not tarihi | Hasta | Aşı | Doz | Durum | Nottaki cümle |')
console.log('|---|---|---|---|---|---|')
for (const s of satirlar) console.log(`| ${s.tarih} | ${s.hasta} | ${s.asi} | ${s.doz} | ${s.durum} | ${s.cumle} |`)
const say = (on: string) => satirlar.filter((s) => s.durum.startsWith(on)).length
console.log(`\nwould-insert: ${say('would-insert')} · already-on-card: ${say('already-on-card')} · conflict: ${say('conflict')}`)
