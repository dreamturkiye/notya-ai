/**
 * ESNEK-MUAYENE-B3 — the autonomy ladder on one note (what the doctor sees), the doctor's own changes to the ladder, the daily
 * batch approval, and the secretary-finalization gate (Phase A optional approval).
 *
 * HASTA-IZOLASYON: every note by id AND doctor_id (arsivsizNotlar: an archived visit is never in a batch); questions by
 * doctor_id; events / ladder rows by doctor_id. The batch approval runs the ONE approval path (notOnayla) per note.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'
import { alanGorunumu, notGorunumu, onayliOlmasiGerekenler, hekimIndir, hekimTavaniKaldir, b3TeklifUygun, OZERK_ALANLAR, KORUMALI_ALANLAR, type AlanGorunumu, type Basamak, type NotGorunumu, type OzerkAlan } from '@/core/esnek/ozerklik'
import { ozet } from '@/core/elNotu/derleyici'
import { ALAN_KOLON, alanDurumlariYukle } from './onaySonrasi'
import { esnekAyarYaz, esnekAyarYukle } from './sunucu'

const SOAP_IZ: Partial<Record<OzerkAlan, string>> = { subjektif: 'subjektif', objektif: 'objektif', degerlendirme: 'degerlendirme', plan: 'plan' }
const NOT_SECIM = `id, session_id, approved_at, created_at, hekim_onayi_bekliyor, kaynak_izleri, kaynak_ozeti, ${[...new Set(Object.values(ALAN_KOLON))].join(', ')}, sessions(patient_id)`

/** A note column as display text (arrays / objects rendered as plain lines, never invented). */
export function alanMetni(alan: OzerkAlan, v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) {
    return v.map((x) => {
      if (typeof x === 'string') return x
      const o = (x || {}) as Record<string, unknown>
      if (alan === 'content_ilaclar') return [o.ad, o.doz, o.kullanim, o.sure].filter(Boolean).join(' ')
      if (alan === 'icd10_codes') return [o.code, o.description_tr].filter(Boolean).join(' ')
      if (alan === 'content_asilar') return [o.asi_adi || o.ad, o.doz_no ? `doz ${o.doz_no}` : '', o.uygulama_tarihi].filter(Boolean).join(' ')
      return [o.ad, o.ad_tr, o.test, o.name, o.kod].filter(Boolean).join(' ') || JSON.stringify(o)
    }).filter(Boolean).join('\n')
  }
  if (typeof v === 'object') return Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== null && x !== '' && x !== undefined).map(([k, x]) => `${k}: ${x}`).join('\n')
  return String(v)
}

export type NotDurumu = NotGorunumu & { noteId: string; onayli: boolean; acildi: boolean; gorulen: string[]; onaylanacak: { alan: OzerkAlan; metin: string; anahtar: string }[]; patientId: string | null }

export const gorduAnahtari = (alan: string, metin: string) => `${alan}:${ozet(metin.trim())}`

function notuDegerlendir(n: Record<string, unknown>, adimlar: Map<OzerkAlan, { basamak: Basamak }>, acikOkuma: boolean): NotGorunumu {
  const izler = (n.kaynak_izleri || null) as Partial<Record<string, { cumle: string }[]>> | null
  const alanlar: AlanGorunumu[] = []
  for (const alan of OZERK_ALANLAR) {
    const metin = alanMetni(alan, n[ALAN_KOLON[alan]])
    if (!metin.trim()) continue
    const izAlan = SOAP_IZ[alan]
    const izli = izAlan && izler?.[izAlan] ? new Set(izler[izAlan]!.map((x) => String(x.cumle).trim())) : undefined
    alanlar.push(alanGorunumu(alan, metin, adimlar.get(alan)?.basamak ?? 0, { izli, kaynakli: Boolean(izler && izAlan), acikOkuma }))
  }
  return notGorunumu(alanlar, acikOkuma)
}

