/**
 * NOTYA-ACCOUNTING-01 — Paraşüt e-SMM / e-Arşiv adapter (2026-10-15 integrator re-research round).
 *
 * WHY THIS FILE EXISTS: the 2026-10-15 CHECKLIST.md research pass re-checked NES / QNB eSolutions /
 * Logo and found no public developer API docs for any of them (unchanged). This round was asked to
 * look further — specifically at Nilvera, Paraşüt, İzibiz, Foriba (Digital Planet), Uyumsoft, Mikro
 * — for a vendor with genuinely public, field-level API documentation. Paraşüt is the one that
 * cleared that bar: it has a published OpenAPI 3.2.0 spec (api version 4.0.0), third-party
 * open-source client libraries built against it, and a commercial add-on's own integration guide —
 * all independently describing the SAME resources, fields and auth model. See CHECKLIST.md for the
 * other five vendors' findings (still no public field-level docs for any of them).
 *
 * CONFIDENCE, STATED PLAINLY: Paraşüt's own primary reference page, apidocs.parasut.com, was NOT
 * directly fetchable from this session (the search tool surfaced the URL but a direct fetch of it
 * was refused as outside this session's browsing provenance). Everything below is therefore
 * cross-referenced from THREE independent secondary sources that agree with each other, not read
 * directly off Paraşüt's own page:
 *   1. apis.apievangelist.com's catalog entry for Paraşüt's e_smms resource, which is generated from
 *      Paraşüt's own published OpenAPI spec (operations, exact paths, auth scheme, base URL) —
 *      https://apis.apievangelist.com/store/para-t-esmms-api/
 *   2. Open-source API client libraries that wrap the real wire protocol and whose README/usage
 *      examples show the OAuth client-construction parameters and resource/field names:
 *      github.com/salyangoz/parasut, packagist.org/packages/mkiyak/parasut-api-v4,
 *      pypi.org/project/parasut-python (all three independently agree on
 *      grant_type=password + client_id/client_secret/username/password/company_id/redirect_uri).
 *   3. A commercial integration add-on's own setup guide describing the developer-panel credential
 *      model and the e-Invoice-vs-e-Archive routing rule: docs.wisecp.com/en/parasut-e-invoice-addon.
 * This is therefore BEST-EFFORT, cross-referenced confidence — the SAME tier as
 * lib/accounting/banks/nestpay.ts's "VERIFIED by protocol cross-reference" status, one tier below
 * iyzico's direct-primary-docs VERIFIED status (facilitators/iyzico.ts) — never claim this is
 * "VERIFIED against Paraşüt's own docs" anywhere else in this codebase; it isn't, because that page
 * could not be read this session. Still real work: this talks to Paraşüt's actual documented
 * resource shape (JSON:API, `e_smms`/`sales_invoices`/`e_archives`/`e_invoices`), not a generic
 * guess — a materially different (and more honest) thing than `generic_rest.ts`'s deliberately
 * vendor-neutral protocol.
 *
 * BYO-ENTEGRATÖR, NOT NOTYA-OWNED (Kaan, 2026-10-15): each doctor/klinik connects THEIR OWN Paraşüt
 * account — their own login email/password plus an application they register themselves in their
 * own Paraşüt "Geliştirici Paneli" for a client_id/client_secret. Notya's own company is not yet
 * legally formed (Kaan's own stated fact) and could not be the GİB-connected party even if the
 * architecture wanted it to be (it doesn't — see docs/ARCH-NOTYA-ACCOUNTING.md §1). This file never
 * embeds a Notya-owned identity or credential anywhere.
 *
 * Scope of what actually works here, honestly:
 *  - e-SMM (`docType: 'esmm'`, the MVP default and the one every independent doctor legally needs —
 *    see ARCH doc §4.9.7) → real, documented `POST {apiBaseUrl}/{companyId}/e_smms` call.
 *  - e-Arşiv (`docType: 'earsiv'`) → real, documented two-step `sales_invoices` → `e_archives` call.
 *  - e-Fatura (`docType: 'efatura'`) → NOT implemented here. Paraşüt's e_invoices resource needs the
 *    buyer's e-Fatura mailbox address (`to`), resolved via Paraşüt's own `check_vkn_type` lookup —
 *    this module's `EbelgeInvoiceDto.buyer` does not carry a real buyer VKN at all yet
 *    (ACCOUNTING-11, still open; see engine.ts). Rather than guess a mailbox address, `issue()`
 *    throws a clear, specific error for `efatura` so a doctor sees exactly why, instead of a
 *    malformed submission reaching Paraşüt.
 *  - `cancel()` / `credit()`: no cancel/void/credit-note endpoint was found documented for the
 *    `e_smms` resource in any of the three sources above (only create / show / show-as-pdf).
 *    `sales_invoices` DOES document a `cancel` action, but that path is only reachable for the
 *    e-Arşiv/e-Fatura flow, not e-SMM. Rather than fabricate an e_smm-cancel endpoint, both methods
 *    return/throw an explicit "not documented for this vendor+doctype" result — see each method.
 */
