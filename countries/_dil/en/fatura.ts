/**
 * BYO-PAYMENTS-01 (2026-10-22) — the English wording of the invoice and payment screen, shared by the English-language country packs
 * (us, gb, ca, au, nz). ONE place for everything that is not a rule of a country: the bring-your-own merchant-account explanation, the
 * restricted-key instructions, the webhook steps, the test-vs-live badges and the live confirmation. What IS a country's own (currency,
 * tax name and rate, the wording of the tax-free box, the label of the free-text item code, the seller-identity sentence, whether Tyro
 * exists) comes in as `EnFaturaGirdisi`.
 *
 * Permission names follow Stripe's own examples ("Payment Intents: Write", "Customers: Read", "Disputes: Read" —
 * https://docs.stripe.com/keys/restricted-api-keys, read 2026-10-22); the page lists no resource list, so the labels "Checkout Sessions",
 * "Refunds" and "Charges" are the API object names and are UNVERIFIED as dashboard labels: the text sends the doctor to the key's request log,
 * which names any permission still missing. Initial compliance draft – external legal review later.
 */
import type { FaturaMetni } from '@/lib/ulke/uzanti/tipler'

export const FATURA_TASLAK_ETIKETI = 'Initial compliance draft – external legal review later.'

export type EnFaturaGirdisi = {
  paraKodu: string
  vergiAdi: string
  /** The label of the per-line tax-free box ("GST-free", "VAT-exempt", "No tax added"). */
  vergiMuaf: string
  vergiMuafIpucu: string
  vergiNotu: string
  /** The label of the free-text item/billing code field (typed by the practitioner; the product supplies no code, no description and no fee). */
  kalemNo: string
  kalemNoIpucu: string
  /** Label above the amount field. */
  kalemTutar: string
  /** One sentence about the seller particulars printed on the invoice; '' where the pack has no practice-identity form. */
  saticiCumlesi: string
  saticiEksik: string
  saticiKimlik: string
  /** Australia only: the Tyro option exists (inactive until Tyro partner onboarding). */
  tyro: boolean
}