const kaynakIdleri = (n: Record<string, unknown>) => (((n.kaynak_ozeti as { kaynaklar?: { id: string }[] } | null)?.kaynaklar) || []).map((k) => k.id).filter((x) => /^[0-9a-f-]{36}$/i.test(x))
const yerTutucuVar = (n: Record<string, unknown>) => /⟦[a-z0-9-]+(\|[^⟧]*)?⟧/.test(OZERK_ALANLAR.map((a) => alanMetni(a, n[ALAN_KOLON[a]])).join('\n'))

/** Open reading questions of many notes in ONE query (round trips do not grow with the number of notes). */
async function acikOkumalar(sb: SupabaseClient, doktorId: string, notlar: Record<string, unknown>[]): Promise<Set<string>> {
  const acik = new Set<string>()
  const kaynakNot = new Map<string, string>()
  for (const n of notlar) { if (yerTutucuVar(n)) acik.add(String(n.id)); for (const k of kaynakIdleri(n)) kaynakNot.set(k, String(n.id)); kaynakNot.set(String(n.id), String(n.id)) }
  if (!kaynakNot.size) return acik
  const { data } = await sb.from('okuma_dogrulamalari').select('kaynak_id').eq('doctor_id', doktorId).in('kaynak_id', [...kaynakNot.keys()]).eq('durum', 'acik').limit(5000)
  for (const r of data || []) { const n = kaynakNot.get(String(r.kaynak_id)); if (n) acik.add(n) }
  return acik
}

async function olaylar(sb: SupabaseClient, doktorId: string, noteIds: string[]): Promise<{ note_id: string; tur: string; anahtar: string; created_at: string }[]> {
  if (!noteIds.length) return []
  const { data } = await sb.from('esnek_olaylar').select('note_id, tur, anahtar, created_at').eq('doctor_id', doktorId).in('note_id', noteIds).in('tur', ['acildi', 'gordum']).limit(5000)
  return (data || []) as never
}

const bugunAcildi = (o: { created_at: string } | undefined) => Boolean(o && Date.now() - new Date(o.created_at).getTime() < 24 * 3600000)

export async function notDurumu(sb: SupabaseClient, doktorId: string, noteId: string): Promise<NotDurumu | null> {
  const { data: n } = await arsivsizNotlar(sb, NOT_SECIM).eq('id', noteId).eq('doctor_id', doktorId).maybeSingle()
  if (!n) return null
  const [adimlar, acik, ol] = await Promise.all([alanDurumlariYukle(sb, doktorId), acikOkumalar(sb, doktorId, [n as Record<string, unknown>]), olaylar(sb, doktorId, [noteId])])
  const g = notuDegerlendir(n as Record<string, unknown>, adimlar, acik.has(noteId))
  const gorulen = ol.filter((o) => o.tur === 'gordum').map((o) => o.anahtar)
  return {
    ...g, noteId, onayli: Boolean((n as { approved_at?: string }).approved_at), acildi: bugunAcildi(ol.find((o) => o.tur === 'acildi')), gorulen,
    onaylanacak: onayliOlmasiGerekenler(g.alanlar).map((x) => ({ ...x, anahtar: gorduAnahtari(x.alan, x.metin) })),
    patientId: ((n as { sessions?: { patient_id?: string } | null }).sessions?.patient_id) || null,
  }
}

/** "Opened" (batch rule: each note opened today) and "seen" for one protected item. Note by id AND doctor_id first. */
export async function notOlayi(sb: SupabaseClient, doktorId: string, userId: string, noteId: string, tur: 'acildi' | 'gordum', anahtar?: string): Promise<boolean> {
  const d = await notDurumu(sb, doktorId, noteId)
  if (!d || d.onayli) return false
  if (tur === 'gordum' && !d.onaylanacak.some((x) => x.anahtar === anahtar)) return false
  const satir = { doctor_id: doktorId, note_id: noteId, patient_id: d.patientId, tur, anahtar: tur === 'acildi' ? 'acildi' : String(anahtar), user_id: userId, created_at: new Date().toISOString() }
  const { error } = await sb.from('esnek_olaylar').upsert(satir, { onConflict: 'doctor_id,note_id,tur,anahtar' })
  return !error
}

