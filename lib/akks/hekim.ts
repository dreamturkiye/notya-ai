/**
 * AKKS evaluation doctors — one synthetic doctor account per branş, so Ayşe is measured EXACTLY as a doctor of that branş
 * uses her: users.specialty drives the branş lock and the default colleague in lib/asistan/ayseCevapla.ts (founder-locked;
 * called here only as a black box). The accounts have no patients, no password anyone knows (a random one is set and
 * discarded) and an e-mail on a subdomain with no mailbox; lib/kurucu/denemeBildirimi.ts bildirimDisiMi keeps them out of
 * the founder console and sign-up notifications.
 *
 * Before every item the doctor's learned memory is cleared (doktor_hafiza / doktor_iliski), so every run measures the same
 * "first day" colleague and runs stay comparable; the session the item opened is deleted after the answer.
 */
import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AKKS_EPOSTA_ALANI } from '@/lib/kurucu/denemeBildirimi'
import { SPECIALTIES } from '@/lib/doktor/specialties'
import { KLINIK_ETIKET, klinikYeniSlugMu } from '@/lib/specialties/klinikDikey'

export const akksEpostasi = (brans: string) => `akks-${brans}@${AKKS_EPOSTA_ALANI}`

export function bransAdi(brans: string): string {
  if (klinikYeniSlugMu(brans)) return KLINIK_ETIKET[brans]
  return SPECIALTIES.find((s) => s.key === brans)?.label || brans
}

const onbellek = new Map<string, string>()

async function authKimligiBul(sb: SupabaseClient, eposta: string): Promise<string | null> {
  for (let sayfa = 1; sayfa <= 10; sayfa++) {
    const { data, error } = await sb.auth.admin.listUsers({ page: sayfa, perPage: 200 })
    if (error) return null
    const u = data.users.find((x) => (x.email || '').toLowerCase() === eposta)
    if (u) return u.id
    if (data.users.length < 200) return null
  }
  return null
}

/** The evaluation doctor of a branş (created on first use). Throws when the account cannot be prepared. */
export async function degerlendirmeHekimi(sb: SupabaseClient, brans: string): Promise<string> {
  const hazir = onbellek.get(brans)
  if (hazir) return hazir
  const eposta = akksEpostasi(brans)
  const { data: var_ } = await sb.from('users').select('id, specialty').eq('email', eposta).limit(1)
  let id = (var_?.[0] as { id?: string } | undefined)?.id ?? null
  if (!id) {
    const yeni = await sb.auth.admin.createUser({
      email: eposta, email_confirm: true, password: randomBytes(32).toString('base64url'),
      user_metadata: { akks: true, onboarding_completed: true, profession_type: 'doktor' },
    })
    id = yeni.data.user?.id ?? (await authKimligiBul(sb, eposta))
    if (!id) throw new Error('akks: evaluation doctor could not be created')
  }
  const etiket = bransAdi(brans)
  const { error } = await sb.from('users').upsert({
    id, email: eposta, full_name: `AKKS Değerlendirme — ${etiket}`, first_name: 'AKKS', last_name: etiket, specialty: brans,
    profession_type: 'doktor', title: 'Uzm. Dr.', addressing_preference: 'hocam', onboarding_completed: true,
    account_type: 'individual', subscription_tier: 'pro', subscription_status: 'active',
  }, { onConflict: 'id' })
  if (error) throw new Error(`akks: evaluation doctor row (${error.code || 'db'})`)
  onbellek.set(brans, id)
  return id
}

/** Every evaluation doctor id that exists (for cost accounting); no account is created. */
export async function degerlendirmeHekimleri(sb: SupabaseClient): Promise<string[]> {
  const { data } = await sb.from('users').select('id').like('email', `akks-%@${AKKS_EPOSTA_ALANI}`).limit(100)
  return ((data || []) as { id: string }[]).map((r) => r.id)
}

/** Clear what the colleague learned from earlier items (same "first day" doctor for every item and every run). */
export async function hafizaSifirla(sb: SupabaseClient, hekimId: string): Promise<void> {
  await Promise.all([
    sb.from('doktor_hafiza').delete().eq('doctor_id', hekimId),
    sb.from('doktor_iliski').delete().eq('doctor_id', hekimId),
  ])
}
