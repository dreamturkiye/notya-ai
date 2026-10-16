/**
 * NOTYA-ACCOUNTING-GIB-PORTAL-01 (Kaan, 2026-10-16) — the default, free MVP e-belge path.
 *
 * GİB Portalı (earsivportal.efatura.gov.tr / gib.gov.tr) is Türkiye's own official channel for
 * issuing e-SMM and e-Fatura/e-Arşiv for free, using only the e-imza/mali mühür a doctor already
 * must have for this obligation — no integrator license, no separate subscription. The catch,
 * stated plainly: **GİB Portalı has no API — it is manual, web-form entry only.** Notya's role
 * here is therefore NOT to submit anything; it is to compute the exact numbers and render them in
 * the order the doctor would type them into that form, so the doctor can issue the real document
 * themselves and paste the resulting GİB document number back into Notya
 * (`confirmGibPortalIssuance` in lib/accounting/invoices/engine.ts).
 *
 * This is a parallel, simpler path alongside the pluggable `EbelgeAdapter` interface
 * (lib/accounting/ebelge/types.ts) — it never goes through `getEbelgeAdapter()`, never touches
 * `accounting_ebelge_credentials`, and has zero dependency on any third-party integrator
 * (Paraşüt or otherwise). The doctor remains the legal issuer of record in every mode; this file
 * only ever prepares data, consistent with docs/ARCH-NOTYA-ACCOUNTING.md §1's non-negotiable
 * ownership model.
 */
import type { EbelgeInvoiceDto } from './types'
import type { StopajResult } from '../stopaj'
import { formatTRY } from '../ledger/money'

export const GIB_PORTAL_URL = 'https://earsivportal.efatura.gov.tr'

export interface GibPortalField {
  label: string
  value: string
}

function buyerLine(buyer: EbelgeInvoiceDto['buyer']): string {
  if (buyer.idType !== 'unknown' && buyer.idValue) {
    const idLabel = buyer.idType === 'vkn' ? 'VKN' : buyer.idType === 'tckn' ? 'TCKN' : 'Kimlik'
    return `${buyer.name} (${idLabel}: ${buyer.idValue})`
  }
  return buyer.name
}

const DOC_TYPE_LABELS: Record<EbelgeInvoiceDto['docType'], string> = {
  esmm: 'e-Serbest Meslek Makbuzu (e-SMM)',
  efatura: 'e-Fatura',
  earsiv: 'e-Arşiv Fatura',
}

/**
 * Builds the exact ordered field list a doctor would enter into GİB Portalı's own form for this
 * invoice — amounts, KDV, (for e-SMM) stopaj, description and buyer fields, in entry order.
 * Pure/side-effect-free: the DTO and the already-computed `StopajResult` are its only inputs, so
 * this can be called both by the engine (at prepare time) and unit-tested directly.
 */
export function buildGibPortalFields(dto: EbelgeInvoiceDto, stopaj: StopajResult): GibPortalField[] {
  const fields: GibPortalField[] = []

  fields.push({ label: 'Belge türü', value: DOC_TYPE_LABELS[dto.docType] })
  fields.push({ label: 'Düzenleme tarihi', value: dto.issueDate })
  fields.push({ label: 'Alıcı adı / unvanı', value: buyerLine(dto.buyer) })
  if (dto.buyer.idType === 'unknown' || !dto.buyer.idValue) {
    fields.push({
      label: 'Alıcı TCKN / VKN',
      value: 'Notya\'da kayıtlı değil — GİB Portalı\'nda nihai tüketici seçeneğini kullanın veya hastanızdan alıp elle girin.',
    })
  }
  if (dto.buyer.email) fields.push({ label: 'Alıcı e-posta (opsiyonel)', value: dto.buyer.email })

  dto.lines.forEach((l, i) => {
    const n = dto.lines.length > 1 ? ` ${i + 1}` : ''
    fields.push({ label: `Hizmet açıklaması${n}`, value: l.description })
    fields.push({ label: `Miktar${n}`, value: String(l.quantity) })
    fields.push({ label: `Birim fiyat${n}`, value: formatTRY(l.unitPriceKurus) })
    fields.push({ label: `KDV oranı${n}`, value: `%${(l.kdvRateBp / 100).toFixed(0)}` })
    fields.push({ label: `KDV tutarı${n}`, value: formatTRY(l.kdvKurus) })
  })

  fields.push({ label: 'Brüt tutar (matrah)', value: formatTRY(dto.subtotalKurus) })
  fields.push({ label: 'Toplam KDV', value: formatTRY(dto.kdvKurus) })

  if (dto.docType === 'esmm') {
    fields.push({ label: 'Gelir vergisi stopaj oranı', value: stopaj.applicable ? `%${(stopaj.rateBp / 100).toFixed(0)}` : 'Uygulanmadı' })
    fields.push({ label: 'Gelir vergisi stopaj tutarı', value: stopaj.applicable ? formatTRY(stopaj.stopajKurus) : formatTRY(0) })
    fields.push({ label: 'Net tahsil edilecek tutar', value: formatTRY(stopaj.netKurus) })
  } else {
    fields.push({ label: 'Genel toplam', value: formatTRY(dto.totalKurus) })
  }

  fields.push({ label: 'Not', value: stopaj.note })
  return fields
}

/** Plain-text rendering ("Alan: Değer" per line) for a one-click clipboard copy. */
export function gibPortalFieldsToClipboardText(fields: GibPortalField[]): string {
  return fields.map((f) => `${f.label}: ${f.value}`).join('\n')
}