export type TopluSatir = NotDurumu & { hasta: string; tarih: string; hazir: boolean; metinler: Partial<Record<OzerkAlan, string>> }

/** Waiting notes (last 3 days) with their ladder view; `hazir` = eligible for the batch now (opened + every item seen). */
export async function topluListe(sb: SupabaseClient, doktorId: string): Promise<{ izin: boolean; notlar: TopluSatir[] }> {
  const ayar = await esnekAyarYukle(sb, doktorId)
  const kesim = new Date(Date.now() - 3 * 86400000).toISOString()
  const { data } = await arsivsizNotlar(sb, NOT_SECIM).eq('doctor_id', doktorId).is('approved_at', null).gte('created_at', kesim).order('created_at', { ascending: true }).limit(60)
  const notlar = (data || []) as Record<string, unknown>[]
  if (!notlar.length) return { izin: ayar.topluOnayIzni, notlar: [] }
  const [adimlar, ol, aciklar] = await Promise.all([alanDurumlariYukle(sb, doktorId), olaylar(sb, doktorId, notlar.map((n) => String(n.id))), acikOkumalar(sb, doktorId, notlar)])
  const { hastaAdlari } = await import('@/lib/elNotu/sunucu')
  const pid = (n: Record<string, unknown>) => ((n.sessions as { patient_id?: string } | null)?.patient_id) || null
  const adlar = await hastaAdlari(sb, doktorId, notlar.map((n) => String(pid(n) || '')))
  const out: TopluSatir[] = []
  for (const n of notlar) {
    const id = String(n.id)
    const g = notuDegerlendir(n, adimlar, aciklar.has(id))
    if (!g.topluUygun) continue
    const benim = ol.filter((o) => o.note_id === id)
    const gorulen = benim.filter((o) => o.tur === 'gordum').map((o) => o.anahtar)
    const onaylanacak = onayliOlmasiGerekenler(g.alanlar).map((x) => ({ ...x, anahtar: gorduAnahtari(x.alan, x.metin) }))
    const acildi = bugunAcildi(benim.find((o) => o.tur === 'acildi'))
    const metinler = Object.fromEntries(g.alanlar.map((a) => [a.alan, alanMetni(a.alan, n[ALAN_KOLON[a.alan]]).slice(0, 4000)])) as TopluSatir['metinler']
    out.push({ ...g, noteId: id, onayli: false, acildi, gorulen, onaylanacak, patientId: pid(n), hasta: adlar.get(String(pid(n))) || '', tarih: String(n.created_at), hazir: acildi && onaylanacak.every((x) => gorulen.includes(x.anahtar)), metinler })
  }
  return { izin: ayar.topluOnayIzni, notlar: out }
}

/** Batch approve: only notes the server itself finds eligible now (B3 on, opened today, every protected item seen). */
export async function topluOnayla(sb: SupabaseClient, doktorId: string, userId: string, noteIds: unknown): Promise<{ onaylanan: string[]; reddedilen: string[] } | { hata: string; durum: number }> {
  const ayar = await esnekAyarYukle(sb, doktorId)
  if (!ayar.topluOnayIzni) return { hata: 'Toplu onay açık değil.', durum: 403 }
  const istenen = new Set((Array.isArray(noteIds) ? noteIds : []).filter((x): x is string => typeof x === 'string' && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 30))
  if (!istenen.size) return { hata: 'Not seçilmedi.', durum: 400 }
  const { notlar } = await topluListe(sb, doktorId)
  const { notOnayla } = await import('@/lib/doktor/notOnayla')
  const onaylanan: string[] = [], reddedilen: string[] = []
  for (const id of istenen) {
    const n = notlar.find((x) => x.noteId === id)
    if (!n || !n.hazir) { reddedilen.push(id); continue }
    const y = await notOnayla(sb, { noteId: id, doktorId, onaylayanId: userId, govde: { duzenlemeler: {} }, ogrenme: true })
    if (y.status === 200) onaylanan.push(id); else reddedilen.push(id)
  }
  return { onaylanan, reddedilen }
}

