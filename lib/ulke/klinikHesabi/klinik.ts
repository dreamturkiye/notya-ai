/**
 * NOTYA-ULKE-KLINIK-01 — A CLINIC, ITS MEMBERS AND ITS INVITATIONS (migration 145). Server only.
 *
 * A clinic belongs to one country database and to one owner account. Members join with a ONE-USE INVITATION CODE
 * that the owner or an administrator issues: it is shown once, stored only as a SHA-256 hash, and ends by itself.
 * There is no list of clinics to browse and no way to ask whether a clinic exists. A member holds ONE position, and
 * AN ACCOUNT IS A MEMBER OF AT MOST ONE CLINIC.
 *
 * NOTHING HERE TOUCHES A PATIENT. A position is not access: what a member may do for a doctor's patients is a
 * grant, and grants are in ./yetki.ts. Removing a member deletes the membership row, and the database deletes every
 * grant given by or to that member in the same statement — access ends on the next request, because the next
 * request finds no row.
 *
 * WHO MAY DO WHAT is decided in the database function that does it (ulke_klinik_uye_cikar, ulke_klinik_konum_degistir,
 * the trigger of ulke_klinik_davetleri): the one who asks is always THE AUTHENTICATED ACCOUNT, never an id from the
 * request, and the clinic is always that account's own — a clinic id is never read from a request at all.
 * Every statement is bound to this build's country (lib/ulke/uygulama/tablolar.ts).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { davetKoduBicimiGecerli, davetKoduHash, davetKoduUret } from '../davet'
import type { KlinikHesabiAyarlari } from '../tipler'
import { ozellikAcik, ulkePaketi } from '../ulke'
import { uygulamaRoluMu } from '../uygulama/rol'
import { ulkeIslevi, ulkeTablosu } from '../uygulama/tablolar'
import { DAVET_KONUMLARI, KLINIK_ADI_AZAMI, konumMu, yoneticiMi, type KlinikDaveti, type KlinikGorunumu, type KlinikKonumu, type KlinikUyesi } from './tipler'

const GUN_MS = 86_400_000
/** PostgreSQL's code for a violated check or a refusing trigger. */
const KISIT_KODU = '23514'

/** The pack's answers about clinic accounts, or null where the country has none. */
export function klinikAyarlari(): KlinikHesabiAyarlari | null {
  if (!ozellikAcik('cekirdekMuayene') || !ozellikAcik('klinikHesaplari')) return null
  return ulkePaketi().uygulama?.klinikHesaplari ?? null
}

/** Days an invitation stays valid in this country, or null where the pack's value is not usable. */
export function davetGecerlilikGun(): number | null {
  const g = klinikAyarlari()?.davetGecerlilikGun
  return typeof g === 'number' && Number.isInteger(g) && g >= 1 && g <= 31 ? g : null
}

export type Uyelik = { klinikId: string; konum: KlinikKonumu }

/** The membership of ONE account, read by that account's id. null = not a member of any clinic (or not readable: closed). */
export async function uyelikOku(supabase: SupabaseClient, hesapId: string): Promise<Uyelik | null> {
  const { data, error } = await ulkeTablosu(supabase, 'ulke_klinik_uyeleri').select('klinik_id, konum').eq('doctor_id', hesapId).maybeSingle()
  const s = data as { klinik_id?: unknown; konum?: unknown } | null
  if (error || !s || typeof s.klinik_id !== 'string' || !konumMu(s.konum)) return null
  return { klinikId: s.klinik_id, konum: s.konum }
}

/** The membership of `hesapId` IN THE CLINIC `klinikId` — the clinic in the same statement, so a member of another clinic is nobody here. */
export async function klinikteUyelik(supabase: SupabaseClient, klinikId: string, hesapId: string): Promise<Uyelik | null> {
  const { data, error } = await ulkeTablosu(supabase, 'ulke_klinik_uyeleri').select('klinik_id, konum').eq('klinik_id', klinikId).eq('doctor_id', hesapId).maybeSingle()
  const s = data as { klinik_id?: unknown; konum?: unknown } | null
  if (error || !s || s.klinik_id !== klinikId || !konumMu(s.konum)) return null
  return { klinikId, konum: s.konum }
}

