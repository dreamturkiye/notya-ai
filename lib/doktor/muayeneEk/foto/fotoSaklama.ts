/**
 * FOTO-AI-01 — storage of AI photo evaluations (hash + prompt-version cache), the doctor's feedback and the learning
 * counters. Migration 174. Same discipline as muayeneEk/saklama.ts: a missing table never throws — reads are empty,
 * writes return false/null — and every query is scoped by doctor_id (service role bypasses RLS on purpose).
 * Results are AES-256-GCM encrypted; plaintext columns carry ids, hashes, versions and the model name only.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { tabloYokMu } from '@/lib/doktor/muayeneEk/saklama'
import { fotoSonucuDogrula, type FotoDegerlendirme, type FotoMod, type FotoUretimKaydi } from './sema'
import { karsilastirmaDogrula, type FotoKarsilastirma } from './karsilastir'
import { kararMi, ozellikGecerliMi, type GeriBildirimKarari, type OgrenmeSatiri } from './ogrenme'

const T_DEG = 'hasta_foto_degerlendirme'
const T_GERI = 'hasta_foto_geri_bildirim'
const T_OGRENME = 'hasta_foto_ogrenme'

export type DegTuru = 'tek' | 'karsilastirma'

export interface DegKaydi<T> {
  id: string
  belgeId: string
  oncekiBelgeId: string | null
  girdiHash: string
  surum: string
  durum: 'tamam' | 'hata'
  model: string | null
  deger: T | null
  uretim: FotoUretimKaydi | null
}

/** What is stored encrypted: the calibrated answer + its provenance. */
interface Paket<T> { deger: T; uretim: FotoUretimKaydi }

function kayitCoz<T>(r: Record<string, unknown>, dogrula: (ham: unknown) => T | null): DegKaydi<T> {
  let deger: T | null = null
  let uretim: FotoUretimKaydi | null = null
  if (r.sonuc_encrypted) {
    try {
      const p = JSON.parse(decrypt(String(r.sonuc_encrypted))) as Paket<unknown>
      deger = dogrula(p.deger)
      uretim = p.uretim ?? null
    } catch { deger = null }
  }
  return {
    id: String(r.id), belgeId: String(r.belge_id), oncekiBelgeId: r.onceki_belge_id ? String(r.onceki_belge_id) : null,
    girdiHash: String(r.girdi_hash), surum: String(r.surum), durum: r.durum === 'hata' ? 'hata' : 'tamam',
    model: r.model ? String(r.model) : null, deger, uretim,
  }
}

/** Re-validates a stored answer (defence against a row written by an older schema). Stored answers are already calibrated. */
export function tekDogrula(mod: FotoMod): (ham: unknown) => FotoDegerlendirme | null {
  return (ham) => {
    if (!ham || typeof ham !== 'object') return null
    // the stored object already has the final shape; run it through the validator's coercions without re-adding anything
    const d = ham as FotoDegerlendirme
    const r = fotoSonucuDogrula({ ...d, abstain: d.abstain, kirmiziBayraklar: d.kirmiziBayraklar }, mod)
    if (!r.deger) return null
    // keep calibrated-only fields the validator would reset
    return { ...r.deger, gozlemler: d.gozlemler ?? [], ayiricilar: d.ayiricilar ?? [], oneri: d.oneri ?? null, sinirlar: d.sinirlar ?? [], kirmiziBayraklar: d.kirmiziBayraklar ?? r.deger.kirmiziBayraklar }
  }
}
export const karsilastirmaCoz = (ham: unknown): FotoKarsilastirma | null => karsilastirmaDogrula(ham).deger ?? null

async function oku<T>(sb: SupabaseClient, sorgu: (q: any) => any, dogrula: (ham: unknown) => T | null): Promise<DegKaydi<T> | null> {
  try {
    const { data, error } = await sorgu(sb.from(T_DEG).select('*'))
    if (error || !data) return null
    return kayitCoz(data as Record<string, unknown>, dogrula)
  } catch { return null }
}

