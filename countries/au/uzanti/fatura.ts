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
 * PAYMENTS: bring-your-own merchant account; demo adapter only today (lib/ulke/fatura/odemeSaglayici.ts).
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
    demoNotu: 'DEMO MODE. Payments here run on a demonstration provider: no real charge is made and no card is used. Notya is not the merchant and never holds your funds: when your own Stripe or Tyro account is connected, charges are created on YOUR account and settle to you; Notya keeps no balance or ledger of customer money and takes no platform fee. The Stripe and Tyro connections are not available in this beta, so payments stay in demo mode. Initial compliance draft – external legal review later.',
    testNotu: 'Key saved (encrypted). Test mode only — payments still run in demo mode in this beta.',
    saticiEksik: 'No ABN set (add it in Settings)',
    saticiKimlik: 'ABN',
    hata: 'Could not complete that. Check the lines (each needs a description and an amount) and try again.',
    baglantiBaslik: 'Your own merchant account (bring your own)',
    baglantiAciklama: 'Connect your own Stripe or Tyro account. Card details are taken by the provider’s hosted page and never touch Notya’s servers. Only TEST-mode keys are accepted in this beta; a live key is refused. Tyro requires partner onboarding that is not in place.',
    baglantiVar: 'Connected: %1 (key ending %2). Test mode.',
    baglantiSil: 'Disconnect',
    baglantiSaglayici: 'Provider',
    baglantiAnahtar: 'Test-mode secret or restricted key',
    baglantiKaydet: 'Save connection',
    baglantiCanli: 'That looks like a live key (or not a test key). Live mode is off in this beta.',
    iadeTam: 'Refund in full',
    iadeKismi: 'Partial refund…',
    iadeTutar: 'Refund amount (AUD)',
    uzlasmaBaslik: 'Reconciliation',
    uzlasmaNotu: 'Compares each invoice with what the payment provider reports. In demo mode the provider’s answer is built from the invoices themselves, so every paid invoice matches: this shows the shape of the check, not a real one.',
    uzlasmaCalistir: 'Run reconciliation',
    csv: 'Download CSV',
    uzlasmaSonuclari: { eslesti: 'Match', uyusmadi: 'Mismatch', saglayicida_yok: 'Not found at provider', odenmedi: 'Not paid' },
  },
}
