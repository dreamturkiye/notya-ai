/**
 * ESNEK-MUAYENE-B3 + B5 — after a note is approved (the ONE approval path, lib/doktor/notOnayla.ts), after the response:
 *   - the field-level autonomy ladder: a corrected field drops one step; an uncorrected field present in the note counts
 *     towards the next step — only on the DOCTOR's approval (a secretary's finalization never promotes anything);
 *   - the suggestion profile: which of Ayşe's suggestion types reached his final note (doctor's approval only);
 *   - ESNEK-GELISIM: the regression set's pending pages of this note get their facts (doctor's approval + consent only).
 * Idempotent per note (esnek_olaylar unique (doctor, note, kind, key)): a re-approval never counts twice.
 * HASTA-IZOLASYON: called with the doctor id and the note id the approval already proved; every row carries doctor_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { notIsle, yeniAlan, OZERK_ALANLAR, type AlanDurumu, type OzerkAlan, type Basamak } from '@/core/esnek/ozerklik'
import { notGeriBildirimi } from '@/core/esnek/oneriProfili'
import { esnekAyarYukle } from './sunucu'

/** Approval-log field name → ladder field. */
const LOG_ALAN: Record<string, OzerkAlan> = {
  basvuruYakinmasi: 'basvuruYakinmasi', subjektif: 'subjektif', objektif: 'objektif', degerlendirme: 'degerlendirme', plan: 'plan',
  hastaOzeti: 'hastaOzeti', alarm_bulgulari: 'alarm_bulgulari', vitaller: 'vitaller', content_tetkikler: 'content_tetkikler',
  content_asilar: 'content_asilar', content_ilaclar: 'content_ilaclar', icd10_codes: 'icd10_codes',
}
/** Ladder field → note column. */
export const ALAN_KOLON: Record<OzerkAlan, string> = {
  basvuruYakinmasi: 'basvuru_yakinmasi', subjektif: 'content_subjektif', objektif: 'content_objektif', degerlendirme: 'content_degerlendirme',
  plan: 'content_plan', hastaOzeti: 'hasta_ozeti', alarm_bulgulari: 'alarm_bulgulari', vitaller: 'vitaller', content_tetkikler: 'content_tetkikler',
  content_asilar: 'content_asilar', content_ilaclar: 'content_ilaclar', icd10_codes: 'icd10_codes',
}

const doluMu = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.values(v as Record<string, unknown>).some((x) => x !== null && x !== '' && x !== undefined) : typeof v === 'string' ? v.trim().length > 0 : false)

export function alanDurumlari(satirlar: { alan: string; basamak: number; seri: number; hekim_tavani: number }[]): Map<OzerkAlan, AlanDurumu> {
  const m = new Map<OzerkAlan, AlanDurumu>()
  for (const a of OZERK_ALANLAR) m.set(a, yeniAlan(a))
  for (const r of satirlar) if ((OZERK_ALANLAR as readonly string[]).includes(r.alan)) m.set(r.alan as OzerkAlan, { alan: r.alan as OzerkAlan, basamak: Math.max(0, Math.min(3, Number(r.basamak) || 0)) as Basamak, seri: Math.max(0, Number(r.seri) || 0), hekimTavani: Math.max(0, Math.min(3, Number(r.hekim_tavani ?? 3))) as Basamak })
  return m
}

export async function alanDurumlariYukle(sb: SupabaseClient, doktorId: string): Promise<Map<OzerkAlan, AlanDurumu>> {
  const { data } = await sb.from('alan_ozerklik').select('alan, basamak, seri, hekim_tavani').eq('doctor_id', doktorId)
  return alanDurumlari((data || []) as never)
}