/** Names of accounts, by id. An id that is not an account of this country has no name. */
export async function hesapAdlari(supabase: SupabaseClient, idler: readonly string[]): Promise<Map<string, string>> {
  const tekil = [...new Set(idler.filter(Boolean))]
  if (!tekil.length) return new Map()
  const { data } = await ulkeTablosu(supabase, 'ulke_hesaplari').select('id, full_name').in('id', tekil)
  return new Map(((data as { id: string; full_name: string | null }[] | null) ?? []).map((h) => [h.id, String(h.full_name ?? '').trim()]))
}

/** Role keys of accounts, by id — only keys the active pack has. */
export async function hesapRolleri(supabase: SupabaseClient, idler: readonly string[]): Promise<Map<string, string>> {
  const tekil = [...new Set(idler.filter(Boolean))]
  if (!tekil.length) return new Map()
  const { data } = await ulkeTablosu(supabase, 'hekim_rolu').select('doctor_id, rol').in('doctor_id', tekil)
  return new Map(((data as { doctor_id: string; rol: unknown }[] | null) ?? []).filter((r) => uygulamaRoluMu(r.rol)).map((r) => [r.doctor_id, r.rol as string]))
}

/** The members of ONE clinic, owner first. Names, positions and role keys — nothing about any patient. */
async function uyeleriOku(supabase: SupabaseClient, klinikId: string): Promise<KlinikUyesi[]> {
  const { data } = await ulkeTablosu(supabase, 'ulke_klinik_uyeleri').select('doctor_id, konum, created_at').eq('klinik_id', klinikId).order('created_at', { ascending: true }).limit(500)
  const satirlar = ((data as { doctor_id: string; konum: unknown }[] | null) ?? []).filter((s) => konumMu(s.konum))
  const idler = satirlar.map((s) => s.doctor_id)
  const [adlar, roller] = await Promise.all([hesapAdlari(supabase, idler), hesapRolleri(supabase, idler)])
  const sira: readonly string[] = ['sahip', 'yonetici', 'hekim', 'muttefik', 'on-buro']
  return satirlar
    .map((s) => ({ hesapId: s.doctor_id, ad: adlar.get(s.doctor_id) ?? '', konum: s.konum as KlinikKonumu, rol: roller.get(s.doctor_id) ?? null }))
    .sort((a, b) => sira.indexOf(a.konum) - sira.indexOf(b.konum))
}

/**
 * THE CALLER'S OWN CLINIC: its name, the caller's position, and its members. null = the caller is in no clinic.
 * Every member sees who the members are (a doctor has to be able to name the colleague a grant is for); nobody sees
 * anything else through this.
 */
export async function klinikGetir(supabase: SupabaseClient, hesapId: string): Promise<KlinikGorunumu | null> {
  const u = await uyelikOku(supabase, hesapId)
  if (!u) return null
  const { data, error } = await ulkeTablosu(supabase, 'ulke_klinikler').select('id, ad').eq('id', u.klinikId).maybeSingle()
  const k = data as { id?: string; ad?: unknown } | null
  if (error || !k?.id) return null
  return { id: k.id, ad: String(k.ad ?? ''), konum: u.konum, uyeler: await uyeleriOku(supabase, u.klinikId) }
}

export type KlinikRetKodu = 'NOT_FOUND' | 'UYE' | 'KOD' | 'SAHIP' | 'YETKI_YOK' | 'AYNI' | 'GECERSIZ' | 'HAZIR_DEGIL' | 'BASARISIZ'
type Ret = { tamam: false; kod: KlinikRetKodu }
const ret = (kod: KlinikRetKodu): Ret => ({ tamam: false, kod })

