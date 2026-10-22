/**
 * AU-BETA-01 — invoices for an Australian practice: ABN of the seller printed from the practice details, a free-text
 * item-number field (NO item description and NO fee is supplied by this product: whatever the practitioner types is
 * kept), and GST at 10% with the tax-free box ticked by default.
 *
 * Rate and default are STARTING VALUES of this pack. Whether a given service is GST-free is for the practitioner and
 * their adviser; the ATO's "GST and health" page (https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/in-detail/your-industry/gst-and-health ,
 * read 2026-10-22, last updated 12 June 2024 by its own line) says conditions apply to GST-free medical services and
 * links a page for them, which was NOT read. Nothing on the screen is tax advice. The 10% figure is the general GST rate
 * in A New Tax System (Goods and Services Tax) Act 1999 (read for ../araclar/gstInvoice.ts, which cites the compilation).
 * The statutory particulars of a tax invoice are a separate checklist tool (../araclar/gstInvoice.ts); this screen does
 * not claim to produce a valid tax invoice.
 *
 * PAYMENTS: bring-your-own merchant account; demo adapter, real Stripe adapter (test mode), Tyro adapter written but inactive until Tyro onboarding (lib/ulke/fatura/).
 * Initial compliance draft – external legal review later.
 */
import type { FaturaTanimi } from '@/lib/ulke/uzanti/tipler'

export const AU_FATURA: FaturaTanimi = {
  vergiAdi: 'GST',
  oranYuzde: 10,
  varsayilanMuaf: true,
  paraKodu: 'AUD',
  saticiKimlikAlani: 'abn',
  saticiAdAlani: 'adi',
  metin: {
    baslik: 'Invoices',
    aciklama: 'Create an invoice for a patient, record payment, refund and reconcile. Fill in your practice details (ABN and address) in Settings first so they print on the invoice. Initial compliance draft – external legal review later.',
    yeni: 'New invoice',
    hasta: 'Patient',
    hastaSec: 'Choose a patient',
    kalemAciklama: 'Description',
    kalemAciklamaIpucu: 'What the charge is for',
    kalemNo: 'Medicare item number (free text, optional)',
    kalemNoIpucu: 'Item number, if any — typed by you',
    kalemTutar: 'Amount before GST (AUD)',
    kalemEkle: 'Add a line',
    kalemSil: 'Remove line',
    vergiMuaf: 'GST-free',
    vergiMuafIpucu: 'Each line starts as GST-free. Untick it for a line that includes GST at 10%. Whether a service is GST-free is your decision; this is not tax advice.',
    vergiNotu: 'Amounts you type are before GST. GST is worked out at 10% on lines that are not ticked GST-free, rounded once on the total.',
    altToplam: 'Subtotal',
    toplam: 'Total',
    olustur: 'Create invoice',
    olusturuluyor: 'Creating…',
    bos: 'No invoices yet.',
    durumlar: { taslak: 'Unpaid', odendi: 'Paid', iptal: 'Cancelled' },
    ode: 'Pay',
    odendi: 'Payment recorded (demo mode: no real charge was made).',
    demoNotu: 'DEMO MODE until your own account is connected: payments run on a demonstration provider, no real charge is made and no card is used. Notya is not the merchant and never holds your funds: with your own Stripe account connected, charges are created on YOUR account and settle to you; Notya keeps no balance or ledger of customer money and takes no platform fee. Initial compliance draft – external legal review later.',
    testNotu: 'Connection saved (encrypted) and checked with the provider. Test mode only.',
    saticiEksik: 'No ABN set (add it in Settings)',
    saticiKimlik: 'ABN',
    hata: 'Could not complete that. Check the lines (each needs a description and an amount) and try again.',
    baglantiBaslik: 'Your own merchant account (bring your own)',
    baglantiAciklama: 'Connect your own Stripe account with a restricted API key. Card details are taken by Stripe’s hosted page and never touch Notya’s servers; the money settles to your account. Only TEST-mode keys are accepted in this beta; a live key is refused. Tyro can be saved but stays inactive until Tyro partner onboarding is in place.',
    baglantiVar: 'Connected: %1 (key ending %2). Test mode.',
    baglantiSil: 'Disconnect',
    baglantiSaglayici: 'Provider',
    baglantiAnahtar: 'Test-mode secret or restricted key',
    baglantiKaydet: 'Save connection',
    baglantiCanli: 'That looks like a live key (or not a test key). Live mode is off in this beta.',
    canliNotu: 'CONNECTED (test mode): Pay opens a Stripe-hosted page on YOUR Stripe account. An invoice shows Paid only after Stripe confirms by its signed webhook. Notya is not the merchant, holds no funds and takes no platform fee.',
    tyroBekliyor: 'Tyro is saved but NOT ACTIVE: it needs Tyro partner onboarding (credentials and webhook registration from Tyro Connect) and the Tyro card page before it can take a payment. Payments stay in demo mode.',
    izinler: 'Create the key in your Stripe dashboard (Developers → API keys → Create restricted key) with Write on Checkout Sessions, Payment Intents and Refunds and Read on Charges. If a permission is missing, Stripe’s request log for the key names it.',
    webhookEtiket: 'Webhook signing secret (whsec_…) — optional until you register the endpoint',
    webhookUrlEtiket: 'Register this URL as an endpoint in YOUR Stripe dashboard (events: checkout.session.completed, checkout.session.async_payment_succeeded, charge.refunded), then save its signing secret here:',
    webhookYok: 'No webhook secret saved yet: payments cannot be confirmed automatically.',
    tyroIstemci: 'Tyro client id',
    tyroGizli: 'Tyro client secret',
    tyroKonum: 'Tyro location id',
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
    iadeTutar: 'Refund amount (AUD)',
    uzlasmaBaslik: 'Reconciliation',
    uzlasmaNotu: 'Compares each invoice with what the payment provider reports. In demo mode the provider’s answer is built from the invoices themselves, so every paid invoice matches: this shows the shape of the check, not a real one.',
    uzlasmaCalistir: 'Run reconciliation',
    csv: 'Download CSV',
    uzlasmaSonuclari: { eslesti: 'Matched', uyusmadi: 'Amount mismatch', saglayicida_yok: 'Missing at provider', odenmedi: 'Not paid', notya_yok: 'Missing in Notya', iade_edildi: 'Matched, refunded' },
  },
}
