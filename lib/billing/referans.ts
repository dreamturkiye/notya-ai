/**
 * REFERANS-01 (Kaan, 2026-11-05) — THE DOCTOR REFERRAL PROGRAMME (CORE: every branch, every build). Shared by main and
 * every release branch; the caller hands in its database door (`Islev`, with its own country code) — a country build's
 * through lib/ulke/uygulama/tablolar.ts → ulkeIslevi.
 *
 *   code      NTY-XXXX, per doctor, unique, from the unambiguous alphabet of lib/belge/belge.ts. Shown in Settings with
 *             a QR code of the build's own sign-up address (`/signup?ref=…`, Türkiye `/kayit?ref=…`).
 *   sign-up   the code is OPTIONAL and NEVER gates an account: an unknown or self code is silently ignored. The free
 *             trial stays without a card and without an invitation code; there is no discount at sign-up.
 *   reward    ONE FREE MONTH FOR BOTH DOCTORS, as a Stripe customer-balance credit equal to one month of EACH doctor's own
 *             plan, in that plan's currency — and only when the referred doctor's FIRST PAID INVOICE arrives
 *             (invoice.paid with amount_paid > 0). Idempotent: one reward per side per referral (database unique key),
 *             and the Stripe call carries an idempotency key. At most 12 referrer rewards in a rolling 365 days.
 *             Self-referral refused: same account, same e-mail, same clinic (database), same card where Stripe shows a
 *             fingerprint for both (here). A referrer who has no paid subscription yet gets the reward when their own
 *             first invoice is paid (`bekliyor`).
 */
import type Stripe from 'stripe'
import { BELGE_ALFABESI, rastgeleKod } from '@/lib/belge/belge'

export const REFERANS_KODU_RE = new RegExp(`^NTY-[${BELGE_ALFABESI}]{4}$`)
export const YILLIK_ODUL_SINIRI = 12

/** "nty-7k3q " → "NTY-7K3Q", or null when it cannot be a code. */
export function referansKoduNormalize(x: unknown): string | null {
  if (typeof x !== 'string') return null
  const k = x.trim().toUpperCase()
  return REFERANS_KODU_RE.test(k) ? k : null
}
export const yeniReferansKodu = (): string => `NTY-${rastgeleKod(4)}`

/** The sign-up address carrying a code. `kayitYolu` is the build's own (Türkiye '/kayit', a country '/<prefix>/signup'). */
export function referansAdresi(koken: string, kayitYolu: string, kod: string): string {
  return `${koken.replace(/\/+$/, '')}${kayitYolu}?ref=${encodeURIComponent(kod)}`
}

export type ReferansIslevi = (
  ad: 'referans_kodu_al' | 'referans_kaydet' | 'referans_odul_hazirla' | 'referans_odul_sonuc' | 'referans_ozeti',
  argumanlar: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message?: string; code?: string } | null }>

/** The doctor's code, made once. A collision of a random code is drawn again. */
export async function referansKoduAl(islev: ReferansIslevi, doktorId: string): Promise<string | null> {
  for (let i = 0; i < 4; i++) {
    const { data, error } = await islev('referans_kodu_al', { p_doctor_id: doktorId, p_aday: yeniReferansKodu() })
    if (error) { if (error.code === '23505') continue; return null }
    return typeof data === 'string' && REFERANS_KODU_RE.test(data) ? data : null
  }
  return null
}

