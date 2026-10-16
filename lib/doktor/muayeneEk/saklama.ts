/**
 * MUAYENE-EKLERI-01 — değerlendirme önbelleği + hekime özel öğrenme depolaması (migration 171).
 *
 * KURAL: tablolar yoksa (171 henüz uygulanmadı) HİÇBİR işlem hata fırlatmaz — okumalar boş döner, yazmalar `false` döner;
 * akış (yükle → değerlendir → rapor) tabloya bağlı DEĞİLDİR. Öğrenme kapalı kalır, önbellek yok sayılır.
 *
 * HASTA-IZOLASYON: her sorgu `doctor_id` ile kapsanır (service-role RLS'i atlar); belge/seans/hasta sahipliği çağıranda
 * (rotalar) önceden kanıtlanır. Sonuç AES-256-GCM ile şifrelenir; loglara hasta/klinik metin yazılmaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { decrypt, encrypt } from '@/lib/security/encryption'
import type { EkSonuc, EkTuru } from './tipler'
import { EK_DEGERLENDIRME_SURUMU, ekTuruMu } from './tipler'
import type { OgrenmeArtisi, OgrenmeKaydi } from './siniflandir'
import { sonucuDogrula } from './guvence'

const T_DEGERLENDIRME = 'muayene_ek_degerlendirmeleri'
const T_OGRENME = 'muayene_ek_ogrenme'

/** PostgREST / Postgres "tablo yok" imzaları. */
export function tabloYokMu(hata: unknown): boolean {
  if (!hata || typeof hata !== 'object') return false
  const h = hata as { code?: string; message?: string }
  const kod = String(h.code || '')
  const msg = String(h.message || '').toLowerCase()
  return kod === '42P01' || kod === 'PGRST205' || kod === 'PGRST200' || /does not exist|schema cache|could not find the table/.test(msg)
}

export function girdiHash(bytes: Buffer, tur: EkTuru, ekBaglam = ''): string {
  return createHash('sha256').update(bytes).update('\u0000').update(tur).update('\u0000').update(EK_DEGERLENDIRME_SURUMU).update('\u0000').update(ekBaglam).digest('hex')
}

export interface DegerlendirmeSatiri {
  id: string
  belgeId: string
  sessionId: string
  patientId: string
  tur: EkTuru
  turGuven: number | null
  turKaynagi: 'otomatik' | 'hekim' | 'ogrenilen'
  durum: 'bekliyor' | 'tamam' | 'hata' | 'atlandi'
  girdiHash: string | null
  ogrenmeIslendi: boolean
  noteId: string | null
  sonuc: EkSonuc | null
}

function satiraCevir(r: Record<string, unknown>): DegerlendirmeSatiri | null {
  if (!ekTuruMu(r.tur)) return null
  let sonuc: EkSonuc | null = null
  if (r.sonuc_encrypted) {
    try { sonuc = sonucuDogrula(JSON.parse(decrypt(String(r.sonuc_encrypted))), 'EK-0') } catch { sonuc = null }
  }
  const durum = (['bekliyor', 'tamam', 'hata', 'atlandi'] as const).find((d) => d === r.durum) || 'bekliyor'
  const kaynak = (['otomatik', 'hekim', 'ogrenilen'] as const).find((d) => d === r.tur_kaynagi) || 'otomatik'
  return {
    id: String(r.id), belgeId: String(r.belge_id), sessionId: String(r.session_id), patientId: String(r.patient_id),
    tur: r.tur, turGuven: r.tur_guven == null ? null : Number(r.tur_guven), turKaynagi: kaynak, durum,
    girdiHash: r.girdi_hash ? String(r.girdi_hash) : null, ogrenmeIslendi: r.ogrenme_islendi === true,
    noteId: r.note_id ? String(r.note_id) : null, sonuc,
  }
}

export async function degerlendirmeOku(sb: SupabaseClient, doktorId: string, belgeId: string): Promise<DegerlendirmeSatiri | null> {
  try {
    const { data, error } = await sb.from(T_DEGERLENDIRME).select('*').eq('doctor_id', doktorId).eq('belge_id', belgeId).maybeSingle()
    if (error || !data) return null
    return satiraCevir(data as Record<string, unknown>)
  } catch { return null }
}

export async function seansDegerlendirmeleri(sb: SupabaseClient, doktorId: string, sessionId: string): Promise<DegerlendirmeSatiri[]> {
  try {
    const { data, error } = await sb.from(T_DEGERLENDIRME).select('*').eq('doctor_id', doktorId).eq('session_id', sessionId).order('created_at', { ascending: true }).limit(40)
    if (error || !Array.isArray(data)) return []
    return data.map((r) => satiraCevir(r as Record<string, unknown>)).filter((s): s is DegerlendirmeSatiri => !!s)
  } catch { return [] }
}

export interface YazGirdisi {
  doktorId: string
  patientId: string
  sessionId: string
  belgeId: string
  tur: EkTuru
  turGuven?: number | null
  turKaynagi?: 'otomatik' | 'hekim' | 'ogrenilen'
  durum?: 'bekliyor' | 'tamam' | 'hata' | 'atlandi'
  girdiHash?: string | null
  sonuc?: EkSonuc | null
}

