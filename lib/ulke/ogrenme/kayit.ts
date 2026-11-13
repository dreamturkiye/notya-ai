/**
 * AYSE-OGRENME-V3f — LEARNING MOMENTUM IN A COUNTRY BUILD: the draft kept until approval, the edit log and the
 * correction count of each approved note (migration 198). The country's version of Türkiye's
 * lib/doktor/ogrenme/{arkaPlandaOgren,metrik}.ts; the counting itself is the same shared pure analysis (./duzeltme.ts).
 *
 * PATIENT ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md). Service-role client, so this file is the isolation:
 * every statement goes through the country door (`ulkeTablosu`) and carries the authenticated doctor's id. The note
 * id comes from the doctor's OWN approved note (the approve route proved it before calling this); even so, every
 * statement here is scoped by doctor_id AND note id, so a foreign id reads nothing and writes nothing.
 *
 * HONEST MEASUREMENT. A note with no draft on record (written before migration 198, or the draft could not be kept),
 * or approved in the other language than the draft, has NO count: nothing is invented, no zero is written.
 * A note approved without a change counts 0.
 *
 * NEVER BREAKS A PAGE. Every statement answers with an error value when the tables are not on the database yet
 * (migration 198 not applied): that is "no data", never a thrown error, never a 500.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { OnayMetrigi } from '@/lib/doktor/ogrenme/ivme'
import type { NotIcerigi } from '../tipler'
import { ulkeTablosu } from '../uygulama/tablolar'
import { arkaPlandaSurdur } from './arkaPlan'
import { duzeltmeSayisi, duzenlemeleriBul } from './duzeltme'

type Dort = Pick<NotIcerigi, 's' | 'o' | 'a' | 'p'>
type Taslak = Dort & { dil: string }

/** The model's draft of a note, written once, when the note is written. Fails quietly (the note is not affected). */
export async function taslakKaydet(supabase: SupabaseClient, doktorId: string, notId: string, dil: string, icerik: Dort): Promise<void> {
  if (!doktorId || !notId || !dil) return
  const { error } = await ulkeTablosu(supabase, 'ulke_not_taslaklari').upsert(
    { doctor_id: doktorId, note_id: notId, dil, s: icerik.s ?? '', o: icerik.o ?? '', a: icerik.a ?? '', p: icerik.p ?? '' },
    { onConflict: 'ulke,doctor_id,note_id' },
  )
  if (error) console.error('[ulke/ogrenme] taslak yazilamadi', (error as { code?: string }).code ?? '')
}

async function taslakOku(supabase: SupabaseClient, doktorId: string, notId: string): Promise<Taslak | null> {
  const { data, error } = await ulkeTablosu(supabase, 'ulke_not_taslaklari').select('dil, s, o, a, p').eq('doctor_id', doktorId).eq('note_id', notId).maybeSingle()
  const t = data as Partial<Taslak> | null
  if (error || !t || typeof t.dil !== 'string') return null
  return { dil: t.dil, s: String(t.s ?? ''), o: String(t.o ?? ''), a: String(t.a ?? ''), p: String(t.p ?? '') }
}

/**
 * After an approval: compare the approved text with the kept draft, write the correction count (and the edit log of
 * the sections that changed), and drop the draft. Idempotent: every write is keyed by (country, doctor, note[, section]).
 * Returns the count written, or null when nothing could be measured.
 */
export async function onayiOgren(supabase: SupabaseClient, doktorId: string, notId: string, onayDili: string, onayli: Dort): Promise<number | null> {
  if (!doktorId || !notId) return null
  const taslak = await taslakOku(supabase, doktorId, notId)
  if (!taslak) return null
  const temizle = async () => { await ulkeTablosu(supabase, 'ulke_not_taslaklari').delete().eq('doctor_id', doktorId).eq('note_id', notId) }
  // The other language's draft is a different text: not comparable with the model's draft, so not measured.
  if (taslak.dil !== onayDili) { await temizle(); return null }
  const sayi = duzeltmeSayisi(taslak, onayli)
  const { error } = await ulkeTablosu(supabase, 'ulke_ogrenme_metrik').upsert(
    { doctor_id: doktorId, note_id: notId, duzeltme_sayisi: sayi, onay_at: new Date().toISOString() },
    { onConflict: 'ulke,doctor_id,note_id' },
  )
  if (error) { console.error('[ulke/ogrenme] metrik yazilamadi', (error as { code?: string }).code ?? ''); return null }
  for (const d of duzenlemeleriBul(taslak, onayli)) {
    const { error: e } = await ulkeTablosu(supabase, 'ulke_not_duzenlemeleri').upsert(
      { doctor_id: doktorId, note_id: notId, alan: d.alan, onceki: d.onceki, sonraki: d.sonraki },
      { onConflict: 'ulke,doctor_id,note_id,alan' },
    )
    if (e) console.error('[ulke/ogrenme] duzenleme yazilamadi', (e as { code?: string }).code ?? '')
  }
  await temizle()
  return sayi
}

/** The draft is kept in the background of the note's own write: no latency on the doctor's request. */
export function taslagiArkaPlandaKaydet(supabase: SupabaseClient, doktorId: string, notId: string, dil: string, icerik: Dort): void {
  arkaPlandaSurdur(taslakKaydet(supabase, doktorId, notId, dil, icerik))
}

/** The approval's learning step, in the background of the approve answer: no latency on the doctor's request. */
export function onayiArkaPlandaOgren(supabase: SupabaseClient, doktorId: string, notId: string, onayDili: string, onayli: Dort): void {
  arkaPlandaSurdur(onayiOgren(supabase, doktorId, notId, onayDili, onayli))
}

/** The doctor's own correction counts, oldest first, at most `limit` (the latest). [] when there is none or the table is not there yet. */
export async function onayMetrikleriniOku(supabase: SupabaseClient, doktorId: string, limit = 60): Promise<OnayMetrigi[]> {
  const { data, error } = await ulkeTablosu(supabase, 'ulke_ogrenme_metrik')
    .select('note_id, duzeltme_sayisi, onay_at')
    .eq('doctor_id', doktorId)
    .order('onay_at', { ascending: false })
    .limit(limit)
  if (error || !Array.isArray(data)) return []
  return (data as OnayMetrigi[]).reverse()
}
