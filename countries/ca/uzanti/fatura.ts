/**
 * BYO-PAYMENTS-01 (2026-10-22) — invoices and the bring-your-own payment connection for Canada: currency CAD, tax name and rate, and the wording
 * that is this country's own. Everything that is not a rule of the country is shared English wording: countries/_dil/en/fatura.ts.
 *
 * The tax name, rate and the default of the tax-free box are STARTING VALUES of this pack, not tax advice: whether a service carries tax is for the
 * practitioner and their adviser. They were NOT checked against the tax authority's own pages in this change (those pages could not be fetched in the
 * run that wrote this); docs/OPEN-COMMITMENTS.md BYO-PAYMENTS-01 lists it as an open review item. The pack has no practice-identity form yet, so no
 * seller particulars are printed on the invoice line.
 *
 * PAYMENTS: bring-your-own Stripe account (restricted key, TEST or LIVE mode per connection). Stripe only: Tyro is Australian and exists in the Australian build alone.
 * Initial compliance draft – external legal review later.
 */
import type { FaturaTanimi } from '@/lib/ulke/uzanti/tipler'
import { enFaturaMetni } from '../../_dil/en/fatura'

export const CA_FATURA: FaturaTanimi = {
  vergiAdi: 'GST',
  oranYuzde: 5,
  varsayilanMuaf: true,
  paraKodu: 'CAD',
  saglayicilar: ['stripe'],
  metin: enFaturaMetni({
    paraKodu: 'CAD',
    vergiAdi: 'GST',
    vergiMuaf: 'GST-exempt',
    vergiMuafIpucu: 'Each line starts as GST-exempt. Untick it for a line that includes GST at 5%. Whether a service is exempt is your decision and your adviser’s; this is not tax advice.',
    vergiNotu: 'Amounts you type are before tax. Only the federal GST rate of 5% is worked out here, on lines that are not ticked GST-exempt, rounded once on the total. HST and provincial taxes are not calculated: if they apply to you, type amounts that already include them.',
    kalemNo: 'Service code (free text, optional)',
    kalemNoIpucu: 'Code, if any — typed by you',
    kalemTutar: 'Amount before GST (CAD)',
    saticiCumlesi: '',
    saticiEksik: '',
    saticiKimlik: '',
    tyro: false,
  }),
}