export type ReferansOzeti = { kod: string | null; davet: number; odeyen: number; verilen: number; son12ay: number; bekleyen: number; sinir: number }
export async function referansOzeti(islev: ReferansIslevi, doktorId: string): Promise<ReferansOzeti | null> {
  const { data, error } = await islev('referans_ozeti', { p_doctor_id: doktorId })
  if (error || !data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const n = (x: unknown) => (Number.isFinite(Number(x)) ? Number(x) : 0)
  return { kod: typeof d.kod === 'string' ? d.kod : null, davet: n(d.davet), odeyen: n(d.odeyen), verilen: n(d.verilen), son12ay: n(d.son12ay), bekleyen: n(d.bekleyen), sinir: YILLIK_ODUL_SINIRI }
}

/** At sign-up. Never throws, never refuses the account: returns what happened to the code. */
export async function referansKaydet(islev: ReferansIslevi, kodHam: unknown, yeniId: string): Promise<'kaydedildi' | 'zaten' | 'gecersiz' | 'kendisi' | 'ayni_klinik' | 'yok' | 'hata'> {
  const kod = referansKoduNormalize(kodHam)
  if (!kod) return kodHam == null || kodHam === '' ? 'yok' : 'gecersiz'
  try {
    const { data, error } = await islev('referans_kaydet', { p_kod: kod, p_yeni_id: yeniId })
    if (error) return 'hata'
    return (['kaydedildi', 'zaten', 'gecersiz', 'kendisi', 'ayni_klinik'] as const).find((x) => x === data) || 'hata'
  } catch { return 'hata' }
}

// ───────────────────────── the reward ─────────────────────────

/** One month of a subscription item's price, in the price's currency (minor units). Yearly = a twelfth, rounded down. */
export function birAylikTutar(fiyat: { unit_amount: number | null; currency: string; recurring: { interval: string; interval_count?: number | null } | null }, adet = 1): { tutar: number; paraBirimi: string } | null {
  if (!fiyat.recurring || typeof fiyat.unit_amount !== 'number' || fiyat.unit_amount <= 0) return null
  const sayi = Math.max(1, fiyat.recurring.interval_count || 1)
  const toplam = fiyat.unit_amount * Math.max(1, adet)
  const ay = fiyat.recurring.interval === 'month' ? sayi : fiyat.recurring.interval === 'year' ? 12 * sayi : null
  if (!ay) return null
  const tutar = Math.floor(toplam / ay)
  return tutar > 0 ? { tutar, paraBirimi: fiyat.currency.toLowerCase() } : null
}

/** Whether this invoice is the event that grants a reward: paid, something actually paid. */
export function odulFaturasiMi(fatura: { status?: string | null; amount_paid?: number | null }): boolean {
  return fatura.status === 'paid' && typeof fatura.amount_paid === 'number' && fatura.amount_paid > 0
}

type Hekim = { stripe_customer_id: string | null; stripe_subscription_id: string | null }
export type HekimBul = (doktorId: string) => Promise<Hekim | null>

async function kartIzi(stripe: Stripe, musteriId: string, aboneId: string | null): Promise<string | null> {
  try {
    if (aboneId) {
      const a = await stripe.subscriptions.retrieve(aboneId, { expand: ['default_payment_method'] })
      const pm = a.default_payment_method
      if (pm && typeof pm === 'object' && pm.card?.fingerprint) return pm.card.fingerprint
    }
    const m = await stripe.customers.retrieve(musteriId, { expand: ['invoice_settings.default_payment_method'] })
    if ('deleted' in m && m.deleted) return null
    const pm = (m as Stripe.Customer).invoice_settings?.default_payment_method
    return pm && typeof pm === 'object' && pm.card?.fingerprint ? pm.card.fingerprint : null
  } catch { return null }
}

/**
 * On invoice.paid of `odeyenId`: claim the rewards due (database), then credit each side's Stripe balance. Every outcome
 * is written back; nothing here throws into the webhook. Returns the outcomes for the log (no patient data, no amounts of
 * anyone else).
 */
export async function faturaOdendiOdul(g: { islev: ReferansIslevi; stripe: Stripe; odeyenId: string; hekimBul: HekimBul; aciklama: string }): Promise<string[]> {
  const sonuc: string[] = []
  const { data, error } = await g.islev('referans_odul_hazirla', { p_odeyen_id: g.odeyenId })
  if (error || !Array.isArray(data)) return ['hazirla_hata']
  for (const ham of data as { odul_id: string; taraf: string; doctor_id: string; karsi_id: string }[]) {
    const yaz = async (durum: 'verildi' | 'bekliyor' | 'engellendi' | 'basarisiz', ek: { tutar?: number; para?: string; islem?: string; neden?: string } = {}) => {
      await g.islev('referans_odul_sonuc', { p_odul_id: ham.odul_id, p_durum: durum, p_tutar: ek.tutar ?? null, p_para_birimi: ek.para ?? null, p_islem_id: ek.islem ?? null, p_neden: ek.neden ?? null })
      sonuc.push(`${ham.taraf}:${durum}${ek.neden ? `:${ek.neden}` : ''}`)
    }
    try {
      const hekim = await g.hekimBul(ham.doctor_id)
      if (!hekim?.stripe_customer_id || !hekim.stripe_subscription_id) { await yaz('bekliyor', { neden: 'abonelik_yok' }); continue }
      // Same card on both sides (where Stripe shows a fingerprint for both): a self-referral.
      const karsi = await g.hekimBul(ham.karsi_id)
      if (karsi?.stripe_customer_id) {
        const [a, b] = await Promise.all([kartIzi(g.stripe, hekim.stripe_customer_id, hekim.stripe_subscription_id), kartIzi(g.stripe, karsi.stripe_customer_id, karsi.stripe_subscription_id)])
        if (a && b && a === b) { await yaz('engellendi', { neden: 'ayni_kart' }); continue }
      }
      const abone = await g.stripe.subscriptions.retrieve(hekim.stripe_subscription_id)
      if (!['active', 'trialing', 'past_due'].includes(abone.status)) { await yaz('bekliyor', { neden: 'abonelik_etkin_degil' }); continue }
      const kalem = abone.items.data[0]
      const ay = kalem?.price ? birAylikTutar(kalem.price as never, kalem.quantity || 1) : null
      if (!ay) { await yaz('basarisiz', { neden: 'fiyat_okunamadi' }); continue }
      const islem = await g.stripe.customers.createBalanceTransaction(
        hekim.stripe_customer_id,
        { amount: -ay.tutar, currency: ay.paraBirimi, description: g.aciklama, metadata: { notya_referans_odulu: ham.odul_id } },
        { idempotencyKey: `notya-referans-${ham.odul_id}` },
      )
      await yaz('verildi', { tutar: ay.tutar, para: ay.paraBirimi, islem: islem.id })
    } catch {
      await yaz('basarisiz', { neden: 'stripe_hata' })
    }
  }
  return sonuc
}
