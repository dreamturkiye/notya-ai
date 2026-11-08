/**
 * DENEME-BILDIRIM-01 — Türkiye: the internal "new trial signup" e-mail, sent once when a doctor's specialty is first set.
 * Called (fire-and-forget, via arkaPlanda) by POST /api/users/profile and POST /api/users/brans after their own write.
 * Sent over SMTP from Kaan's own mailbox (lib/kurucu/smtpGonder.ts, DENEME-BILDIRIM-02).
 *
 * Left out: invited staff (auth metadata `personel`, or a row in `personel`), accountant/lawyer accounts (mali, avukat),
 * Kaan's own test account and the founder addresses. Exactly once: users.deneme_bildirim_at is claimed with
 * `update … where id = <own id> and deneme_bildirim_at is null` — only the call that flips it sends.
 * Reads only the caller's own users row, plus one count. No patient table is touched.
 */
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { bildirimDisiMi, bildirimEpostasi, type DenemeKaydi } from './denemeBildirimi'
import { bildirimGonder, gonderimiGunlukle, type TasiyiciKur } from './smtpGonder'
import { kayitBransAdi } from '@/lib/onboarding/kayitBransi'
import { TR_SOZLUK } from './trBildirimMetni'

const BRANSSIZ = new Set(['mali', 'mali_musavirlik', 'avukat'])

export type TrBildirimSonucu = 'disarida' | 'zaten' | 'gonderildi' | 'sifre-yok' | 'hata'

export async function trDenemeKaydiBildir(supabase: SupabaseClient, user: Pick<User, 'id' | 'email' | 'user_metadata'>, ayar: { simdi?: Date; env?: Record<string, string | undefined>; tasiyiciKur?: TasiyiciKur } = {}): Promise<TrBildirimSonucu> {
  const meta = (user.user_metadata || {}) as Record<string, unknown>
  if (meta.personel === true || bildirimDisiMi(user.email)) return 'disarida'

  const { data: satir } = await supabase
    .from('users')
    .select('id, email, full_name, first_name, last_name, specialty, profession_type, cep_telefonu, stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .maybeSingle()
  const s = (satir || {}) as Record<string, unknown>
  if (typeof s.profession_type === 'string' && BRANSSIZ.has(s.profession_type)) return 'disarida'
  const { data: personel } = await supabase.from('personel').select('id').eq('user_id', user.id).limit(1)
  if (Array.isArray(personel) && personel.length) return 'disarida'

  const simdi = ayar.simdi ?? new Date()
  const { data: alinan, error: almaHatasi } = await supabase
    .from('users')
    .update({ deneme_bildirim_at: simdi.toISOString() })
    .eq('id', user.id)
    .is('deneme_bildirim_at', null)
    .select('id')
  if (almaHatasi) throw new Error(`claim failed: ${almaHatasi.message}`)
  if (!Array.isArray(alinan) || alinan.length === 0) return 'zaten'

  const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).not('deneme_bildirim_at', 'is', null)

  const brans = typeof s.specialty === 'string' ? s.specialty : typeof meta.specialty === 'string' ? meta.specialty : ''
  const ad = [s.first_name, s.last_name].filter((x) => typeof x === 'string' && x.trim()).join(' ') || String(s.full_name || meta.full_name || '')
  const planAnahtari = typeof meta.kayit_plani === 'string' ? meta.kayit_plani : null
  const ucretli = typeof s.stripe_subscription_id === 'string' && !!s.stripe_subscription_id && !['canceled', 'cancelled', 'unpaid'].includes(String(s.subscription_status))
  const kayit: DenemeKaydi = {
    ulke: 'tr',
    ad,
    eposta: String(user.email || s.email || ''),
    telefon: typeof s.cep_telefonu === 'string' ? s.cep_telefonu : null,
    bransEtiketi: kayitBransAdi(brans) || brans || '—',
    plan: ucretli ? 'paid' : planAnahtari ? 'paid-pending' : 'trial',
    planAnahtari,
    zaman: simdi,
    toplam: Math.max(1, Number(count ?? 1)),
  }
  const sonuc = await bildirimGonder(bildirimEpostasi(kayit, TR_SOZLUK), `notya-deneme/tr/${user.id}`, { env: ayar.env, tasiyiciKur: ayar.tasiyiciKur })
  gonderimiGunlukle(sonuc)
  return sonuc.durum
}
