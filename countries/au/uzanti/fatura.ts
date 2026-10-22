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
 * PAYMENTS: bring-your-own merchant account; demo adapter, real Stripe adapter (restricted key, TEST or LIVE mode per connection), Tyro adapter written but inactive until Tyro onboarding (lib/ulke/fatura/).
 * The wording that is not Australian is shared: countries/_dil/en/fatura.ts.
 * Initial compliance draft – external legal review later.
 */
import type { FaturaTanimi } from '@/lib/ulke/uzanti/tipler'
import { enFaturaMetni } from '../../_dil/en/fatura'

export const AU_FATURA: FaturaTanimi = {
  vergiAdi: 'GST',
  oranYuzde: 10,
  varsayilanMuaf: true,
  paraKodu: 'AUD',
  saticiKimlikAlani: 'abn',
  saticiAdAlani: 'adi',
  saglayicilar: ['stripe', 'tyro'],
  metin: enFaturaMetni({
    paraKodu: 'AUD',
    vergiAdi: 'GST',
    vergiMuaf: 'GST-free',
    vergiMuafIpucu: 'Each line starts as GST-free. Untick it for a line that includes GST at 10%. Whether a service is GST-free is your decision; this is not tax advice.',
    vergiNotu: 'Amounts you type are before GST. GST is worked out at 10% on lines that are not ticked GST-free, rounded once on the total.',
    kalemNo: 'Medicare item number (free text, optional)',
    kalemNoIpucu: 'Item number, if any — typed by you',
    kalemTutar: 'Amount before GST (AUD)',
    saticiCumlesi: 'Fill in your practice details (ABN and address) in Settings first so they print on the invoice.',
    saticiEksik: 'No ABN set (add it in Settings)',
    saticiKimlik: 'ABN',
    tyro: true,
  }),
}