export function enFaturaMetni(g: EnFaturaGirdisi): FaturaMetni {
  const para = g.paraKodu
  return {
    baslik: 'Invoices',
    aciklama: `Create an invoice for a patient, record payment, refund and reconcile.${g.saticiCumlesi ? ` ${g.saticiCumlesi}` : ''} ${FATURA_TASLAK_ETIKETI}`,
    yeni: 'New invoice',
    hasta: 'Patient',
    hastaSec: 'Choose a patient',
    kalemAciklama: 'Description',
    kalemAciklamaIpucu: 'What the charge is for',
    kalemNo: g.kalemNo,
    kalemNoIpucu: g.kalemNoIpucu,
    kalemTutar: g.kalemTutar,
    kalemEkle: 'Add a line',
    kalemSil: 'Remove line',
    vergiMuaf: g.vergiMuaf,
    vergiMuafIpucu: g.vergiMuafIpucu,
    vergiNotu: g.vergiNotu,
    altToplam: 'Subtotal',
    toplam: 'Total',
    olustur: 'Create invoice',
    olusturuluyor: 'Creating…',
    bos: 'No invoices yet.',
    durumlar: { taslak: 'Unpaid', odendi: 'Paid', iptal: 'Cancelled' },
    ode: 'Pay',
    odendi: 'Payment recorded (demo mode: no real charge was made).',
    demoNotu: `DEMO MODE until your own account is connected: payments run on a demonstration provider, no real charge is made and no card is used. Notya is not the merchant and never holds your funds: with your own Stripe account connected, charges are created on YOUR account and settle to you; Notya keeps no balance or ledger of customer money and takes no platform fee. ${FATURA_TASLAK_ETIKETI}`,
    testNotu: 'Connection saved (encrypted) and checked with Stripe. TEST mode: no real money moves.',
    canliKaydedildi: 'Connection saved (encrypted) and checked with Stripe. LIVE mode: payments you start are real and settle to your own Stripe account.',
    saticiEksik: g.saticiEksik,
    saticiKimlik: g.saticiKimlik,
    hata: 'Could not complete that. Check the lines (each needs a description and an amount) and try again.',
    baglantiBaslik: 'Your own merchant account (bring your own)',
    baglantiAciklama: `Connect your own Stripe account with a restricted API key (rk_…). Full-access secret keys (sk_…) are refused. Card details are taken by Stripe’s hosted page and never touch Notya’s servers; the money settles to your own Stripe account. A test key (rk_test_…) moves no money. A live key (rk_live_…) takes real payments: it needs your live webhook signing secret and a confirmation.${g.tyro ? ' Tyro can be saved but stays inactive until Tyro partner onboarding is in place.' : ''}`,
    baglantiVar: 'Connected: %1 (key ending %2).',
    baglantiSil: 'Disconnect',
    baglantiSaglayici: 'Provider',
    baglantiAnahtar: 'Restricted API key (rk_test_… or rk_live_…)',
    baglantiKaydet: 'Save connection',
    sirAnahtar: 'That is a full-access secret key (sk_…). It is refused: create a restricted key (rk_…) with only the permissions listed above and paste that.',
    modEtiketTest: 'TEST MODE — no real money',
    modEtiketCanli: 'LIVE — real money',
    webhookGerekli: 'A live connection needs the signing secret (whsec_…) of your LIVE webhook endpoint: without it Stripe’s payment confirmations cannot be checked and invoices would never show Paid. Add the endpoint in Stripe first (URL above), copy its signing secret and paste it here.',
    canliOnayBaslik: 'Confirm: connect a LIVE Stripe account',
    canliOnayMetin: `With this live key, every payment you start from an invoice is a real card charge on your own Stripe account and every refund returns real money. Notya is not the merchant of record, holds no funds and takes no platform fee; Stripe settles the money to you. Check the amounts before you press Pay. ${FATURA_TASLAK_ETIKETI}`,
    canliOnayKutu: 'I understand that this connection takes real payments and makes real refunds on my own Stripe account.',
    canliOnayDugme: 'Connect live account',
    canliOnayVazgec: 'Cancel',
    canliNotu: 'CONNECTED: Pay opens a Stripe-hosted page on YOUR Stripe account (the badge says whether it is TEST or LIVE). An invoice shows Paid only after Stripe confirms by its signed webhook. Notya is not the merchant, holds no funds and takes no platform fee.',
    tyroBekliyor: g.tyro ? 'Tyro is saved but NOT ACTIVE: it needs Tyro partner onboarding (credentials and webhook registration from Tyro Connect) and the Tyro card page before it can take a payment. Payments stay in demo mode.' : '',
    izinler: 'Create the key in your Stripe dashboard (Developers → API keys → Create restricted key), in live mode for a live key and in test mode for a test key. Give it: Checkout Sessions: Write; Payment Intents: Read; Refunds: Write; Charges: Read; everything else None. If a permission is missing, Stripe’s request log for the key names it.',
    webhookEtiket: 'Webhook signing secret (whsec_…) — required for a live key; optional for a test key until you register the endpoint',
    webhookUrlEtiket: 'Register this URL as an endpoint in YOUR Stripe dashboard (Developers → Webhooks; events: checkout.session.completed, checkout.session.async_payment_succeeded, charge.refunded) and save its signing secret here. Test mode and live mode have separate endpoints and separate secrets:',
    webhookYok: 'No webhook secret saved yet: payments cannot be confirmed automatically.',
    tyroIstemci: g.tyro ? 'Tyro client id' : '',
    tyroGizli: g.tyro ? 'Tyro client secret' : '',
    tyroKonum: g.tyro ? 'Tyro location id' : '',
    anahtarReddedildi: 'Stripe rejected that key.',
    izinYok: 'That key lacks a permission it needs (Payment Intents: Read at least).',
    odemeYonlendiriliyor: 'Opening the payment page on your Stripe account. The invoice shows Paid only after Stripe confirms.',
    onayBekliyor: 'Awaiting payment confirmation',
    uzlasmaDemoEtiketi: 'DEMO CHECK — not a real reconciliation',
    uzlasmaGercekNotu: 'Real check: the payments your own Stripe account lists for the period are matched to the invoices paid in it, by the invoice id stored on each payment, then by amount, currency and refunded total. Payouts and balance transactions are not included.',
    uzlasmaAralik: 'Period',
    aralik7: 'Last 7 days',
    aralik30: 'Last 30 days',
    aralik90: 'Last 90 days',
    iadeTam: 'Refund in full',
    iadeKismi: 'Partial refund…',
    iadeTutar: `Refund amount (${para})`,
    uzlasmaBaslik: 'Reconciliation',
    uzlasmaNotu: 'Compares each invoice with what the payment provider reports. In demo mode the provider’s answer is built from the invoices themselves, so every paid invoice matches: this shows the shape of the check, not a real one.',
    uzlasmaCalistir: 'Run reconciliation',
    csv: 'Download CSV',
    uzlasmaSonuclari: { eslesti: 'Matched', uyusmadi: 'Amount mismatch', saglayicida_yok: 'Missing at provider', odenmedi: 'Not paid', notya_yok: 'Missing in Notya', iade_edildi: 'Matched, refunded' },
  }
}