/** The caller creates a clinic and becomes its owner. An account that is already a member of a clinic cannot. */
export async function klinikKur(supabase: SupabaseClient, hesapId: string, adHam: unknown, simdi = Date.now()): Promise<{ tamam: true; klinikId: string } | Ret> {
  const ad = typeof adHam === 'string' ? adHam.trim() : ''
  if (ad.length < 2 || ad.length > KLINIK_ADI_AZAMI) return ret('GECERSIZ')
  const { data, error } = await ulkeIslevi(supabase, 'ulke_klinik_kur', { p_doctor_id: hesapId, p_ad: ad, p_simdi: new Date(simdi).toISOString() })
  if (error) return ret('BASARISIZ')
  const d = data as { durum?: string; klinik_id?: string } | null
  if (d?.durum === 'UYE') return ret('UYE')
  if (d?.durum !== 'TAMAM' || !d.klinik_id) return ret('BASARISIZ')
  return { tamam: true, klinikId: d.klinik_id }
}

/**
 * The caller issues an invitation for a position of THEIR OWN clinic. The code is answered ONCE; the database keeps
 * its hash. Who may issue what is the database's rule (the trigger of ulke_klinik_davetleri): the owner any position
 * but the owner's, an administrator a doctor's, an allied professional's or the front desk's.
 */
export async function davetVer(supabase: SupabaseClient, hesapId: string, konum: unknown, simdi = Date.now()): Promise<{ tamam: true; davetId: string; kod: string; konum: KlinikKonumu; sonGecerlilik: string } | Ret> {
  const gun = davetGecerlilikGun()
  if (gun === null) return ret('HAZIR_DEGIL')
  if (!konumMu(konum) || !DAVET_KONUMLARI.includes(konum)) return ret('GECERSIZ')
  const u = await uyelikOku(supabase, hesapId)
  if (!u) return ret('NOT_FOUND')
  const kod = davetKoduUret()
  const sonGecerlilik = new Date(simdi + gun * GUN_MS).toISOString()
  const { data, error } = await ulkeTablosu(supabase, 'ulke_klinik_davetleri')
    .insert({ klinik_id: u.klinikId, doctor_id: hesapId, konum, kod_hash: davetKoduHash(kod), son_gecerlilik: sonGecerlilik, created_at: new Date(simdi).toISOString() })
    .select('id')
    .single()
  if (error) return ret((error as { code?: string }).code === KISIT_KODU ? 'YETKI_YOK' : 'BASARISIZ')
  const id = (data as { id?: string } | null)?.id
  if (!id) return ret('BASARISIZ')
  return { tamam: true, davetId: id, kod, konum, sonGecerlilik }
}

type DavetSatiri = { id: string; konum: unknown; son_gecerlilik: string; kullanildi_at: string | null; iptal_at: string | null; created_at: string }

/** The invitations of the caller's clinic, newest first — for the owner and an administrator only. NEVER a code or its hash. null = not theirs to see. */
export async function davetleriListele(supabase: SupabaseClient, hesapId: string, simdi = Date.now()): Promise<KlinikDaveti[] | null> {
  const u = await uyelikOku(supabase, hesapId)
  if (!u || !yoneticiMi(u.konum)) return null
  const { data, error } = await ulkeTablosu(supabase, 'ulke_klinik_davetleri').select('id, konum, son_gecerlilik, kullanildi_at, iptal_at, created_at').eq('klinik_id', u.klinikId).order('created_at', { ascending: false }).limit(100)
  if (error || !data) return []
  return (data as unknown as DavetSatiri[]).filter((d) => konumMu(d.konum)).map((d) => ({
    id: d.id,
    konum: d.konum as KlinikKonumu,
    durum: d.kullanildi_at ? 'kullanildi' : d.iptal_at ? 'iptal' : new Date(d.son_gecerlilik).getTime() <= simdi ? 'suresi-doldu' : 'acik',
    olusturuldu: d.created_at,
    sonGecerlilik: d.son_gecerlilik,
  }))
}

