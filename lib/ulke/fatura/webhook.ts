/**
 * AU-BETA-02 — PAYMENT WEBHOOKS (Stripe, Tyro). Server only.
 *
 * Each doctor's connection has its OWN signing secret (stored encrypted with the connection); the URL carries the doctor's id so the right secret is
 * found BEFORE anything is trusted. Order of work: (1) verify the signature on the RAW body, (2) record the provider's event id — a second delivery of the
 * same event is acknowledged and not processed again, (3) apply the one fact the event proves, (4) on failure forget the event id so the provider's retry can
 * succeed. Nothing from the body is trusted for who is paid: the invoice is found by the id we put in the payment's metadata (Stripe) or by the reference we stored
 * (Tyro), and the amount and currency must equal the invoice's.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { ulkePaketi } from '../ulke'
import { ulkeTablosu } from '../uygulama/tablolar'
import { faturaIadeSenkron, faturaOdendiIsaretle, faturaRefile, kimlikOku } from './fatura'
import { STRIPE_FATURA_ANAHTARI, stripeOlayiDogrula } from './stripe'
import { tyroImzaDogru, tyroOlayiOku, tyroSaglayici } from './tyro'

export type WebhookCevabi = { durum: 200 | 400 | 404 | 500; sonuc: string }

async function olayKaydet(supabase: SupabaseClient, doktorId: string, saglayici: 'stripe' | 'tyro', olayId: string, tur: string): Promise<'yeni' | 'tekrar' | 'hata'> {
  const { error } = await ulkeTablosu(supabase, 'ulke_odeme_olaylari').insert({ ulke: ulkePaketi().kod, doctor_id: doktorId, saglayici, olay_id: olayId, tur: tur.slice(0, 120) })
  if (!error) return 'yeni'
  return (error as { code?: string }).code === '23505' ? 'tekrar' : 'hata'
}
async function olayiUnut(supabase: SupabaseClient, doktorId: string, saglayici: 'stripe' | 'tyro', olayId: string): Promise<void> {
  await ulkeTablosu(supabase, 'ulke_odeme_olaylari').delete().eq('doctor_id', doktorId).eq('saglayici', saglayici).eq('olay_id', olayId)
}
const kimlikId = (x: string | { id: string } | null | undefined): string => (typeof x === 'string' ? x : x?.id ?? '')

export async function stripeWebhookIsle(supabase: SupabaseClient, doktorId: string, govde: string, imza: string | null): Promise<WebhookCevabi> {
  const k = await kimlikOku(supabase, doktorId)
  if (!k || k.saglayici !== 'stripe' || !k.kimlik.webhookGizli) return { durum: 404, sonuc: 'no_endpoint' }
  const d = stripeOlayiDogrula(govde, imza, k.kimlik.webhookGizli)
  if (!d.tamam) return { durum: 400, sonuc: 'bad_signature' }
  const olay = d.olay
  // The signing secret of a test endpoint never signs a live event and vice versa; this is the belt to that braces: an event whose `livemode`
  // disagrees with the mode of the connection is acknowledged (no retry can ever make it valid) and changes nothing.
  if (olay.livemode !== (k.mod === 'live')) return { durum: 200, sonuc: 'mode_mismatch' }
  const kayit = await olayKaydet(supabase, doktorId, 'stripe', olay.id, olay.type)
  if (kayit === 'tekrar') return { durum: 200, sonuc: 'duplicate' }
  if (kayit === 'hata') return { durum: 500, sonuc: 'ledger' }
  try {
    if (olay.type === 'checkout.session.completed' || olay.type === 'checkout.session.async_payment_succeeded') {
      const o = olay.data.object as Stripe.Checkout.Session
      const faturaId = o.metadata?.[STRIPE_FATURA_ANAHTARI]
      if (o.payment_status !== 'paid' || !faturaId || !o.currency || o.amount_total == null) return { durum: 200, sonuc: 'ignored' }
      const r = await faturaOdendiIsaretle(supabase, doktorId, faturaId, { saglayici: 'stripe', ref: kimlikId(o.payment_intent) || o.id, tutarKurus: o.amount_total, paraKodu: o.currency, mod: k.mod })
      return { durum: 200, sonuc: r === 'tamam' ? 'paid' : r === 'uyusmadi' ? 'mismatch' : 'unknown_invoice' }
    }
    if (olay.type === 'charge.refunded') {
      const c = olay.data.object as Stripe.Charge
      const pi = kimlikId(c.payment_intent)
      if (!pi) return { durum: 200, sonuc: 'ignored' }
      return { durum: 200, sonuc: (await faturaIadeSenkron(supabase, doktorId, pi, c.amount_refunded)) ? 'refund_synced' : 'unknown_invoice' }
    }
    return { durum: 200, sonuc: 'ignored' }
  } catch {
    await olayiUnut(supabase, doktorId, 'stripe', olay.id).catch(() => undefined)
    return { durum: 500, sonuc: 'failed' }
  }
}

export async function tyroWebhookIsle(supabase: SupabaseClient, doktorId: string, govde: string, imza: string | null, getir: typeof fetch = fetch): Promise<WebhookCevabi> {
  const k = await kimlikOku(supabase, doktorId)
  if (!k || k.saglayici !== 'tyro' || !k.kimlik.webhookGizli || !k.kimlik.tyro) return { durum: 404, sonuc: 'no_endpoint' }
  if (!tyroImzaDogru(govde, imza, k.kimlik.webhookGizli)) return { durum: 400, sonuc: 'bad_signature' }
  const olay = tyroOlayiOku(govde)
  if (!olay) return { durum: 400, sonuc: 'bad_payload' }
  // Tyro: "ignore duplicate events, meaning those with an identical type and id".
  const olayId = `${olay.type}:${olay.data.id}`
  const kayit = await olayKaydet(supabase, doktorId, 'tyro', olayId, olay.type)
  if (kayit === 'tekrar') return { durum: 200, sonuc: 'duplicate' }
  if (kayit === 'hata') return { durum: 500, sonuc: 'ledger' }
  try {
    if (olay.type !== 'PAY_REQUEST_SUCCESS') return { durum: 200, sonuc: 'ignored' }
    const faturaId = await faturaRefile(supabase, doktorId, olay.data.id)
    if (!faturaId) return { durum: 200, sonuc: 'unknown_invoice' }
    // The event only names the Pay Request; ask Tyro itself what it is before an invoice is marked paid.
    const p = await tyroSaglayici(k.kimlik.tyro, getir).odemeyiOku(olay.data.id)
    if (!p || !p.basarili) return { durum: 200, sonuc: 'not_successful' }
    const r = await faturaOdendiIsaretle(supabase, doktorId, faturaId, { saglayici: 'tyro', ref: olay.data.id, tutarKurus: p.tutarKurus, paraKodu: p.paraKodu })
    return { durum: 200, sonuc: r === 'tamam' ? 'paid' : 'mismatch' }
  } catch {
    await olayiUnut(supabase, doktorId, 'tyro', olayId).catch(() => undefined)
    return { durum: 500, sonuc: 'failed' }
  }
}