export type OnaySonrasiGirdisi = {
  doktorId: string
  noteId: string
  patientId: string | null
  /** The approver is the doctor (false = a secretary's finalization). */
  hekim: boolean
  /** Fields changed at approval (lib/doktor/notOnayla.ts `loglar`). */
  loglar: { alan: string }[]
  /** The note's final values (existing row merged with this approval's update). */
  son: Record<string, unknown>
  /** The advisory as generated (to judge what reached the note). */
  aiDegerlendirme: string | null
  receteOnerisi: unknown
}

export async function esnekOnaySonrasi(sb: SupabaseClient, g: OnaySonrasiGirdisi): Promise<{ alan: number; oneri: number }> {
  const duzeltilen = new Set(g.loglar.map((l) => LOG_ALAN[l.alan]).filter(Boolean))
  const mevcut = OZERK_ALANLAR.filter((a) => duzeltilen.has(a) || doluMu(g.son[ALAN_KOLON[a]]))
  // corrections count from anyone; uncorrected fields count only on the doctor's own approval
  const olaylar = mevcut.filter((a) => duzeltilen.has(a) || g.hekim).map((a) => ({ doctor_id: g.doktorId, note_id: g.noteId, patient_id: g.patientId, tur: 'alan', anahtar: a, deger: { duzeltildi: duzeltilen.has(a), hekim: g.hekim } }))
  let alanSayi = 0
  if (olaylar.length) {
    const { data: yeni } = await sb.from('esnek_olaylar').upsert(olaylar, { onConflict: 'doctor_id,note_id,tur,anahtar', ignoreDuplicates: true }).select('anahtar, deger')
    if (yeni?.length) {
      const [durumlar, ayar] = await Promise.all([alanDurumlariYukle(sb, g.doktorId), esnekAyarYukle(sb, g.doktorId)])
      const simdi = new Date().toISOString()
      const yaz = (yeni as { anahtar: string; deger: { duzeltildi?: boolean } }[]).map((o) => {
        const alan = o.anahtar as OzerkAlan
        const d = notIsle(durumlar.get(alan) || yeniAlan(alan), Boolean(o.deger?.duzeltildi), ayar.topluOnayIzni)
        return { doctor_id: g.doktorId, alan, basamak: d.basamak, seri: d.seri, hekim_tavani: d.hekimTavani, ...(o.deger?.duzeltildi ? { son_duzeltme_at: simdi } : {}), updated_at: simdi }
      })
      await sb.from('alan_ozerklik').upsert(yaz, { onConflict: 'doctor_id,alan' })
      alanSayi = yaz.length
    }
  }
  let oneriSayi = 0
  if (g.hekim) {
    const metin = (k: string) => { const v = g.son[k]; return Array.isArray(v) ? JSON.stringify(v) : typeof v === 'string' ? v : '' }
    const sonMetin = ['content_plan', 'content_tedavi', 'content_degerlendirme', 'content_tani', 'content_objektif', 'content_ilaclar', 'content_tetkikler'].map(metin).join('\n')
    const gb = notGeriBildirimi({ aiDegerlendirme: g.aiDegerlendirme, receteOnerisi: g.receteOnerisi, sonMetin })
    if (gb.length) {
      const { data } = await sb.from('esnek_olaylar').upsert(gb.map((x) => ({ doctor_id: g.doktorId, note_id: g.noteId, patient_id: g.patientId, tur: 'oneri', anahtar: x.tur, deger: { kabul: x.kabul } })), { onConflict: 'doctor_id,note_id,tur,anahtar', ignoreDuplicates: true }).select('id')
      oneriSayi = data?.length || 0
    }
  }
  // ESNEK-GELISIM: pending regression-set pages of this note get their facts (doctor's approval + consent only)
  if (g.hekim) {
    try { const { regresyonuTamamla } = await import('@/lib/elNotu/regresyon'); await regresyonuTamamla(sb, { doktorId: g.doktorId, noteId: g.noteId, hekim: g.hekim, son: g.son }) } catch { /* the set is never critical */ }
  }
  return { alan: alanSayi, oneri: oneriSayi }
}
