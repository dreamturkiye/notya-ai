/**
 * ESNEK-MUAYENE-B — server helpers shared by the Phase B services (service-role client; EVERY query scoped by the practice's
 * doktorId — hasta-izolasyon). Settings live on the Phase A row (esnek_muayene_ayarlari, migration 203 columns).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SozlukGirdisi } from '@/core/elNotu/tipler'
import { gunAnahtari } from '@/core/esnek/metinAraclari'

export type EsnekAyari = {
  golgeModu: boolean
  golgeBaslangic: string | null
  golgeBitis: string | null
  golgeHedef: number
  golgeTeklif: 'yok' | 'teklif' | 'kabul' | 'ertele'
  golgeTeklifAt: string | null
  /** From this local day on, the secretary only uploads pages: Notya drafts, the doctor approves. */
  sekreterYazmasinGun: string | null
  topluOnayIzni: boolean
  /** The doctor's corrections of derived profile lines (working style, usual approval time). */
  hekimDuzeltmeleri: { calismaSekli?: 'kagit' | 'ses' | 'karma' | null; onaySaatDk?: number | null; onayTuru?: 'gun_sonu' | 'anlik' | null }
}

export const VARSAYILAN_ESNEK: EsnekAyari = {
  golgeModu: false, golgeBaslangic: null, golgeBitis: null, golgeHedef: 0.9, golgeTeklif: 'yok', golgeTeklifAt: null,
  sekreterYazmasinGun: null, topluOnayIzni: false, hekimDuzeltmeleri: {},
}

const SECIM = 'golge_modu, golge_baslangic, golge_bitis, golge_hedef, golge_teklif, golge_teklif_at, sekreter_yazmasin_gun, toplu_onay_izni, hekim_duzeltmeleri'

export async function esnekAyarYukle(sb: SupabaseClient, doktorId: string): Promise<EsnekAyari> {
  const { data, error } = await sb.from('esnek_muayene_ayarlari').select(SECIM).eq('doctor_id', doktorId).maybeSingle()
  if (error || !data) return { ...VARSAYILAN_ESNEK }
  const d = data as Record<string, unknown>
  return {
    golgeModu: d.golge_modu === true,
    golgeBaslangic: (d.golge_baslangic as string) || null,
    golgeBitis: (d.golge_bitis as string) || null,
    golgeHedef: Number(d.golge_hedef) > 0 ? Number(d.golge_hedef) : 0.9,
    golgeTeklif: (['yok', 'teklif', 'kabul', 'ertele'].includes(String(d.golge_teklif)) ? d.golge_teklif : 'yok') as EsnekAyari['golgeTeklif'],
    golgeTeklifAt: (d.golge_teklif_at as string) || null,
    sekreterYazmasinGun: (d.sekreter_yazmasin_gun as string) || null,
    topluOnayIzni: d.toplu_onay_izni === true,
    hekimDuzeltmeleri: (d.hekim_duzeltmeleri && typeof d.hekim_duzeltmeleri === 'object' ? d.hekim_duzeltmeleri : {}) as EsnekAyari['hekimDuzeltmeleri'],
  }
}

/** Upsert some Phase B columns on the doctor's settings row (the Phase A columns keep their defaults / values). */
export async function esnekAyarYaz(sb: SupabaseClient, doktorId: string, userId: string, degisen: Record<string, unknown>): Promise<boolean> {
  const { error } = await sb.from('esnek_muayene_ayarlari').upsert({ doctor_id: doktorId, ...degisen, guncelleyen_user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'doctor_id' })
  return !error
}

/** "Sekreter yazmasın" is in force today (the offer was accepted and its first day has come). */
export function sekreterYazmasinMi(a: EsnekAyari, simdi = new Date()): boolean {
  return Boolean(a.sekreterYazmasinGun && gunAnahtari(simdi) >= a.sekreterYazmasinGun)
}

/** The doctor's lexicon + the branş (curated + founder-approved) and general seeds of the Türkiye build (for expansion while comparing / testing). */
export async function sozlukParcalari(sb: SupabaseClient, doktorId: string): Promise<{ hekim: SozlukGirdisi[]; brans: SozlukGirdisi[]; genel: SozlukGirdisi[]; bransAnahtari: string | null }> {
  const [{ sozlukYukle }, { bransTohumu }, { hekimBransi }] = await Promise.all([import('@/lib/elNotu/sunucu'), import('@/lib/elNotu/bransSozluk'), import('@/lib/doktor/hekimAdi')])
  const [hekim, brans] = await Promise.all([sozlukYukle(sb, doktorId), hekimBransi(sb, doktorId).catch(() => null)])
  // ESNEK-GELISIM: curated branş seed + founder-approved pairs
  const t = await bransTohumu(sb, brans || null)
  return { hekim, brans: t.brans, genel: t.genel, bransAnahtari: brans || null }
}

/** Lexicon expander (doctor first, then branş, then general seed) — deterministic, adds no fact. */
export async function genisletici(sb: SupabaseClient, doktorId: string): Promise<(s: string) => string> {
  const p = await sozlukParcalari(sb, doktorId)
  const { sozlukKur, genislet } = await import('@/core/elNotu/sozluk')
  const s = sozlukKur(p.hekim, p.brans, p.genel)
  return (m: string) => m.split('\n').map((satir) => genislet(s, satir).metin).join('\n')
}

/** Name parts of a patient (decrypted server-side, doctor-scoped) — a learning candidate carrying one is refused. */
export async function hastaAdParcalari(sb: SupabaseClient, doktorId: string, patientIds: string[]): Promise<string[]> {
  const { hastaAdlari } = await import('@/lib/elNotu/sunucu')
  const adlar = await hastaAdlari(sb, doktorId, patientIds)
  return [...adlar.values()].flatMap((a) => a.split(/\s+/)).filter((p) => p.length >= 2)
}

export function arkaPlanda(p: Promise<unknown>): void {
  void import('@/lib/doktor/ogrenme/arkaPlandaOgren').then((m) => m.arkaPlandaSurdur(p)).catch(() => { void p })
}
