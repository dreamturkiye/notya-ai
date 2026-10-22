/**
 * AU-BETA-01 — INVOICES, payment, refund, reconciliation and the doctor's own payment connection. Server only.
 *
 * NOT A MERCHANT: this product never holds funds and keeps no ledger of customer money (see ./odemeSaglayici.ts).
 * Every payment goes through an adapter; today that is the DEMO adapter, which makes no network call.
 *
 * ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md): service-role client, so every statement carries the
 * authenticated doctor's id; a patient id from a request is checked with hastaGetir (doctor + patient) before it is
 * used; another doctor's invoice answers like a missing one. The lines and both parties' particulars are one encrypted
 * value. Connection credentials are encrypted with the repo's helper, are never logged and never sent to the client.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { ulkePaketi } from '../ulke'
import { hastaAdlari, hastaGetir } from '../uygulama/hastalar'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeTablosu } from '../uygulama/tablolar'
import { yerelAn } from '../uygulama/zaman'
import { faturaToplami, kalemleriTemizle, type FaturaKalemi } from './hesap'
import { canliAnahtarMi, saglayiciSec, uzlastir, type OdemeSaglayiciAdi, type UzlasmaSatiri } from './odemeSaglayici'

export type Fatura = {
  id: string; no: number; hastaId: string; hastaAdi: string; muayeneId: string | null; kalemler: FaturaKalemi[]
  satici: Record<string, string>; tarih: string
  altToplamKurus: number; vergiKurus: number; toplamKurus: number; iadeKurus: number; paraKodu: string
  durum: 'taslak' | 'odendi' | 'iptal'; saglayici: string | null; odemeRef: string | null; odendiAt: string | null
}
type Satir = {
  id: string; fatura_no: number; patient_id: string; session_id: string | null; govde_encrypted: string
  alt_toplam_kurus: number | string; vergi_kurus: number | string; toplam_kurus: number | string; iade_kurus: number | string
  para_kodu: string; durum: Fatura['durum']; saglayici: string | null; odeme_ref: string | null; odendi_at: string | null
}
const KOLON = 'id, fatura_no, patient_id, session_id, govde_encrypted, alt_toplam_kurus, vergi_kurus, toplam_kurus, iade_kurus, para_kodu, durum, saglayici, odeme_ref, odendi_at'
type Govde = { v: 1; kalemler: FaturaKalemi[]; satici: Record<string, string>; tarih: string }

const aktifTanim = () => ulkePaketi().uzanti?.fatura ?? null

function govdeCoz(h: string): Govde | null {
  try { const g = JSON.parse(decrypt(h)) as Govde; return g && g.v === 1 && Array.isArray(g.kalemler) ? g : null } catch { return null }
}
function donustur(s: Satir, ad: string): Fatura | null {
  const g = govdeCoz(s.govde_encrypted)
  if (!g) return null
  return {
    id: s.id, no: s.fatura_no, hastaId: s.patient_id, hastaAdi: ad, muayeneId: s.session_id, kalemler: g.kalemler, satici: g.satici, tarih: g.tarih,
    altToplamKurus: Number(s.alt_toplam_kurus), vergiKurus: Number(s.vergi_kurus), toplamKurus: Number(s.toplam_kurus), iadeKurus: Number(s.iade_kurus),
    paraKodu: s.para_kodu, durum: s.durum, saglayici: s.saglayici, odemeRef: s.odeme_ref, odendiAt: s.odendi_at,
  }
}

/** The practice particulars kept on the account (auth user_metadata.muayenehane), re-validated by the pack on every read. */
export function muayenehaneOku(meta: unknown): Record<string, string> {
  const t = ulkePaketi().uzanti?.muayenehane
  const ham = meta && typeof meta === 'object' ? (meta as { muayenehane?: unknown }).muayenehane : null
  if (!t || !ham || typeof ham !== 'object') return {}
  const r = t.dogrula(ham as Record<string, unknown>)
  return Object.keys(r.hatalar).length ? {} : r.temiz
}

export type FaturaRet = 'KAPALI' | 'GECERSIZ' | 'NOT_FOUND' | 'DURUM' | 'BASARISIZ'