import type { EbelgeAdapter, EbelgeCredentials, EbelgeInvoiceDto, EbelgeIssueResult, EbelgeCreditResult } from './types'

function requireField(fields: Record<string, string>, key: string, label: string): string {
  const v = fields[key]
  if (!v) throw new Error(`parasut adapter: eksik kimlik bilgisi alanı "${label}" (${key})`)
  return v
}

/**
 * Doğrulanmış kaynak: her üç kaynak da `grant_type=password` + client_id/client_secret/username/
 * password/company_id/redirect_uri (urn:ietf:wg:oauth:2.0:oob) üzerinde birleşiyor. Token uç
 * noktasının tam URL'si (`tokenUrl`) hiçbir kaynakta harfiyen görülmedi — bu yüzden burada
 * sabitlenmiyor; doktorun kendi Paraşüt Geliştirici Paneli'nden aldığı adres bir kimlik alanı
 * olarak isteniyor (generic_rest.ts'in `baseUrl` deseniyle aynı dürüstlük ilkesi).
 */
async function fetchAccessToken(credentials: EbelgeCredentials): Promise<string> {
  const f = credentials.fields
  const tokenUrl = requireField(f, 'tokenUrl', 'OAuth Token Adresi')
  const clientId = requireField(f, 'clientId', 'Client ID')
  const clientSecret = requireField(f, 'clientSecret', 'Client Secret')
  const username = requireField(f, 'username', 'Paraşüt E-posta')
  const password = requireField(f, 'password', 'Paraşüt Şifre')

  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
  })
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  })
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string }
  if (res.status < 200 || res.status >= 300 || !json.access_token) {
    throw new Error(`parasut: OAuth token alınamadı (HTTP ${res.status}): ${json.error_description || json.error || JSON.stringify(json)}`)
  }
  return json.access_token
}

function apiBase(credentials: EbelgeCredentials): { base: string; companyId: string } {
  const f = credentials.fields
  return {
    base: requireField(f, 'apiBaseUrl', 'API Adresi').replace(/\/$/, ''),
    companyId: requireField(f, 'companyId', 'Şirket No (company_id)'),
  }
}

async function jsonApiCall(
  accessToken: string,
  url: string,
  method: 'POST' | 'GET',
  body?: Record<string, unknown>
): Promise<{ status: number; json: any }> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

/** `e_smms`/`sales_invoices` ortak satır biçimi — field adları apievangelist/packagist kaynaklarından. */
function toDetailsAttributes(invoice: EbelgeInvoiceDto) {
  return invoice.lines.map((l) => ({
    quantity: l.quantity,
    unit_price: Math.round(l.unitPriceKurus) / 100,
    vat_rate: Math.round(l.kdvRateBp / 100), // bp(1000) -> yüzde(10)
    description: l.description,
  }))
}

