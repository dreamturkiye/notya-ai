/**
 * KURUCU-KONSOL-01 + DENEME-BILDIRIM-01 (Kaan, 2026-11-07) — a country build's half of the founder tools. The same file
 * in every country build; the database is reached only through ulkeTablosu (this country's tables, this country's rows).
 *
 *   ulkeKurucuVerisi       what /api/internal/founder-stats answers: doctor-ACCOUNT metadata (name, e-mail, role, sign-up
 *                          and last sign-in time, onboarding done) and COUNTS of notes and visits per account for 7/30 days.
 *                          The activity reads select only `doctor_id, created_at`; no patient id or content is read, and the
 *                          rows leave as numbers (hesapSatiriTemizle keeps only the allowed keys).
 *   ulkeDenemeKaydiBildir  the internal "New trial signup" e-mail to kaan@notya.io, once per account, the moment the
 *                          account's role (specialty) is first recorded — /api/ulke/kayit or /api/ulke/rol call it after
 *                          their own write, through arkaPlanda (never in the doctor's way). Exactly once:
 *                          ulke_hesaplari.deneme_bildirim_at is claimed atomically (migration 192).
 *
 * Left out of both: Kaan's test account and the founder addresses (named under testHesaplari), and front-desk members of a
 * clinic (they choose no role and are not doctors).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ulkeTablosu } from '@/lib/ulke/uygulama/tablolar'
import { aktifUlke, ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { rolAdi, roller } from '@/lib/ulke/arayuz'
import { uygulamaRoluMu } from '@/lib/ulke/uygulama/rol'
import { bildirimDisiMi, bildirimEpostasi, bildirimGonder, KAAN_TEST_EPOSTASI, kurucuEpostalari, type BildirimUlkesi } from '@/lib/kurucu/denemeBildirimi'
import { hesapSatiriTemizle, type KurucuHesap, type KurucuUlkeYaniti } from '@/lib/kurucu/tipler'

const GUN = 24 * 60 * 60 * 1000

type AuthHesap = { id: string; email?: string | null; created_at?: string | null; last_sign_in_at?: string | null; user_metadata?: Record<string, unknown> | null }
export type DenemeBilgisi = { kalanGun: number | null; ucretli: boolean } | null

function sayimlar(satirlar: unknown, simdi: number): Map<string, [number, number]> {
  const m = new Map<string, [number, number]>()
  for (const r of (Array.isArray(satirlar) ? satirlar : []) as { doctor_id?: unknown; created_at?: unknown }[]) {
    if (typeof r.doctor_id !== 'string' || typeof r.created_at !== 'string') continue
    const yas = simdi - Date.parse(r.created_at)
    if (!(yas >= 0 && yas <= 30 * GUN)) continue
    const v = m.get(r.doctor_id) || [0, 0]
    v[1] += 1
    if (yas <= 7 * GUN) v[0] += 1
    m.set(r.doctor_id, v)
  }
  return m
}

export async function ulkeKurucuVerisi(
  supabase: SupabaseClient,
  ayar: { simdi?: number; deneme?: (hesapId: string) => Promise<DenemeBilgisi> } = {},
): Promise<KurucuUlkeYaniti> {
  const simdi = ayar.simdi ?? Date.now()
  const otuz = new Date(simdi - 30 * GUN).toISOString()
  const bos = { data: [] as unknown[] }
  const guvenli = <T,>(p: PromiseLike<T>) => Promise.resolve(p).catch(() => bos as unknown as T)
  const [authYaniti, hesaplar, rolSatirlari, dilSatirlari, uyeler, notlar, muayeneler] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ulkeTablosu(supabase, 'ulke_hesaplari').select('id, full_name, created_at').limit(5000),
    guvenli(ulkeTablosu(supabase, 'hekim_rolu').select('doctor_id, rol').limit(5000)),
    guvenli(ulkeTablosu(supabase, 'hekim_dil_tercihleri').select('doctor_id, soruldu_at').limit(5000)),
    guvenli(ulkeTablosu(supabase, 'ulke_klinik_uyeleri').select('doctor_id, konum').limit(5000)),
    guvenli(ulkeTablosu(supabase, 'ulke_notlar').select('doctor_id, created_at').gte('created_at', otuz).limit(20000)),
    guvenli(ulkeTablosu(supabase, 'ulke_muayeneler').select('doctor_id, created_at').gte('created_at', otuz).limit(20000)),
  ])
  if (authYaniti.error) throw new Error('auth list failed')
  if ((hesaplar as { error?: unknown }).error) throw new Error('account list failed')
  const authHaritasi = new Map<string, AuthHesap>()
  for (const a of ((authYaniti.data as { users?: AuthHesap[] } | null)?.users || [])) authHaritasi.set(a.id, a)
  const rolHaritasi = new Map<string, string>()
  for (const r of ((rolSatirlari as { data?: unknown }).data || []) as { doctor_id?: unknown; rol?: unknown }[]) if (typeof r.doctor_id === 'string' && uygulamaRoluMu(r.rol)) rolHaritasi.set(r.doctor_id, r.rol)
  const dilSoruldu = new Set<string>()
  for (const r of ((dilSatirlari as { data?: unknown }).data || []) as { doctor_id?: unknown; soruldu_at?: unknown }[]) if (typeof r.doctor_id === 'string' && r.soruldu_at) dilSoruldu.add(r.doctor_id)
  const onBuro = new Set<string>()
  for (const r of ((uyeler as { data?: unknown }).data || []) as { doctor_id?: unknown; konum?: unknown }[]) if (typeof r.doctor_id === 'string' && r.konum === 'on-buro') onBuro.add(r.doctor_id)
  const notSayim = sayimlar((notlar as { data?: unknown }).data, simdi)
  const muayeneSayim = sayimlar((muayeneler as { data?: unknown }).data, simdi)
  const rolsuzUlke = roller().length === 0 || !ozellikAcik('cekirdekMuayene')
  const dil = ulkePaketi().varsayilanDil
  const kurucular = kurucuEpostalari()

  const sonuc: KurucuHesap[] = []
  const testHesaplari: string[] = []
  for (const h of ((hesaplar as { data?: unknown }).data || []) as { id?: unknown; full_name?: unknown; created_at?: unknown }[]) {
    if (typeof h.id !== 'string') continue
    const a = authHaritasi.get(h.id)
    const eposta = String(a?.email || '').toLowerCase()
    if (eposta === KAAN_TEST_EPOSTASI || kurucular.includes(eposta)) { testHesaplari.push(eposta); continue }
    if (bildirimDisiMi(eposta, kurucular) || onBuro.has(h.id)) continue
    const rol = rolHaritasi.get(h.id) || null
    const deneme = ayar.deneme ? await ayar.deneme(h.id).catch(() => null) : null
    const n = notSayim.get(h.id) || [0, 0]
    const m = muayeneSayim.get(h.id) || [0, 0]
    sonuc.push(hesapSatiriTemizle({
      ad: String(h.full_name || a?.user_metadata?.full_name || ''),
      eposta,
      brans: rol,
      bransEtiketi: rol ? rolAdi(rol, dil) || rol : null,
      plan: deneme?.ucretli ? 'paid' : 'trial',
      onboardingTamam: dilSoruldu.has(h.id) && (rolsuzUlke || !!rol),
      denemeKalanGun: deneme && !deneme.ucretli ? deneme.kalanGun : null,
      bransSecildi: !!rol,
      kayit: typeof h.created_at === 'string' ? h.created_at : a?.created_at || null,
      sonGiris: a?.last_sign_in_at || null,
      not7: n[0], not30: n[1], muayene7: m[0], muayene30: m[1],
    }))
  }
  sonuc.sort((x, y) => String(y.kayit || '').localeCompare(String(x.kayit || '')))
  return { ulke: aktifUlke(), uretildi: new Date(simdi).toISOString(), hesaplar: sonuc, testHesaplari }
}

export type UlkeBildirimSonucu = 'disarida' | 'zaten' | 'gonderildi' | 'anahtar-yok' | 'hata'

export async function ulkeDenemeKaydiBildir(
  supabase: SupabaseClient,
  hesap: { id: string; email?: string | null; ad?: string | null },
  rol: string,
  ayar: { simdi?: Date; fetchFn?: typeof fetch } = {},
): Promise<UlkeBildirimSonucu> {
  if (bildirimDisiMi(hesap.email) || !uygulamaRoluMu(rol)) return 'disarida'
  const simdi = ayar.simdi ?? new Date()
  const { data: alinan, error } = await ulkeTablosu(supabase, 'ulke_hesaplari')
    .update({ deneme_bildirim_at: simdi.toISOString() })
    .eq('id', hesap.id)
    .is('deneme_bildirim_at', null)
    .select('id, full_name')
  if (error) throw new Error('claim failed')
  if (!Array.isArray(alinan) || alinan.length === 0) return 'zaten'
  // Counted from the ids (a country database holds few accounts; the shared door takes a column list only in every build).
  const { data: sayilan } = await ulkeTablosu(supabase, 'ulke_hesaplari').select('id').not('deneme_bildirim_at', 'is', null).limit(100000)
  const count = Array.isArray(sayilan) ? sayilan.length : 1
  const ulke = aktifUlke() as BildirimUlkesi
  const e = bildirimEpostasi({
    ulke,
    ad: String(hesap.ad || (alinan[0] as { full_name?: unknown }).full_name || ''),
    eposta: String(hesap.email || ''),
    telefon: null,
    bransEtiketi: rolAdi(rol, ulkePaketi().varsayilanDil) || rol,
    plan: 'trial',
    zaman: simdi,
    toplam: Math.max(1, Number(count ?? 1)),
  })
  const s = await bildirimGonder(e, `notya-deneme/${ulke}/${hesap.id}`, { fetchFn: ayar.fetchFn })
  if (s.durum === 'anahtar-yok') console.warn('[deneme-bildirim] RESEND_API_KEY is not set: trial signup recorded, e-mail not sent (DENEME-BILDIRIM-01).')
  else if (s.durum === 'hata') console.error('[deneme-bildirim] send failed', s.ayrinti)
  return s.durum
}
