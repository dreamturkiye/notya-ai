/**
 * KURUCU-KONSOL-01 — trial → paid conversions, read from the existing Stripe account (StopThreatAI) with the key already
 * configured server-side (STRIPE_SECRET_KEY). READ-ONLY: one list call (subscriptions, paged, at most 5 pages), nothing
 * is created or changed. No key → "not connected" (never a key entered or created here).
 *
 * Only Notya subscriptions are counted (metadata supabase_user_id or notya_plan_key — the account also bills other
 * products). The country is read from the price currency (TRY → TR, AUD → AU, …). Customer names, e-mails and card data
 * are never read into the result: counts only.
 */
export type StripeUlkeSayimi = { deneme: number; aktif: number; denemedenUcretliye: number; iptal: number }
export type StripeDonusumu =
  | { durum: 'bagli-degil' }
  | { durum: 'hata'; ayrinti: string }
  | { durum: 'tamam'; ulkeler: Record<string, StripeUlkeSayimi>; toplam: StripeUlkeSayimi }

const PARA_BIRIMI: Record<string, string> = { try: 'tr', aud: 'au', uzs: 'uz', gbp: 'gb', cad: 'ca', nzd: 'nz', usd: 'us' }

type AboneSatiri = { status?: string; trial_end?: number | null; metadata?: Record<string, string> | null; items?: { data?: { price?: { currency?: string } | null }[] } | null; currency?: string }

const bos = (): StripeUlkeSayimi => ({ deneme: 0, aktif: 0, denemedenUcretliye: 0, iptal: 0 })

export function donusumSay(aboneler: readonly AboneSatiri[], simdiSn: number = Math.floor(Date.now() / 1000)): { ulkeler: Record<string, StripeUlkeSayimi>; toplam: StripeUlkeSayimi } {
  const ulkeler: Record<string, StripeUlkeSayimi> = {}
  const toplam = bos()
  for (const a of aboneler) {
    const md = a.metadata || {}
    if (!md.supabase_user_id && !md.notya_plan_key) continue
    const pb = String(a.items?.data?.[0]?.price?.currency || a.currency || '').toLowerCase()
    const ulke = PARA_BIRIMI[pb] || 'diger'
    const u = (ulkeler[ulke] ||= bos())
    const ekle = (k: keyof StripeUlkeSayimi) => { u[k] += 1; toplam[k] += 1 }
    if (a.status === 'trialing') ekle('deneme')
    else if (a.status === 'active' || a.status === 'past_due') {
      ekle('aktif')
      if (a.trial_end && a.trial_end <= simdiSn) ekle('denemedenUcretliye')
    } else if (a.status === 'canceled' || a.status === 'unpaid' || a.status === 'incomplete_expired') ekle('iptal')
  }
  return { ulkeler, toplam }
}

type Listeleyici = (p: { status: 'all'; limit: number; starting_after?: string }) => Promise<{ data: (AboneSatiri & { id: string })[]; has_more: boolean }>

export async function stripeDonusumuOku(ayar: { anahtar?: string; listele?: Listeleyici; zamanAsimiMs?: number } = {}): Promise<StripeDonusumu> {
  const anahtar = ayar.anahtar ?? process.env.STRIPE_SECRET_KEY
  if (!anahtar && !ayar.listele) return { durum: 'bagli-degil' }
  try {
    let listele = ayar.listele
    if (!listele) {
      const { default: Stripe } = await import('stripe')
      const stripe = new Stripe(anahtar as string, { timeout: 5000, maxNetworkRetries: 0 })
      listele = (p) => stripe.subscriptions.list(p) as unknown as ReturnType<Listeleyici>
    }
    const isle = (async () => {
      const hepsi: AboneSatiri[] = []
      let sonraki: string | undefined
      for (let i = 0; i < 5; i += 1) {
        const sayfa = await listele!({ status: 'all', limit: 100, ...(sonraki ? { starting_after: sonraki } : {}) })
        hepsi.push(...sayfa.data)
        if (!sayfa.has_more || !sayfa.data.length) break
        sonraki = sayfa.data[sayfa.data.length - 1].id
      }
      return hepsi
    })()
    const zaman = new Promise<never>((_, red) => setTimeout(() => red(new Error('timeout')), ayar.zamanAsimiMs ?? 6000))
    const aboneler = await Promise.race([isle, zaman])
    return { durum: 'tamam', ...donusumSay(aboneler) }
  } catch (e) {
    return { durum: 'hata', ayrinti: e instanceof Error ? e.message.slice(0, 120) : 'error' }
  }
}
