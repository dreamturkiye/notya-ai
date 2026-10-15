/**
 * NOTYA-ACCOUNTING-01 — the ONE real, working EbelgeAdapter.
 *
 * Honesty note (see docs/ARCH-NOTYA-ACCOUNTING.md §4.1 and CHECKLIST.md in this directory): this
 * is a **generic REST e-belge adapter**, per PART 2 §5 of the build brief ("start with NES or a
 * generic REST adapter"). No verified NES / QNB eSolutions / Logo API documentation was available
 * at build time, so this talks to a **documented generic protocol** instead of guessing a named
 * vendor's real fields — exactly what the mandatory honesty rule requires.
 *
 * Protocol (what's actually implemented):
 *   1. `POST {baseUrl}/documents` with `{ docType, seller, buyer, lines, totals, idempotencyKey }`
 *      bearer-authenticated with `apiKey` → `{ uuid, documentNumber, pdfUrl, status }`.
 *      `idempotencyKey = invoiceId` so a retried submit never double-issues.
 *   2. `POST {baseUrl}/documents/{uuid}/cancel` → `{ ok }`.
 *   3. `POST {baseUrl}/documents/{uuid}/credit-notes` with `{ amountKurus, reason }` →
 *      `{ creditUuid }`.
 *   4. `GET {baseUrl}/health` with the same bearer token, for the setup wizard's "Test
 *      connection" button.
 *
 * Seller identity always comes from the invoice DTO (the doctor's own tax profile) — this file
 * never injects a Notya-owned identity, matching the non-negotiable ownership rule in
 * docs/ARCH-NOTYA-ACCOUNTING.md §1.
 */
import type { EbelgeAdapter, EbelgeCredentials, EbelgeInvoiceDto, EbelgeIssueResult, EbelgeCreditResult } from './types'
import type { HttpTransport } from '../payments/types'
import { fetchTransport } from '../payments/types'

function requireField(fields: Record<string, string>, key: string): string {
  const v = fields[key]
  if (!v) throw new Error(`generic_rest adapter: missing required credential field "${key}"`)
  return v
}

function authHeaders(credentials: EbelgeCredentials): Record<string, string> {
  const apiKey = requireField(credentials.fields, 'apiKey')
  return { Authorization: `Bearer ${apiKey}` }
}

export function createGenericRestEbelgeAdapter(transport: HttpTransport = fetchTransport): EbelgeAdapter {
  return {
    vendor: 'generic_rest',
    isReal: true,

    async testConnection(credentials) {
      try {
        const baseUrl = requireField(credentials.fields, 'baseUrl')
        const apiKey = requireField(credentials.fields, 'apiKey')
        const res = await fetch(`${baseUrl}/health`, { headers: { Authorization: `Bearer ${apiKey}` } })
        if (res.status >= 200 && res.status < 300) return { ok: true }
        return { ok: false, detail: `HTTP ${res.status}` }
      } catch (err) {
        return { ok: false, detail: err instanceof Error ? err.message : 'unknown error' }
      }
    },

    async issue(credentials, invoice: EbelgeInvoiceDto): Promise<EbelgeIssueResult> {
      const baseUrl = requireField(credentials.fields, 'baseUrl')
      const { status, json } = await transport.postJson(
        `${baseUrl}/documents`,
        {
          docType: invoice.docType,
          seller: invoice.seller,
          buyer: invoice.buyer,
          lines: invoice.lines,
          totals: { subtotalKurus: invoice.subtotalKurus, kdvKurus: invoice.kdvKurus, totalKurus: invoice.totalKurus },
          currency: invoice.currency,
          issueDate: invoice.issueDate,
          idempotencyKey: invoice.invoiceId,
        },
        authHeaders(credentials)
      )
      if (status < 200 || status >= 300) {
        throw new Error(`generic_rest: issue failed (HTTP ${status}): ${JSON.stringify(json)}`)
      }
      const body = json as { uuid?: string; documentNumber?: string; pdfUrl?: string | null }
      if (!body.uuid || !body.documentNumber) {
        throw new Error('generic_rest: malformed issue response (missing uuid/documentNumber)')
      }
      return {
        vendor: 'generic_rest',
        uuid: body.uuid,
        documentNumber: body.documentNumber,
        pdfUrl: body.pdfUrl ?? null,
        raw: body,
      }
    },

    async cancel(credentials, ebelgeUuid) {
      const baseUrl = requireField(credentials.fields, 'baseUrl')
      const { status, json } = await transport.postJson(
        `${baseUrl}/documents/${encodeURIComponent(ebelgeUuid)}/cancel`,
        {},
        authHeaders(credentials)
      )
      return { ok: status >= 200 && status < 300, raw: json }
    },

    async credit(credentials, ebelgeUuid, amountKurus, reason): Promise<EbelgeCreditResult> {
      const baseUrl = requireField(credentials.fields, 'baseUrl')
      const { status, json } = await transport.postJson(
        `${baseUrl}/documents/${encodeURIComponent(ebelgeUuid)}/credit-notes`,
        { amountKurus, reason },
        authHeaders(credentials)
      )
      if (status < 200 || status >= 300) {
        throw new Error(`generic_rest: credit note failed (HTTP ${status}): ${JSON.stringify(json)}`)
      }
      const body = json as { creditUuid?: string }
      if (!body.creditUuid) throw new Error('generic_rest: malformed credit-note response (missing creditUuid)')
      return { vendor: 'generic_rest', creditUuid: body.creditUuid, raw: body }
    },
  }
}