/** Upsert (doktor, belge). `false` = tablo yok ya da yazılamadı (akış devam eder). */
export async function degerlendirmeYaz(sb: SupabaseClient, g: YazGirdisi): Promise<boolean> {
  try {
    const mevcut = await sb.from(T_DEGERLENDIRME).select('id').eq('doctor_id', g.doktorId).eq('belge_id', g.belgeId).maybeSingle()
    if (mevcut.error && tabloYokMu(mevcut.error)) return false
    const alanlar: Record<string, unknown> = {
      tur: g.tur,
      ...(g.turGuven != null ? { tur_guven: Math.round(g.turGuven * 1000) / 1000 } : {}),
      ...(g.turKaynagi ? { tur_kaynagi: g.turKaynagi } : {}),
      ...(g.durum ? { durum: g.durum } : {}),
      ...(g.girdiHash !== undefined ? { girdi_hash: g.girdiHash } : {}),
      ...(g.sonuc !== undefined ? { sonuc_encrypted: g.sonuc ? encrypt(JSON.stringify(g.sonuc)) : null, surum: g.sonuc?.surum ?? null } : {}),
      updated_at: new Date().toISOString(),
    }
    if (mevcut.data?.id) {
      const { error } = await sb.from(T_DEGERLENDIRME).update(alanlar).eq('id', mevcut.data.id).eq('doctor_id', g.doktorId)
      return !error
    }
    const { error } = await sb.from(T_DEGERLENDIRME).insert({ doctor_id: g.doktorId, patient_id: g.patientId, session_id: g.sessionId, belge_id: g.belgeId, ...alanlar })
    return !error
  } catch { return false }
}

export async function ogrenmeIsaretle(sb: SupabaseClient, doktorId: string, belgeId: string): Promise<void> {
  try { await sb.from(T_DEGERLENDIRME).update({ ogrenme_islendi: true }).eq('doctor_id', doktorId).eq('belge_id', belgeId) } catch { /* öğrenme kritik değil */ }
}

/** Notun oluşturulmasından sonra seansın değerlendirmelerini nota bağlar (kaynak bağlantısı). */
export async function notaBagla(sb: SupabaseClient, doktorId: string, sessionId: string, noteId: string): Promise<void> {
  try { await sb.from(T_DEGERLENDIRME).update({ note_id: noteId }).eq('doctor_id', doktorId).eq('session_id', sessionId) } catch { /* kritik değil */ }
}

// ─── Öğrenme ────────────────────────────────────────────────────────────────────────────────────────────
const AZAMI_OGRENME_SATIRI = 600

export async function ogrenmeYukle(sb: SupabaseClient, doktorId: string, brans: string): Promise<OgrenmeKaydi[]> {
  try {
    const { data, error } = await sb.from(T_OGRENME).select('ozellik, tur, onay, duzeltme').eq('doctor_id', doktorId).eq('brans', brans || 'genel').limit(AZAMI_OGRENME_SATIRI)
    if (error || !Array.isArray(data)) return []
    return data
      .filter((r) => ekTuruMu((r as { tur?: unknown }).tur) && typeof (r as { ozellik?: unknown }).ozellik === 'string')
      .map((r) => ({ ozellik: String(r.ozellik), tur: r.tur as EkTuru, onay: Number(r.onay) || 0, duzeltme: Number(r.duzeltme) || 0 }))
  } catch { return [] }
}

/** Sayaçları artırır. `false` = tablo yok (öğrenme kapalı). Özellik anahtarı kontrollü sözlükten gelir (siniflandir.ts). */
export async function ogrenmeKaydet(sb: SupabaseClient, doktorId: string, brans: string, artilar: OgrenmeArtisi[]): Promise<boolean> {
  if (!artilar.length) return true
  const b = brans || 'genel'
  try {
    const { data, error } = await sb.from(T_OGRENME).select('id, ozellik, tur, onay, duzeltme').eq('doctor_id', doktorId).eq('brans', b).in('ozellik', artilar.map((a) => a.ozellik))
    if (error) return false
    const mevcut = new Map((data || []).map((r) => [`${r.ozellik}#${r.tur}`, r as { id: string; onay: number; duzeltme: number }]))
    for (const a of artilar) {
      if (!/^[a-z0-9:+\-]{1,80}$/.test(a.ozellik)) continue // yalnız sözlük anahtarı biçimi
      const var_ = mevcut.get(`${a.ozellik}#${a.tur}`)
      if (var_) {
        const { error: e } = await sb.from(T_OGRENME).update({ onay: (Number(var_.onay) || 0) + a.onayEk, duzeltme: (Number(var_.duzeltme) || 0) + a.duzeltmeEk, updated_at: new Date().toISOString() }).eq('id', var_.id).eq('doctor_id', doktorId)
        if (e) return false
      } else {
        const { error: e } = await sb.from(T_OGRENME).insert({ doctor_id: doktorId, brans: b, ozellik: a.ozellik, tur: a.tur, onay: a.onayEk, duzeltme: a.duzeltmeEk })
        if (e) return false
      }
    }
    return true
  } catch { return false }
}
