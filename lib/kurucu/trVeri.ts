/**
 * KURUCU-KONSOL-01 — the Türkiye build's own rows for the founder console, read with the service role.
 *
 * Doctor-ACCOUNT metadata only (auth user + users row) and COUNTS of notes and visits per account for the last 7/30 days.
 * The activity queries select only `doctor_id, created_at` — no patient id, no content — and the result leaves this file
 * as numbers (hesapSatiriTemizle keeps only the allowed keys). Left out of the list: invited staff, accountant/lawyer
 * accounts; Kaan's test account and the founder addresses are named under testHesaplari and never counted.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { bildirimDisiMi, KAAN_TEST_EPOSTASI, kurucuEpostalari } from './denemeBildirimi'
import { hesapSatiriTemizle, type KurucuHesap, type KurucuUlkeYaniti } from './tipler'
import { etkinBrans, kayitliBransVarMi } from '@/lib/onboarding/bransKapisi'
import { kayitBransAdi, kayitBransiMi } from '@/lib/onboarding/kayitBransi'
import { onboardingAlanlariTamamMi } from '@/lib/onboarding/onboardingTamam'

const GUN = 24 * 60 * 60 * 1000
const BRANSSIZ = new Set(['mali', 'mali_musavirlik', 'avukat'])
const UCRETSIZ_DURUM = new Set(['canceled', 'cancelled', 'unpaid', 'incomplete_expired'])

type AuthHesap = { id: string; email?: string | null; created_at?: string | null; last_sign_in_at?: string | null; user_metadata?: Record<string, unknown> | null }

export function kalanGun(bitisIso: unknown, simdi: number): number | null {
  if (typeof bitisIso !== 'string' || !bitisIso) return null
  const t = Date.parse(bitisIso)
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.ceil((t - simdi) / GUN))
}

/** Per account: [last 7 days, last 30 days] from rows of { doctor_id, created_at }. */
export function sayimlar(satirlar: readonly { doctor_id?: unknown; created_at?: unknown }[] | null | undefined, simdi: number): Map<string, [number, number]> {
  const m = new Map<string, [number, number]>()
  for (const r of satirlar || []) {
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

export async function trKurucuVerisi(supabase: SupabaseClient, simdi: number = Date.now()): Promise<KurucuUlkeYaniti> {
  const otuzGunOnce = new Date(simdi - 30 * GUN).toISOString()
  const [authYaniti, satirlar, personel, notlar, seanslar] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from('users').select('id, email, full_name, first_name, last_name, specialty, profession_type, title, cep_telefonu, gender, addressing_preference, kvkk_consent_at, stripe_subscription_id, subscription_status, trial_end').limit(5000),
    supabase.from('personel').select('user_id').not('user_id', 'is', null).limit(5000),
    supabase.from('notes').select('doctor_id, created_at').gte('created_at', otuzGunOnce).limit(20000),
    supabase.from('sessions').select('doctor_id, created_at').gte('created_at', otuzGunOnce).limit(20000),
  ])
  if (authYaniti.error) throw new Error(`auth list failed: ${authYaniti.error.message}`)
  const authHesaplari = ((authYaniti.data as { users?: AuthHesap[] } | null)?.users || []) as AuthHesap[]
  const satirHaritasi = new Map<string, Record<string, unknown>>()
  for (const s of (satirlar.data || []) as Record<string, unknown>[]) if (typeof s.id === 'string') satirHaritasi.set(s.id, s)
  const personelSet = new Set(((personel.data || []) as { user_id?: unknown }[]).map((p) => String(p.user_id)))
  const notSayim = sayimlar(notlar.data as { doctor_id?: unknown; created_at?: unknown }[], simdi)
  const seansSayim = sayimlar(seanslar.data as { doctor_id?: unknown; created_at?: unknown }[], simdi)
  const kurucular = kurucuEpostalari()

  const hesaplar: KurucuHesap[] = []
  const testHesaplari: string[] = []
  for (const a of authHesaplari) {
    const meta = (a.user_metadata || {}) as Record<string, unknown>
    const eposta = String(a.email || '').toLowerCase()
    if (bildirimDisiMi(eposta, kurucular)) {
      if (eposta === KAAN_TEST_EPOSTASI || kurucular.includes(eposta)) testHesaplari.push(eposta)
      continue
    }
    const s = satirHaritasi.get(a.id) || {}
    if (meta.personel === true || personelSet.has(a.id)) continue
    if (typeof s.profession_type === 'string' && BRANSSIZ.has(s.profession_type)) continue
    const etkin = etkinBrans(s.specialty, meta.specialty)
    const secilen = kayitliBransVarMi(etkin) ? etkin : kayitBransiMi(meta.kayit_bransi) ? meta.kayit_bransi : null
    const ucretli = typeof s.stripe_subscription_id === 'string' && !!s.stripe_subscription_id && !UCRETSIZ_DURUM.has(String(s.subscription_status))
    const ad = [s.first_name, s.last_name].filter((x) => typeof x === 'string' && x.trim()).join(' ') || String(s.full_name || meta.full_name || '')
    const n = notSayim.get(a.id) || [0, 0]
    const m = seansSayim.get(a.id) || [0, 0]
    hesaplar.push(hesapSatiriTemizle({
      ad,
      eposta,
      brans: secilen,
      bransEtiketi: secilen ? kayitBransAdi(secilen) || secilen : null,
      plan: ucretli ? 'paid' : 'trial',
      onboardingTamam: onboardingAlanlariTamamMi(s, meta),
      denemeKalanGun: ucretli ? null : kalanGun(meta.trial_ends, simdi),
      bransSecildi: !!secilen,
      kayit: a.created_at || null,
      sonGiris: a.last_sign_in_at || null,
      not7: n[0], not30: n[1], muayene7: m[0], muayene30: m[1],
    }))
  }
  hesaplar.sort((x, y) => String(y.kayit || '').localeCompare(String(x.kayit || '')))
  return { ulke: 'tr', uretildi: new Date(simdi).toISOString(), hesaplar, testHesaplari }
}