export function createParasutEbelgeAdapter(): EbelgeAdapter {
  return {
    vendor: 'parasut',
    isReal: true,

    async testConnection(credentials) {
      try {
        await fetchAccessToken(credentials)
        return { ok: true, detail: 'OAuth token alındı (kaynak dokümantasyonu CHECKLIST.md\'de — BEST-EFFORT güven seviyesi).' }
      } catch (err) {
        return { ok: false, detail: err instanceof Error ? err.message : 'Bilinmeyen hata' }
      }
    },

    async issue(credentials, invoice: EbelgeInvoiceDto): Promise<EbelgeIssueResult> {
      if (invoice.docType === 'efatura') {
        throw new Error(
          'parasut adapter: e-Fatura için alıcının e-Fatura posta kutusu adresi (GB/PK) gerekir; ' +
            'bu modülde hastanın gerçek VKN\'si henüz toplanmıyor (ACCOUNTING-11, açık) — bu yüzden ' +
            'e-Fatura yerine tahmini bir adres göndermek yerine burada durduruluyor. e-SMM veya e-Arşiv kullanın.'
        )
      }
      const accessToken = await fetchAccessToken(credentials)
      const { base, companyId } = apiBase(credentials)

      if (invoice.docType === 'esmm') {
        const payload = {
          data: {
            type: 'e_smms',
            attributes: {
              description: `Notya fatura ${invoice.invoiceId}`,
              issue_date: invoice.issueDate,
              gross_total: Math.round(invoice.totalKurus) / 100,
              vat_withholding_rate: 0,
              stopaj_rate: 0,
              exchange_rate: 1,
              currency: invoice.currency,
            },
            relationships: {
              // Paraşüt tarafında kayıtlı bir contact gerektirir; buyer burada yalnız açıklama
              // alanına yazılır (gerçek contact eşleştirmesi — var olan hastayı Paraşüt
              // contact'ına bağlamak — bu adaptörün kapsamı dışında, CHECKLIST.md'de açık madde).
            },
          },
        }
        const { status, json } = await jsonApiCall(accessToken, `${base}/${companyId}/e_smms`, 'POST', payload)
        if (status < 200 || status >= 300) {
          throw new Error(`parasut: e_smm oluşturma başarısız (HTTP ${status}): ${JSON.stringify(json)}`)
        }
        const id = json?.data?.id
        if (!id) throw new Error('parasut: e_smm yanıtı beklenen biçimde değil (data.id eksik)')
        return {
          vendor: 'parasut',
          uuid: String(id),
          documentNumber: json?.data?.attributes?.serial_number || String(id),
          pdfUrl: `${base}/${companyId}/e_smms/${id}.pdf`,
          raw: json,
        }
      }

      // earsiv — iki adım: sales_invoices sonra e_archives.
      const salesPayload = {
        data: {
          type: 'sales_invoices',
          attributes: {
            item_type: 'invoice',
            description: `Notya fatura ${invoice.invoiceId}`,
            issue_date: invoice.issueDate,
            currency: invoice.currency,
            details_attributes: toDetailsAttributes(invoice),
          },
        },
      }
      const salesRes = await jsonApiCall(accessToken, `${base}/${companyId}/sales_invoices`, 'POST', salesPayload)
      if (salesRes.status < 200 || salesRes.status >= 300) {
        throw new Error(`parasut: sales_invoice oluşturma başarısız (HTTP ${salesRes.status}): ${JSON.stringify(salesRes.json)}`)
      }
      const salesId = salesRes.json?.data?.id
      if (!salesId) throw new Error('parasut: sales_invoice yanıtı beklenen biçimde değil (data.id eksik)')

      const archivePayload = {
        data: { type: 'e_archives', relationships: { sales_invoice: { data: { id: String(salesId), type: 'sales_invoices' } } } },
      }
      const archiveRes = await jsonApiCall(accessToken, `${base}/${companyId}/e_archives`, 'POST', archivePayload)
      if (archiveRes.status < 200 || archiveRes.status >= 300) {
        throw new Error(`parasut: e_archive oluşturma başarısız (HTTP ${archiveRes.status}): ${JSON.stringify(archiveRes.json)}`)
      }
      const archiveId = archiveRes.json?.data?.id
      if (!archiveId) throw new Error('parasut: e_archive yanıtı beklenen biçimde değil (data.id eksik)')
      return {
        vendor: 'parasut',
        uuid: String(archiveId),
        documentNumber: String(salesId),
        pdfUrl: `${base}/${companyId}/e_archives/${archiveId}.pdf`,
        raw: { sales: salesRes.json, archive: archiveRes.json },
      }
    },

    async cancel(_credentials, _ebelgeUuid) {
      // Hiçbir kaynakta e_smms veya e_archives için belgelenmiş bir iptal/cancel endpoint'i
      // bulunamadı (yalnız sales_invoices'ın kendisi için "cancel" belgelendi, o da henüz
      // issue() akışımızda e_archive'den önceki ara adım, bağımsız iptal edilebilir bir kaynak
      // değil). Var olmayan bir endpoint icat etmek yerine açıkça başarısız dönülüyor.
      return { ok: false, raw: { error: 'parasut: e_smms/e_archives için dokümante edilmiş bir iptal endpoint\'i bulunamadı (CHECKLIST.md).' } }
    },

    async credit(_credentials, _ebelgeUuid, _amountKurus, _reason): Promise<EbelgeCreditResult> {
      throw new Error('parasut: e_smms/e_archives için dokümante edilmiş bir düzeltme/iade (credit-note) endpoint\'i bulunamadı (CHECKLIST.md).')
    },
  }
}