/** The ladder as the doctor sees it on his card, plus whether the B3 offer applies. */
export async function ozerklikOzeti(sb: SupabaseClient, doktorId: string): Promise<{ alanlar: { alan: OzerkAlan; basamak: Basamak; seri: number; hekimTavani: Basamak; korumali: boolean }[]; b3Teklif: boolean; topluOnayIzni: boolean }> {
  const [adimlar, ayar] = await Promise.all([alanDurumlariYukle(sb, doktorId), esnekAyarYukle(sb, doktorId)])
  const liste = [...adimlar.values()]
  return {
    alanlar: liste.map((a) => ({ alan: a.alan, basamak: a.basamak, seri: a.seri, hekimTavani: a.hekimTavani, korumali: KORUMALI_ALANLAR.has(a.alan) })),
    b3Teklif: !ayar.topluOnayIzni && b3TeklifUygun(liste), topluOnayIzni: ayar.topluOnayIzni,
  }
}

/** The doctor lowers a field one step (or lifts his own ceiling back), or opens / closes the daily batch approval. */
export async function ozerklikIslem(sb: SupabaseClient, doktorId: string, userId: string, g: { islem: unknown; alan?: unknown }): Promise<boolean> {
  if (g.islem === 'toplu_ac' || g.islem === 'toplu_kapat') {
    const ac = g.islem === 'toplu_ac'
    if (!(await esnekAyarYaz(sb, doktorId, userId, { toplu_onay_izni: ac }))) return false
    if (!ac) {
      // closing B3: every field at B3 goes back to B2
      const adimlar = await alanDurumlariYukle(sb, doktorId)
      const yaz = [...adimlar.values()].filter((a) => a.basamak === 3).map((a) => ({ doctor_id: doktorId, alan: a.alan, basamak: 2, seri: a.seri, hekim_tavani: a.hekimTavani, updated_at: new Date().toISOString() }))
      if (yaz.length) await sb.from('alan_ozerklik').upsert(yaz, { onConflict: 'doctor_id,alan' })
    }
    return true
  }
  if (typeof g.alan !== 'string' || !(OZERK_ALANLAR as readonly string[]).includes(g.alan)) return false
  const alan = g.alan as OzerkAlan
  const d = (await alanDurumlariYukle(sb, doktorId)).get(alan)!
  const yeni = g.islem === 'indir' ? hekimIndir(d, Math.max(0, d.basamak - 1) as Basamak) : g.islem === 'tavan_kaldir' ? hekimTavaniKaldir(d) : null
  if (!yeni) return false
  const { error } = await sb.from('alan_ozerklik').upsert({ doctor_id: doktorId, alan, basamak: yeni.basamak, seri: yeni.seri, hekim_tavani: yeni.hekimTavani, updated_at: new Date().toISOString() }, { onConflict: 'doctor_id,alan' })
  return !error
}

/**
 * Phase A optional approval × B3: a secretary may finalize only when the doctor turned approval off — and never a note with
 * drugs / doses, diagnosis codes or an allergy proposal (never automatic, never without the doctor). Pure decision.
 */
export function personelKesinlestirmeEngeli(n: { content_ilaclar?: unknown; icd10_codes?: unknown; kaynak_ozeti?: unknown }): 'ilac' | 'tani_kodu' | 'alerji' | null {
  if (Array.isArray(n.content_ilaclar) && n.content_ilaclar.length) return 'ilac'
  if (Array.isArray(n.icd10_codes) && n.icd10_codes.length) return 'tani_kodu'
  const oneriler = ((n.kaynak_ozeti as { dosyaOnerileri?: { tur?: string }[] } | null)?.dosyaOnerileri) || []
  if (oneriler.some((o) => o?.tur === 'alerji')) return 'alerji'
  return null
}