/** The owner or an administrator withdraws an invitation of THEIR OWN clinic that was not used. */
export async function davetIptal(supabase: SupabaseClient, hesapId: string, davetId: string, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  const u = await uyelikOku(supabase, hesapId)
  if (!u || !yoneticiMi(u.konum)) return ret('NOT_FOUND')
  // The invitation id and the caller's own clinic in the same statement: another clinic's invitation is a missing one.
  const { data, error } = await ulkeTablosu(supabase, 'ulke_klinik_davetleri').update({ iptal_at: new Date(simdi).toISOString() }).eq('id', davetId).eq('klinik_id', u.klinikId).is('kullanildi_at', null).is('iptal_at', null).select('id')
  if (error) return ret('BASARISIZ')
  return Array.isArray(data) && data.length ? { tamam: true } : ret('NOT_FOUND')
}

/** The caller joins a clinic with an invitation code. One answer for a code that does not exist, was used, was withdrawn or has ended. */
export async function klinigeKatil(supabase: SupabaseClient, hesapId: string, kod: unknown, simdi = Date.now()): Promise<{ tamam: true; klinikId: string; konum: KlinikKonumu } | Ret> {
  if (!davetKoduBicimiGecerli(kod)) return ret('KOD')
  const { data, error } = await ulkeIslevi(supabase, 'ulke_klinik_katil', { p_kod_hash: davetKoduHash(kod), p_doctor_id: hesapId, p_simdi: new Date(simdi).toISOString() })
  if (error) return ret('BASARISIZ')
  const d = data as { durum?: string; klinik_id?: string; konum?: unknown } | null
  if (d?.durum === 'UYE') return ret('UYE')
  if (d?.durum === 'KOD') return ret('KOD')
  if (d?.durum !== 'TAMAM' || !d.klinik_id || !konumMu(d.konum)) return ret('BASARISIZ')
  return { tamam: true, klinikId: d.klinik_id, konum: d.konum }
}

const DURUMLAR: readonly string[] = ['TAMAM', 'NOT_FOUND', 'SAHIP', 'YETKI_YOK', 'AYNI']

/**
 * A member is removed from the CALLER'S OWN clinic, or leaves it (`hedefId` = the caller). The database decides who
 * may (ulke_klinik_uye_cikar) and, in the same step, writes every open grant of that member to the record and
 * deletes the membership — and with it every grant given by or to that member.
 */
export async function uyeCikar(supabase: SupabaseClient, yapanId: string, hedefId: string, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  const u = await uyelikOku(supabase, yapanId)
  if (!u) return ret('NOT_FOUND')
  const { data, error } = await ulkeIslevi(supabase, 'ulke_klinik_uye_cikar', { p_klinik_id: u.klinikId, p_doctor_id: hedefId, p_yapan_id: yapanId, p_simdi: new Date(simdi).toISOString() })
  if (error || typeof data !== 'string' || !DURUMLAR.includes(data)) return ret('BASARISIZ')
  return data === 'TAMAM' ? { tamam: true } : ret(data as KlinikRetKodu)
}

/** The owner or an administrator changes a member's position in THEIR OWN clinic. Every grant of that member ends in the same step. */
export async function konumDegistir(supabase: SupabaseClient, yapanId: string, hedefId: string, konum: unknown, simdi = Date.now()): Promise<{ tamam: true } | Ret> {
  if (!konumMu(konum) || !DAVET_KONUMLARI.includes(konum)) return ret(konum === 'sahip' ? 'SAHIP' : 'GECERSIZ')
  const u = await uyelikOku(supabase, yapanId)
  if (!u) return ret('NOT_FOUND')
  const { data, error } = await ulkeIslevi(supabase, 'ulke_klinik_konum_degistir', { p_klinik_id: u.klinikId, p_doctor_id: hedefId, p_konum: konum, p_yapan_id: yapanId, p_simdi: new Date(simdi).toISOString() })
  if (error || typeof data !== 'string' || !DURUMLAR.includes(data)) return ret('BASARISIZ')
  return data === 'TAMAM' ? { tamam: true } : ret(data as KlinikRetKodu)
}