export async function faturaOlustur(supabase: SupabaseClient, doktorId: string, doktorMeta: unknown, g: { hastaId: unknown; muayeneId?: unknown; kalemler: unknown }, simdi = Date.now()): Promise<{ tamam: true; fatura: Fatura } | { tamam: false; kod: FaturaRet }> {
  const t = aktifTanim()
  if (!t) return { tamam: false, kod: 'KAPALI' }
  const kalemler = kalemleriTemizle(g.kalemler)
  if (!kalemler || typeof g.hastaId !== 'string') return { tamam: false, kod: 'GECERSIZ' }
  const hasta = await hastaGetir(supabase, doktorId, g.hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  const dilim = await hesapSaatDilimi(supabase, doktorId)
  const toplam = faturaToplami(kalemler, t.oranYuzde)
  const govde: Govde = { v: 1, kalemler, satici: muayenehaneOku(doktorMeta), tarih: yerelAn(simdi, dilim).gun }
  for (let deneme = 0; deneme < 3; deneme++) {
    const son = await ulkeTablosu(supabase, 'ulke_faturalar').select('fatura_no').eq('doctor_id', doktorId).order('fatura_no', { ascending: false }).limit(1)
    if (son.error) return { tamam: false, kod: 'BASARISIZ' }
    const no = (((son.data as { fatura_no: number }[] | null)?.[0]?.fatura_no) ?? 0) + 1
    const { data, error } = await ulkeTablosu(supabase, 'ulke_faturalar').insert({
      doctor_id: doktorId, patient_id: g.hastaId, session_id: typeof g.muayeneId === 'string' ? g.muayeneId : null, fatura_no: no,
      govde_encrypted: encrypt(JSON.stringify(govde)), alt_toplam_kurus: toplam.altToplamKurus, vergi_kurus: toplam.vergiKurus, toplam_kurus: toplam.toplamKurus, para_kodu: t.paraKodu,
    }).select(KOLON).single()
    if (!error && data) { const f = donustur(data as unknown as Satir, hasta.ad); return f ? { tamam: true, fatura: f } : { tamam: false, kod: 'BASARISIZ' } }
    if (error?.code !== '23505') return { tamam: false, kod: 'BASARISIZ' }
  }
  return { tamam: false, kod: 'BASARISIZ' }
}

export async function faturaListe(supabase: SupabaseClient, doktorId: string, hastaId?: string): Promise<Fatura[]> {
  let q = ulkeTablosu(supabase, 'ulke_faturalar').select(KOLON).eq('doctor_id', doktorId)
  if (hastaId) q = q.eq('patient_id', hastaId)
  const { data } = await q.order('fatura_no', { ascending: false }).limit(200)
  const satirlar = (data as Satir[] | null) ?? []
  const adlar = await hastaAdlari(supabase, doktorId, satirlar.map((s) => s.patient_id))
  return satirlar.map((s) => donustur(s, adlar.get(s.patient_id) ?? '')).filter((f): f is Fatura => f !== null)
}

async function tek(supabase: SupabaseClient, doktorId: string, id: string): Promise<Satir | null> {
  const { data } = await ulkeTablosu(supabase, 'ulke_faturalar').select(KOLON).eq('doctor_id', doktorId).eq('id', id).limit(1)
  return ((data as Satir[] | null) ?? [])[0] ?? null
}

export async function faturaOde(supabase: SupabaseClient, doktorId: string, id: string, simdi = Date.now()): Promise<{ tamam: true } | { tamam: false; kod: FaturaRet }> {
  const s = await tek(supabase, doktorId, id)
  if (!s) return { tamam: false, kod: 'NOT_FOUND' }
  if (s.durum !== 'taslak') return { tamam: false, kod: 'DURUM' }
  const bag = await baglantiOku(supabase, doktorId)
  const sag = saglayiciSec(bag)
  const r = await sag.ode({ faturaId: s.id, tutarKurus: Number(s.toplam_kurus), paraKodu: s.para_kodu })
  if (!r.tamam) return { tamam: false, kod: 'BASARISIZ' }
  const { data, error } = await ulkeTablosu(supabase, 'ulke_faturalar').update({ durum: 'odendi', saglayici: sag.ad, odeme_ref: r.ref, odendi_at: new Date(simdi).toISOString() })
    .eq('doctor_id', doktorId).eq('id', id).eq('durum', 'taslak').select('id')
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  return (data as unknown[] | null)?.length ? { tamam: true } : { tamam: false, kod: 'DURUM' }
}

/** A full or partial refund of a paid invoice. The total refunded never exceeds the total paid. */
export async function faturaIade(supabase: SupabaseClient, doktorId: string, id: string, kurus: unknown): Promise<{ tamam: true; iadeKurus: number } | { tamam: false; kod: FaturaRet }> {
  const s = await tek(supabase, doktorId, id)
  if (!s) return { tamam: false, kod: 'NOT_FOUND' }
  if (s.durum !== 'odendi' || !s.odeme_ref) return { tamam: false, kod: 'DURUM' }
  const kalan = Number(s.toplam_kurus) - Number(s.iade_kurus)
  if (typeof kurus !== 'number' || !Number.isInteger(kurus) || kurus <= 0 || kurus > kalan) return { tamam: false, kod: 'GECERSIZ' }
  const sag = saglayiciSec(await baglantiOku(supabase, doktorId))
  const r = await sag.iade(s.odeme_ref, kurus)
  if (!r.tamam) return { tamam: false, kod: 'BASARISIZ' }
  const yeni = Number(s.iade_kurus) + kurus
  const { data, error } = await ulkeTablosu(supabase, 'ulke_faturalar').update({ iade_kurus: yeni }).eq('doctor_id', doktorId).eq('id', id).eq('iade_kurus', Number(s.iade_kurus)).select('id')
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  return (data as unknown[] | null)?.length ? { tamam: true, iadeKurus: yeni } : { tamam: false, kod: 'DURUM' }
}

export async function uzlasma(supabase: SupabaseClient, doktorId: string): Promise<{ saglayici: OdemeSaglayiciAdi; gercek: boolean; satirlar: UzlasmaSatiri[] }> {
  const liste = await faturaListe(supabase, doktorId)
  // The demo adapter answers from the invoices' own records, so in demo mode this check is tautological: the screen says so.
  const kayit = new Map(liste.filter((f) => f.odemeRef).map((f) => [f.odemeRef as string, { tutarKurus: f.toplamKurus, iadeKurus: f.iadeKurus }]))
  const sag = saglayiciSec(await baglantiOku(supabase, doktorId), kayit)
  const yanit = await sag.sorgula(liste.map((f) => f.odemeRef).filter((x): x is string => Boolean(x)))
  return { saglayici: sag.ad, gercek: sag.gercek, satirlar: uzlastir(liste.map((f) => ({ id: f.id, no: f.no, toplamKurus: f.toplamKurus, iadeKurus: f.iadeKurus, durum: f.durum, ref: f.odemeRef })), yanit) }
}

// ───────────────────────── the doctor's own connection ─────────────────────────

export type Baglanti = { saglayici: 'stripe' | 'tyro'; mod: 'test'; sonDort: string }
export async function baglantiOku(supabase: SupabaseClient, doktorId: string): Promise<(Baglanti & { saglayici: 'stripe' | 'tyro' }) | null> {
  const { data } = await ulkeTablosu(supabase, 'ulke_odeme_baglantilari').select('saglayici, mod, kimlik_encrypted').eq('doctor_id', doktorId).limit(1)
  const s = ((data as { saglayici: 'stripe' | 'tyro'; mod: 'test'; kimlik_encrypted: string }[] | null) ?? [])[0]
  if (!s) return null
  let son = ''
  try { son = (JSON.parse(decrypt(s.kimlik_encrypted)) as { anahtar?: string }).anahtar?.slice(-4) ?? '' } catch { /* shown without the tail */ }
  return { saglayici: s.saglayici, mod: s.mod, sonDort: son }
}

/** Keys of the provider's TEST mode only. A live key is refused (live mode is off in this beta); the key is never echoed. */
export async function baglantiKaydet(supabase: SupabaseClient, doktorId: string, g: { saglayici: unknown; anahtar: unknown }): Promise<'TAMAM' | 'GECERSIZ' | 'CANLI_MOD' | 'BASARISIZ'> {
  if (g.saglayici !== 'stripe' && g.saglayici !== 'tyro') return 'GECERSIZ'
  const anahtar = typeof g.anahtar === 'string' ? g.anahtar.trim() : ''
  if (anahtar.length < 8 || anahtar.length > 300 || /\s/.test(anahtar)) return 'GECERSIZ'
  if (canliAnahtarMi(anahtar) || (g.saglayici === 'stripe' && !/^(sk|rk)_test_/.test(anahtar))) return 'CANLI_MOD'
  const { error } = await ulkeTablosu(supabase, 'ulke_odeme_baglantilari').upsert({ doctor_id: doktorId, saglayici: g.saglayici, mod: 'test', kimlik_encrypted: encrypt(JSON.stringify({ anahtar })) }, { onConflict: 'ulke,doctor_id' })
  return error ? 'BASARISIZ' : 'TAMAM'
}
export async function baglantiSil(supabase: SupabaseClient, doktorId: string): Promise<boolean> {
  const { error } = await ulkeTablosu(supabase, 'ulke_odeme_baglantilari').delete().eq('doctor_id', doktorId)
  return !error
}