export function degOku<T>(sb: SupabaseClient, doktorId: string, belgeId: string, tur: DegTuru, oncekiBelgeId: string | null, dogrula: (ham: unknown) => T | null): Promise<DegKaydi<T> | null> {
  return oku(sb, (q) => {
    let s = q.eq('doctor_id', doktorId).eq('belge_id', belgeId).eq('tur', tur)
    s = oncekiBelgeId ? s.eq('onceki_belge_id', oncekiBelgeId) : s.is('onceki_belge_id', null)
    return s.maybeSingle()
  }, dogrula)
}

/** The same input (hash) already evaluated for ANY of this doctor's photos -> reuse, no model call. */
export function degHashIleBul<T>(sb: SupabaseClient, doktorId: string, hash: string, tur: DegTuru, dogrula: (ham: unknown) => T | null): Promise<DegKaydi<T> | null> {
  return oku(sb, (q) => q.eq('doctor_id', doktorId).eq('girdi_hash', hash).eq('tur', tur).eq('durum', 'tamam').order('created_at', { ascending: false }).limit(1).maybeSingle(), dogrula)
}

export interface DegYazGirdisi<T> {
  doktorId: string; patientId: string; belgeId: string; tur: DegTuru; oncekiBelgeId: string | null
  girdiHash: string; surum: string; istemIzi: string; durum: 'tamam' | 'hata'; model: string | null
  paket: Paket<T> | null
}

export async function degYaz<T>(sb: SupabaseClient, g: DegYazGirdisi<T>): Promise<string | null> {
  try {
    let q = sb.from(T_DEG).select('id').eq('doctor_id', g.doktorId).eq('belge_id', g.belgeId).eq('tur', g.tur)
    q = g.oncekiBelgeId ? q.eq('onceki_belge_id', g.oncekiBelgeId) : q.is('onceki_belge_id', null)
    const mevcut = await q.maybeSingle()
    if (mevcut.error && tabloYokMu(mevcut.error)) return null
    const alanlar = {
      girdi_hash: g.girdiHash, surum: g.surum, istem_izi: g.istemIzi, durum: g.durum, model: g.model,
      sonuc_encrypted: g.paket ? encrypt(JSON.stringify(g.paket)) : null, updated_at: new Date().toISOString(),
    }
    if (mevcut.data?.id) {
      const { error } = await sb.from(T_DEG).update(alanlar).eq('id', mevcut.data.id).eq('doctor_id', g.doktorId)
      return error ? null : String(mevcut.data.id)
    }
    const { data, error } = await sb.from(T_DEG).insert({ doctor_id: g.doktorId, patient_id: g.patientId, belge_id: g.belgeId, tur: g.tur, onceki_belge_id: g.oncekiBelgeId, ...alanlar }).select('id').single()
    return error || !data ? null : String(data.id)
  } catch { return null }
}

// ─── Feedback ────────────────────────────────────────────────────────────────────────────────────────────
export interface GeriBildirimSatiri { gozlemAnahtari: string; ozellik: string; karar: GeriBildirimKarari; duzeltme: string | null }

export async function geriBildirimleriOku(sb: SupabaseClient, doktorId: string, belgeId: string): Promise<GeriBildirimSatiri[]> {
  try {
    const { data, error } = await sb.from(T_GERI).select('*').eq('doctor_id', doktorId).eq('belge_id', belgeId).limit(80)
    if (error || !Array.isArray(data)) return []
    const out: GeriBildirimSatiri[] = []
    for (const r of data as Record<string, unknown>[]) {
      if (!kararMi(r.karar)) continue
      let duzeltme: string | null = null
      if (r.duzeltme_encrypted) { try { duzeltme = decrypt(String(r.duzeltme_encrypted)) } catch { duzeltme = null } }
      out.push({ gozlemAnahtari: String(r.gozlem_anahtari), ozellik: String(r.ozellik), karar: r.karar, duzeltme })
    }
    return out
  } catch { return [] }
}

/** Upserts one answer. Returns the PREVIOUS decision (null = first answer) so the caller can move the counters; undefined = not stored. */
export async function geriBildirimYaz(
  sb: SupabaseClient,
  g: { doktorId: string; patientId: string; belgeId: string; degerlendirmeId: string | null; gozlemAnahtari: string; ozellik: string; karar: GeriBildirimKarari; duzeltme: string | null },
): Promise<GeriBildirimKarari | null | undefined> {
  try {
    const mevcut = await sb.from(T_GERI).select('id, karar').eq('doctor_id', g.doktorId).eq('belge_id', g.belgeId).eq('gozlem_anahtari', g.gozlemAnahtari).maybeSingle()
    if (mevcut.error) return undefined
    const alanlar = {
      degerlendirme_id: g.degerlendirmeId, ozellik: g.ozellik, karar: g.karar,
      duzeltme_encrypted: g.duzeltme ? encrypt(g.duzeltme) : null, updated_at: new Date().toISOString(),
    }
    if (mevcut.data?.id) {
      const { error } = await sb.from(T_GERI).update(alanlar).eq('id', mevcut.data.id).eq('doctor_id', g.doktorId)
      return error ? undefined : kararMi(mevcut.data.karar) ? mevcut.data.karar : null
    }
    const { error } = await sb.from(T_GERI).insert({ doctor_id: g.doktorId, patient_id: g.patientId, belge_id: g.belgeId, gozlem_anahtari: g.gozlemAnahtari, ...alanlar })
    return error ? undefined : null
  } catch { return undefined }
}

// ─── Learning counters ───────────────────────────────────────────────────────────────────────────────────
export async function ogrenmeOku(sb: SupabaseClient, doktorId: string, brans: string): Promise<OgrenmeSatiri[]> {
  try {
    const { data, error } = await sb.from(T_OGRENME).select('ozellik, kabul, duzelt, reddet').eq('doctor_id', doktorId).eq('brans', brans || 'genel').limit(600)
    if (error || !Array.isArray(data)) return []
    return (data as Record<string, unknown>[]).filter((r) => ozellikGecerliMi(r.ozellik)).map((r) => ({
      ozellik: String(r.ozellik), kabul: Number(r.kabul) || 0, duzelt: Number(r.duzelt) || 0, reddet: Number(r.reddet) || 0,
    }))
  } catch { return [] }
}

/** Moves one answer between counters: `eski` (if any) is decremented, `yeni` incremented. */
export async function ogrenmeIsle(sb: SupabaseClient, doktorId: string, brans: string, ozellik: string, eski: GeriBildirimKarari | null, yeni: GeriBildirimKarari): Promise<boolean> {
  if (!ozellikGecerliMi(ozellik) || eski === yeni) return true
  const b = brans || 'genel'
  try {
    const mevcut = await sb.from(T_OGRENME).select('id, kabul, duzelt, reddet').eq('doctor_id', doktorId).eq('brans', b).eq('ozellik', ozellik).maybeSingle()
    if (mevcut.error) return false
    const sayac = { kabul: Number(mevcut.data?.kabul) || 0, duzelt: Number(mevcut.data?.duzelt) || 0, reddet: Number(mevcut.data?.reddet) || 0 }
    if (eski) sayac[eski] = Math.max(0, sayac[eski] - 1)
    sayac[yeni] += 1
    if (mevcut.data?.id) {
      const { error } = await sb.from(T_OGRENME).update({ ...sayac, updated_at: new Date().toISOString() }).eq('id', mevcut.data.id).eq('doctor_id', doktorId)
      return !error
    }
    const { error } = await sb.from(T_OGRENME).insert({ doctor_id: doktorId, brans: b, ozellik, ...sayac })
    return !error
  } catch { return false }
}
